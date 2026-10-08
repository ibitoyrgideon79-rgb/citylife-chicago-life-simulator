# City Life: Chicago

A browser-based, multiplayer 3D Chicago life-simulation prototype. The client uses Next.js, React Three Fiber, and Three.js; the multiplayer server uses Colyseus.

## Run locally

Requires Node.js and npm.

```powershell
npm ci
```

Start the game server and client in separate terminals:

```powershell
npm run dev -w server
npm run dev -w client -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001). The client connects to the local game server on port `2567`.

## Checks

```powershell
npm run typecheck
npm test
npm run build
```

## Map data

The game includes generated Greater Chicago map assets so they are available immediately after cloning. Map data is derived from © OpenStreetMap contributors and is available under the Open Database License (ODbL); see [OpenStreetMap copyright](https://www.openstreetmap.org/copyright).

The original regional `.osm.pbf` downloads are not included because of their size. To regenerate the map assets, obtain the source extracts expected by `scripts/build-chicago-metro.mjs` and run:

```powershell
npm run build:metro-map
```

## Project status

This is an evolving prototype, not a finished or production-ready open-world game. Features and simulation detail are still under development.
