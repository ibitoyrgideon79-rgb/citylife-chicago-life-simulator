import type { LedgerStore, TxReason, TxRecord } from "./types";

export type EconomyConfig = {
  maxEarnPerAction: number;  // hard cap on any single credit from gameplay
  taxRate: number;           // 0..1, applied to job_pay
};

export class EconomyError extends Error {
  constructor(public code: "INSUFFICIENT" | "INVALID" | "CAP", msg: string) { super(msg); }
}

const isMoney = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) > 0;

/**
 * The ONLY code allowed to change a balance.
 * Every change: validated, atomic, logged, idempotent when a key is given.
 */
export class Economy {
  constructor(private store: LedgerStore, private cfg: EconomyConfig) {}

  /** Credit from gameplay (job pay). Capped, taxed, idempotent. */
  async earn(userId: string, amount: number, key: string): Promise<TxRecord> {
    if (!isMoney(amount)) throw new EconomyError("INVALID", "bad amount");
    if (amount > this.cfg.maxEarnPerAction) throw new EconomyError("CAP", "over earn cap");
    const tax = Math.floor(amount * this.cfg.taxRate);
    return this.apply(userId, amount - tax, "job_pay", key);
  }

  /** Debit (rent, purchases). Can never take balance below zero. */
  async spend(userId: string, amount: number, reason: TxReason, key: string): Promise<TxRecord> {
    if (!isMoney(amount)) throw new EconomyError("INVALID", "bad amount");
    return this.apply(userId, -amount, reason, key);
  }

  /** Real-money top-up. Call ONLY from a verified payment webhook; key = provider event id. */
  async topup(userId: string, amount: number, providerEventId: string): Promise<TxRecord> {
    if (!isMoney(amount)) throw new EconomyError("INVALID", "bad amount");
    return this.apply(userId, amount, "topup", `topup:${providerEventId}`);
  }

  private apply(userId: string, delta: number, reason: TxReason, key: string): Promise<TxRecord> {
    if (!key) throw new EconomyError("INVALID", "idempotency key required");
    return this.store.atomic(async (tx) => {
      const prior = await tx.findByKey(key);
      if (prior) return prior;                       // replay: return original, change nothing
      const bal = await tx.getBalance(userId);
      const next = bal + delta;
      if (next < 0) throw new EconomyError("INSUFFICIENT", "not enough money");
      if (!Number.isSafeInteger(next)) throw new EconomyError("INVALID", "overflow");
      await tx.setBalance(userId, next);
      return tx.insert({ userId, amount: delta, reason, balanceAfter: next, idempotencyKey: key, at: Date.now() });
    });
  }
}
