"use client";
import dynamic from "next/dynamic";

// Three.js must only load in the browser
const Game = dynamic(() => import("../components/Game"), { ssr: false });

export default function Page() {
  return <Game />;
}
