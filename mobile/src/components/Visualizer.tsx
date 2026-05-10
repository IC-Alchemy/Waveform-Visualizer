import { Canvas, Circle, Group, Line, Path, Rect, Skia, useCanvasRef } from "@shopify/react-native-skia";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { useAnimationTime } from "../hooks/useAnimationTime";
import { ScopeState } from "../model/oscilloscope";

export interface VisualizerHandle {
  capturePngBase64: () => Promise<string>;
}

interface VisualizerProps {
  state: ScopeState;
  height: number;
}

interface Point {
  x: number;
  y: number;
  age: number;
}

export const Visualizer = forwardRef<VisualizerHandle, VisualizerProps>(function Visualizer({ state, height }, ref) {
  const canvasRef = useCanvasRef();
  const [size, setSize] = useState({ width: 1, height: 1 });
  const time = useAnimationTime(!state.frozen);

  useImperativeHandle(ref, () => ({
    async capturePngBase64() {
      const image = await canvasRef.current?.makeImageSnapshotAsync();
      const base64 = image?.encodeToBase64();
      if (!base64) {
        throw new Error("Could not capture visualizer image.");
      }
      return base64;
    },
  }));

  const sampleCount = Math.min(2200, Math.max(128, Math.round(state.samples)));
  const display = useMemo(() => {
    const layers = Array.from({ length: 5 }, (_, index) => {
      const layerAge = index / 4;
      const layerTime = time - state.window * layerAge * 0.7;
      return {
        opacity: Math.max(0.04, Math.pow(state.persistence * state.decay, index + 1) * (0.62 - layerAge * 0.08)),
        path: makeTracePath(size.width, size.height, state, layerTime, sampleCount),
      };
    });
    const points = state.traceStyle !== "lines" ? makeTracePoints(size.width, size.height, state, time) : [];
    return { layers, points };
  }, [sampleCount, size.height, size.width, state, time]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height: nextHeight } = event.nativeEvent.layout;
    setSize({ width: Math.max(1, width), height: Math.max(1, nextHeight) });
  };

  const drawLines = state.traceStyle !== "points";
  const drawPoints = state.traceStyle !== "lines";
  const glowWidth = Math.max(3, state.focus * (2.2 + state.bloom));
  const coreWidth = Math.max(1.1, state.focus * 0.48);

  return (
    <View style={[styles.shell, { height }]} onLayout={handleLayout}>
      <Canvas ref={canvasRef} style={styles.canvas} opaque>
        <Rect x={0} y={0} width={size.width} height={size.height} color="#020706" />
        <Grid width={size.width} height={size.height} color={state.phosphorColor} />
        <Group>
          {drawLines &&
            display.layers.map((layer, index) => (
              <Path
                key={`trail-${index}`}
                path={layer.path}
                color={state.phosphorColor}
                opacity={layer.opacity * state.intensity * 0.9}
                style="stroke"
                strokeWidth={coreWidth}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}
          {drawLines && state.bloom > 0 && (
            <Path
              path={display.layers[0].path}
              color={state.phosphorColor}
              opacity={Math.min(0.38, state.bloom * 0.13)}
              style="stroke"
              strokeWidth={glowWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          )}
          {drawPoints &&
            display.points.map((point, index) => (
              <Circle
                key={`point-${index}`}
                cx={point.x}
                cy={point.y}
                r={Math.max(1.2, state.focus * (0.42 + state.traceAntialias * 0.35))}
                color={state.phosphorColor}
                opacity={(0.15 + point.age * 0.35) * state.intensity}
              />
            ))}
        </Group>
      </Canvas>
      <View pointerEvents="none" style={styles.overlay}>
        <Text style={styles.mode}>XY analog mode</Text>
        <Text style={styles.readout}>
          X {state.x.freq.toFixed(2)} Hz / Y {state.y.freq.toFixed(2)} Hz
        </Text>
      </View>
    </View>
  );
});

function Grid({ width, height, color }: { width: number; height: number; color: string }) {
  const minor = [];
  for (let i = 1; i < 10; i += 1) {
    const x = (width * i) / 10;
    const y = (height * i) / 10;
    minor.push(<Line key={`x-${i}`} p1={{ x, y: 0 }} p2={{ x, y: height }} color={color} opacity={0.12} strokeWidth={0.8} />);
    minor.push(<Line key={`y-${i}`} p1={{ x: 0, y }} p2={{ x: width, y }} color={color} opacity={0.12} strokeWidth={0.8} />);
  }
  return (
    <>
      {minor}
      <Line p1={{ x: width / 2, y: 0 }} p2={{ x: width / 2, y: height }} color={color} opacity={0.32} strokeWidth={1.2} />
      <Line p1={{ x: 0, y: height / 2 }} p2={{ x: width, y: height / 2 }} color={color} opacity={0.32} strokeWidth={1.2} />
    </>
  );
}

function makeTracePath(width: number, height: number, state: ScopeState, time: number, samples: number) {
  const path = Skia.Path.Make();
  for (let i = 0; i < samples; i += 1) {
    const f = i / Math.max(samples - 1, 1);
    const localTime = time + f * state.window;
    const point = samplePoint(width, height, state, localTime);
    if (i === 0) {
      path.moveTo(point.x, point.y);
    } else {
      path.lineTo(point.x, point.y);
    }
  }
  return path;
}

function makeTracePoints(width: number, height: number, state: ScopeState, time: number): Point[] {
  const samples = 96;
  return Array.from({ length: samples }, (_, index) => {
    const age = index / Math.max(samples - 1, 1);
    const localTime = time + age * state.window;
    return { ...samplePoint(width, height, state, localTime), age };
  });
}

function samplePoint(width: number, height: number, state: ScopeState, time: number) {
  const xSignal = osc(Math.PI * 2 * state.x.freq * time + radians(state.x.phase), state.x.wave) * state.x.amp + state.x.offset;
  const ySignal = osc(Math.PI * 2 * state.y.freq * time + radians(state.y.phase), state.y.wave) * state.y.amp + state.y.offset;
  const x = width / 2 + clamp(xSignal, -1.08, 1.08) * width * 0.43;
  const y = height / 2 - clamp(ySignal, -1.08, 1.08) * height * 0.43;
  return { x, y };
}

function osc(t: number, wave: number) {
  const s = Math.sin(t);
  if (wave === 1) {
    return Math.asin(s) * 0.63661977236;
  }
  if (wave === 2) {
    return Math.tanh(s * 5.8);
  }
  if (wave === 3) {
    const p = fract(t * 0.15915494309);
    return p * 2 - 1;
  }
  return s;
}

function fract(value: number) {
  return value - Math.floor(value);
}

function radians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1d3f34",
    backgroundColor: "#020706",
  },
  canvas: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    padding: 12,
  },
  mode: {
    alignSelf: "flex-start",
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "rgba(3, 15, 12, 0.72)",
    color: "#d9ffea",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  readout: {
    alignSelf: "flex-start",
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "rgba(3, 15, 12, 0.72)",
    color: "#9feebf",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
});
