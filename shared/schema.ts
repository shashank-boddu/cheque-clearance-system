import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bankName: text("bank_name").notNull().default("HDFC Bank"),
  accountNumber: text("account_number").notNull().unique(),
  ifscCode: text("ifsc_code").notNull().default("HDFC0001234"),
  balance: integer("balance").notNull().default(0), // In paise (to handle INR properly)
});

export const cheques = pgTable("cheques", {
  id: serial("id").primaryKey(),
  chequeNumber: text("cheque_number").notNull(),
  payeeName: text("payee_name").notNull(),
  payeeBank: text("payee_bank").notNull(),
  payerAccountId: integer("payer_account_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(), // In paise
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("PENDING"), // PENDING, CLEARED, BOUNCED, CANCELLED
  
  // AI Analysis Results
  signatureScore: integer("signature_score"),
  tamperStatus: text("tamper_status"), // "No Tampering" | "Suspicious Alteration"
  duplicateCheck: text("duplicate_check"), // "Unique" | "Duplicate Found"
  riskLevel: text("risk_level"), // "Low" | "Medium" | "High"
  explanation: text("explanation"),
  
  // Balance snapshots
  payerBalanceBefore: integer("payer_balance_before"),
  payerBalanceAfter: integer("payer_balance_after"),
  payeeBalanceBefore: integer("payee_balance_before"),
  payeeBalanceAfter: integer("payee_balance_after"),

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
  riskLevel: true,
  explanation: true,
  payerBalanceBefore: true,
  payerBalanceAfter: true,
  payeeBalanceBefore: true,
  payeeBalanceAfter: true,
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
  tamperStatus: "No Tampering" | "Suspicious Alteration";
  duplicateCheck: "Unique" | "Duplicate Found";
  riskLevel: "Low" | "Medium" | "High";
  explanation: string;
}
