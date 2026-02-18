import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { blockchain } from "./blockchain";
import { z } from "zod";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  app.get(api.cheques.list.path, async (req, res) => {
    const cheques = await storage.getCheques();
    res.json(cheques);
  });

  app.get(api.cheques.get.path, async (req, res) => {
    const cheque = await storage.getCheque(Number(req.params.id));
    if (!cheque) return res.status(404).json({ message: "Cheque not found" });
    res.json(cheque);
  });

  app.post(api.cheques.create.path, async (req, res) => {
    try {
      const input = api.cheques.create.input.parse(req.body);
      const cheque = await storage.createCheque(input);
      res.status(201).json(cheque);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.post(api.cheques.process.path, async (req, res) => {
    const chequeId = Number(req.params.id);
    const cheque = await storage.getCheque(chequeId);
    
    if (!cheque) {
      return res.status(404).json({ message: "Cheque not found" });
    }

    if (cheque.status !== 'PENDING') {
       return res.status(400).json({ message: "Cheque already processed" });
    }

    try {
      const prompt = `Analyze a cheque for ₹${(cheque.amount / 100).toLocaleString('en-IN')} paid to ${cheque.payeeName} at ${cheque.payeeBank}. 
      Return JSON:
      {
        "signatureScore": number (0-100),
        "tamperStatus": "No Tampering" | "Suspicious Alteration",
        "duplicateCheck": "Unique" | "Duplicate Found",
        "riskLevel": "Low" | "Medium" | "High",
        "explanation": "Professional summary including signature anomaly probability and transaction deviation"
      }`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(aiResponse.choices[0].message.content || "{}");
      const signatureScore = analysis.signatureScore || 0;
      const riskLevel = signatureScore > 80 ? "High" : (signatureScore > 50 ? "Medium" : "Low");
      
      const payer = await storage.getUser(cheque.payerAccountId);
      const allUsers = await storage.getUsers();
      const payee = allUsers.find(u => u.name === cheque.payeeName && u.bankName === cheque.payeeBank);

      let newStatus = "CLEARED";
      let explanation = analysis.explanation || "Verification successful.";

      if (signatureScore > 80) {
        newStatus = "CANCELLED";
        explanation = `CANCELLED: High Fraud Risk (Score: ${signatureScore}). ${explanation}`;
      } else if (signatureScore > 50) {
        newStatus = "ESCROW";
        explanation = `ESCROW: Requires Admin Approval (Score: ${signatureScore}). ${explanation}`;
      } else if (!payer || payer.balance < cheque.amount) {
        newStatus = "CANCELLED";
        const shortfall = payer ? (cheque.amount - payer.balance) : cheque.amount;
        explanation = `CANCELLED: Insufficient funds. Available: ₹${((payer?.balance || 0)/100).toLocaleString('en-IN')}, Required: ₹${(cheque.amount/100).toLocaleString('en-IN')}, Shortfall: ₹${(shortfall/100).toLocaleString('en-IN')}.`;
      }

      const payerBalanceBefore = payer?.balance || 0;
      const payeeBalanceBefore = payee?.balance || 0;
      let payerBalanceAfter = payerBalanceBefore;
      let payeeBalanceAfter = payeeBalanceBefore;

      if (newStatus === "CLEARED" && payer && payee) {
         payerBalanceAfter -= cheque.amount;
         payeeBalanceAfter += cheque.amount;
         await storage.updateUserBalance(payer.id, payerBalanceAfter);
         await storage.updateUserBalance(payee.id, payeeBalanceAfter);
         
         const latestBlock = await storage.getLatestBlock();
         const newBlock = blockchain.createBlock(
           (latestBlock?.index || 0) + 1, 
           latestBlock?.hash || "0", 
           { transactionId: `TX-${Date.now()}`, payerName: payer.name, payeeName: payee.name, amount: cheque.amount, status: "CLEARED", balances: { before: { payer: payerBalanceBefore, payee: payeeBalanceBefore }, after: { payer: payerBalanceAfter, payee: payeeBalanceAfter } } }
         );
         await storage.createBlock(newBlock);
      }

      const updatedCheque = await storage.updateCheque(cheque.id, {
        status: newStatus,
        signatureScore,
        tamperStatus: analysis.tamperStatus || "No Tampering",
        duplicateCheck: analysis.duplicateCheck || "Unique",
        riskLevel,
        explanation,
        payerBalanceBefore,
        payerBalanceAfter,
        payeeBalanceBefore,
        payeeBalanceAfter,
        processedAt: new Date()
      });

      res.json(updatedCheque);
    } catch (error: any) {
      res.status(500).json({ message: "Processing failed: " + error.message });
    }
  });

  app.get(api.blocks.list.path, async (req, res) => {
    res.json(await storage.getBlocks());
  });
  
  if (process.env.NODE_ENV !== 'production') {
      const users = await storage.getUsers();
      if (users.length === 0) {
          await storage.createUser({ name: "Rajesh Kumar", bankName: "SBI", accountNumber: "30456789123", ifscCode: "SBIN0001234", balance: 50000000 });
          await storage.createUser({ name: "Priya Sharma", bankName: "HDFC Bank", accountNumber: "5010023456", ifscCode: "HDFC0005678", balance: 10000000 });
          await storage.createUser({ name: "Amit Patel", bankName: "ICICI Bank", accountNumber: "0004012345", ifscCode: "ICIC0009101", balance: 25000000 });
      }
      if (!(await storage.getLatestBlock())) {
          await storage.createBlock(blockchain.createBlock(0, "0", { message: "Genesis Block - RBI Interbank System" }));
      }
  }

  return httpServer;
}
