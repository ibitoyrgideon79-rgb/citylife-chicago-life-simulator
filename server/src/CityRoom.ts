import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";
import fs from "node:fs";
import path from "node:path";
import { findRoadRoute, type RoadPoint, type RoadRoute } from "./roadRouting";

import {
  APARTMENT_POIS,
  CAR_HALF_L,
  CAR_HALF_W,
  CAR_MAX_SPEED,
  CAR_REVERSE_SPEED,
  CAR_TURN_RATE,
  CTA_STATIONS,
  CROUCH_SPEED,
  HOUSING_PROPERTIES,
  GRAVITY,
  INITIAL_HOSTILE_NPCS,
  INITIAL_VEHICLES,
  INTERACTIVE_POIS,
  JUMP_VELOCITY,
  MAX_PLAYERS_PER_ROOM,
  MIN_INPUT_GAP_MS,
  MSG,
  PROFESSIONS,
  PRONE_SPEED,
  SPEED,
  SPRINT_SPEED,
  STREET_OBSTACLES,
  STREET_PEDESTRIANS,
  TICK_MS,
  type InputMessage,
  type HousingMessage,
  type InteractMessage,
  type LifeSelectMessage,
  type Stance,
  type RideshareMessage,
  type SocialChatMessage,
  type ToastMessage,
  type TransitMessage,
  type VehicleMessage,
  type WardrobeMessage,
} from "../../shared/protocol";
import cityData from "../../shared/chicago-loop.json";

type StaticBuilding = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

type ServiceRoute = {
  points: RoadPoint[];
  nextIndex: number;
  tripPoints: RoadPoint[];
};

const metroCollisionPath = path.resolve(__dirname, "../../shared/chicago-metro-collision.json");
const metroIndexPath = path.resolve(__dirname, "../../shared/chicago-metro-index.json");
const metroBuildings: StaticBuilding[] = fs.existsSync(metroCollisionPath)
  ? (JSON.parse(fs.readFileSync(metroCollisionPath, "utf8")) as [number, number, number, number][])
    .map(([minX, maxX, minZ, maxZ]) => ({ minX, maxX, minZ, maxZ }))
  : [];
const metroBounds = fs.existsSync(metroIndexPath)
  ? (JSON.parse(fs.readFileSync(metroIndexPath, "utf8")) as {
    bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  }).bounds
  : { minX: -320, maxX: 320, minZ: -320, maxZ: 320 };
const buildings: StaticBuilding[] = [...cityData.buildings, ...metroBuildings];
const COLLISION_CELL_SIZE = 1500;
const collisionGrid = new Map<string, StaticBuilding[]>();

for (const building of buildings) {
  const minCellX = Math.floor(building.minX / COLLISION_CELL_SIZE);
  const maxCellX = Math.floor(building.maxX / COLLISION_CELL_SIZE);
  const minCellZ = Math.floor(building.minZ / COLLISION_CELL_SIZE);
  const maxCellZ = Math.floor(building.maxZ / COLLISION_CELL_SIZE);
  for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
    for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
      const key = `${cellX}_${cellZ}`;
      const bucket = collisionGrid.get(key) ?? [];
      bucket.push(building);
      collisionGrid.set(key, bucket);
    }
  }
}

function buildingsNear(x: number, z: number, radius = 2): StaticBuilding[] {
  const minCellX = Math.floor((x - radius) / COLLISION_CELL_SIZE);
  const maxCellX = Math.floor((x + radius) / COLLISION_CELL_SIZE);
  const minCellZ = Math.floor((z - radius) / COLLISION_CELL_SIZE);
  const maxCellZ = Math.floor((z + radius) / COLLISION_CELL_SIZE);
  const nearby = new Set<StaticBuilding>();
  for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
    for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ += 1) {
      for (const building of collisionGrid.get(`${cellX}_${cellZ}`) ?? []) nearby.add(building);
    }
  }
  return [...nearby];
}

function overlapsBox(x: number, z: number, radius: number, box: StaticBuilding) {
  return x + radius > box.minX && x - radius < box.maxX &&
    z + radius > box.minZ && z - radius < box.maxZ;
}

function vehicleOverlaps(x: number, z: number, rot: number, other: VehicleState) {
  const halfX = Math.abs(Math.cos(rot)) * CAR_HALF_W + Math.abs(Math.sin(rot)) * CAR_HALF_L;
  const halfZ = Math.abs(Math.sin(rot)) * CAR_HALF_W + Math.abs(Math.cos(rot)) * CAR_HALF_L;
  const otherHalfX = Math.abs(Math.cos(other.rot)) * CAR_HALF_W + Math.abs(Math.sin(other.rot)) * CAR_HALF_L;
  const otherHalfZ = Math.abs(Math.sin(other.rot)) * CAR_HALF_W + Math.abs(Math.cos(other.rot)) * CAR_HALF_L;
  return x + halfX + 0.6 > other.x - otherHalfX &&
    x - halfX - 0.6 < other.x + otherHalfX &&
    z + halfZ + 0.6 > other.z - otherHalfZ &&
    z - halfZ - 0.6 < other.z + otherHalfZ;
}

function routeDistanceRemaining(vehicle: VehicleState, route: ServiceRoute) {
  let distance = Math.hypot(vehicle.targetX - vehicle.x, vehicle.targetZ - vehicle.z);
  for (let index = route.nextIndex + 1; index < route.points.length; index += 1) {
    const previous = route.points[index - 1];
    const current = route.points[index];
    distance += Math.hypot(current.x - previous.x, current.z - previous.z);
  }
  return distance;
}

function getHomeExitPosition(homeId: string) {
  const property = HOUSING_PROPERTIES.find((item) => item.id === homeId);
  return property ? { x: property.x, z: property.z } : { x: 14, z: -2.5 };
}

export class Player extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") z = 0;
  @type("number") money = 1500;
  @type("string") name = "";
  @type("string") stance = "stand"; // "stand" | "crouch" | "prone"
  @type("boolean") isSleeping = false;
  @type("string") interiorId = "";
  @type("boolean") isSprinting = false;
  @type("string") vehicleId = ""; // empty if on foot
  @type("string") interior = "street"; // "street" | "apartment_loft" | "mall_interior"
  @type("string") jacketColor = "#dc2626";
  @type("string") pantsColor = "#1e293b";
  @type("string") sneakerColor = "#ffffff";
  @type("boolean") doorOpen = false;
  @type("string") profession = "";
  @type("string") company = "";
  @type("string") gender = "male";
  @type("number") health = 100;
  @type("number") energy = 100;
  @type("number") hunger = 80;
  @type("number") thirst = 80;
  @type("string") homeId = "";
  @type("string") homeTenure = "";
  @type("number") homeLeaseEndsAt = 0;
  @type("number") wantedLevel = 0;
  @type("number") educationLevel = 0;
  @type("string") rideStatus = "";
  @type("number") rideEtaAt = 0;
  @type("number") rideFare = 0;
  @type("string") medicalStatus = "";

  // server-only (not synced)
  dirX = 0;
  dirZ = 0;
  vy = 0;
  sprinting = false;
  jumpPending = false;
  desiredStance: Stance = "stand";
  lastInputAt = 0;
  lastInteractAt = 0;
  lastAttackAt = 0;
  lastChatAt = 0;
  pendingRide = false;
  pendingTransit = false;
  lastVehicleImpactAt = 0;
  impactUntil = 0;
  pickupX = 0;
  pickupZ = 0;
  rideVehicleId = "";
  rideDestinationX = 0;
  rideDestinationZ = 0;
  medicalVehicleId = "";
  needTick = 0;
  lastWorkAt = 0;
  lastStudyAt = 0;
}

export class VehicleState extends Schema {
  @type("string") id = "";
  @type("number") x = 0;
  @type("number") z = 0;
  @type("number") rot = 0;
  @type("string") color = "#facc15";
  @type("string") model = "taxi";
  @type("string") name = "";
  @type("string") driverId = "";
  @type("number") speed = 0;
  @type("boolean") doorOpen = false;
  @type("string") serviceType = "";
  @type("string") serviceFor = "";
  @type("string") ridePhase = "";
  @type("string") destinationName = "";
  @type("number") targetX = 0;
  @type("number") targetZ = 0;
  @type("number") fare = 0;
  @type("string") riderId = "";
  ambientAxis: "x" | "z" | null = null;
  ambientMin = 0;
  ambientMax = 0;
  ambientLane = 0;
  ambientDirection: -1 | 1 = 1;
  ambientSpeed = 0;
  waitUntil = 0;
}

export class StreetPedestrianSchema extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  @type("string") gender = "male";
  @type("string") topColor = "#2563eb";
  @type("string") bottomColor = "#334155";
  @type("number") x = 0;
  @type("number") z = 0;
  @type("number") rot = 0;
  @type("string") activity = "";

  itinerary: Array<{ x: number; z: number; activity: string; pauseSeconds: number }> = [];
  itineraryIndex = 0;
  pauseUntil = 0;
}

export class HostileNPCSchema extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  @type("string") type = "cultist"; // "cultist" | "smoker"
  @type("number") x = 0;
  @type("number") z = 0;
  @type("number") rot = 0;
  @type("number") health = 100;
  @type("boolean") isAggro = false;
  @type("string") targetPlayerId = "";
  @type("boolean") isAttacking = false;

  // server-only
  spawnX = 0;
  spawnZ = 0;
  patrolTimer = 0;
  lastAttackTime = 0;
}

export class CityState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: VehicleState }) vehicles = new MapSchema<VehicleState>();
  @type({ map: HostileNPCSchema }) hostiles = new MapSchema<HostileNPCSchema>();
  @type({ map: StreetPedestrianSchema }) pedestrians = new MapSchema<StreetPedestrianSchema>();
}

function sharesInteriorSpace(first: Player, second: Player) {
  return first.interior === second.interior &&
    (first.interior !== "apartment_loft" || first.interiorId === second.interiorId);
}

export class CityRoom extends Room<CityState> {
  maxClients = MAX_PLAYERS_PER_ROOM;
  private readonly serviceRoutes = new Map<string, ServiceRoute>();

