import {
  AlphaType,
  Canvas,
  Circle,
  ColorType,
  Group,
  Line,
  Path,
  Rect,
  Skia,
  useCanvasRef,
} from "@shopify/react-native-skia";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { useAnimationTime } from "../hooks/useAnimationTime";
import { type ComparisonResult, type ViewMode } from "../model/comparison";
import { type AppTheme, visiblePaneLabels } from "../model/ui";

export interface VisualizerHandle {
  capturePngBase64: () => Promise<string>;
  captureRgbaFrame: () => Promise<{ width: number; height: number; pixels: Uint8Array }>;
}

interface VisualizerProps {
  comparison: ComparisonResult;
  height: number;
  theme: AppTheme;
  viewMode: ViewMode;
}

export const Visualizer = forwardRef<VisualizerHandle, VisualizerProps>(function Visualizer(
  { comparison, height, theme, viewMode },
  ref,
) {
  const canvasRef = useCanvasRef();
  const [size, setSize] = useState({ width: 1, height: 1 });
  const time = useAnimationTime(true);

  useImperativeHandle(ref, () => ({
    async capturePngBase64() {
      const image = await canvasRef.current?.makeImageSnapshotAsync();
      const base64 = image?.encodeToBase64();
      if (!base64) {
        throw new Error("Could not capture visualizer image.");
      }
      return base64;
    },
    async captureRgbaFrame() {
      const image = await canvasRef.current?.makeImageSnapshotAsync();
      if (!image) {
        throw new Error("Could not capture visualizer frame.");
      }
      const width = image.width();
      const height = image.height();
      const pixels = image.readPixels(0, 0, {
        alphaType: AlphaType.Unpremul,
        colorType: ColorType.RGBA_8888,
        width,
        height,
      });
      if (!(pixels instanceof Uint8Array)) {
        throw new Error("Could not read visualizer frame pixels.");
      }
      return { width, height, pixels };
    },
  }));

  const panes = useMemo(() => {
    const labels = visiblePaneLabels(viewMode);
    const paneHeight = size.height / labels.length;
    return labels.map((label, index) => {
      const isEqual = label === "Equal";
      const y = index * paneHeight;
      const yFreq = isEqual ? comparison.equalY : comparison.justY;
      return {
        label,
        y,
        height: paneHeight,
        color: isEqual ? theme.equalAccent : theme.justAccent,
        glowColor: isEqual ? theme.traceGlowEqual : theme.traceGlowJust,
        path: makeTracePath(size.width, paneHeight, comparison.xFreq, yFreq, time),
        points: makeTracePoints(size.width, paneHeight, comparison.xFreq, yFreq, time),
      };
    });
  }, [comparison, size, theme.equalAccent, theme.justAccent, theme.traceGlowEqual, theme.traceGlowJust, time, viewMode]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width: Math.max(1, width), height: Math.max(1, height) });
  };

  return (
    <View
      style={[
        styles.shell,
        {
          height,
          backgroundColor: theme.visualizerBackground,
          borderColor: theme.border,
        },
      ]}
      onLayout={handleLayout}
    >
      <Canvas ref={canvasRef} style={styles.canvas} opaque>
        <Rect x={0} y={0} width={size.width} height={size.height} color={theme.visualizerBackground} />
        {panes.map((pane) => (
          <Group key={pane.label} transform={[{ translateY: pane.y }]}>
            <Rect x={0} y={0} width={size.width} height={pane.height} color={theme.visualizerBackground} />
            <Rect
              x={2}
              y={2}
              width={Math.max(0, size.width - 4)}
              height={Math.max(0, pane.height - 4)}
              color={theme.visualizerFrame}
              opacity={0.22}
              style="stroke"
              strokeWidth={1}
            />
            <Grid
              width={size.width}
              height={pane.height}
              minorColor={theme.visualizerGridMinor}
              majorColor={theme.visualizerGridMajor}
            />
            <Path
              path={pane.path}
              color={pane.glowColor}
              style="stroke"
              strokeWidth={18}
              strokeCap="round"
              strokeJoin="round"
            />
            <Path
              path={pane.path}
              color={pane.glowColor}
              opacity={0.7}
              style="stroke"
              strokeWidth={9}
              strokeCap="round"
              strokeJoin="round"
            />
            <Path path={pane.path} color={pane.color} style="stroke" strokeWidth={2.2} strokeCap="round" strokeJoin="round" />
            <Path path={pane.path} color={pane.color} opacity={0.36} style="stroke" strokeWidth={4.5} strokeCap="round" strokeJoin="round" />
            {pane.points.map((point, index) => (
              <Circle
                key={`${pane.label}-${index}`}
                cx={point.x}
                cy={point.y}
                r={1.4}
                color={pane.color}
                opacity={0.16 + point.age * 0.18}
              />
            ))}
          </Group>
        ))}
        {panes.length > 1
          ? panes.slice(1).map((pane) => (
              <Group key={`divider-${pane.label}`}>
                <Line
                  p1={{ x: 10, y: pane.y }}
                  p2={{ x: Math.max(10, size.width - 10), y: pane.y }}
                  color={theme.visualizerBackground}
                  opacity={0.78}
                  strokeWidth={5}
                />
                <Line
                  p1={{ x: 12, y: pane.y }}
                  p2={{ x: Math.max(12, size.width - 12), y: pane.y }}
                  color={theme.visualizerFrame}
                  opacity={0.82}
                  strokeWidth={1.4}
                />
              </Group>
            ))
          : null}
        <Rect
          x={0.5}
          y={0.5}
          width={Math.max(0, size.width - 1)}
          height={Math.max(0, size.height - 1)}
          color={theme.visualizerFrame}
          style="stroke"
          strokeWidth={1.5}
        />
        <Rect
          x={4}
          y={4}
          width={Math.max(0, size.width - 8)}
          height={Math.max(0, size.height - 8)}
          color={theme.visualizerFrame}
          opacity={0.32}
          style="stroke"
          strokeWidth={0.8}
        />
      </Canvas>
      <View pointerEvents="none" style={styles.labels}>
        {panes.map((pane) => (
          <Text
            key={pane.label}
            style={[
              styles.label,
              {
                top: pane.y + 10,
                backgroundColor: theme.visualizerLabelBackground,
                borderColor: pane.color,
                color: pane.color,
                textShadowColor: pane.glowColor,
              },
            ]}
          >
            {pane.label}
          </Text>
        ))}
      </View>
    </View>
  );
});

