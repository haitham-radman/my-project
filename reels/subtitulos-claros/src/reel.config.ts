// Variante de reel.config.ts para proyectos con marca (reel-brand-kit).
// SAFE sale de brand.json a traves de src/brand.config.ts; no se escribe aqui.
import {BRAND} from "./brand.config";

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const SECONDS = 30;
export const DURATION_IN_FRAMES = FPS * SECONDS; // 900

export const SAFE = BRAND.safe;

// Ancho maximo de un subtitulo dentro de la zona segura.
export const CAPTION_MAX_WIDTH = WIDTH - SAFE.left - SAFE.right;
