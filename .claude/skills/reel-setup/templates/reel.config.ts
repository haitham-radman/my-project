// Valores de un reel vertical de 30 s para TikTok e Instagram Reels.
// WIDTH, HEIGHT, FPS y SECONDS son decisiones del usuario (confirmadas).
// SAFE son valores de partida en píxeles, PENDIENTES DE CONFIRMAR contra la
// interfaz actual de cada plataforma: botones, nombre de cuenta y descripción
// tapan parte del cuadro.
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 30;
export const SECONDS = 30;
export const DURATION_IN_FRAMES = FPS * SECONDS; // 900

export const SAFE = {top: 150, bottom: 380, left: 60, right: 120};

// Ancho máximo de un subtítulo dentro de la zona segura.
export const CAPTION_MAX_WIDTH = WIDTH - SAFE.left - SAFE.right; // 900