function Grid({
  width,
  height,
  minorColor,
  majorColor,
}: {
  width: number;
  height: number;
  minorColor: string;
  majorColor: string;
}) {
  const minor = [];
  const major = [];
  for (let i = 1; i < 10; i += 1) {
    const x = (width * i) / 10;
    const y = (height * i) / 10;
    minor.push(<Line key={`mx-${i}`} p1={{ x, y: 0 }} p2={{ x, y: height }} color={minorColor} opacity={0.72} strokeWidth={0.55} />);
    minor.push(<Line key={`my-${i}`} p1={{ x: 0, y }} p2={{ x: width, y }} color={minorColor} opacity={0.72} strokeWidth={0.55} />);
  }
  for (let i = 1; i < 2; i += 1) {
    const x = (width * i) / 2;
    const y = (height * i) / 2;
    major.push(<Line key={`gx-${i}`} p1={{ x, y: 0 }} p2={{ x, y: height }} color={majorColor} opacity={0.86} strokeWidth={0.9} />);
    major.push(<Line key={`gy-${i}`} p1={{ x: 0, y }} p2={{ x: width, y }} color={majorColor} opacity={0.86} strokeWidth={0.9} />);
  }
  return (
    <>
      {minor}
      {major}
    </>
  );
}

function makeTracePath(width: number, height: number, xFreq: number, yFreq: number, time: number) {
  const path = Skia.Path.Make();
  const samples = 520;
  const traceWindow = 0.085;
  const amp = Math.min(width, height) * 0.38;
  const cx = width / 2;
  const cy = height / 2;

  for (let i = 0; i < samples; i += 1) {
    const f = i / Math.max(samples - 1, 1);
    const localTime = time + f * traceWindow;
    const x = cx + Math.sin(Math.PI * 2 * xFreq * localTime) * amp;
    const y = cy - Math.sin(Math.PI * 2 * yFreq * localTime + Math.PI / 2) * amp;
    if (i === 0) {
      path.moveTo(x, y);
    } else {
      path.lineTo(x, y);
    }
  }
  return path;
}

function makeTracePoints(width: number, height: number, xFreq: number, yFreq: number, time: number) {
  const samples = 32;
  const traceWindow = 0.085;
  const amp = Math.min(width, height) * 0.38;
  const cx = width / 2;
  const cy = height / 2;
  return Array.from({ length: samples }, (_, i) => {
    const age = i / Math.max(samples - 1, 1);
    const localTime = time + age * traceWindow;
    return {
      age,
      x: cx + Math.sin(Math.PI * 2 * xFreq * localTime) * amp,
      y: cy - Math.sin(Math.PI * 2 * yFreq * localTime + Math.PI / 2) * amp,
    };
  });
}

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
  },
  canvas: {
    flex: 1,
  },
  labels: {
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    position: "absolute",
    left: 12,
    borderRadius: 4,
    borderWidth: 1,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    overflow: "hidden",
  },
});
