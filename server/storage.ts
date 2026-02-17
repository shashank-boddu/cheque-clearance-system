import { db } from "./db";
import { 
  users, cheques, blocks,
  type User, type InsertUser,
  type Cheque, type InsertCheque,
  type Block, type InsertBlock
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  updateUserBalance(id: number, newBalance: number): Promise<User>;
  createUser(user: InsertUser): Promise<User>;

  // Cheques
  getCheque(id: number): Promise<Cheque | undefined>;
  getCheques(): Promise<Cheque[]>;
  createCheque(cheque: InsertCheque): Promise<Cheque>;
  updateCheque(id: number, updates: Partial<Cheque>): Promise<Cheque>;

  // Blocks
  getBlocks(): Promise<Block[]>;
  getLatestBlock(): Promise<Block | undefined>;
  createBlock(block: InsertBlock): Promise<Block>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserBalance(id: number, newBalance: number): Promise<User> {
    const [updated] = await db.update(users)
      .set({ balance: newBalance })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  // Cheques
  async getCheque(id: number): Promise<Cheque | undefined> {
    const [cheque] = await db.select().from(cheques).where(eq(cheques.id, id));
    return cheque;
  }

  async getCheques(): Promise<Cheque[]> {
    return await db.select().from(cheques).orderBy(desc(cheques.createdAt));
  }

  async createCheque(cheque: InsertCheque): Promise<Cheque> {
    const [newCheque] = await db.insert(cheques).values(cheque).returning();
    return newCheque;
  }

  async updateCheque(id: number, updates: Partial<Cheque>): Promise<Cheque> {
    const [updated] = await db.update(cheques)
      .set(updates)
      .where(eq(cheques.id, id))
      .returning();
    return updated;
  }

  // Blocks
  async getBlocks(): Promise<Block[]> {
    return await db.select().from(blocks).orderBy(desc(blocks.index));
  }

  async getLatestBlock(): Promise<Block | undefined> {
    const [block] = await db.select().from(blocks).orderBy(desc(blocks.index)).limit(1);
    return block;
  }

  async createBlock(block: InsertBlock): Promise<Block> {
    const [newBlock] = await db.insert(blocks).values(block).returning();
    return newBlock;
  }
}

export const storage = new DatabaseStorage();
