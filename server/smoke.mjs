import { Client } from "colyseus.js";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const a = await new Client("ws://localhost:2567").joinOrCreate("city", { name: "A" });
const b = await new Client("ws://localhost:2567").joinOrCreate("city", { name: "B" });
await wait(300);
console.log("players seen by A:", a.state.players.size);

const me = a.state.players.get(a.sessionId);
const x0 = me.x;

// 1) Normal move: right for ~1s => expect ~4 units
a.send("input", { x: 1, z: 0 });
await wait(1000);
a.send("input", { x: 0, z: 0 });
await wait(200);
console.log("normal move dx:", (me.x - x0).toFixed(2), "(expect ~4)");

// 2) Cheat: try speed 9999 for 1s => must still be ~4
const x1 = me.x;
await wait(60);
a.send("input", { x: 9999, z: 0 });
await wait(1000);
a.send("input", { x: 0, z: 0 });
await wait(200);
console.log("cheat dx:", (me.x - x1).toFixed(2), "(expect ~4, NOT 9999)");

// 3) Junk input must not crash or teleport
a.send("input", { x: "abc", z: NaN });
a.send("input", null);
await wait(200);
console.log("after junk, x finite:", Number.isFinite(me.x));

// 4) B sees A's position (sync works)
const meOnB = b.state.players.get(a.sessionId);
console.log("B sees A at x:", meOnB.x.toFixed(2), "matches:", Math.abs(meOnB.x - me.x) < 0.5);

// 5) World bounds: push far right for 15s should clamp at 50
a.send("input", { x: 1, z: 0 });
await wait(15000);
console.log("bounds x:", me.x.toFixed(2), "(expect 50)");
process.exit(0);
