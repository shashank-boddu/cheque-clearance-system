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

  // Users
  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  });

  // Cheques
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
      // 1. AI Analysis Simulation
      const prompt = `Analyze a cheque for ₹${cheque.amount / 100} paid to ${cheque.payeeName} at ${cheque.payeeBank}. 
      Context: Indian Banking System.
      Return a JSON object with:
      - signatureScore (0-100)
      - tamperStatus ("No Tampering" | "Suspicious Alteration")
      - duplicateCheck ("Unique" | "Duplicate Found")
      - riskLevel ("Low" | "Medium" | "High")
      - explanation (brief professional string)`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(aiResponse.choices[0].message.content || "{}");
      
      const signatureScore = analysis.signatureScore || 85;
      const tamperStatus = analysis.tamperStatus || "No Tampering";
      const riskLevel = analysis.riskLevel || "Low";
      const duplicateCheck = analysis.duplicateCheck || "Unique";
      let explanation = analysis.explanation || "Verification successful.";

      // 2. Logic: Check Balance & Risk
      const payer = await storage.getUser(cheque.payerAccountId);
      // For payee, we search by name and bank (simulation)
      const allUsers = await storage.getUsers();
      const payee = allUsers.find(u => u.name === cheque.payeeName && u.bankName === cheque.payeeBank);

      let newStatus = "CLEARED";
      
      if (riskLevel === "High") {
         newStatus = "CANCELLED";
         explanation = "Cheque cancelled due to high fraud risk detected in signature analysis.";
      } else if (!payer || payer.balance < cheque.amount) {
         newStatus = "BOUNCED";
         explanation = "Cheque bounced due to insufficient funds in payer's account.";
      }

      // Snapshots
      const payerBalanceBefore = payer?.balance || 0;
      const payeeBalanceBefore = payee?.balance || 0;
      let payerBalanceAfter = payerBalanceBefore;
      let payeeBalanceAfter = payeeBalanceBefore;

      // 3. Execute Transaction
      if (newStatus === "CLEARED" && payer && payee) {
         payerBalanceAfter = payerBalanceBefore - cheque.amount;
         payeeBalanceAfter = payeeBalanceBefore + cheque.amount;

         await storage.updateUserBalance(payer.id, payerBalanceAfter);
         await storage.updateUserBalance(payee.id, payeeBalanceAfter);
         
         const latestBlock = await storage.getLatestBlock();
         const previousHash = latestBlock ? latestBlock.hash : "0";
         const nextIndex = latestBlock ? latestBlock.index + 1 : 0;
         
         const blockData = {
            transactionId: `TX-${Date.now()}`,
            payerName: payer.name,
            payeeName: payee.name,
            bankNames: { payer: payer.bankName, payee: payee.bankName },
            amount: cheque.amount,
            status: "CLEARED",
            explanation,
            balancesBefore: { payer: payerBalanceBefore, payee: payeeBalanceBefore },
            balancesAfter: { payer: payerBalanceAfter, payee: payeeBalanceAfter }
         };

         const newBlock = blockchain.createBlock(nextIndex, previousHash, blockData);
         await storage.createBlock(newBlock);
      }

      // 4. Update Cheque
      const updatedCheque = await storage.updateCheque(cheque.id, {
        status: newStatus,
        signatureScore,
        tamperStatus,
        duplicateCheck,
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
      console.error("Processing error:", error);
      res.status(500).json({ message: "Failed to process cheque: " + error.message });
    }
  });

  // Blocks
  app.get(api.blocks.list.path, async (req, res) => {
    const blocks = await storage.getBlocks();
    res.json(blocks);
  });
  
  // SEED DATA
  if (process.env.NODE_ENV !== 'production') {
      const users = await storage.getUsers();
      if (users.length === 0) {
          await storage.createUser({
              name: "Rajesh Kumar",
              bankName: "HDFC Bank",
              accountNumber: "50100234567890",
              ifscCode: "HDFC0001234",
              balance: 15000000, // ₹1,50,000.00
          });
          await storage.createUser({
              name: "Priya Sharma",
              bankName: "State Bank of India (SBI)",
              accountNumber: "30456789123",
              ifscCode: "SBIN0004567",
              balance: 500000, // ₹5,000.00
          });
          await storage.createUser({
              name: "Amit Patel",
              bankName: "ICICI Bank",
              accountNumber: "000401234567",
              ifscCode: "ICIC0000004",
              balance: 2500000, // ₹25,000.00
          });
      }
      
      const latestBlock = await storage.getLatestBlock();
      if (!latestBlock) {
          const genesisBlock = blockchain.createBlock(0, "0", { message: "Genesis Block - ChequeClear India" });
          await storage.createBlock(genesisBlock);
      }
  }

  return httpServer;
}
