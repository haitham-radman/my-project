import {AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate} from "remotion";
import {loadFont} from "@remotion/google-fonts/Cairo";
import {BRAND} from "./brand.config";
import {SAFE, CAPTION_MAX_WIDTH} from "./reel.config";
import captions from "../captions.json";

const {fontFamily} = loadFont("normal", {weights: ["700"], subsets: ["arabic", "latin"]});

// captions.json: un subtítulo por página, con tiempos ESTIMADOS por número de
// palabras (reel-script-ar). Dentro de cada página la palabra activa se reparte
// a partes iguales; sustituye ambos por los tiempos de la voz real cuando exista.
export const Captions = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ms = (frame / fps) * 1000;
  const page = captions.find((c) => ms >= c.startMs && ms < c.endMs);
  if (!page) return null;

  const words = page.text.split(" ");
  const active = Math.min(words.length - 1, Math.floor(((ms - page.startMs) / (page.endMs - page.startMs)) * words.length));
  const opacity = interpolate(ms, [page.startMs, page.startMs + 150], [0, 1], {extrapolateRight: "clamp"});

  return (
    <AbsoluteFill>
      {/* Centrado vertical dentro de la zona segura (no de la pantalla entera). */}
      <div
        style={{
          position: "absolute",
          left: SAFE.left,
          right: SAFE.right,
          top: SAFE.top,
          bottom: SAFE.bottom,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          dir="rtl"
          lang="ar"
          style={{
            maxWidth: CAPTION_MAX_WIDTH,
            textAlign: "center",
            textWrap: "balance",
            fontFamily,
            fontSize: BRAND.captions.fontSize,
            lineHeight: 1.4,
            opacity,
          }}
        >
          {words.map((w, i) => (
            <span key={i} style={{display: "inline-block", margin: "0 8px", color: i === active ? BRAND.colors.highlight : BRAND.colors.text}}>
              {w}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
