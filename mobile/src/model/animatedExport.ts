export const ANIMATED_EXPORT_DURATIONS = [3, 5, 10] as const;

export type AnimatedExportDuration = (typeof ANIMATED_EXPORT_DURATIONS)[number];
export type AnimatedExportStatus = "idle" | "rendering" | "encoding" | "sharing" | "done" | "error";

export interface AnimatedExportOption {
  value: AnimatedExportDuration;
  label: string;
  detail: string;
}

export interface AnimatedExportFrame {
  index: number;
  timestampSeconds: number;
}

export interface AnimatedExportPlan {
  durationSeconds: AnimatedExportDuration;
  frameRate: number;
  frameCount: number;
  delayMs: number;
  frameDelayMs: number;
  frames: AnimatedExportFrame[];
  mimeType: "image/gif";
  fileExtension: "gif";
  shareDialogTitle: string;
}

const ANDROID_SHARE_FRAME_RATE = 6;
const GIF_MIME_TYPE = "image/gif";
const GIF_EXTENSION = "gif";

export const ANIMATED_EXPORT_OPTIONS: readonly AnimatedExportOption[] = ANIMATED_EXPORT_DURATIONS.map((duration) => {
  const frameCount = duration * ANDROID_SHARE_FRAME_RATE;
  return {
    value: duration,
    label: animatedExportLabel(duration),
    detail: `${frameCount} frames at ${ANDROID_SHARE_FRAME_RATE} fps`,
  };
});

export const ANIMATED_EXPORT_STATUS_TEXT: Record<AnimatedExportStatus, string> = {
  idle: "Share exports an animated GIF of the visualizer.",
  rendering: "Capturing animation frames...",
  encoding: "Encoding animated GIF...",
  sharing: "Opening Android share sheet...",
  done: "Animated GIF sent to Android share sheet.",
  error: "Animated export failed.",
};

export function isAnimatedExportDuration(value: number): value is AnimatedExportDuration {
  return ANIMATED_EXPORT_DURATIONS.includes(value as AnimatedExportDuration);
}

export function validateAnimatedExportDuration(value: number): AnimatedExportDuration {
  if (isAnimatedExportDuration(value)) {
    return value;
  }
  throw new Error(`Unsupported animated export duration: ${value}. Use 3, 5, or 10 seconds.`);
}

export function buildAnimatedExportPlan(durationSeconds: number): AnimatedExportPlan {
  const duration = validateAnimatedExportDuration(durationSeconds);
  const frameCount = duration * ANDROID_SHARE_FRAME_RATE;
  const frameDelayMs = Math.round(1000 / ANDROID_SHARE_FRAME_RATE);
  return {
    durationSeconds: duration,
    frameRate: ANDROID_SHARE_FRAME_RATE,
    frameCount,
    delayMs: frameDelayMs,
    frameDelayMs,
    frames: Array.from({ length: frameCount }, (_, index) => ({
      index,
      timestampSeconds: index / ANDROID_SHARE_FRAME_RATE,
    })),
    mimeType: GIF_MIME_TYPE,
    fileExtension: GIF_EXTENSION,
    shareDialogTitle: `Share ${duration}s animation`,
  };
}

export function animatedExportLabel(durationSeconds: number): string {
  return `${validateAnimatedExportDuration(durationSeconds)} sec GIF`;
}

export function formatAnimatedExportProgress(capturedFrames: number, plan: Pick<AnimatedExportPlan, "frameCount">): string {
  const complete = Math.max(0, Math.min(plan.frameCount, Math.floor(capturedFrames)));
  return `Capturing frame ${complete} of ${plan.frameCount}`;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const hasSecond = index + 1 < bytes.length;
    const hasThird = index + 2 < bytes.length;
    const chunk = (first << 16) | ((second ?? 0) << 8) | (third ?? 0);

    output += alphabet[(chunk >> 18) & 63];
    output += alphabet[(chunk >> 12) & 63];
    output += hasSecond ? alphabet[(chunk >> 6) & 63] : "=";
    output += hasThird ? alphabet[chunk & 63] : "=";
  }

  return output;
}
