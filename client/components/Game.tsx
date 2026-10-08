"use client";
import React, { useRef, useCallback, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Sky, AdaptiveDpr } from "@react-three/drei";
import {
  APARTMENT_POIS,
  HOUSING_PROPERTIES,
  INITIAL_VEHICLES,
  INTERACTIVE_POIS,
  MALL_POIS,
  MSG,
  PROFESSIONS,
  type InputMessage,
  type InteractMessage,
  type POIDefinition,
  type VehicleConfig,
  type VehicleMessage,
  type WardrobeMessage,
} from "../../shared/protocol";
import { useNetwork } from "../hooks/useNetwork";
import { useInput } from "../hooks/useInput";
import Avatar from "./Avatar";
import FollowCam from "./FollowCam";
import CityMap from "./CityMap";
import MetroChunkLayer from "./MetroChunkLayer";
import VehiclesLayer from "./VehiclesLayer";
import ApartmentInterior from "./ApartmentInterior";
import MallInterior from "./MallInterior";
import HostilesLayer from "./HostilesLayer";
import LifeSelectModal from "./LifeSelectModal";
import CityGuideModal from "./CityGuideModal";
import WardrobeModal from "./WardrobeModal";
import Joystick from "./Joystick";
import HUD from "./HUD";
import HousingMarketModal from "./HousingMarketModal";
import SocialChatModal from "./SocialChatModal";
import HospitalInterior from "./HospitalInterior";

/**
 * Top-level Game shell:
 * - Real 3D Chicago Loop city map with realistic architecture, doors, and storefronts
 * - Usable Interactive Vehicles: Drive Chicago Yellow Cabs, Sedans, SUVs with full physics
 * - Interactive Buildings & Safehouse Penthouse:
 *   - Open/Close front door with animated swing
 *   - Sleep in King Bed (health & safehouse checkpoint)
 *   - Walk-in Wardrobe (change streetwear jacket/pants/kicks)
 *   - Stainless steel fridge (snack replenishment)
 *   - Step out back onto Chicago street
 * - Chicago Loop Mega Mall (Block 37):
 *   - Food court with Giordano's deep dish pizza
 *   - Flight Club Chicago sneaker boutique
 *   - Corporate office workstations & college lecture halls
 * - Hostile NPCs: Cultists and Smokers patrolling alleys & assaulting players
 * - 16+ Realistic Careers with 3 distinct companies each
 * - Interactive Chicago City Map with zoom in/out & Fast Travel
 */
