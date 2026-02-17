import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  balance: integer("balance").notNull().default(0), // In cents
  accountNumber: text("account_number").notNull().unique(),
});

export const cheques = pgTable("cheques", {
  id: serial("id").primaryKey(),
  payeeName: text("payee_name").notNull(),
  payerAccountId: integer("payer_account_id").notNull(), // Links to users.id
  amount: integer("amount").notNull(), // In cents
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING, CLEARED, BOUNCED, FRAUD
  
  // AI Analysis Results
  signatureScore: integer("signature_score"),
  tamperStatus: text("tamper_status"), // Low, Medium, High
  duplicateCheck: text("duplicate_check"), // Passed, Failed
  riskLevel: text("risk_level"), // Low, Medium, High
  
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const blocks = pgTable("blocks", {
  index: serial("index").primaryKey(),
  timestamp: text("timestamp").notNull(),
  data: jsonb("data").notNull(), // Stores the transaction details
  previousHash: text("previous_hash").notNull(),
  hash: text("hash").notNull(),
});

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertChequeSchema = createInsertSchema(cheques).omit({ 
  id: true, 
  processedAt: true, 
  createdAt: true,
  status: true,
  signatureScore: true,
  tamperStatus: true,
  duplicateCheck: true,
  riskLevel: true
});
export const insertBlockSchema = createInsertSchema(blocks);

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Cheque = typeof cheques.$inferSelect;
export type InsertCheque = z.infer<typeof insertChequeSchema>;

export type Block = typeof blocks.$inferSelect;
export type InsertBlock = z.infer<typeof insertBlockSchema>;

// API Request/Response Types
export type CreateChequeRequest = InsertCheque;

export type ChequeResponse = Cheque;

export interface AIAnalysisResult {
  signatureScore: number;
  tamperStatus: "Low" | "Medium" | "High";
  duplicateCheck: "Passed" | "Failed";
  riskLevel: "Low" | "Medium" | "High";
  explanation?: string;
}
