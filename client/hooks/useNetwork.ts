"use client";
import { useEffect, useRef, useState } from "react";
import { Client, type Room } from "colyseus.js";
import { MSG, ROOM_NAME, type SocialChatEvent, type ToastMessage } from "../../shared/protocol";
import type { Net } from "../types/network";

/**
 * Manages the Colyseus connection lifecycle:
 * - Initial connect
 * - Player state tracking (positions, money, stances, vehicleId, join/leave)
 * - Vehicle fleet state tracking (positions, rotations, drivers)
 * - Toast notification tracking
 * - Auto-reconnect with exponential backoff on abnormal disconnects
 */
export function useNetwork() {
  const net = useRef<Net>({
    room: null,
    me: null,
    pos: new Map(),
    names: new Map(),
    vehicles: new Map(),
    pedestrians: new Map(),
    hostiles: new Map(),
    money: 1500,
  }).current;

  const [ids, setIds] = useState<string[]>([]);
  const [status, setStatus] = useState("connecting…");
  const [myMoney, setMyMoney] = useState(1500);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [socialMessages, setSocialMessages] = useState<SocialChatEvent[]>([]);

  useEffect(() => {
    let dead = false;
    let currentRoom: Room | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const url =
      process.env.NEXT_PUBLIC_GAME_URL ??
      `ws://${window.location.hostname}:2567`;
    const client = new Client(url);
    let savedToken: string | null = null;

    /** Wire up Colyseus state listeners on a (re)connected room. */
    function setupRoom(r: Room) {
      currentRoom = r;
      net.room = r;
      net.me = r.sessionId;

      // Clear stale state from any previous room
      net.pos.clear();
      net.names.clear();
      net.vehicles.clear();
      net.pedestrians.clear();
      net.hostiles.clear();
      setIds([]);
      setStatus("online");

      // Save reconnection token for allowReconnection flow
      savedToken = r.reconnectionToken ?? null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const players = (r.state as any).players;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vehicles = (r.state as any).vehicles;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hostiles = (r.state as any).hostiles;

      const syncPlayer = (key: string, p: any) => {
        const money = typeof p.money === "number" ? p.money : 1500;
        net.pos.set(key, {
          x: p.x ?? 0,
          y: p.y ?? 0,
          z: p.z ?? 0,
          money,
          stance: p.stance ?? "stand",
          isSleeping: !!p.isSleeping,
          isSprinting: !!p.isSprinting,
          vehicleId: p.vehicleId || "",
          interior: p.interior || "street",
          interiorId: p.interiorId || "",
          jacketColor: p.jacketColor || "#dc2626",
          pantsColor: p.pantsColor || "#1e293b",
          sneakerColor: p.sneakerColor || "#ffffff",
          doorOpen: !!p.doorOpen,
          profession: p.profession || "",
          company: p.company || "",
          gender: p.gender || "male",
          health: p.health ?? 100,
          energy: p.energy ?? 100,
          hunger: p.hunger ?? 85,
          thirst: p.thirst ?? 85,
          homeId: p.homeId || "",
          homeTenure: p.homeTenure || "",
          homeLeaseEndsAt: p.homeLeaseEndsAt ?? 0,
          wantedLevel: p.wantedLevel ?? 0,
          educationLevel: p.educationLevel ?? 0,
          rideStatus: p.rideStatus || "",
          rideEtaAt: p.rideEtaAt ?? 0,
          rideFare: p.rideFare ?? 0,
          medicalStatus: p.medicalStatus || "",
        });

        if (key === net.me) {
          net.money = money;
          setMyMoney(money);
        }

        if (p.name) {
          net.names.set(key, p.name || (key === net.me ? "You" : "Citizen"));
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      players.onAdd((p: any, key: string) => {
        syncPlayer(key, p);
        setIds((a) => (a.includes(key) ? a : [...a, key]));
        p.onChange(() => {
          syncPlayer(key, p);
        });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      players.onRemove((_p: any, key: string) => {
        net.pos.delete(key);
        net.names.delete(key);
        setIds((a) => a.filter((i) => i !== key));
      });

      // Sync interactive vehicles
      if (vehicles) {
        const syncVehicle = (key: string, v: any) => {
          net.vehicles.set(key, {
            id: v.id || key,
            x: v.x ?? 0,
            z: v.z ?? 0,
            rot: v.rot ?? 0,
            color: v.color || "#facc15",
            model: v.model || "taxi",
            name: v.name || "Vehicle",
            driverId: v.driverId || "",
            speed: v.speed ?? 0,
            doorOpen: !!v.doorOpen,
            serviceType: v.serviceType || "",
            riderId: v.riderId || "",
            ridePhase: v.ridePhase || "",
          });
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vehicles.onAdd((v: any, key: string) => {
          syncVehicle(key, v);
          v.onChange(() => {
            syncVehicle(key, v);
          });
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vehicles.onRemove((_v: any, key: string) => {
          net.vehicles.delete(key);
        });
      }

      // Sync ambient pedestrians with their current destinations and activities.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pedestrians = (r.state as any).pedestrians;
      if (pedestrians) {
        const syncPedestrian = (key: string, p: any) => {
          net.pedestrians.set(key, {
            id: p.id || key,
            name: p.name || "Chicago resident",
            gender: p.gender === "female" ? "female" : "male",
            topColor: p.topColor || "#2563eb",
            bottomColor: p.bottomColor || "#334155",
            x: p.x ?? 0,
            z: p.z ?? 0,
            rot: p.rot ?? 0,
            activity: p.activity || "Walking",
          });
        };
        pedestrians.onAdd((pedestrian: any, key: string) => {
          syncPedestrian(key, pedestrian);
          pedestrian.onChange(() => syncPedestrian(key, pedestrian));
        });
        pedestrians.onRemove((_pedestrian: any, key: string) => net.pedestrians.delete(key));
      }

      // Sync hostile NPCs (Cultists & Smokers)
      if (hostiles) {
        const syncHostile = (key: string, h: any) => {
          net.hostiles.set(key, {
            id: h.id || key,
            name: h.name || "Hostile",
            type: h.type || "cultist",
            x: h.x ?? 0,
            z: h.z ?? 0,
            rot: h.rot ?? 0,
            health: h.health ?? 100,
            isAggro: !!h.isAggro,
            targetPlayerId: h.targetPlayerId || "",
            isAttacking: !!h.isAttacking,
          });
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hostiles.onAdd((h: any, key: string) => {
          syncHostile(key, h);
          h.onChange(() => {
            syncHostile(key, h);
          });
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hostiles.onRemove((_h: any, key: string) => {
          net.hostiles.delete(key);
        });
      }

      // Toast notification listener
      r.onMessage(MSG.toast, (msg: ToastMessage) => {
        setToast(msg);
        setTimeout(() => setToast(null), 4500);
      });

      r.onMessage(MSG.social_chat_event, (event: SocialChatEvent) => {
        setSocialMessages((messages) => [...messages.slice(-49), event]);
      });

      r.onLeave((code) => {
        if (dead) return;
        net.room = null;
        if (code === 1000) {
          setStatus("disconnected");
        } else {
          setStatus("reconnecting…");
          attemptReconnect(0);
        }
      });
    }

    /** Exponential backoff reconnect: 1s → 2s → 4s → … → 10s cap. */
    async function attemptReconnect(attempt: number) {
      if (dead) return;
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);

      reconnectTimer = setTimeout(async () => {
        if (dead) return;
        setStatus(
          attempt > 0
            ? `reconnecting… (attempt ${attempt + 1})`
            : "reconnecting…",
        );

        try {
          let r: Room;
          if (savedToken) {
            try {
              r = await client.reconnect(savedToken);
            } catch {
              savedToken = null;
              r = await client.joinOrCreate(ROOM_NAME, { name: "Player" });
            }
          } else {
            r = await client.joinOrCreate(ROOM_NAME, { name: "Player" });
          }

          if (dead) {
            r.leave();
            return;
          }
          setupRoom(r);
        } catch {
          if (!dead) attemptReconnect(attempt + 1);
        }
      }, delay);
    }

    // Initial connection
    client
      .joinOrCreate(ROOM_NAME, { name: "Player" })
      .then((r) => {
        if (dead) {
          r.leave();
          return;
        }
        setupRoom(r);
      })
      .catch(() => {
        setStatus("can't reach server");
        attemptReconnect(0);
      });

    return () => {
      dead = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      currentRoom?.leave();
    };
  }, [net]);

  return { net, ids, status, myMoney, toast, socialMessages };
}
