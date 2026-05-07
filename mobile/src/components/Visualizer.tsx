import { Canvas, Circle, Group, Line, Path, Rect, Skia, useCanvasRef } from "@shopify/react-native-skia";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import { useAnimationTime } from "../hooks/useAnimationTime";
import { type ComparisonResult, type ViewMode } from "../model/comparison";
import { visiblePaneLabels } from "../model/ui";

const EQUAL_COLOR = "#00acc1";
const JUST_COLOR = "#f9ab00";

export interface VisualizerHandle {
  capturePngBase64: () => Promise<string>;
}

interface VisualizerProps {
  comparison: ComparisonResult;
  viewMode: ViewMode;
}

export const Visualizer = forwardRef<VisualizerHandle, VisualizerProps>(function Visualizer(
  { comparison, viewMode },
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
        color: isEqual ? EQUAL_COLOR : JUST_COLOR,
        path: makeTracePath(size.width, paneHeight, comparison.xFreq, yFreq, time),
        points: makeTracePoints(size.width, paneHeight, comparison.xFreq, yFreq, time),
      };
    });
  }, [comparison, size, time, viewMode]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width: Math.max(1, width), height: Math.max(1, height) });
  };

  return (
    <View style={styles.shell} onLayout={handleLayout}>
      <Canvas ref={canvasRef} style={styles.canvas} opaque>
        <Rect x={0} y={0} width={size.width} height={size.height} color="#f9fbfe" />
        {panes.map((pane) => (
          <Group key={pane.label} transform={[{ translateY: pane.y }]}>
            <Rect x={0} y={0} width={size.width} height={pane.height} color="#f9fbfe" />
            <Grid width={size.width} height={pane.height} />
            <Path path={pane.path} color={pane.color} style="stroke" strokeWidth={2.2} strokeCap="round" strokeJoin="round" />
            <Path path={pane.path} color={pane.color} opacity={0.18} style="stroke" strokeWidth={7} strokeCap="round" strokeJoin="round" />
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
      </Canvas>
      <View pointerEvents="none" style={styles.labels}>
        {panes.map((pane) => (
          <Text key={pane.label} style={[styles.label, { top: pane.y + 10 }]}>
            {pane.label}
          </Text>
        ))}
      </View>
    </View>
  );
});

function Grid({ width, height }: { width: number; height: number }) {
  const minor = [];
  const major = [];
  for (let i = 1; i < 10; i += 1) {
    const x = (width * i) / 10;
    const y = (height * i) / 10;
    minor.push(<Line key={`mx-${i}`} p1={{ x, y: 0 }} p2={{ x, y: height }} color="#d5deea" strokeWidth={0.7} />);
    minor.push(<Line key={`my-${i}`} p1={{ x: 0, y }} p2={{ x: width, y }} color="#d5deea" strokeWidth={0.7} />);
  }
  for (let i = 1; i < 2; i += 1) {
    const x = (width * i) / 2;
    const y = (height * i) / 2;
    major.push(<Line key={`gx-${i}`} p1={{ x, y: 0 }} p2={{ x, y: height }} color="#aebbc9" strokeWidth={1.1} />);
    major.push(<Line key={`gy-${i}`} p1={{ x: 0, y }} p2={{ x: width, y }} color="#aebbc9" strokeWidth={1.1} />);
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
    height: 320,
    overflow: "hidden",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f9fbfe",
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
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.78)",
    color: "#26313f",
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
