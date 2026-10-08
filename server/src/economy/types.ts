export type TxReason =
  | "job_pay" | "rent" | "tax" | "purchase" | "topup" | "admin_adjust" | "billboard_rent";

export type TxRecord = {
  id: number;
  userId: string;
  amount: number;        // signed integer, smallest unit (no floats for money)
  reason: TxReason;
  balanceAfter: number;
  idempotencyKey: string | null;
  at: number;
};

/**
 * Storage the economy needs. Postgres adapter MUST implement `atomic` as one DB
 * transaction with a row lock on the wallet (SELECT ... FOR UPDATE), a UNIQUE
 * constraint on idempotencyKey, and CHECK (balance >= 0).
 */
export interface LedgerStore {
  atomic<T>(fn: (tx: LedgerTx) => Promise<T>): Promise<T>;
}
export interface LedgerTx {
  getBalance(userId: string): Promise<number>;
  setBalance(userId: string, balance: number): Promise<void>;
  findByKey(key: string): Promise<TxRecord | null>;
  insert(rec: Omit<TxRecord, "id">): Promise<TxRecord>;
}
