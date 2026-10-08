import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { CityRoom } from "./CityRoom";
import { ROOM_NAME } from "../../shared/protocol";

const port = Number(process.env.PORT ?? 2567);

const gameServer = new Server({
  transport: new WebSocketTransport({ pingInterval: 5000, pingMaxRetries: 3 }),
});

gameServer.define(ROOM_NAME, CityRoom);
gameServer.listen(port).then(() => console.log(`game server on :${port}`));