  private isHomeBedOccupied(exceptSessionId: string) {
    const interiorId = this.state.players.get(exceptSessionId)?.interiorId ??
      `home:${exceptSessionId}`;
    for (const [sessionId, player] of this.state.players) {
      if (
        sessionId !== exceptSessionId &&
        player.interior === "apartment_loft" &&
        player.interiorId === interiorId &&
        Math.hypot(player.x - 5.2, player.z + 2.8) < 1.25
      ) {
        return true;
      }
    }
    return false;
  }

  private placeAtHome(player: Player, sessionId: string) {
    player.interior = "apartment_loft";
    player.interiorId = `home:${sessionId}`;
    player.vy = 0;
    player.jumpPending = false;
    player.dirX = 0;
    player.dirZ = 0;
    player.sprinting = false;

    if (!this.isHomeBedOccupied(sessionId)) {
      player.x = 5.2;
      player.y = 0;
      player.z = -2.8;
      player.stance = "prone";
      player.desiredStance = "prone";
      player.isSleeping = true;
      return;
    }

    const floorSpawns = [
      { x: -2.8, z: 0.8 },
      { x: -2.8, z: 2.4 },
      { x: -1.0, z: 2.4 },
      { x: 1.0, z: 2.4 },
      { x: 3.3, z: 2.4 },
      { x: 3.3, z: 0.5 },
      { x: -2.8, z: -1.2 },
      { x: -1.0, z: -2.4 },
      { x: 1.0, z: 0.8 },
      { x: 3.3, z: -1.4 },
    ];
    const spawn = floorSpawns.find((candidate) =>
      [...this.state.players.entries()].every(([otherId, other]) =>
        otherId === sessionId || other.interior !== "apartment_loft" ||
        other.interiorId !== player.interiorId ||
        Math.hypot(candidate.x - other.x, candidate.z - other.z) >= 1.2,
      ),
    ) ?? floorSpawns[0];
    player.x = spawn.x;
    player.y = 0;
    player.z = spawn.z;
    player.stance = "stand";
    player.desiredStance = "stand";
    player.isSleeping = false;
  }

  private wakeAtHome(player: Player, sessionId: string, health: number) {
    player.health = health;
    player.energy = 80;
    this.placeAtHome(player, sessionId);
  }

  onCreate() {
    const state = new CityState();

    // Initialize interactive vehicle fleet
    INITIAL_VEHICLES.forEach((cfg) => {
      const v = new VehicleState();
      v.id = cfg.id;
      v.x = cfg.x;
      v.z = cfg.z;
      v.rot = cfg.rot;
      v.color = cfg.color;
      v.model = cfg.model;
      v.name = cfg.name;
      v.driverId = "";
      v.speed = cfg.traffic?.speed ?? 0;
      if (cfg.traffic) {
        v.ambientAxis = cfg.traffic.axis;
        v.ambientMin = cfg.traffic.min;
        v.ambientMax = cfg.traffic.max;
        v.ambientLane = cfg.traffic.lane;
        v.ambientDirection = cfg.traffic.direction;
        v.ambientSpeed = cfg.traffic.speed;
        if (cfg.traffic.axis === "x") v.z = cfg.traffic.lane;
        else v.x = cfg.traffic.lane;
      }
      state.vehicles.set(cfg.id, v);
    });

    STREET_PEDESTRIANS.forEach((cfg) => {
      const pedestrian = new StreetPedestrianSchema();
      pedestrian.id = cfg.id;
      pedestrian.name = cfg.name;
      pedestrian.gender = cfg.gender;
      pedestrian.topColor = cfg.topColor;
      pedestrian.bottomColor = cfg.bottomColor;
      pedestrian.x = cfg.x;
      pedestrian.z = cfg.z;
      pedestrian.activity = cfg.itinerary[0]?.activity ?? "Walking";
      pedestrian.itinerary = cfg.itinerary;
      state.pedestrians.set(cfg.id, pedestrian);
    });

    // Initialize hostile NPCs (Cultists and Smokers - Step 6)
    INITIAL_HOSTILE_NPCS.forEach((cfg) => {
      const h = new HostileNPCSchema();
      h.id = cfg.id;
      h.name = cfg.name;
      h.type = cfg.type;
      h.x = cfg.x;
      h.z = cfg.z;
      h.rot = cfg.rot;
      h.health = 100;
      h.isAggro = false;
      h.targetPlayerId = "";
      h.spawnX = cfg.x;
      h.spawnZ = cfg.z;
      state.hostiles.set(cfg.id, h);
    });

    this.setState(state);

    // Life / Profession Selection (Step 3)
    this.onMessage(MSG.life_select, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      const m = msg as Partial<LifeSelectMessage> | null;
      if (!m) return;
      if (m.professionId) {
        const prof = PROFESSIONS.find((prof) => prof.id === m.professionId);
        if (prof) {
          p.profession = prof.title;
          p.jacketColor = prof.uniform.jacketColor;
          p.pantsColor = prof.uniform.pantsColor;
          p.sneakerColor = prof.uniform.sneakerColor;
          p.money += 350; // Career signing bonus
        }
      }
      if (m.companyId) {
        p.company = m.companyId;
      }
      if (m.gender === "female" || m.gender === "male") {
        p.gender = m.gender;
      }
      if (m.characterName && typeof m.characterName === "string") {
        p.name = m.characterName.trim().slice(0, 16);
      }
      client.send(MSG.toast, {
        text: `Career Started: ${p.profession || "Citizen"} at ${p.company || "Chicago Loop"}! Signing bonus +$350 💼`,
        type: "success",
        delta: 350,
      } satisfies ToastMessage);
    });

