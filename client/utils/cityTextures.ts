import * as THREE from "three";

/**
 * Procedural texture generators for GTA-style city rendering.
 * All textures are generated on-the-fly in browser canvas memory (0 KB network download).
 */

let skyscraperTextureCache: THREE.CanvasTexture | null = null;
let brickTextureCache: THREE.CanvasTexture | null = null;
let asphaltRoadTextureCache: THREE.CanvasTexture | null = null;
let sidewalkTextureCache: THREE.CanvasTexture | null = null;
let billboardTextureCache: THREE.CanvasTexture | null = null;

/**
 * Modern glass & steel skyscraper facade texture.
 * Grid of reflective office windows with varied interior lighting and steel mullions.
 */
export function getSkyscraperTexture(): THREE.CanvasTexture {
  if (skyscraperTextureCache) return skyscraperTextureCache;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Neutral charcoal curtain-wall framing keeps reflected sky color out of the base material.
  ctx.fillStyle = "#353b40";
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 12;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    // Floor dividing spandrel beam
    ctx.fillStyle = "#596168";
    ctx.fillRect(0, r * cellH, 512, 4);

    for (let c = 0; c < cols; c++) {
      const x = c * cellW + 5;
      const y = r * cellH + 6;
      const w = cellW - 10;
      const h = cellH - 11;

      // Restrained neutral reflections, dark glazing, and a few warm occupied offices.
      const rand = Math.sin(r * 17.3 + c * 31.7);
      if (rand > 0.4) {
        ctx.fillStyle = "#c9b995";
      } else if (rand > -0.2) {
        ctx.fillStyle = "#899398";
      } else if (rand > -0.6) {
        ctx.fillStyle = "#59666d";
      } else {
        ctx.fillStyle = "#292f34";
      }
      ctx.fillRect(x, y, w, h);

      // Fine steel mullions and a subtle sill.
      ctx.fillStyle = "#42494e";
      ctx.fillRect(x + w / 2 - 0.7, y, 1.4, h);
      ctx.fillRect(x, y + h - 1, w, 1);

      // Restrained reflected daylight, not a saturated painted-on blue.
      ctx.fillStyle = "rgba(235, 239, 240, 0.16)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.4, y);
      ctx.lineTo(x, y + h * 0.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  skyscraperTextureCache = texture;
  return texture;
}

/**
 * Classic Chicago brick / terracotta skyscraper facade texture.
 */
export function getBrickSkyscraperTexture(): THREE.CanvasTexture {
  if (brickTextureCache) return brickTextureCache;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Weathered limestone and warm Chicago masonry.
  ctx.fillStyle = "#86786b";
  ctx.fillRect(0, 0, 512, 512);

  const cols = 8;
  const rows = 12;
  const cellW = 512 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    // Stone belt course
    ctx.fillStyle = "#b4a99b";
    ctx.fillRect(0, r * cellH, 512, 5);

    for (let c = 0; c < cols; c++) {
      const x = c * cellW + 6;
      const y = r * cellH + 8;
      const w = cellW - 12;
      const h = cellH - 12;

      // Stone window frame / sill
      ctx.fillStyle = "#b7ab9b";
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);

      // Window pane
      const rand = Math.sin(r * 23.1 + c * 13.9);
      ctx.fillStyle = rand > 0.3 ? "#b7a889" : rand > -0.3 ? "#657076" : "#343a3e";
      ctx.fillRect(x, y, w, h);

      // Window cross muntin
      ctx.fillStyle = "#71685e";
      ctx.fillRect(x + w / 2 - 1, y, 2, h);
      ctx.fillRect(x, y + h / 2 - 1, w, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  brickTextureCache = texture;
  return texture;
}

/**
 * Real asphalt road texture with yellow centerlines and white dashed lane dividers.
 */
export function getAsphaltRoadTexture(): THREE.CanvasTexture {
  if (asphaltRoadTextureCache) return asphaltRoadTextureCache;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Dark asphalt base
  ctx.fillStyle = "#27272a";
  ctx.fillRect(0, 0, 256, 512);

  // Subtle asphalt grain texture
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 512;
    const shade = Math.random() > 0.5 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, 2, 2);
  }

  // Double solid yellow centerlines
  ctx.fillStyle = "#facc15";
  ctx.fillRect(124, 0, 3, 512);
  ctx.fillRect(130, 0, 3, 512);

  // White dashed lane markers on left & right lanes
  ctx.fillStyle = "#f8fafc";
  for (let y = 0; y < 512; y += 48) {
    ctx.fillRect(60, y, 3, 26);
    ctx.fillRect(193, y, 3, 26);
  }

  // White solid shoulder lines
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.fillRect(8, 0, 2, 512);
  ctx.fillRect(246, 0, 2, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  asphaltRoadTextureCache = texture;
  return texture;
}

/**
 * Concrete sidewalk paving slab texture.
 */
export function getSidewalkTexture(): THREE.CanvasTexture {
  if (sidewalkTextureCache) return sidewalkTextureCache;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Clean urban sidewalk concrete
  ctx.fillStyle = "#cbd5e1";
  ctx.fillRect(0, 0, 256, 256);

  // Concrete grid joints (tile slabs)
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 122, 122);
  ctx.strokeRect(130, 4, 122, 122);
  ctx.strokeRect(4, 130, 122, 122);
  ctx.strokeRect(130, 130, 122, 122);

  // Grain
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
    ctx.fillRect(x, y, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  sidewalkTextureCache = texture;
  return texture;
}

/**
 * Glowing LED billboard animation canvas texture.
 */
export function getBillboardTexture(title: string, subtitle: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Deep dark LED backing
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, 512, 256);

  // Glowing cyber neon border
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 500, 244);

  // Digital scanlines
  ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
  for (let y = 0; y < 256; y += 4) {
    ctx.fillRect(0, y, 512, 2);
  }

  // Header Title
  ctx.fillStyle = color;
  ctx.font = "bold 34px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(title, 256, 100);

  // Subtitle
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 20px monospace";
  ctx.fillText(subtitle, 256, 150);

  // Bottom action bar
  ctx.fillStyle = color;
  ctx.fillRect(100, 185, 312, 36);
  ctx.fillStyle = "#09090b";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("★ VIRTUAL BILLBOARD ★", 256, 210);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}
