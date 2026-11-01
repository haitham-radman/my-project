import {Composition} from "remotion";
import {Reel} from "./Reel";
import {WIDTH, HEIGHT, FPS, DURATION_IN_FRAMES} from "./reel.config";

export const Root = () => (
  <Composition
    id="Reel"
    component={Reel}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={DURATION_IN_FRAMES}
  />
);
