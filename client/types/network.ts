import type { Room } from "colyseus.js";
import type { Stance, VehicleConfig } from "../../shared/protocol";

/** Latest server-reported position and state for one player. */
export type Pos = {
  x: number;
  y: number;
  z: number;
  money: number;
  stance: Stance;
  isSleeping: boolean;
  isSprinting: boolean;
  vehicleId: string;
  interior: string; // "street" | "apartment_loft" | "mall_interior"
  interiorId: string;
  jacketColor: string;
  pantsColor: string;
  sneakerColor: string;
  doorOpen?: boolean;
  profession?: string;
  company?: string;
  gender?: string;
  health?: number;
  energy?: number;
  hunger?: number;
  thirst?: number;
  homeId?: string;
  homeTenure?: string;
  homeLeaseEndsAt?: number;
  wantedLevel?: number;
  educationLevel?: number;
  rideStatus?: string;
  rideEtaAt?: number;
  rideFare?: number;
  medicalStatus?: string;
};

/** Synchronized vehicle state */
export type VehicleClientState = {
  id: string;
  x: number;
  z: number;
  rot: number;
  color: string;
  model: VehicleConfig["model"];
  name: string;
  driverId: string;
  speed: number;
  doorOpen: boolean;
  serviceType: string;
  riderId: string;
  ridePhase: string;
};

export type StreetPedestrianClientState = {
  id: string;
  name: string;
  gender: "male" | "female";
  topColor: string;
  bottomColor: string;
  x: number;
  z: number;
  rot: number;
  activity: string;
};

/** Synchronized hostile NPC state */
export type HostileClientState = {
  id: string;
  name: string;
  type: "cultist" | "smoker";
  x: number;
  z: number;
  rot: number;
  health: number;
  isAggro: boolean;
  targetPlayerId: string;
  isAttacking: boolean;
};

/**
 * Mutable network state shared by ref (never triggers re-renders on its own).
 * Components read from this inside useFrame; React state (ids, status) is
 * separate so only the things that need re-renders cause them.
 */
export type Net = {
  room: Room | null;
  me: string | null;
  pos: Map<string, Pos>; // latest SERVER positions, keyed by sessionId
  names: Map<string, string>; // player names
  vehicles: Map<string, VehicleClientState>; // synced interactive vehicles
  pedestrians: Map<string, StreetPedestrianClientState>;
  hostiles: Map<string, HostileClientState>; // synced cultists & smokers
  money: number; // local player's current balance
};
