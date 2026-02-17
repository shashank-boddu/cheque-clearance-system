import crypto from 'crypto';
import { type InsertBlock } from '@shared/schema';

export class BlockchainService {
  calculateHash(index: number, previousHash: string, timestamp: string, data: any): string {
    return crypto
      .createHash('sha256')
      .update(index + previousHash + timestamp + JSON.stringify(data))
      .digest('hex');
  }

  createBlock(index: number, previousHash: string, data: any): InsertBlock {
    const timestamp = new Date().toISOString();
    const hash = this.calculateHash(index, previousHash, timestamp, data);
    
    return {
      timestamp,
      data,
      previousHash,
      hash
    };
  }
}

export const blockchain = new BlockchainService();