export default function Game() {
  const { net, ids, status, myMoney, toast, socialMessages } = useNetwork();
  const camYawRef = useRef(0);
  const cameraZoomRef = useRef(5);
  const [showHint, setShowHint] = useState(true);
  const [showWardrobe, setShowWardrobe] = useState(false);
  const [showLifeSelect, setShowLifeSelect] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [millionaireOffer, setMillionaireOffer] = useState(false);
  const millionairePrompted = useRef(false);
  const [characterGender, setCharacterGender] = useState<"male" | "female">("male");
  const [activePoi, setActivePoi] = useState<POIDefinition | null>(null);
  const [nearbyVehicle, setNearbyVehicle] = useState<VehicleConfig | null>(null);

  const myPos = net.me ? net.pos.get(net.me) : null;
  const isInsideApartment = myPos?.interior === "apartment_loft";
  const isInsideMall = myPos?.interior === "mall_interior";
  const isInsideHospital = myPos?.interior === "hospital_interior";
  const currentVehicleId = myPos?.vehicleId || "";
  const isDriving = !isInsideApartment && !isInsideMall && !isInsideHospital &&
    !!currentVehicleId && myPos?.rideStatus !== "riding";
  const homeProperty = HOUSING_PROPERTIES.find((property) => property.id === myPos?.homeId);

  useEffect(() => {
    if (myMoney >= 1_000_000 && !millionairePrompted.current) {
      millionairePrompted.current = true;
      setMillionaireOffer(true);
      setShowHousing(true);
    }
  }, [myMoney]);

  // Auto-open career selection on start if not selected yet
  useEffect(() => {
    const t = setTimeout(() => {
      const pos = net.me ? net.pos.get(net.me) : null;
      if (pos && !pos.profession) {
        setShowLifeSelect(true);
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [net]);

  const currentVehicle = currentVehicleId
    ? net.vehicles.get(currentVehicleId) || INITIAL_VEHICLES.find((v) => v.id === currentVehicleId)
    : null;

  const getCamYaw = useCallback(() => camYawRef.current, []);
  const getInVehicle = useCallback(() => isDriving, [isDriving]);
  const handleUber = useCallback(
    (x: number, z: number, name: string) => {
      if (!net.room) return;
      net.room.send(MSG.uber_request, { x, z, name });
      setShowMapModal(false);
    },
    [net.room]
  );
  const handleUberToWork = useCallback(() => {
    const company = PROFESSIONS
      .flatMap((profession) => profession.companies)
      .find((workplace) => workplace.id === myPos?.company || workplace.name === myPos?.company);
    if (!company) {
      net.room?.send(MSG.toast, {
        text: "Your current workplace could not be found on the Chicago map.",
        type: "warning",
      });
      return;
    }
    handleUber(company.x, company.z, company.name);
  }, [handleUber, myPos?.company, net.room]);
  const handleTransit = useCallback(
    (stationId: string) => {
      if (!net.room) return;
      net.room.send(MSG.cta_trip, { stationId });
      setShowMapModal(false);
    },
    [net.room]
  );

  const {
    stance,
    setTouchDir,
    clearTouch,
    triggerJump,
    toggleCrouch,
    toggleProne,
  } = useInput(
    (x, z, sprint, jump, st) =>
      net.room?.send(MSG.input, {
        x,
        z,
        sprint,
        jump,
        stance: st,
      } satisfies InputMessage),
    getCamYaw,
    getInVehicle
  );

  const handleYawChange = useCallback((yaw: number) => {
    camYawRef.current = yaw;
  }, []);
  const changeCameraZoom = useCallback((amount: number) => {
    cameraZoomRef.current = Math.min(420, Math.max(3, cameraZoomRef.current + amount));
  }, []);

  // Proximity checking for POIs and Vehicles (every 100ms)
  useEffect(() => {
    const iv = setInterval(() => {
      if (!net.me) return;
      const mePos = net.pos.get(net.me);
      if (!mePos) return;

      // Inside Apartment Loft: check apartment interior POIs only
      if (mePos.interior === "apartment_loft") {
        setNearbyVehicle(null);
        let nearestPoi: POIDefinition | null = null;
        let minPoiDist = 3.6;
        for (const poi of APARTMENT_POIS) {
          const d = Math.hypot(mePos.x - poi.x, mePos.z - poi.z);
          if (d < minPoiDist) {
            minPoiDist = d;
            nearestPoi = poi;
          }
        }
        setActivePoi(nearestPoi);
        return;
      }

      // Inside Chicago Mega Mall: check mall interior POIs
      if (mePos.interior === "mall_interior") {
        setNearbyVehicle(null);
        let nearestPoi: POIDefinition | null = null;
        let minPoiDist = 3.6;
        for (const poi of MALL_POIS) {
          const d = Math.hypot(mePos.x - poi.x, mePos.z - poi.z);
          if (d < minPoiDist) {
            minPoiDist = d;
            nearestPoi = poi;
          }
        }
        setActivePoi(nearestPoi);
        return;
      }

      // If driving a car on street, clear nearby on-foot prompts
      if (mePos.vehicleId) {
        setActivePoi(null);
        setNearbyVehicle(null);
        return;
      }

      // Check Chicago Street POIs
      let nearestPoi: POIDefinition | null = null;
      let minPoiDist = 3.6;
      for (const poi of INTERACTIVE_POIS) {
        const d = Math.hypot(mePos.x - poi.x, mePos.z - poi.z);
        if (d < minPoiDist) {
          minPoiDist = d;
          nearestPoi = poi;
        }
      }
      setActivePoi(nearestPoi);

      // Check Street Vehicles
      let nearestVeh: VehicleConfig | null = null;
      let minVehDist = 3.6;
      const candidates = new Map(INITIAL_VEHICLES.map((vehicle) => [vehicle.id, vehicle]));
      net.vehicles.forEach((live) => {
        if (live.serviceType || live.driverId) return;
        if (!candidates.has(live.id)) {
          candidates.set(live.id, {
            id: live.id,
            x: live.x,
            z: live.z,
            rot: live.rot,
            color: live.color,
            model: live.model,
            name: live.name,
          });
        }
      });
      for (const cfg of candidates.values()) {
        const live = net.vehicles.get(cfg.id);
        if (live?.serviceType || live?.driverId) continue;
        const vx = live ? live.x : cfg.x;
        const vz = live ? live.z : cfg.z;
        const d = Math.hypot(mePos.x - vx, mePos.z - vz);
        if (d < minVehDist) {
          minVehDist = d;
          nearestVeh = cfg;
        }
      }
      setNearbyVehicle(nearestVeh);
    }, 100);

    return () => clearInterval(iv);
  }, [net]);

  // Execute interaction with active POI
  const handleInteract = useCallback(
    (targetPoi?: POIDefinition | null) => {
      const poiToUse = targetPoi || activePoi;
      if (!poiToUse || !net.room) return;

      if (poiToUse.id === "apt_entrance") {
        net.room.send(MSG.enter_interior);
        return;
      }
      if (poiToUse.id === "apt_exit") {
        net.room.send(MSG.exit_interior);
        return;
      }
      if (poiToUse.id === "apt_door") {
        net.room.send(MSG.door_toggle);
        return;
      }
      if (poiToUse.id === "apt_bed") {
        net.room.send(MSG.sleep_bed);
        return;
      }
      if (poiToUse.id === "apt_wardrobe") {
        setShowWardrobe(true);
        return;
      }
      if (poiToUse.id === "chicago_mall_entrance") {
        net.room.send(MSG.enter_mall);
        return;
      }
      if (poiToUse.id === "mall_exit") {
        net.room.send(MSG.exit_mall);
        return;
      }
      if (poiToUse.id === "mall_foodcourt_pizza" || poiToUse.id === "chicago_pizza_stand") {
        net.room.send(MSG.eat_food);
        return;
      }
      if (poiToUse.id === "loop_coffee") {
        net.room.send(MSG.drink_beverage);
        return;
      }
      if (poiToUse.id === "cta_subway") {
        setShowMapModal(true);
        return;
      }

      net.room.send(MSG.interact, {
        poiId: poiToUse.id,
      } satisfies InteractMessage);
    },
    [activePoi, net.room]
  );

  const handleInteractById = useCallback(
    (poiId: string) => {
      const list = isInsideApartment
        ? APARTMENT_POIS
        : isInsideMall
        ? MALL_POIS
        : INTERACTIVE_POIS;
      const target = list.find((p) => p.id === poiId);
      if (target) handleInteract(target);
    },
    [isInsideApartment, isInsideMall, handleInteract]
  );

  // Enter a vehicle
  const handleEnterVehicle = useCallback(
    (vId?: string) => {
      const idToEnter = vId || nearbyVehicle?.id;
      if (!idToEnter || !net.room) return;
      net.room.send(MSG.vehicle_enter, {
        vehicleId: idToEnter,
      } satisfies VehicleMessage);
    },
    [nearbyVehicle, net.room]
  );

  // Exit vehicle
  const handleExitVehicle = useCallback(() => {
    if (!net.room || !isDriving) return;
    net.room.send(MSG.vehicle_exit);
  }, [net.room, isDriving]);

  // Keyboard shortcuts: E interact, F vehicle/exit, M map, P career, T chat, Q punch.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === "KeyM") {
        e.preventDefault();
        setShowMapModal((prev) => !prev);
        return;
      }

      if (e.code === "KeyT") {
        e.preventDefault();
        setShowChat((prev) => !prev);
        return;
      }

      if (e.code === "KeyP") {
        e.preventDefault();
        setShowLifeSelect((prev) => !prev);
        return;
      }

      if (e.code === "KeyQ" && !isDriving) {
        e.preventDefault();
        net.room?.send(MSG.player_attack);
        return;
      }

      if (e.code === "KeyE") {
        if (activePoi) {
          e.preventDefault();
          handleInteract(activePoi);
        } else if (nearbyVehicle && !isDriving) {
          e.preventDefault();
          handleEnterVehicle(nearbyVehicle.id);
        }
      }

      if (e.code === "KeyF") {
        e.preventDefault();
        if (myPos?.rideStatus === "arrived") {
          net.room?.send(MSG.uber_board);
        } else if (myPos?.medicalStatus === "hospital") {
          net.room?.send(MSG.hospital_discharge);
        } else if (isDriving) {
          handleExitVehicle();
        } else if (isInsideApartment && activePoi?.id === "apt_exit") {
          handleInteract(activePoi);
        } else if (isInsideMall) {
          net.room?.send(MSG.exit_mall);
        } else if (nearbyVehicle) {
          handleEnterVehicle(nearbyVehicle.id);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePoi, nearbyVehicle, isDriving, isInsideApartment, isInsideMall, handleInteract, handleEnterVehicle, handleExitVehicle, net.room, myPos?.rideStatus, myPos?.medicalStatus]);

  // Dismiss controls hint after 9 seconds or when pointer is locked
  useEffect(() => {
    const onLock = () => {
      if (document.pointerLockElement) setShowHint(false);
    };
    document.addEventListener("pointerlockchange", onLock);
    const t = setTimeout(() => setShowHint(false), 9000);
    return () => {
      document.removeEventListener("pointerlockchange", onLock);
      clearTimeout(t);
    };
  }, []);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        backgroundColor: isInsideApartment ? "#090d16" : "#93c5fd",
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        shadows="soft"
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          depth: true,
          logarithmicDepthBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: isInsideApartment ? 1.05 : 1.18,
        }}
        camera={{ fov: 65, position: [0, 3, 6], near: 0.3, far: 12000 }}
        style={{ width: "100%", height: "100%" }}
      >
        {isInsideApartment ? (
          <>
            <ambientLight intensity={0.75} color="#fed7aa" />
            <ApartmentInterior
              net={net}
              homeKind={homeProperty?.kind}
              activePoiId={activePoi?.id}
              onInteractPoi={handleInteractById}
              onOpenWardrobe={() => setShowWardrobe(true)}
            />
          </>
        ) : isInsideHospital ? (
          <>
            <ambientLight intensity={1.05} color="#e0f2fe" />
            <directionalLight position={[4, 8, 5]} intensity={1.25} color="#fffdf7" />
            <HospitalInterior />
          </>
        ) : isInsideMall ? (
          <>
            <MallInterior
              net={net}
              activePoiId={activePoi?.id}
              onInteractPoi={handleInteractById}
              onExitMall={() => net.room?.send(MSG.exit_mall)}
              onWorkShift={() => net.room?.send(MSG.office_work)}
              onStudyCollege={() => net.room?.send(MSG.college_study)}
            />
          </>
        ) : (
          <>
            {/* Realistic Daytime Sky & Atmosphere */}
            <Sky
              distance={450000}
              sunPosition={[120, 90, 100]}
              turbidity={8}
              rayleigh={2.5}
              mieCoefficient={0.005}
              mieDirectionalG={0.8}
            />
            <fog attach="fog" args={["#bfdbfe", 150, 420]} />

            {/* Cinematic Chicago Daylight & Sun Rim Lighting */}
            <ambientLight intensity={0.65} color="#f0f9ff" />
            <directionalLight
              position={[85, 160, 105]}
              intensity={2.1}
              color="#fffdf7"
              castShadow
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.0001}
            />
            <hemisphereLight args={["#bae6fd", "#475569", 0.65]} />

            {/* Real 3D Chicago Loop Buildings, Roads, Doors, & Landmarks */}
            <CityMap
              net={net}
              activePoiId={activePoi?.id}
              onInteractPoi={(poi) => handleInteract(poi)}
            />
            <MetroChunkLayer net={net} />

            {/* Dynamic Interactive Vehicles (Chicago Cabs, Sedans, SUVs) */}
            <VehiclesLayer
              net={net}
              nearbyVehicleId={nearbyVehicle?.id ?? null}
              onEnterVehicle={(vId) => handleEnterVehicle(vId)}
            />

            {/* Hostile NPCs (Cultists & Smokers - Step 6) */}
            <HostilesLayer net={net} />
          </>
        )}

        {/* Multiplayer 3D Human Avatars */}
        {ids.map((id) => (
          <Avatar
            key={id}
            id={id}
            net={net}
            isMe={id === net.me}
            gender={id === net.me ? characterGender : net.pos.get(id)?.gender === "female" ? "female" : "male"}
          />
        ))}

        {/* GTA Third-Person Chase Camera with Vehicle Chase tracking */}
        <FollowCam net={net} onYawChange={handleYawChange} zoomDistance={cameraZoomRef} />

        {/* Performance: Adaptive DPR for cheap mobile devices */}
        <AdaptiveDpr pixelated />
      </Canvas>

      {/* GTA-Style HUD & Minimap Overlay */}
      <HUD
        status={status}
        playerCount={ids.length}
        money={myMoney}
        toast={toast}
        activePoi={activePoi}
        onInteract={() => handleInteract(activePoi)}
        profession={myPos?.profession}
        company={myPos?.company}
        health={myPos?.health}
        energy={myPos?.energy}
        hunger={myPos?.hunger}
        thirst={myPos?.thirst}
        onOpenMap={() => setShowMapModal(true)}
        onOpenCareer={() => setShowLifeSelect(true)}
        onEatFood={() => net.room?.send(MSG.eat_food)}
        onDrinkBeverage={() => net.room?.send(MSG.drink_beverage)}
        onOpenHousing={() => setShowHousing(true)}
        onOpenChat={() => setShowChat(true)}
        homeName={homeProperty?.name}
        homeTenure={myPos?.homeTenure}
        wantedLevel={myPos?.wantedLevel}
        educationLevel={myPos?.educationLevel}
        rideStatus={myPos?.rideStatus}
        rideEtaAt={myPos?.rideEtaAt}
        rideFare={myPos?.rideFare}
        medicalStatus={myPos?.medicalStatus}
        onUberBoard={() => net.room?.send(MSG.uber_board)}
        onUberCancel={() => net.room?.send(MSG.uber_cancel)}
        onUberToWork={handleUberToWork}
        onHospitalDischarge={() => net.room?.send(MSG.hospital_discharge)}
        onZoomIn={() => changeCameraZoom(-8)}
        onZoomOut={() => changeCameraZoom(8)}
        onZoomReset={() => { cameraZoomRef.current = 5; }}
      />

      {/* Mobile Touch Joystick (nipplejs) */}
      <Joystick onMove={setTouchDir} onEnd={clearTouch} />

      {/* Vehicle Driving Dashboard / Speedometer when driving */}
      {isDriving && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.94)",
            border: "2px solid #22c55e",
            borderRadius: "18px",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            boxShadow: "0 8px 32px rgba(34, 197, 94, 0.45)",
            backdropFilter: "blur(12px)",
            zIndex: 45,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "11px", color: "#86efac", fontWeight: 700 }}>
              VEHICLE ACTIVE
            </span>
            <span style={{ fontSize: "15px", color: "#ffffff", fontWeight: 800 }}>
              {currentVehicle?.name || "Vehicle"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
              fontFamily: "'Arial Black', Impact, sans-serif",
              color: "#4ade80",
            }}
          >
            <span style={{ fontSize: "28px" }}>
              {Math.round(Math.abs((currentVehicle?.speed ?? 0) * 2.237))}
            </span>
            <span style={{ fontSize: "12px", opacity: 0.8 }}>MPH</span>
          </div>

          <button
            onClick={handleExitVehicle}
            style={{
              background: "linear-gradient(135deg, #ef4444, #b91c1c)",
              border: "1.5px solid #fca5a5",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "10px",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            EXIT CAR [F]
          </button>
        </div>
      )}

      {/* Mobile Action Buttons */}
      <div
        style={{
          position: "absolute",
          bottom: "28px",
          right: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 40,
        }}
      >
        {/* Drive Vehicle Button (when standing near car) */}
        {!isDriving && nearbyVehicle && (
          <button
            onClick={() => handleEnterVehicle(nearbyVehicle.id)}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #16a34a, #15803d)",
              border: "2.5px solid #86efac",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: 900,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(34, 197, 94, 0.8)",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
            title="Drive (F)"
          >
            <span style={{ fontSize: "15px" }}>🚗</span>
            <span>DRIVE [F]</span>
          </button>
        )}

        {/* Exit Vehicle Button (when driving) */}
        {isDriving && (
          <button
            onClick={handleExitVehicle}
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #dc2626, #b91c1c)",
              border: "2.5px solid #fca5a5",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: 900,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(239, 68, 68, 0.8)",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
            title="Exit Vehicle (F)"
          >
            <span style={{ fontSize: "15px" }}>🚪</span>
            <span>EXIT [F]</span>
          </button>
        )}

        {/* Contextual POI Interact Button */}
        {!isDriving && activePoi && (
          <button
            onClick={() => handleInteract(activePoi)}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0284c7, #0369a1)",
              border: "2.5px solid #38bdf8",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: 900,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(56, 189, 248, 0.8)",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
            title="Interact (E)"
          >
            <span style={{ fontSize: "14px" }}>{activePoi.icon}</span>
            <span>USE [E]</span>
          </button>
        )}

        {/* Jump Button (only on foot) */}
        {!isDriving && (
          <>
          <button
            onClick={() => net.room?.send(MSG.player_attack)}
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #b91c1c, #7f1d1d)",
              border: "2px solid #fca5a5",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
            }}
            title="Punch the nearest player or hostile (Q)"
          >
            PUNCH [Q]
          </button>
          <button
            onClick={triggerJump}
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background: "rgba(15, 23, 42, 0.82)",
              border: "2px solid rgba(255, 255, 255, 0.4)",
              color: "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
            title="Jump (Space)"
          >
            JUMP
          </button>
          </>
        )}

        {/* Crouch Button (only on foot) */}
        {!isDriving && (
          <button
            onClick={toggleCrouch}
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background:
                stance === "crouch"
                  ? "rgba(234, 179, 8, 0.9)"
                  : "rgba(15, 23, 42, 0.82)",
              border: `2px solid ${
                stance === "crouch" ? "#fef08a" : "rgba(255, 255, 255, 0.4)"
              }`,
              color: stance === "crouch" ? "#000" : "#fff",
              fontSize: "10px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
            title="Crouch (C)"
          >
            CROUCH
          </button>
        )}

        {/* Prone Button (only on foot) */}
        {!isDriving && (
          <button
            onClick={toggleProne}
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "50%",
              background:
                stance === "prone"
                  ? "rgba(239, 68, 68, 0.9)"
                  : "rgba(15, 23, 42, 0.82)",
              border: `2px solid ${
                stance === "prone" ? "#fca5a5" : "rgba(255, 255, 255, 0.4)"
              }`,
              color: "#fff",
              fontSize: "11px",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
            title="Prone / Lay (Z)"
          >
            PRONE
          </button>
        )}
      </div>

      {/* Controls Guide Hint Overlay */}
      {showHint && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(15, 23, 42, 0.92)",
            color: "#fff",
            padding: "20px 32px",
            borderRadius: "16px",
            fontSize: "14px",
            fontFamily: "'Inter', sans-serif",
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 1000,
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
            lineHeight: 1.8,
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              marginBottom: "8px",
              color: "#38bdf8",
              letterSpacing: "0.5px",
            }}
          >
            🏙️ CHICAGO LOOP SIMULATOR
          </div>
          🖱️ <b>CapsLock / Click</b>: Free-Look Mouse Lock<br />
          ⌨️ <b>WASD</b>: Move On Foot / Drive Vehicle<br />
          🚗 <b>F</b>: Enter / Exit Vehicle &nbsp;|&nbsp; <b>E</b>: Interact with Doors/ATMs<br />
          🚀 <b>Space</b>: Jump &nbsp;|&nbsp; <b>Shift</b>: Sprint &nbsp;|&nbsp; <b>C</b>: Crouch<br />
          🥊 <b>Q</b>: Punch &nbsp;|&nbsp; <b>T</b>: Talk &nbsp;|&nbsp; <b>M</b>: City map<br />
          <span style={{ opacity: 0.6, fontSize: "12px" }}>
            Press ESC to release cursor · Controls disappear shortly
          </span>
        </div>
      )}

      {/* GTA RP Wardrobe & Outfit Selector Modal */}
      {showWardrobe && (
        <WardrobeModal
          currentJacket={myPos?.jacketColor}
          currentPants={myPos?.pantsColor}
          currentSneaker={myPos?.sneakerColor}
          onSave={(outfit: WardrobeMessage) => {
            net.room?.send(MSG.wardrobe_set, outfit);
          }}
          onClose={() => setShowWardrobe(false)}
        />
      )}

      {/* Career & Life Selection Modal (Step 3) */}
      {showLifeSelect && (
        <LifeSelectModal
          net={net}
          onGenderSelected={setCharacterGender}
          onClose={() => setShowLifeSelect(false)}
        />
      )}

      {/* Chicago Metropolitan Map Modal with Zoom & Fast Travel (Step 9) */}
      {showMapModal && (
        <CityGuideModal
          onClose={() => setShowMapModal(false)}
          onUber={handleUber}
          onTransit={handleTransit}
          playerPosition={myPos ? { x: myPos.x, z: myPos.z } : null}
        />
      )}

      {showHousing && (
        <HousingMarketModal
          money={myMoney}
          homeId={myPos?.homeId ?? ""}
          homeTenure={myPos?.homeTenure ?? ""}
          leaseEndsAt={myPos?.homeLeaseEndsAt ?? 0}
          millionaireOffer={millionaireOffer}
          onApply={(request) => net.room?.send(MSG.housing_apply, request)}
          onVacate={() => net.room?.send(MSG.housing_vacate)}
          onGoHome={() => {
            net.room?.send(MSG.home_go);
            setShowHousing(false);
          }}
          onClose={() => {
            setShowHousing(false);
            setMillionaireOffer(false);
          }}
        />
      )}

      {showChat && (
        <SocialChatModal
          messages={socialMessages}
          playerId={net.me}
          onSend={(text) => net.room?.send(MSG.social_chat, { text })}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