    // Fast-Travel from City Map (Step 9)
    this.onMessage(MSG.fast_travel, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      const m = msg as { x?: number; z?: number; interior?: string; name?: string } | null;
      if (!m || typeof m.x !== "number" || !Number.isFinite(m.x) ||
          typeof m.z !== "number" || !Number.isFinite(m.z)) return;

      // Dismount vehicle if driving
      if (p.vehicleId) {
        const v = this.state.vehicles.get(p.vehicleId);
        if (v) {
          v.driverId = "";
          v.speed = 0;
        }
        p.vehicleId = "";
      }

      p.x = clamp(m.x, metroBounds.minX + 10, metroBounds.maxX - 10);
      p.z = clamp(m.z, metroBounds.minZ + 10, metroBounds.maxZ - 10);
      p.y = 0;
      if (m.interior) {
        p.interior = m.interior;
      } else {
        p.interior = "street";
        p.interiorId = "";
      }
      p.interiorId = p.interior === "apartment_loft" ? `home:${client.sessionId}` : "";

      client.send(MSG.toast, {
        text: `Navigated to ${m.name || "Destination"} 📍`,
        type: "info",
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.housing_apply, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      const request = msg as Partial<HousingMessage> | null;
      if (!p || !request || (request.tenure !== "rent" && request.tenure !== "buy")) return;
      const property = HOUSING_PROPERTIES.find((item) => item.id === request.propertyId);
      if (!property) return;

      if (p.homeId && p.homeId !== property.id) {
        client.send(MSG.toast, {
          text: "Move out of your current home before choosing another one.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      if (p.homeId === property.id && p.homeTenure === "owner") {
        client.send(MSG.toast, {
          text: `You already own ${property.name}.`,
          type: "info",
        } satisfies ToastMessage);
        return;
      }
      if (p.homeId === property.id && p.homeTenure === "tenant" && p.homeLeaseEndsAt > Date.now()) {
        client.send(MSG.toast, {
          text: `Your lease at ${property.name} is active. Renew after it expires or move out.`,
          type: "info",
        } satisfies ToastMessage);
        return;
      }

      const cost = request.tenure === "buy" ? property.purchasePrice : property.weeklyRent * 2;
      if (p.money < cost) {
        client.send(MSG.toast, {
          text: `${property.name} requires $${cost.toLocaleString()} upfront; your balance is $${Math.floor(p.money).toLocaleString()}.`,
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      p.money -= cost;
      p.homeId = property.id;
      p.homeTenure = request.tenure === "buy" ? "owner" : "tenant";
      p.homeLeaseEndsAt = request.tenure === "rent" ? Date.now() + 7 * 24 * 60 * 60 * 1000 : 0;
      client.send(MSG.toast, {
        text: request.tenure === "buy"
          ? `Home purchased: ${property.name} in ${property.neighborhood}.`
          : `Lease signed: ${property.name}. One week plus a refundable one-week deposit paid upfront.`,
        type: "success",
        delta: -cost,
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.housing_vacate, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p?.homeId) return;
      const property = HOUSING_PROPERTIES.find((item) => item.id === p.homeId);
      if (!property) return;
      const refund = p.homeTenure === "owner"
        ? Math.floor(property.purchasePrice * 0.8)
        : property.weeklyRent;
      const formerTenure = p.homeTenure;
      p.money += refund;
      p.homeId = "";
      p.homeTenure = "";
      p.homeLeaseEndsAt = 0;
      if (p.interior === "apartment_loft") {
        const exit = getHomeExitPosition(property.id);
        p.interior = "street";
        p.interiorId = "";
        p.x = exit.x;
        p.z = exit.z;
        p.y = 0;
      }
      client.send(MSG.toast, {
        text: `Moved out. ${formerTenure === "owner" ? "Sale proceeds" : "Security deposit"} returned: $${refund.toLocaleString()}.`,
        type: "success",
        delta: refund,
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.home_go, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.vehicleId) return;
      const property = HOUSING_PROPERTIES.find((item) => item.id === p.homeId);
      if (!property || (p.homeTenure === "tenant" && p.homeLeaseEndsAt <= Date.now())) {
        client.send(MSG.toast, {
          text: "You need an active lease or owned home before you can go home.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      p.interior = "apartment_loft";
      p.interiorId = `home:${client.sessionId}`;
      p.x = 0;
      p.z = 3.6;
      p.y = 0;
      p.stance = "stand";
      p.desiredStance = "stand";
      client.send(MSG.toast, {
        text: `Welcome home to ${property.name}.`,
        type: "success",
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.uber_request, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      const request = msg as Partial<RideshareMessage> | null;
      if (!p || !request || !Number.isFinite(request.x) || !Number.isFinite(request.z) ||
          p.pendingRide || p.pendingTransit || p.vehicleId || p.medicalStatus) return;
      const x = clamp(request.x!, metroBounds.minX + 10, metroBounds.maxX - 10);
      const z = clamp(request.z!, metroBounds.minZ + 10, metroBounds.maxZ - 10);
      const pickup = p.interior === "apartment_loft" ? getHomeExitPosition(p.homeId) : { x: p.x, z: p.z };
      let tripRoute: RoadRoute | null;
      let pickupRoute: RoadRoute | null = null;
      try {
        tripRoute = findRoadRoute(pickup, { x, z });
        const pickupRoad = tripRoute?.points[0];
        if (pickupRoad && Math.hypot(pickupRoad.x - pickup.x, pickupRoad.z - pickup.z) <= 75) {
          for (const approach of [
            { x: pickupRoad.x - 40, z: pickupRoad.z },
            { x: pickupRoad.x + 40, z: pickupRoad.z },
            { x: pickupRoad.x, z: pickupRoad.z - 40 },
            { x: pickupRoad.x, z: pickupRoad.z + 40 },
          ]) {
            const candidate = findRoadRoute(approach, pickupRoad);
            if (candidate && candidate.distance >= 20) {
              pickupRoute = candidate;
              break;
            }
          }
          pickupRoute ??= findRoadRoute(pickupRoad, pickupRoad);
        }
      } catch (error) {
        console.error("[rideshare] Could not calculate an OSM road route.", error);
        client.send(MSG.toast, {
          text: "Uber could not load a drivable Chicago road route. Please try again.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      if (!tripRoute || !pickupRoute || tripRoute.points.length === 0 || pickupRoute.points.length === 0) {
        client.send(MSG.toast, {
          text: "Uber could not find a drivable road route to that destination. Try a nearby street or destination.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      const pickupRoad = tripRoute.points[0];
      const destinationRoad = tripRoute.points.at(-1)!;
      const fare = Math.max(4, Math.round((4 + tripRoute.distance / 1000 * 1.35) * 100) / 100);
      if (p.money < fare) {
        client.send(MSG.toast, {
          text: `Uber fare is $${fare.toFixed(2)}; insufficient account balance.`,
          type: "warning",
        } satisfies ToastMessage);
        return;
      }

      if (p.interior === "apartment_loft") {
        p.interior = "street";
        p.interiorId = "";
        p.isSleeping = false;
        p.stance = "stand";
        p.desiredStance = "stand";
        p.dirX = 0;
        p.dirZ = 0;
      }
      p.x = pickupRoad.x;
      p.z = pickupRoad.z;
      p.y = 0;
      const vehicle = new VehicleState();
      vehicle.id = `uber_${client.sessionId}`;
      const pickupTargetIndex = Math.min(1, pickupRoute.points.length - 1);
      vehicle.x = pickupRoute.points[0].x;
      vehicle.z = pickupRoute.points[0].z;
      vehicle.color = "#111827";
      vehicle.model = "suv";
      vehicle.name = "Your Uber";
      vehicle.speed = 8;
      vehicle.driverId = "driver";
      vehicle.serviceType = "uber";
      vehicle.serviceFor = client.sessionId;
      vehicle.ridePhase = "pickup";
      vehicle.targetX = pickupRoute.points[pickupTargetIndex].x;
      vehicle.targetZ = pickupRoute.points[pickupTargetIndex].z;
      vehicle.fare = fare;
      vehicle.destinationName = String(request.name ?? "your destination").slice(0, 80);

      p.pickupX = pickupRoad.x;
      p.pickupZ = pickupRoad.z;
      p.rideDestinationX = destinationRoad.x;
      p.rideDestinationZ = destinationRoad.z;
      p.rideVehicleId = vehicle.id;
      p.rideFare = fare;
      p.rideStatus = "enroute";
      p.rideEtaAt = Date.now() + Math.max(2, Math.ceil(pickupRoute.distance / vehicle.speed)) * 1000;
      p.pendingRide = true;
      this.serviceRoutes.set(vehicle.id, {
        points: pickupRoute.points,
        nextIndex: pickupTargetIndex,
        tripPoints: tripRoute.points,
      });
      this.state.vehicles.set(vehicle.id, vehicle);
      client.send(MSG.toast, {
        text: `Uber requested from ${p.homeId ? HOUSING_PROPERTIES.find((item) => item.id === p.homeId)?.name ?? "your location" : "your location"}. Your driver is following Chicago streets. Fare $${fare.toFixed(2)} will be charged at drop-off.`,
        type: "info",
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.uber_board, (client) => {
      const p = this.state.players.get(client.sessionId);
      const vehicle = p?.rideVehicleId ? this.state.vehicles.get(p.rideVehicleId) : undefined;
      const route = vehicle ? this.serviceRoutes.get(vehicle.id) : undefined;
      if (!p || !vehicle || p.rideStatus !== "arrived" || vehicle.serviceFor !== client.sessionId ||
          Math.hypot(p.x - vehicle.x, p.z - vehicle.z) > 4.5) return;
      if (!route || route.tripPoints.length === 0) {
        client.send(MSG.toast, {
          text: "This Uber has no drivable route to the selected destination.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      vehicle.riderId = client.sessionId;
      vehicle.ridePhase = "trip";
      route.points = route.tripPoints;
      route.nextIndex = Math.min(1, route.points.length - 1);
      vehicle.targetX = route.points[route.nextIndex].x;
      vehicle.targetZ = route.points[route.nextIndex].z;
      vehicle.speed = 13;
      p.vehicleId = vehicle.id;
      p.rideStatus = "riding";
      p.rideEtaAt = Date.now() + Math.max(2, Math.ceil(routeDistanceRemaining(vehicle, route) / vehicle.speed)) * 1000;
      p.dirX = 0;
      p.dirZ = 0;
      client.send(MSG.toast, {
        text: "You are in the Uber. Your trip is underway; payment is due when you arrive.",
        type: "info",
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.uber_cancel, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !["enroute", "arrived"].includes(p.rideStatus)) return;
      const vehicle = this.state.vehicles.get(p.rideVehicleId);
      if (vehicle?.serviceFor === client.sessionId) {
        this.state.vehicles.delete(vehicle.id);
        this.serviceRoutes.delete(vehicle.id);
      }
      p.pendingRide = false;
      p.rideStatus = "";
      p.rideEtaAt = 0;
      p.rideFare = 0;
      p.rideVehicleId = "";
      client.send(MSG.toast, {
        text: "Uber cancelled. You have not been charged.",
        type: "info",
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.hospital_discharge, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.medicalStatus !== "hospital") return;
      p.medicalStatus = "";
      p.interior = "street";
      p.interiorId = "";
      p.x = -92;
      p.z = 86;
      p.y = 0;
      p.health = Math.max(60, p.health);
      p.stance = "stand";
      p.desiredStance = "stand";
      client.send(MSG.toast, {
        text: "Discharged from Cook County Hospital. You are medically stable.",
        type: "success",
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.cta_trip, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      const request = msg as Partial<TransitMessage> | null;
      const destination = CTA_STATIONS.find((station) => station.id === request?.stationId);
      if (!p || !destination || p.pendingRide || p.pendingTransit) return;
      const origin = CTA_STATIONS
        .map((station) => ({ station, distance: Math.hypot(p.x - station.x, p.z - station.z) }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (!origin || origin.distance > 900) {
        client.send(MSG.toast, {
          text: "Walk to a marked CTA station before starting a train trip.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      if (origin.station.id === destination.id) {
        client.send(MSG.toast, {
          text: "You are already at that station.",
          type: "info",
        } satisfies ToastMessage);
        return;
      }
      const routeQueue = [origin.station];
      const visitedStations = new Set([origin.station.id]);
      while (routeQueue.length > 0) {
        const current = routeQueue.shift()!;
        const currentLines = current.line.split(" / ");
        for (const station of CTA_STATIONS) {
          if (visitedStations.has(station.id)) continue;
          if (currentLines.some((line) => station.line.split(" / ").includes(line))) {
            visitedStations.add(station.id);
            routeQueue.push(station);
          }
        }
      }
      if (!visitedStations.has(destination.id)) {
        client.send(MSG.toast, {
          text: `No CTA route connects ${origin.station.name} to ${destination.name}.`,
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      const fare = 2.5;
      if (p.money < fare) {
        client.send(MSG.toast, {
          text: "CTA fare requires $2.50 on your account.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      p.money -= fare;
      p.pendingTransit = true;
      client.send(MSG.toast, {
        text: `CTA fare paid. Boarding at ${origin.station.name}; train for ${destination.name} is arriving.`,
        type: "info",
        delta: -fare,
      } satisfies ToastMessage);
      setTimeout(() => {
        const rider = this.state.players.get(client.sessionId);
        if (!rider || !rider.pendingTransit) return;
        rider.x = destination.x;
        rider.z = destination.z;
        rider.y = 0;
        rider.interior = "street";
        rider.interiorId = "";
        rider.pendingTransit = false;
        client.send(MSG.toast, {
          text: `Arrived at ${destination.name} CTA station.`,
          type: "success",
        } satisfies ToastMessage);
      }, 2500);
    });

    this.onMessage(MSG.social_chat, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      const request = msg as Partial<SocialChatMessage> | null;
      const text = typeof request?.text === "string" ? request.text.trim().replace(/\s+/g, " ").slice(0, 120) : "";
      if (!p || !text || p.interior !== "street" || Date.now() - p.lastChatAt < 1500) return;
      p.lastChatAt = Date.now();
      const event = { senderId: client.sessionId, senderName: p.name || "Citizen", text };
      this.clients.forEach((recipient) => {
        const nearby = this.state.players.get(recipient.sessionId);
        if (nearby && nearby.interior === "street" && Math.hypot(p.x - nearby.x, p.z - nearby.z) <= 30) {
          recipient.send(MSG.social_chat_event, event);
        }
      });
    });

    // Enter & Exit Mega Mall (Step 8)
    this.onMessage(MSG.enter_mall, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.vehicleId) return;
      p.interior = "mall_interior";
      p.interiorId = "";
      p.x = 0;
      p.z = 4.2;
      p.y = 0;
      client.send(MSG.toast, {
        text: "Entered Chicago Loop Mega Mall · Block 37 (Shops, Food Court & Corporate Offices) 🛍️",
        type: "success",
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.exit_mall, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.interior !== "mall_interior") return;
      p.interior = "street";
      p.interiorId = "";
      p.x = -8.0;
      p.z = -23.0;
      p.y = 0;
      client.send(MSG.toast, {
        text: "Exited Mall to State Street Sidewalk 🏙️",
        type: "info",
      } satisfies ToastMessage);
    });

    // Office Work Shift / College Lecture (Step 4 & 5)
    this.onMessage(MSG.office_work, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      if (p.interior !== "mall_interior" || Math.hypot(p.x, p.z + 2.6) > 4) {
        client.send(MSG.toast, {
          text: "Work shifts are available at the executive office desks inside Block 37.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      const now = Date.now();
      if (now - p.lastWorkAt < 60_000) {
        client.send(MSG.toast, {
          text: "Your next paid shift starts in one minute.",
          type: "info",
        } satisfies ToastMessage);
        return;
      }
      if (p.energy < 15) {
        client.send(MSG.toast, {
          text: "Too exhausted to work! Rest in Bed or drink coffee first 💤",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      p.lastWorkAt = now;
      p.energy = Math.max(0, p.energy - 15);
      const earned = Math.floor(180 + Math.random() * 140);
      p.money += earned;
      client.send(MSG.toast, {
        text: `Completed Shift at ${p.company || "Chicago Corporation"}! Paycheck: +$${earned} 💼`,
        type: "success",
        delta: earned,
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.college_study, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      if (p.interior !== "mall_interior" || Math.hypot(p.x - 10, p.z + 1.5) > 4) {
        client.send(MSG.toast, {
          text: "Attend class at Lecture Hall 101 inside Block 37.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      const now = Date.now();
      if (now - p.lastStudyAt < 30_000) {
        client.send(MSG.toast, {
          text: "Class is in session. You can study again in 30 seconds.",
          type: "info",
        } satisfies ToastMessage);
        return;
      }
      p.lastStudyAt = now;
      p.energy = Math.max(0, p.energy - 5);
      p.educationLevel += 1;
      client.send(MSG.toast, {
        text: `Lecture completed. Education level ${p.educationLevel}; energy −5.`,
        type: "success",
      } satisfies ToastMessage);
    });

    // Food & Beverage Replenishment (Step 8)
    this.onMessage(MSG.eat_food, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      const cost = 12;
      if (p.money < cost) {
        client.send(MSG.toast, {
          text: `Need $${cost} for food!`,
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      p.money -= cost;
      p.hunger = Math.min(100, p.hunger + 40);
      p.health = Math.min(100, p.health + 15);
      client.send(MSG.toast, {
        text: "Ate Chicago deep dish pizza! Hunger +40, Health +15 🍕",
        type: "success",
        delta: -cost,
      } satisfies ToastMessage);
    });

    this.onMessage(MSG.drink_beverage, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      const cost = 5;
      if (p.money < cost) {
        client.send(MSG.toast, {
          text: `Need $${cost} for drink!`,
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      p.money -= cost;
      p.thirst = Math.min(100, p.thirst + 45);
      p.energy = Math.min(100, p.energy + 25);
      client.send(MSG.toast, {
        text: "Drank cold beverage! Thirst +45, Energy +25 🥤",
        type: "success",
        delta: -cost,
      } satisfies ToastMessage);
    });

    // Player Melee Attack against Cultists / Smokers (Step 6)
    this.onMessage(MSG.player_attack, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.vehicleId) return;

      const now = Date.now();
      if (now - p.lastAttackAt < 500) return;
      p.lastAttackAt = now;

      let nearestPlayer: Player | null = null;
      let nearestPlayerId = "";
      let playerDistance = 2.5;
      this.state.players.forEach((target, targetId) => {
        if (targetId === client.sessionId || !sharesInteriorSpace(p, target) || target.health <= 0) return;
        const distance = Math.hypot(p.x - target.x, p.z - target.z);
        if (distance < playerDistance) {
          nearestPlayer = target;
          nearestPlayerId = targetId;
          playerDistance = distance;
        }
      });
      if (nearestPlayer) {
        const victim = nearestPlayer as Player;
        victim.health = Math.max(0, victim.health - 12);
        p.wantedLevel = Math.min(5, p.wantedLevel + 1);
        const victimClient = this.clients.find((candidate) => candidate.sessionId !== client.sessionId &&
          this.state.players.get(candidate.sessionId) === victim);
        victimClient?.send(MSG.toast, {
          text: `${p.name || "A player"} hit you. Defend yourself or move away.`,
          type: "warning",
        } satisfies ToastMessage);
        client.send(MSG.toast, {
          text: `You struck ${victim.name || "a citizen"}. Police wanted level: ${p.wantedLevel}/5.`,
          type: "warning",
        } satisfies ToastMessage);
        if (victim.health <= 0) {
          this.wakeAtHome(victim, nearestPlayerId, 50);
          victimClient?.send(MSG.toast, {
            text: "You were knocked out. You wake up at home and recover.",
            type: "warning",
          } satisfies ToastMessage);
        }
        return;
      }

      const nearestHostile = Array.from(this.state.hostiles.values())
        .filter((h) => h.health > 0)
        .map((hostile) => ({
          hostile,
          distance: Math.hypot(p.x - hostile.x, p.z - hostile.z),
        }))
        .filter(({ distance }) => distance < 3.2)
        .sort((a, b) => a.distance - b.distance)[0]?.hostile;

      if (nearestHostile) {
        const hostile = nearestHostile;
        hostile.health -= 35;
        hostile.isAggro = true;
        hostile.targetPlayerId = client.sessionId;

        if (hostile.health <= 0) {
          hostile.health = 0;
          hostile.isAggro = false;
          hostile.targetPlayerId = "";
          const reward = Math.floor(140 + Math.random() * 110);
          p.money += reward;
          client.send(MSG.toast, {
            text: `Defeated ${hostile.name}! Looted $${reward} 🥊`,
            type: "success",
            delta: reward,
          } satisfies ToastMessage);

          setTimeout(() => {
            const respawningHostile = this.state.hostiles.get(hostile.id);
            if (respawningHostile !== hostile) return;
            hostile.health = 100;
            hostile.x = hostile.spawnX;
            hostile.z = hostile.spawnZ;
            hostile.isAggro = false;
            hostile.targetPlayerId = "";
          }, 12000);
        } else {
          client.send(MSG.toast, {
            text: `Struck ${hostile.name}! Enemy HP: ${hostile.health}% 👊`,
            type: "info",
          } satisfies ToastMessage);
        }
      }
    });

    // Client sends an INTENT (direction, sprint, jump, stance), never a position.
    this.onMessage(MSG.input, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;

      const now = Date.now();
      if (now - p.lastInputAt < MIN_INPUT_GAP_MS) return; // rate limit
      p.lastInputAt = now;

      const m = msg as Partial<InputMessage> | null;
      let x = Number(m?.x);
      let z = Number(m?.z);
      if (!Number.isFinite(x) || !Number.isFinite(z)) return; // reject junk

      // Clamp to a unit vector
      const len = Math.hypot(x, z);
      if (len > 1) {
        x /= len;
        z /= len;
      }
      p.dirX = x;
      p.dirZ = z;
      p.sprinting = !!m?.sprint;
      const hasMovementInput = Math.hypot(x, z) > 0.01;
      if (m?.jump) {
        p.jumpPending = true;
      }
      if (
        (m?.stance === "stand" || m?.stance === "crouch" || m?.stance === "prone") &&
        (!p.isSleeping || hasMovementInput)
      ) {
        p.desiredStance = m.stance;
        if (m.stance !== "prone") p.isSleeping = false;
      }
    });

    // Enter a vehicle
    this.onMessage(MSG.vehicle_enter, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.interior !== "street" || p.medicalStatus) return;
      if (p.vehicleId) return; // already in vehicle

      const { vehicleId } = (msg as Partial<VehicleMessage>) || {};
      if (!vehicleId) return;

      const v = this.state.vehicles.get(vehicleId);
      if (!v) return;
      if (v.serviceType) return;
      if (v.driverId) return; // already occupied

      const dist = Math.hypot(p.x - v.x, p.z - v.z);
      if (dist > 3.8) return; // must be close to car

      if (!v.doorOpen) {
        v.doorOpen = true;
        client.send(MSG.toast, {
          text: `${v.name} driver door opened. Press [F] again to get in.`,
          type: "info",
        } satisfies ToastMessage);
        return;
      }

      v.doorOpen = false;
      v.driverId = client.sessionId;
      p.vehicleId = v.id;
      p.stance = "stand";
      p.y = 0;

      client.send(MSG.toast, {
        text: `Entered ${v.name} · Drive with WASD, Exit with [F]`,
        type: "success",
      } satisfies ToastMessage);
    });

    // Exit vehicle
    this.onMessage(MSG.vehicle_exit, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !p.vehicleId) return;

      const v = this.state.vehicles.get(p.vehicleId);
      if (v?.serviceType === "uber" && p.rideStatus === "riding") {
        client.send(MSG.toast, {
          text: "Please stay in the Uber until it reaches your destination.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      if (v) {
        v.driverId = "";
        v.speed = 0;
        v.doorOpen = false;
        // Dismount to driver door sidewalk
        p.x = clamp(v.x + Math.cos(v.rot) * 1.9, metroBounds.minX, metroBounds.maxX);
        p.z = clamp(v.z - Math.sin(v.rot) * 1.9, metroBounds.minZ, metroBounds.maxZ);
        p.y = 0;

        client.send(MSG.toast, {
          text: `Exited ${v.name}`,
          type: "info",
        } satisfies ToastMessage);
      }
      p.vehicleId = "";
    });

    // Server-authoritative Interaction with POIs, ATMs, Doors, and Jobs
    this.onMessage(MSG.interact, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;

      const now = Date.now();
      if (now - p.lastInteractAt < 1200) return; // rate limit: 1.2s cooldown
      p.lastInteractAt = now;

      const { poiId } = (msg as Partial<InteractMessage>) || {};
      const poi = INTERACTIVE_POIS.find((item) => item.id === poiId);
      if (!poi) return;

      // Validate proximity
      const dist = Math.hypot(p.x - poi.x, p.z - poi.z);
      if (dist > 4.5) return;

      switch (poi.id) {
        case "atm_chase": {
          p.money += 150;
          client.send(MSG.toast, {
            text: "ATM Cash Withdrawal Completed! Account Credited.",
            type: "success",
            delta: 150,
          } satisfies ToastMessage);
          break;
        }

        case "loop_coffee": {
          if (p.money < 6) {
            client.send(MSG.toast, {
              text: "Insufficient Funds for Coffee! ($6 required)",
              type: "warning",
            } satisfies ToastMessage);
            return;
          }
          p.money -= 6;
          client.send(MSG.toast, {
            text: "Enjoy your Fresh Dark Roast Espresso! Energy +100%",
            type: "success",
            delta: -6,
          } satisfies ToastMessage);
          break;
        }

        case "cta_subway": {
          client.send(MSG.toast, {
            text: "Open the city map to choose a CTA station. Trips cost $2.50 and require you to be near a station.",
            type: "info",
          } satisfies ToastMessage);
          break;
        }

        case "county_hospital": {
          const treatmentCost = 150;
          if (p.money < treatmentCost) {
            client.send(MSG.toast, {
              text: "Emergency treatment costs $150. You cannot afford care right now.",
              type: "warning",
            } satisfies ToastMessage);
            return;
          }
          p.money -= treatmentCost;
          p.health = 100;
          p.energy = Math.min(100, p.energy + 30);
          client.send(MSG.toast, {
            text: "Cook County Emergency Department treated your injuries. Health restored; Energy +30.",
            type: "success",
            delta: -treatmentCost,
          } satisfies ToastMessage);
          break;
        }

        case "central_police": {
          if (p.wantedLevel <= 0) {
            client.send(MSG.toast, {
              text: "Central District took your report. You have no active wanted status.",
              type: "info",
            } satisfies ToastMessage);
            break;
          }
          const fine = Math.min(p.money, p.wantedLevel * 100);
          p.money -= fine;
          p.wantedLevel = 0;
          p.health = Math.max(50, p.health);
          client.send(MSG.toast, {
            text: `You were booked and released after paying a $${fine} fine. Wanted status cleared.`,
            type: "warning",
            delta: -fine,
          } satisfies ToastMessage);
          break;
        }

        case "billboard_kiosk": {
          if (p.money < 250) {
            client.send(MSG.toast, {
              text: "Need $250 to Rent Digital Billboard Display",
              type: "warning",
            } satisfies ToastMessage);
            return;
          }
          p.money -= 250;
          client.send(MSG.toast, {
            text: `State St Billboard Rented by ${p.name}! Broadcasting now.`,
            type: "success",
            delta: -250,
          } satisfies ToastMessage);
          break;
        }

        case "chicago_pizza_stand": {
          if (p.money < 12) {
            client.send(MSG.toast, {
              text: "Need $12 for Lou's Deep Dish Pizza Slice!",
              type: "warning",
            } satisfies ToastMessage);
            return;
          }
          p.money -= 12;
          client.send(MSG.toast, {
            text: "Eating Lou's Legendary Buttercrust Deep-Dish! Hunger +50, Health +20 🍕",
            type: "success",
            delta: -12,
          } satisfies ToastMessage);
          break;
        }

        case "chicago_hotdog_cart": {
          if (p.money < 8) {
            client.send(MSG.toast, {
              text: "Need $8 for Vienna Beef Chicago Dog!",
              type: "warning",
            } satisfies ToastMessage);
            return;
          }
          p.money -= 8;
          client.send(MSG.toast, {
            text: "All-Beef Dog Dragged Through the Garden! Hunger +30 🌭",
            type: "success",
            delta: -8,
          } satisfies ToastMessage);
          break;
        }

        case "chicago_cultural_center": {
          client.send(MSG.toast, {
            text: "Entered Preston Bradley Hall · Gaze at the Tiffany Stained-Glass Dome ✨",
            type: "info",
          } satisfies ToastMessage);
          break;
        }

        case "willis_tower_lobby": {
          client.send(MSG.toast, {
            text: "Entered Willis Tower (Sears Tower) 9-Tube Atrium · Skydeck 103 🏢",
            type: "info",
          } satisfies ToastMessage);
          break;
        }

        case "chicago_mall_entrance": {
          client.send(MSG.toast, {
            text: "Welcome to Block 37 Chicago Loop Mall! Browse Shops & Food Court 🛍️",
            type: "success",
          } satisfies ToastMessage);
          break;
        }

        // Apartment Safehouse Interactions
        case "apt_entrance": {
          p.interior = "apartment_loft";
          p.interiorId = `home:${client.sessionId}`;
          p.x = 0;
          p.z = 3.6;
          p.y = 0;
          p.isSleeping = false;
          p.stance = "stand";
          p.desiredStance = "stand";
          client.send(MSG.toast, {
            text: "Welcome to Penthouse 402! Interact with Bed [E], Wardrobe [E], or Door [E]",
            type: "success",
          } satisfies ToastMessage);
          break;
        }

        case "apt_door": {
          p.doorOpen = !p.doorOpen;
          client.send(MSG.toast, {
            text: p.doorOpen ? "Penthouse Door: OPENED 🔓" : "Penthouse Door: CLOSED & LOCKED 🔒",
            type: "info",
          } satisfies ToastMessage);
          break;
        }

        case "apt_bed": {
          if (this.isHomeBedOccupied(client.sessionId)) {
            client.send(MSG.toast, {
              text: "The bed is occupied. Wait until it is free before sleeping.",
              type: "warning",
            } satisfies ToastMessage);
            break;
          }
          p.x = 5.2;
          p.z = -2.8;
          p.y = 0;
          p.vy = 0;
          p.isSleeping = true;
          p.dirX = 0;
          p.dirZ = 0;
          p.jumpPending = false;
          p.energy = 100;
          p.stance = "prone";
          p.desiredStance = "prone";
          client.send(MSG.toast, {
            text: "Resting in King Bed · Safehouse Checkpoint Saved & Energy 100% 💤",
            type: "success",
          } satisfies ToastMessage);
          break;
        }

        case "apt_wardrobe": {
          client.send(MSG.toast, {
            text: "Wardrobe Opened · Customize your Streetwear Outfits! 👔",
            type: "info",
          } satisfies ToastMessage);
          break;
        }

        case "apt_fridge": {
          client.send(MSG.toast, {
            text: "Grabbed an Ice Cold Energy Drink from the Refrigerator! 🥤",
            type: "success",
          } satisfies ToastMessage);
          break;
        }

        case "apt_exit": {
          p.interior = "street";
          p.interiorId = "";
          p.isSleeping = false;
          const exit = getHomeExitPosition(p.homeId);
          p.x = exit.x;
          p.z = exit.z;
          p.y = 0;
          p.stance = "stand";
          p.desiredStance = "stand";
          client.send(MSG.toast, {
            text: "Exited Penthouse · Back on Chicago Adams Street Sidewalk",
            type: "info",
          } satisfies ToastMessage);
          break;
        }
      }
    });

    // Enter Safehouse Loft Interior
    this.onMessage(MSG.enter_interior, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.vehicleId) return;

      const entrance = INTERACTIVE_POIS.find((item) => item.id === "apt_entrance");
      if (entrance) {
        const dist = Math.hypot(p.x - entrance.x, p.z - entrance.z);
        if (dist > 5.0) return;
      }

      p.interior = "apartment_loft";
      p.interiorId = `home:${client.sessionId}`;
      p.x = 0;
      p.z = 3.6;
      p.y = 0;
      p.isSleeping = false;
      p.stance = "stand";
      p.desiredStance = "stand";

      client.send(MSG.toast, {
        text: "Entered Penthouse 402 · Explore Bed [E], Wardrobe [E], or Door [E]",
        type: "success",
      } satisfies ToastMessage);
    });

    // Exit Safehouse Loft Interior
    this.onMessage(MSG.exit_interior, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.interior !== "apartment_loft") return;

      const exit = getHomeExitPosition(p.homeId);
      p.interior = "street";
      p.interiorId = "";
      p.isSleeping = false;
      p.x = exit.x;
      p.z = exit.z;
      p.y = 0;
      p.stance = "stand";
      p.desiredStance = "stand";

      client.send(MSG.toast, {
        text: "Exited to Chicago Adams St Sidewalk",
        type: "info",
      } satisfies ToastMessage);
    });

    // Toggle Door Open / Close
    this.onMessage(MSG.door_toggle, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.interior !== "apartment_loft") return;

      p.doorOpen = !p.doorOpen;
      client.send(MSG.toast, {
        text: p.doorOpen ? "Penthouse Door: OPENED 🔓" : "Penthouse Door: CLOSED & LOCKED 🔒",
        type: "info",
      } satisfies ToastMessage);
    });

    // Sleep in Bed
    this.onMessage(MSG.sleep_bed, (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || p.interior !== "apartment_loft") return;

      if (this.isHomeBedOccupied(client.sessionId)) {
        client.send(MSG.toast, {
          text: "The bed is occupied. Wait until it is free before sleeping.",
          type: "warning",
        } satisfies ToastMessage);
        return;
      }
      p.x = 5.2;
      p.z = -2.8;
      p.y = 0;
      p.vy = 0;
      p.isSleeping = true;
      p.dirX = 0;
      p.dirZ = 0;
      p.jumpPending = false;
      p.energy = 100;
      p.stance = "prone";
      p.desiredStance = "prone";

      client.send(MSG.toast, {
        text: "Resting in Bed · Safehouse Checkpoint Saved & Energy 100% 💤",
        type: "success",
      } satisfies ToastMessage);
    });

    // Wardrobe Outfit Customization
    this.onMessage(MSG.wardrobe_set, (client, msg: unknown) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;

      const m = msg as Partial<WardrobeMessage> | null;
      if (m?.jacketColor && typeof m.jacketColor === "string") {
        p.jacketColor = m.jacketColor.slice(0, 10);
      }
      if (m?.pantsColor && typeof m.pantsColor === "string") {
        p.pantsColor = m.pantsColor.slice(0, 10);
      }
      if (m?.sneakerColor && typeof m.sneakerColor === "string") {
        p.sneakerColor = m.sneakerColor.slice(0, 10);
      }

      client.send(MSG.toast, {
        text: "Wardrobe Updated! Fresh Chicago Streetwear Equipped. 👔",
        type: "success",
      } satisfies ToastMessage);
    });

    this.setSimulationInterval((dtMs) => this.tick(dtMs), TICK_MS);
  }

  private applyVehicleImpact(
    sessionId: string,
    player: Player,
    vehicle: VehicleState,
    speed: number,
    now: number,
  ) {
    if (now - player.lastVehicleImpactAt < 1800) return;
    player.lastVehicleImpactAt = now;
    const damage = Math.max(12, Math.min(85, Math.round((speed - 1.5) * 4)));
    player.health = Math.max(0, player.health - damage);
    player.stance = "prone";
    player.desiredStance = "prone";
    player.impactUntil = now + 1100;

    const client = this.clients.find((candidate) => candidate.sessionId === sessionId);
    client?.send(MSG.toast, {
      text: `Struck by ${vehicle.name}. Health -${damage}; move carefully and get medical care.`,
      type: "warning",
    } satisfies ToastMessage);

    if (player.health > 0) return;

    player.medicalStatus = "ambulance";
    player.vehicleId = "";
    player.rideStatus = "";
    player.pendingRide = false;
    player.dirX = 0;
    player.dirZ = 0;
    const ambulance = new VehicleState();
    ambulance.id = `cfd_response_${sessionId}`;
    ambulance.x = clamp(player.x - 28, metroBounds.minX + 5, metroBounds.maxX - 5);
    ambulance.z = player.z;
    ambulance.rot = Math.PI / 2;
    ambulance.color = "#f8fafc";
    ambulance.model = "ambulance";
    ambulance.name = "Chicago Fire Department Ambulance";
    ambulance.driverId = "driver";
    ambulance.speed = 14;
    ambulance.serviceType = "emergency";
    ambulance.serviceFor = sessionId;
    ambulance.ridePhase = "response";
    ambulance.targetX = player.x;
    ambulance.targetZ = player.z;
    player.medicalVehicleId = ambulance.id;
    this.state.vehicles.set(ambulance.id, ambulance);
    client?.send(MSG.toast, {
      text: "You are critically injured. Chicago Fire Department paramedics are responding.",
      type: "warning",
    } satisfies ToastMessage);
  }

  private tick(dtMs: number) {
    const dt = dtMs / 1000;
    const R = 0.55; // Player collision radius (meters)

    this.state.players.forEach((p, sessionId) => {
      p.needTick += dt;
      if (p.needTick >= 1) {
        const elapsed = p.needTick;
        p.needTick = 0;
        p.hunger = Math.max(0, p.hunger - elapsed * 0.025);
        p.thirst = Math.max(0, p.thirst - elapsed * 0.04);
        if (p.sprinting) p.energy = Math.max(0, p.energy - elapsed * 0.18);
        else if (p.dirX === 0 && p.dirZ === 0) p.energy = Math.min(100, p.energy + elapsed * 0.025);
        if (p.hunger === 0 || p.thirst === 0) p.health = Math.max(1, p.health - elapsed * 0.12);
      }

      if (p.medicalStatus || p.rideStatus === "enroute") {
        p.dirX = 0;
        p.dirZ = 0;
        return;
      }

      // ────────────────── A. VEHICLE DRIVING PHYSICS ──────────────────
      if (p.vehicleId) {
        const v = this.state.vehicles.get(p.vehicleId);
        if (!v) {
          p.vehicleId = "";
          return;
        }

        if (v.serviceType === "uber" && v.riderId === sessionId) {
          p.x = v.x;
          p.z = v.z;
          p.y = 0;
          p.isSprinting = false;
          return;
        }

        // Throttle & Reverse
        const targetSpeed =
          p.dirZ > 0
            ? CAR_MAX_SPEED * p.dirZ
            : p.dirZ < 0
            ? -CAR_REVERSE_SPEED * Math.abs(p.dirZ)
            : 0;

        if (p.dirZ !== 0) {
          v.speed += (targetSpeed - v.speed) * Math.min(1, dt * 3.5);
        } else {
          v.speed *= Math.pow(0.25, dt); // road friction
          if (Math.abs(v.speed) < 0.1) v.speed = 0;
        }

        // Steering: only turns when the vehicle has velocity
        if (Math.abs(v.speed) > 0.4 && p.dirX !== 0) {
          const steerDir = v.speed >= 0 ? 1 : -1;
          v.rot -= p.dirX * CAR_TURN_RATE * dt * steerDir;
        }

        // Move vehicle in direction of heading: [-sin(rot), -cos(rot)]
        const vx = -Math.sin(v.rot) * v.speed;
        const vz = -Math.cos(v.rot) * v.speed;

        const candVx = clamp(v.x + vx * dt, metroBounds.minX + 4, metroBounds.maxX - 4);
        const candVz = clamp(v.z + vz * dt, metroBounds.minZ + 4, metroBounds.maxZ - 4);

        // Check vehicle collision against building walls
        let vHit = false;
        for (const b of buildingsNear(candVx, candVz, 2)) {
          if (
            candVx + 1.2 > b.minX &&
            candVx - 1.2 < b.maxX &&
            candVz + 1.2 > b.minZ &&
            candVz - 1.2 < b.maxZ
          ) {
            vHit = true;
            break;
          }
        }

        const carHit = [...this.state.vehicles.values()].some((other) =>
          other.id !== v.id && vehicleOverlaps(candVx, candVz, v.rot, other),
        );
        const pedestrianHit = [...this.state.pedestrians.values()].some((pedestrian) =>
          Math.hypot(candVx - pedestrian.x, candVz - pedestrian.z) < 3.1,
        );

        if (!vHit && !carHit && !pedestrianHit) {
          v.x = candVx;
          v.z = candVz;
        } else {
          v.speed = 0;
        }

        // Sync player position exactly to driving car
        p.x = v.x;
        p.z = v.z;
        p.y = 0;
        p.isSprinting = false;
        return;
      }

      // ────────────────── B. APARTMENT SAFEHOUS INTERIOR PHYSICS ──────────────────
      if (p.interior === "apartment_loft") {
        p.stance = p.desiredStance;
        if (p.dirX !== 0 || p.dirZ !== 0) p.isSleeping = false;
        if (p.jumpPending && p.y <= 0.02 && p.stance === "stand") {
          p.vy = JUMP_VELOCITY;
          p.jumpPending = false;
        } else {
          p.jumpPending = false;
        }

        if (p.y > 0 || p.vy > 0) {
          p.vy -= GRAVITY * dt;
          p.y = Math.max(0, p.y + p.vy * dt);
          if (p.y === 0) p.vy = 0;
        }

        const hasMovement = p.dirX !== 0 || p.dirZ !== 0;
        let spd = SPEED;
        if (p.stance === "prone") spd = PRONE_SPEED;
        else if (p.stance === "crouch") spd = CROUCH_SPEED;
        else if (p.sprinting && hasMovement && p.y <= 0.05) spd = SPRINT_SPEED;

        if (hasMovement) {
          // Loft bounds: X in [-6.4, 6.4], Z in [-4.4, 4.6]
          const candX = clamp(p.x + p.dirX * spd * dt, -6.4, 6.4);
          const candZ = clamp(p.z + p.dirZ * spd * dt, -4.4, 4.6);

          let hitX = false;
          let hitZ = false;

          // Bed obstacle collision check at [3.8, 6.4] x [-4.4, -1.8]
          const inBedX = candX >= 3.8 && candX <= 6.4;
          const inBedZ = candZ >= -4.4 && candZ <= -1.8;
          if (inBedX && inBedZ && p.y < 0.2) {
            if (candX >= 3.8 && p.x < 3.8) hitX = true;
            if (candZ <= -1.8 && p.z > -1.8) hitZ = true;
          }

          // Wardrobe obstacle check at [-6.4, -4.2] x [-4.4, -2.0]
          const inWardX = candX >= -6.4 && candX <= -4.2;
          const inWardZ = candZ >= -4.4 && candZ <= -2.0;
          if (inWardX && inWardZ) {
            if (candX <= -4.2 && p.x > -4.2) hitX = true;
            if (candZ <= -2.0 && p.z > -2.0) hitZ = true;
          }

          if (!hitX) p.x = candX;
          if (!hitZ) p.z = candZ;
        }
        return;
      }

      // ────────────────── B2. CHICAGO MEGA MALL INTERIOR PHYSICS ──────────────────
      if (p.interior === "mall_interior") {
        p.stance = p.desiredStance;
        if (p.jumpPending && p.y <= 0.02 && p.stance === "stand") {
          p.vy = JUMP_VELOCITY;
          p.jumpPending = false;
        } else {
          p.jumpPending = false;
        }

        if (p.y > 0 || p.vy > 0) {
          p.vy -= GRAVITY * dt;
          p.y = Math.max(0, p.y + p.vy * dt);
          if (p.y === 0) p.vy = 0;
        }

        const hasMovement = p.dirX !== 0 || p.dirZ !== 0;
        let spd = SPEED;
        if (p.stance === "prone") spd = PRONE_SPEED;
        else if (p.stance === "crouch") spd = CROUCH_SPEED;
        else if (p.sprinting && hasMovement && p.y <= 0.05) spd = SPRINT_SPEED;

        if (hasMovement) {
          // Mall 4-Story Atrium bounds: X in [-14.5, 14.5], Z in [-12.5, 12.5]
          p.x = clamp(p.x + p.dirX * spd * dt, -14.5, 14.5);
          p.z = clamp(p.z + p.dirZ * spd * dt, -12.5, 12.5);
        }
        return;
      }

      // ────────────────── B. ON-FOOT WALKING PHYSICS ──────────────────
      // 1. Stance update
      p.stance = p.desiredStance;

      // 2. Jump & Vertical Gravity Physics
      if (p.jumpPending && p.y <= 0.02 && p.stance === "stand") {
        p.vy = JUMP_VELOCITY;
        p.jumpPending = false;
      } else if (p.jumpPending) {
        p.jumpPending = false;
      }

      if (p.y > 0 || p.vy > 0) {
        p.vy -= GRAVITY * dt;
        p.y = Math.max(0, p.y + p.vy * dt);
        if (p.y === 0) p.vy = 0;
      }

      // 3. Movement Speed determination
      const hasMovement = p.dirX !== 0 || p.dirZ !== 0;
      let spd = SPEED;
      if (p.stance === "prone") {
        spd = PRONE_SPEED;
        p.isSprinting = false;
      } else if (p.stance === "crouch") {
        spd = CROUCH_SPEED;
        p.isSprinting = false;
      } else if (p.sprinting && hasMovement && p.y <= 0.05) {
        spd = SPRINT_SPEED;
        p.isSprinting = true;
      } else {
        p.isSprinting = false;
      }

      if (!hasMovement) return;

      const candX = clamp(p.x + p.dirX * spd * dt, metroBounds.minX, metroBounds.maxX);
      const candZ = clamp(p.z + p.dirZ * spd * dt, metroBounds.minZ, metroBounds.maxZ);

      // Check X axis movement against building walls
      let hitX = false;
      for (const b of buildingsNear(candX, p.z, R)) {
        if (
          candX + R > b.minX &&
          candX - R < b.maxX &&
          p.z + R > b.minZ &&
          p.z - R < b.maxZ
        ) {
          hitX = true;
          break;
        }
      }

      // Check X axis against parked vehicles (NO PASSING THROUGH CARS!)
      if (!hitX) {
        if (STREET_OBSTACLES.some((box) => overlapsBox(candX, p.z, R, box))) hitX = true;
        this.state.pedestrians.forEach((pedestrian) => {
          if (Math.hypot(candX - pedestrian.x, p.z - pedestrian.z) < 0.95) hitX = true;
        });
        this.state.players.forEach((other, otherSessionId) => {
          if (otherSessionId !== sessionId &&
              sharesInteriorSpace(p, other) && Math.hypot(candX - other.x, p.z - other.z) < 1.05) hitX = true;
        });
      }
      if (!hitX) {
        this.state.vehicles.forEach((veh) => {
          if (veh.id === p.vehicleId) return;
          const isRotated = Math.abs(Math.sin(veh.rot)) > 0.7;
          const boxW = isRotated ? CAR_HALF_L : CAR_HALF_W;
          const boxL = isRotated ? CAR_HALF_W : CAR_HALF_L;
          if (
            candX + R > veh.x - boxW &&
            candX - R < veh.x + boxW &&
            p.z + R > veh.z - boxL &&
            p.z - R < veh.z + boxL
          ) {
            hitX = true;
          }
        });
      }

      if (!hitX) p.x = candX;

      // Check Z axis movement against building walls
      let hitZ = false;
      for (const b of buildingsNear(p.x, candZ, R)) {
        if (
          p.x + R > b.minX &&
          p.x - R < b.maxX &&
          candZ + R > b.minZ &&
          candZ - R < b.maxZ
        ) {
          hitZ = true;
          break;
        }
      }

      // Check Z axis against parked vehicles (NO PASSING THROUGH CARS!)
      if (!hitZ) {
        if (STREET_OBSTACLES.some((box) => overlapsBox(p.x, candZ, R, box))) hitZ = true;
        this.state.pedestrians.forEach((pedestrian) => {
          if (Math.hypot(p.x - pedestrian.x, candZ - pedestrian.z) < 0.95) hitZ = true;
        });
        this.state.players.forEach((other, otherSessionId) => {
          if (otherSessionId !== sessionId &&
              sharesInteriorSpace(p, other) && Math.hypot(p.x - other.x, candZ - other.z) < 1.05) hitZ = true;
        });
      }
      if (!hitZ) {
        this.state.vehicles.forEach((veh) => {
          if (veh.id === p.vehicleId) return;
          const isRotated = Math.abs(Math.sin(veh.rot)) > 0.7;
          const boxW = isRotated ? CAR_HALF_L : CAR_HALF_W;
          const boxL = isRotated ? CAR_HALF_W : CAR_HALF_L;
          if (
            p.x + R > veh.x - boxW &&
            p.x - R < veh.x + boxW &&
            candZ + R > veh.z - boxL &&
            candZ - R < veh.z + boxL
          ) {
            hitZ = true;
          }
        });
      }

      if (!hitZ) p.z = candZ;
    });

    // ────────────────── C. AMBIENT LOOP TRAFFIC ──────────────────
    const traffic = [...this.state.vehicles.values()].filter(
      (vehicle) => !vehicle.driverId && vehicle.ambientAxis
    );
    traffic.forEach((vehicle) => {
      const axis = vehicle.ambientAxis;
      if (!axis) return;
      const position = axis === "x" ? vehicle.x : vehicle.z;
      const laneTrafficAhead = traffic.some((other) => {
        if (other.id === vehicle.id || other.ambientAxis !== axis) return false;
        const otherLane = axis === "x" ? other.z : other.x;
        if (Math.abs(otherLane - vehicle.ambientLane) > 2) return false;
        const otherPosition = axis === "x" ? other.x : other.z;
        const gap = (otherPosition - position) * vehicle.ambientDirection;
        return gap > 0 && gap < 7;
      });
      const occupiedCarAhead = [...this.state.vehicles.values()].some((other) => {
        if (other.id === vehicle.id || !other.driverId) return false;
        const otherLane = axis === "x" ? other.z : other.x;
        if (Math.abs(otherLane - vehicle.ambientLane) > 3) return false;
        const otherPosition = axis === "x" ? other.x : other.z;
        const gap = (otherPosition - position) * vehicle.ambientDirection;
        return gap > 0 && gap < 8;
      });

      vehicle.speed = laneTrafficAhead || occupiedCarAhead ? 0 : vehicle.ambientSpeed;
      const next = position + vehicle.ambientDirection * vehicle.speed * dt;
      if (next <= vehicle.ambientMin || next >= vehicle.ambientMax) {
        vehicle.ambientDirection = vehicle.ambientDirection === 1 ? -1 : 1;
      }
      const updatedPosition = clamp(next, vehicle.ambientMin, vehicle.ambientMax);
      const nextRot = axis === "x"
        ? vehicle.ambientDirection === -1 ? Math.PI / 2 : -Math.PI / 2
        : vehicle.ambientDirection === -1 ? 0 : Math.PI;
      const nextX = axis === "x" ? updatedPosition : vehicle.ambientLane;
      const nextZ = axis === "z" ? updatedPosition : vehicle.ambientLane;
      const blockedByCar = [...this.state.vehicles.values()].some((other) =>
        other.id !== vehicle.id && vehicleOverlaps(nextX, nextZ, nextRot, other),
      );
      if (blockedByCar) {
        vehicle.speed = 0;
        return;
      }
      if (axis === "x") {
        vehicle.x = updatedPosition;
        vehicle.rot = vehicle.ambientDirection === -1 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        vehicle.z = updatedPosition;
        vehicle.rot = vehicle.ambientDirection === -1 ? 0 : Math.PI;
      }
    });

    const now = Date.now();
    this.state.pedestrians.forEach((pedestrian) => {
      if (pedestrian.itinerary.length === 0) return;
      if (pedestrian.pauseUntil > now) return;
      const waypoint = pedestrian.itinerary[pedestrian.itineraryIndex];
      if (!waypoint) return;
      const dx = waypoint.x - pedestrian.x;
      const dz = waypoint.z - pedestrian.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.45) {
        pedestrian.x = waypoint.x;
        pedestrian.z = waypoint.z;
        pedestrian.activity = waypoint.activity;
        pedestrian.pauseUntil = now + waypoint.pauseSeconds * 1000;
        pedestrian.itineraryIndex = (pedestrian.itineraryIndex + 1) % pedestrian.itinerary.length;
        return;
      }

      const step = Math.min(distance, 1.2 * dt);
      const nextX = pedestrian.x + (dx / distance) * step;
      const nextZ = pedestrian.z + (dz / distance) * step;
      const blockedByFixture = STREET_OBSTACLES.some((box) => overlapsBox(nextX, nextZ, 0.45, box));
      const blockedByBuilding = buildingsNear(nextX, nextZ, 0.6).some((box) => overlapsBox(nextX, nextZ, 0.45, box));
      const blockedByCar = [...this.state.vehicles.values()].some((vehicle) => {
        const halfX = Math.abs(Math.cos(vehicle.rot)) * CAR_HALF_W + Math.abs(Math.sin(vehicle.rot)) * CAR_HALF_L;
        const halfZ = Math.abs(Math.sin(vehicle.rot)) * CAR_HALF_W + Math.abs(Math.cos(vehicle.rot)) * CAR_HALF_L;
        return Math.abs(nextX - vehicle.x) < halfX + 1 && Math.abs(nextZ - vehicle.z) < halfZ + 1;
      });
      const blockedByPlayer = [...this.state.players.values()].some((player) =>
        player.interior === "street" && !player.vehicleId && Math.hypot(nextX - player.x, nextZ - player.z) < 0.9,
      );
      if (blockedByFixture || blockedByBuilding || blockedByCar || blockedByPlayer) {
        pedestrian.activity = blockedByCar ? "Waiting for traffic" : waypoint.activity;
        return;
      }
      pedestrian.activity = waypoint.activity;
      pedestrian.rot = Math.atan2(dx, dz);
      pedestrian.x = nextX;
      pedestrian.z = nextZ;
    });

    this.state.vehicles.forEach((vehicle) => {
      if (!vehicle.serviceType) return;
      const owner = this.state.players.get(vehicle.serviceFor);
      if (!owner) {
        this.state.vehicles.delete(vehicle.id);
        this.serviceRoutes.delete(vehicle.id);
        return;
      }
      const route = this.serviceRoutes.get(vehicle.id);
      const dx = vehicle.targetX - vehicle.x;
      const dz = vehicle.targetZ - vehicle.z;
      const distance = Math.hypot(dx, dz);
      if (vehicle.ridePhase === "pickup" || vehicle.ridePhase === "trip") {
        const remaining = route ? routeDistanceRemaining(vehicle, route) : distance;
        owner.rideEtaAt = Date.now() + Math.ceil(remaining / Math.max(1, vehicle.speed)) * 1000;
      }
      if (distance > 0.1) {
        const step = Math.min(distance, vehicle.speed * dt);
        const nextX = vehicle.x + (dx / distance) * step;
        const nextZ = vehicle.z + (dz / distance) * step;
        const nextRot = Math.atan2(-dx, -dz);
        const blockedByCar = [...this.state.vehicles.values()].some((other) =>
          other.id !== vehicle.id && vehicleOverlaps(nextX, nextZ, nextRot, other),
        );
        if (!blockedByCar) {
          vehicle.x = nextX;
          vehicle.z = nextZ;
          vehicle.rot = nextRot;
        } else {
          const remaining = route ? routeDistanceRemaining(vehicle, route) : distance;
          owner.rideEtaAt = Date.now() + Math.max(1, remaining / Math.max(1, vehicle.speed)) * 1000;
          return;
        }
      }

      if (route && distance <= Math.max(0.8, vehicle.speed * dt) &&
          route.nextIndex < route.points.length - 1) {
        route.nextIndex += 1;
        vehicle.targetX = route.points[route.nextIndex].x;
        vehicle.targetZ = route.points[route.nextIndex].z;
        return;
      }

      if (vehicle.ridePhase === "pickup" && distance <= Math.max(0.8, vehicle.speed * dt)) {
        vehicle.x = vehicle.targetX;
        vehicle.z = vehicle.targetZ;
        vehicle.speed = 0;
        vehicle.ridePhase = "waiting";
        owner.rideStatus = "arrived";
        owner.rideEtaAt = 0;
        const riderClient = this.clients.find((client) => client.sessionId === vehicle.serviceFor);
        riderClient?.send(MSG.toast, {
          text: "Your Uber has arrived and signaled. Walk to the SUV and press [F] to board.",
          type: "success",
        } satisfies ToastMessage);
        setTimeout(() => {
          if (this.state.vehicles.get(vehicle.id) !== vehicle || vehicle.ridePhase !== "waiting") return;
          this.state.vehicles.delete(vehicle.id);
          this.serviceRoutes.delete(vehicle.id);
          owner.pendingRide = false;
          owner.rideStatus = "";
          owner.rideEtaAt = 0;
          owner.rideFare = 0;
          owner.rideVehicleId = "";
          riderClient?.send(MSG.toast, {
            text: "Your Uber left after waiting 30 seconds. You were not charged.",
            type: "warning",
          } satisfies ToastMessage);
        }, 30_000);
      } else if (vehicle.ridePhase === "trip" && distance <= Math.max(0.8, vehicle.speed * dt)) {
        vehicle.x = vehicle.targetX;
        vehicle.z = vehicle.targetZ;
        owner.x = vehicle.x;
        owner.z = vehicle.z;
        owner.y = 0;
        owner.vehicleId = "";
        owner.pendingRide = false;
        owner.rideStatus = "";
        owner.rideEtaAt = 0;
        owner.rideFare = 0;
        owner.rideVehicleId = "";
        const charged = Math.min(owner.money, vehicle.fare);
        owner.money -= charged;
        const riderClient = this.clients.find((client) => client.sessionId === vehicle.serviceFor);
        riderClient?.send(MSG.toast, {
          text: charged === vehicle.fare
            ? `Arrived at ${vehicle.destinationName}. Uber fare paid.`
            : `Arrived at ${vehicle.destinationName}. $${charged.toFixed(2)} paid; remaining fare could not be collected.`,
          type: charged === vehicle.fare ? "success" : "warning",
          delta: -charged,
        } satisfies ToastMessage);
        this.state.vehicles.delete(vehicle.id);
        this.serviceRoutes.delete(vehicle.id);
      } else if (vehicle.ridePhase === "response" && distance <= Math.max(1.2, vehicle.speed * dt)) {
        vehicle.x = vehicle.targetX;
        vehicle.z = vehicle.targetZ;
        vehicle.ridePhase = "transport";
        vehicle.targetX = -92;
        vehicle.targetZ = 86;
        vehicle.speed = 16;
        vehicle.riderId = vehicle.serviceFor;
        owner.vehicleId = vehicle.id;
        const responder = this.clients.find((client) => client.sessionId === vehicle.serviceFor);
        responder?.send(MSG.toast, {
          text: "Chicago Fire Department paramedics reached you and are taking you to Cook County Hospital.",
          type: "info",
        } satisfies ToastMessage);
      } else if (vehicle.ridePhase === "transport" && distance <= Math.max(1.2, vehicle.speed * dt)) {
        owner.vehicleId = "";
        owner.interior = "hospital_interior";
        owner.x = 0;
        owner.y = 0.45;
        owner.z = 0;
        owner.health = 55;
        owner.stance = "prone";
        owner.desiredStance = "prone";
        owner.medicalStatus = "hospital";
        owner.medicalVehicleId = "";
        const responder = this.clients.find((client) => client.sessionId === vehicle.serviceFor);
        responder?.send(MSG.toast, {
          text: "You are in a hospital bed. Medical staff stabilized you; use Discharge when ready.",
          type: "success",
        } satisfies ToastMessage);
        this.state.vehicles.delete(vehicle.id);
      } else if (vehicle.ridePhase === "pickup" || vehicle.ridePhase === "trip" ||
                 vehicle.ridePhase === "response" || vehicle.ridePhase === "transport") {
        owner.x = vehicle.x;
        owner.z = vehicle.z;
        owner.y = 0;
      }
    });

    this.state.vehicles.forEach((vehicle) => {
      if (vehicle.serviceType || Math.abs(vehicle.speed) < 2.5) return;
      this.state.players.forEach((player, sessionId) => {
        if (player.interior !== "street" || player.vehicleId || player.medicalStatus) return;
        const hitDistance = Math.hypot(player.x - vehicle.x, player.z - vehicle.z);
        if (hitDistance < 2.6) this.applyVehicleImpact(sessionId, player, vehicle, Math.abs(vehicle.speed), now);
      });
    });

    // ────────────────── D. HOSTILE NPCS AI (CULTISTS & SMOKERS - Step 6) ──────────────────
    this.state.hostiles.forEach((h) => {
      if (h.health <= 0) return;

      // Search for nearby players on foot within 8.5 meters
      const nearbyPlayers: Array<{ player: Player; sessionId: string; distance: number }> = [];

      this.state.players.forEach((p, sessionId) => {
        if (p.interior !== "street" || p.vehicleId || p.health <= 0) return;
        const d = Math.hypot(p.x - h.x, p.z - h.z);
        if (d < 8.5) nearbyPlayers.push({ player: p, sessionId, distance: d });
      });

      const nearestTarget = nearbyPlayers.reduce<(typeof nearbyPlayers)[number] | null>(
        (nearest, candidate) =>
          !nearest || candidate.distance < nearest.distance ? candidate : nearest,
        null
      );
      const targetPlayer = nearestTarget?.player ?? null;
      const targetClientId = nearestTarget?.sessionId ?? "";
      const minTargetDist = nearestTarget?.distance ?? 8.5;

      if (targetPlayer && nearestTarget) {
        h.isAggro = true;
        h.targetPlayerId = targetClientId;

        // Turn towards target player
        const dx = targetPlayer.x - h.x;
        const dz = targetPlayer.z - h.z;
        h.rot = Math.atan2(dx, dz);

        // Move towards target player if farther than 1.8m
        if (minTargetDist > 1.8) {
          const runSpd = h.type === "cultist" ? 4.4 : 3.8;
          h.x += (dx / minTargetDist) * runSpd * dt;
          h.z += (dz / minTargetDist) * runSpd * dt;
          h.isAttacking = false;
        } else {
          // In melee attack range!
          h.isAttacking = true;
          if (now - h.lastAttackTime > 1500) {
            h.lastAttackTime = now;
            const dmg = h.type === "cultist" ? 14 : 10;
            targetPlayer.health = Math.max(0, targetPlayer.health - dmg);

            const client = this.clients.find((c) => c.sessionId === targetClientId);
            if (client) {
              client.send(MSG.toast, {
                text: `⚠️ ${h.name} assaulted you! Health -${dmg} (Defend with [Space] / [LMB]!)`,
                type: "warning",
              } satisfies ToastMessage);
            }

            // If player dies, revive at safehouse
            if (targetPlayer.health <= 0) {
              this.wakeAtHome(targetPlayer, targetClientId, 100);
              if (client) {
                client.send(MSG.toast, {
                  text: "You were knocked out. Paramedics brought you home to recover.",
                  type: "warning",
                } satisfies ToastMessage);
              }
              h.isAggro = false;
              h.targetPlayerId = "";
            }
          }
        }
      } else {
        // Idle patrol around spawn point
        h.isAggro = false;
        h.targetPlayerId = "";
        h.isAttacking = false;
        h.patrolTimer += dt;
        if (h.patrolTimer > 4.5) {
          h.patrolTimer = 0;
          h.rot = Math.random() * Math.PI * 2;
        }
        const distFromSpawn = Math.hypot(h.x - h.spawnX, h.z - h.spawnZ);
        if (distFromSpawn < 4.0) {
          h.x += Math.sin(h.rot) * 0.9 * dt;
          h.z += Math.cos(h.rot) * 0.9 * dt;
        } else {
          const backX = h.spawnX - h.x;
          const backZ = h.spawnZ - h.z;
          const len = Math.hypot(backX, backZ) || 1;
          h.x += (backX / len) * 1.4 * dt;
          h.z += (backZ / len) * 1.4 * dt;
          h.rot = Math.atan2(backX, backZ);
        }
      }
    });
  }

  onJoin(client: Client, options: { name?: string }) {
    const p = new Player();
    p.homeId = "south-loop-flat";
    p.homeTenure = "owner";
    p.money = 1500;
    p.health = 100;
    p.energy = 100;
    p.hunger = 85;
    p.thirst = 85;
    p.isSprinting = false;
    p.vehicleId = "";
    this.placeAtHome(p, client.sessionId);
    p.name = String(options?.name ?? "Player").slice(0, 16);
    this.state.players.set(client.sessionId, p);
  }

  async onLeave(client: Client, consented?: boolean) {
    const p = this.state.players.get(client.sessionId);
    if (p && p.vehicleId) {
      const v = this.state.vehicles.get(p.vehicleId);
      if (v) {
        v.driverId = "";
        v.speed = 0;
      }
      p.vehicleId = "";
    }

    if (consented) {
      this.state.players.delete(client.sessionId);
      return;
    }

    try {
      await this.allowReconnection(client, 10);
    } catch {
      this.state.players.delete(client.sessionId);
    }
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
