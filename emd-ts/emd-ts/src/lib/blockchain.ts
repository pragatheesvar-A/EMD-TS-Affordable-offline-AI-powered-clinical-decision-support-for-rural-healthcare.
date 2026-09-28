// ============================================================
// EMD-TS Local Permissioned Audit Blockchain
// ------------------------------------------------------------
// A lightweight, dependency-free blockchain-style ledger used to
// provide a tamper-evident audit trail for EMD-TS. It intentionally
// mirrors the structure of a permissioned blockchain (blocks,
// transactions, hash-chaining, validation) so it can be swapped for
// Hyperledger Fabric or another permissioned chain in production
// without changing the rest of the application.
//
// IMPORTANT: only pseudonymous metadata is stored on-chain (patient ID,
// record hash, action, role, timestamp). Raw clinical data never
// touches the ledger — it stays in off-chain local storage.
// ============================================================

import { sha256Hex, generateId } from './crypto';
import { loadJSON, saveJSON, STORAGE_KEYS } from './storage';
import type { Block, BlockchainTransaction, BlockchainTxType, UserRole } from '../types';

const GENESIS_PREV_HASH = '0'.repeat(64);

function computeBlockPayload(block: Omit<Block, 'currentHash'>): string {
  return JSON.stringify({
    index: block.index,
    timestamp: block.timestamp,
    transactions: block.transactions,
    previousHash: block.previousHash,
    nonce: block.nonce,
  });
}

export async function computeBlockHash(block: Omit<Block, 'currentHash'>): Promise<string> {
  return sha256Hex(computeBlockPayload(block));
}

async function createGenesisBlock(): Promise<Block> {
  const base: Omit<Block, 'currentHash'> = {
    index: 0,
    timestamp: new Date(0).toISOString(),
    transactions: [],
    previousHash: GENESIS_PREV_HASH,
    nonce: 0,
  };
  const currentHash = await computeBlockHash(base);
  return { ...base, currentHash };
}

export class BlockchainService {
  private chain: Block[] = [];
  private loaded = false;

  async init(): Promise<void> {
    if (this.loaded) return;
    const stored = loadJSON<Block[]>(STORAGE_KEYS.blockchain, []);
    if (stored.length === 0) {
      const genesis = await createGenesisBlock();
      this.chain = [genesis];
      this.persist();
    } else {
      this.chain = stored;
    }
    this.loaded = true;
  }

  private persist(): void {
    saveJSON(STORAGE_KEYS.blockchain, this.chain);
  }

  getChain(): Block[] {
    return this.chain;
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  async addTransaction(params: {
    type: BlockchainTxType;
    patientId: string;
    userRole: UserRole | 'AI_ENGINE' | 'SYSTEM';
    action: string;
    recordHash: string;
    recordVersion?: number;
  }): Promise<Block> {
    await this.init();
    const tx: BlockchainTransaction = {
      txId: generateId('TX'),
      type: params.type,
      patientId: params.patientId,
      userRole: params.userRole,
      action: params.action,
      recordHash: params.recordHash,
      timestamp: new Date().toISOString(),
      recordVersion: params.recordVersion ?? 1,
    };

    const prev = this.getLatestBlock();
    const base: Omit<Block, 'currentHash'> = {
      index: prev.index + 1,
      timestamp: tx.timestamp,
      transactions: [tx],
      previousHash: prev.currentHash,
      nonce: 0,
    };
    const currentHash = await computeBlockHash(base);
    const block: Block = { ...base, currentHash };
    this.chain.push(block);
    this.persist();
    return block;
  }

  getTransactionsForPatient(patientId: string): BlockchainTransaction[] {
    return this.chain
      .flatMap((b) => b.transactions)
      .filter((t) => t.patientId === patientId);
  }

  getAllTransactions(): (BlockchainTransaction & { blockIndex: number; blockHash: string })[] {
    return this.chain
      .filter((b) => b.index !== 0)
      .flatMap((b) =>
        b.transactions.map((t) => ({ ...t, blockIndex: b.index, blockHash: b.currentHash }))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Verifies hash-chain integrity: recomputes every block's hash and checks
   * previousHash linkage. Returns the index of the first broken block, or
   * null if the whole chain is valid.
   */
  async verifyChain(): Promise<{ valid: boolean; brokenAtIndex: number | null }> {
    await this.init();
    for (let i = 0; i < this.chain.length; i++) {
      const block = this.chain[i];
      const { currentHash, ...rest } = block;
      const recomputed = await computeBlockHash(rest);
      if (recomputed !== currentHash) {
        return { valid: false, brokenAtIndex: i };
      }
      if (i > 0 && block.previousHash !== this.chain[i - 1].currentHash) {
        return { valid: false, brokenAtIndex: i };
      }
    }
    return { valid: true, brokenAtIndex: null };
  }

  /** Reset the ledger (used by the "reset demo data" settings action). */
  async reset(): Promise<void> {
    const genesis = await createGenesisBlock();
    this.chain = [genesis];
    this.persist();
  }
}

export const blockchain = new BlockchainService();
