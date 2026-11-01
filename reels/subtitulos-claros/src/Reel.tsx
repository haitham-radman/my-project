import {AbsoluteFill, useCurrentFrame, interpolate} from "remotion";
import {BRAND} from "./brand.config";
import {DURATION_IN_FRAMES} from "./reel.config";
import {Captions} from "./Captions";

// Reel de solo texto: fondo de marca, subtítulos palabra por palabra y una
// barra de progreso. No hay metraje ni voz; ver README.md.
export const Reel = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, DURATION_IN_FRAMES], [0, 100], {extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{backgroundColor: BRAND.colors.background}}>
      <Captions />
      <div style={{position: "absolute", left: 0, bottom: 0, height: 10, width: `${progress}%`, backgroundColor: BRAND.colors.highlight}} />
    </AbsoluteFill>
  );
};
