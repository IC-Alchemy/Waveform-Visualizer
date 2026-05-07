import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioContext,
  type GainNode,
  type OscillatorNode,
  type WaveShaperNode,
} from "react-native-audio-api";
import {
  audibleYFrequency,
  type AudioTemperament,
  type ComparisonResult,
  type ViewMode,
  volumeToGain,
} from "../model/comparison";

interface AudioGraph {
  ctx: AudioContext;
  gain: GainNode;
  xOsc: OscillatorNode;
  yOsc: OscillatorNode;
  xShaper: WaveShaperNode;
  yShaper: WaveShaperNode;
}

interface UseAudioEngineInput {
  comparison: ComparisonResult;
  viewMode: ViewMode;
  audioTemperament: AudioTemperament;
  volume: number;
}

export function useAudioEngine({ comparison, viewMode, audioTemperament, volume }: UseAudioEngineInput) {
  const graphRef = useRef<AudioGraph | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState("Audio is off.");

  const ensureGraph = useCallback(() => {
    if (graphRef.current) {
      return graphRef.current;
    }

    const ctx = new AudioContext();
    const gain = ctx.createGain();
    const xOsc = ctx.createOscillator();
    const yOsc = ctx.createOscillator();
    const xShaper = ctx.createWaveShaper();
    const yShaper = ctx.createWaveShaper();
    const curve = createSoftClipCurve();

    xOsc.type = "sine";
    yOsc.type = "sine";
    xShaper.curve = curve;
    yShaper.curve = curve;
    xShaper.oversample = "2x";
    yShaper.oversample = "2x";
    gain.gain.value = volumeToGain(volume);

    xOsc.connect(xShaper).connect(gain);
    yOsc.connect(yShaper).connect(gain);
    gain.connect(ctx.destination);
    xOsc.start(ctx.currentTime);
    yOsc.start(ctx.currentTime);

    graphRef.current = { ctx, gain, xOsc, yOsc, xShaper, yShaper };
    return graphRef.current;
  }, [volume]);

  const enable = useCallback(async () => {
    const graph = ensureGraph();
    await graph.ctx.resume();
    setEnabled(true);
  }, [ensureGraph]);

  const disable = useCallback(async () => {
    const graph = graphRef.current;
    if (graph) {
      await graph.ctx.suspend();
    }
    setEnabled(false);
    setStatus("Audio is off.");
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !enabled) {
      return;
    }

    const now = graph.ctx.currentTime;
    const yFreq = audibleYFrequency(comparison, viewMode, audioTemperament);
    graph.xOsc.frequency.setTargetAtTime(comparison.xFreq, now, 0.015);
    graph.yOsc.frequency.setTargetAtTime(yFreq, now, 0.015);
    graph.gain.gain.setTargetAtTime(volumeToGain(volume), now, 0.02);
    setStatus(`Audio is playing X plus ${audioTemperament === "just" ? "just" : "equal"} Y.`);
  }, [audioTemperament, comparison, enabled, viewMode, volume]);

  useEffect(() => {
    return () => {
      const graph = graphRef.current;
      if (graph) {
        graph.ctx.close().catch(() => undefined);
      }
    };
  }, []);

  return {
    enabled,
    status,
    enable,
    disable,
  };
}

function createSoftClipCurve(size = 2048, drive = 1.7) {
  const curve = new Float32Array(size);
  const normalizer = Math.tanh(drive);
  for (let i = 0; i < size; i += 1) {
    const x = (i / (size - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * drive) / normalizer;
  }
  return curve;
}
