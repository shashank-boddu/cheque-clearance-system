import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { blockchain } from "./blockchain";
import { z } from "zod";
import { OpenAI } from "openai";

// Initialize OpenAI client
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

  // Process Cheque (AI + Blockchain Logic)
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
      // In a real app, we'd send the image URL to OpenAI's vision model.
      // Here we'll simulate it or ask OpenAI for a mock analysis based on the payee/amount.
      
      const prompt = `Analyze a cheque for ${cheque.amount / 100} USD paid to ${cheque.payeeName}. Return a JSON object with:
      - signatureScore (0-100)
      - tamperStatus ("Low", "Medium", "High")
      - duplicateCheck ("Passed", "Failed")
      - riskLevel ("Low", "Medium", "High")
      - explanation (brief string)`;

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(aiResponse.choices[0].message.content || "{}");
      
      // Default fallbacks if AI fails to return proper JSON structure
      const signatureScore = analysis.signatureScore || 85;
      const tamperStatus = analysis.tamperStatus || "Low";
      const riskLevel = analysis.riskLevel || "Low";
      const duplicateCheck = analysis.duplicateCheck || "Passed";

      // 2. Logic: Check Balance & Risk
      const payer = await storage.getUser(cheque.payerAccountId);
      let newStatus = "CLEARED";
      
      if (!payer) {
         newStatus = "BOUNCED"; // Should not happen in this controlled env
      } else if (riskLevel === "High" || tamperStatus === "High" || signatureScore < 50) {
         newStatus = "FRAUD";
      } else if (payer.balance < cheque.amount) {
         newStatus = "BOUNCED";
      }

      // 3. Execute Transaction
      if (newStatus === "CLEARED" && payer) {
         // Deduct balance
         await storage.updateUserBalance(payer.id, payer.balance - cheque.amount);
         
         // Create Blockchain Block
         const latestBlock = await storage.getLatestBlock();
         const previousHash = latestBlock ? latestBlock.hash : "0";
         const nextIndex = latestBlock ? latestBlock.index + 1 : 0;
         
         const blockData = {
            transactionId: `TX-${Date.now()}`,
            chequeId: cheque.id,
            amount: cheque.amount,
            from: payer.accountNumber,
            to: cheque.payeeName,
            status: "CLEARED"
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
              name: "Alice Corp",
              balance: 5000000, // $50,000.00
              accountNumber: "US-1234-5678-9012"
          });
          await storage.createUser({
              name: "Bob Enterprises",
              balance: 250000, // $2,500.00
              accountNumber: "US-9876-5432-1098"
          });
      }
      
      // Create Genesis Block if none
      const latestBlock = await storage.getLatestBlock();
      if (!latestBlock) {
          const genesisBlock = blockchain.createBlock(0, "0", { message: "Genesis Block" });
          await storage.createBlock(genesisBlock);
      }
  }

  return httpServer;
}
