import { test } from "node:test";
import assert from "node:assert/strict";
import { Economy, EconomyError } from "../src/economy/economy";
import { MemoryStore } from "../src/economy/memoryStore";

const mk = () => {
  const s = new MemoryStore();
  return { s, e: new Economy(s, { maxEarnPerAction: 1000, taxRate: 0.1 }) };
};
const code = (p: Promise<unknown>) => p.then(() => "ok", (e) => (e as EconomyError).code);

test("earn applies tax and logs", async () => {
  const { s, e } = mk();
  const r = await e.earn("u1", 100, "job:1");
  assert.equal(r.balanceAfter, 90);
  assert.equal(s.log.length, 1);
});

test("replay of same key credits once", async () => {
  const { s, e } = mk();
  await e.earn("u1", 100, "job:1");
  await e.earn("u1", 100, "job:1");
  assert.equal(s.balances.get("u1"), 90);
  assert.equal(s.log.length, 1);
});

test("rapid-fire concurrent spend cannot go negative / double-spend", async () => {
  const { s, e } = mk();
  await e.topup("u1", 100, "evt1");
  const results = await Promise.all(
    Array.from({ length: 50 }, (_, i) => code(e.spend("u1", 60, "purchase", `buy:${i}`)))
  );
  assert.equal(results.filter((r) => r === "ok").length, 1);
  assert.equal(s.balances.get("u1"), 40);
});

test("negative, zero, float, NaN, huge amounts rejected", async () => {
  const { e } = mk();
  for (const bad of [-5, 0, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 10]) {
    assert.equal(await code(e.earn("u1", bad as number, `k${String(bad)}`)), "INVALID");
    assert.equal(await code(e.spend("u1", bad as number, "purchase", `s${String(bad)}`)), "INVALID");
  }
});

test("earn cap enforced", async () => {
  const { e } = mk();
  assert.equal(await code(e.earn("u1", 1001, "k")), "CAP");
});

test("missing idempotency key rejected", async () => {
  const { e } = mk();
  await assert.rejects(async () => e.earn("u1", 10, ""), EconomyError);
});

test("same webhook event twice credits once", async () => {
  const { s, e } = mk();
  await e.topup("u1", 500, "stripe_evt_9");
  await e.topup("u1", 500, "stripe_evt_9");
  assert.equal(s.balances.get("u1"), 500);
});

test("failed spend leaves balance and log untouched", async () => {
  const { s, e } = mk();
  await e.topup("u1", 10, "evt");
  assert.equal(await code(e.spend("u1", 50, "rent", "r1")), "INSUFFICIENT");
  assert.equal(s.balances.get("u1"), 10);
  assert.equal(s.log.length, 1);
});
