import { Client } from "colyseus.js";
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const url = process.env.URL ?? "ws://localhost:2567";
let fails = 0;
const check = (name, ok, info = "") => { console.log(ok ? "PASS" : "FAIL", name, info); if (!ok) fails++; };

const a = await new Client(url).joinOrCreate("city", { name: "A" });
const b = await new Client(url).joinOrCreate("city", { name: "B" });
await wait(300);
check("both players visible", a.state.players.size === 2);

const me = a.state.players.get(a.sessionId);
let x0 = me.x;
a.send("input", { x: 1, z: 0 }); await wait(1000);
a.send("input", { x: 0, z: 0 }); await wait(200);
check("normal move ~4 units/s", Math.abs(me.x - x0 - 4) < 0.6, (me.x - x0).toFixed(2));

x0 = me.x; await wait(60);
a.send("input", { x: 9999, z: 0 }); await wait(1000);
a.send("input", { x: 0, z: 0 }); await wait(200);
check("speed cheat capped", me.x - x0 < 5, (me.x - x0).toFixed(2));

a.send("input", { x: "abc", z: NaN }); a.send("input", null); await wait(200);
check("junk input ignored", Number.isFinite(me.x));

const onB = b.state.players.get(a.sessionId);
check("B sees A in sync", Math.abs(onB.x - me.x) < 0.5);

a.send("input", { x: 1, z: 0 }); await wait(20000);
check("world bound clamps at 75", Math.abs(me.x - 75) < 0.01, me.x.toFixed(2));

process.exit(fails ? 1 : 0);
