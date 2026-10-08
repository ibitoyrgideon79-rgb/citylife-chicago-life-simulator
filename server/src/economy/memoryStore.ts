import type { LedgerStore, LedgerTx, TxRecord } from "./types";

/** Test/dev store. Serializes transactions like a row lock would. */
export class MemoryStore implements LedgerStore {
  balances = new Map<string, number>();
  log: TxRecord[] = [];
  private chain: Promise<unknown> = Promise.resolve();

  atomic<T>(fn: (tx: LedgerTx) => Promise<T>): Promise<T> {
    const run = this.chain.then(async () => {
      const snapB = new Map(this.balances);
      const snapL = this.log.length;
      const tx: LedgerTx = {
        getBalance: async (u) => this.balances.get(u) ?? 0,
        setBalance: async (u, b) => { this.balances.set(u, b); },
        findByKey: async (k) => this.log.find((r) => r.idempotencyKey === k) ?? null,
        insert: async (r) => { const rec = { ...r, id: this.log.length + 1 }; this.log.push(rec); return rec; },
      };
      try { return await fn(tx); }
      catch (e) { this.balances = snapB; this.log.length = snapL; throw e; } // rollback
    });
    this.chain = run.catch(() => {});
    return run;
  }
}
