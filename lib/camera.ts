export type FacingMode = "user" | "environment";

export type AspectRatio = "9:16" | "1:1" | "4:3" | "16:9";

export const ASPECT_RATIOS: AspectRatio[] = ["9:16", "1:1", "4:3", "16:9"];

export function aspectRatioToNumber(ratio: AspectRatio): number {
  const [w, h] = ratio.split(":").map(Number);
  return w / h;
}

export async function startCamera(
  video: HTMLVideoElement,
  deviceId?: string | null,
  facingMode: FacingMode = "environment",
): Promise<MediaStream> {
  const videoConstraints: MediaTrackConstraints = deviceId
    ? { deviceId: { exact: deviceId } }
    : { facingMode };

  const stream = await navigator.mediaDevices.getUserMedia({
    video: videoConstraints,
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopCamera(
  stream: MediaStream,
  video?: HTMLVideoElement | null,
): void {
  stream.getTracks().forEach((track) => track.stop());
  if (video) {
    video.srcObject = null;
  }
}

// Captures a frame from the video, center-cropped to the requested aspect ratio.
export function captureFrame(
  video: HTMLVideoElement,
  aspectRatio: AspectRatio,
): string {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const targetRatio = aspectRatioToNumber(aspectRatio);
  const sourceRatio = vw / vh;

  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;

  if (sourceRatio > targetRatio) {
    // source is wider — crop width
    sw = vh * targetRatio;
    sx = (vw - sw) / 2;
  } else {
    // source is taller — crop height
    sh = vw / targetRatio;
    sy = (vh - sh) / 2;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw);
  canvas.height = Math.round(sh);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function readFileAsResizedDataUrl(
  file: File,
  maxDim = 1600,
  quality = 0.9,
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function dataUrlToBuffer(dataUrl: string): {
  buffer: Buffer;
  mimeType: string;
} {
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}
