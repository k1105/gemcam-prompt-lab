import sharp from "sharp";
import { ASPECT_RATIOS, type AspectRatio } from "./camera";
import { uploadFrameImage } from "./storage";
import type { FrameImage, PromptFilter } from "./types";

// Parses paired "frames" / "frameAspectRatios" form entries, uploads each PNG,
// and returns FrameImage records (last upload wins per aspect ratio).
export async function uploadFramesFromForm(
  form: FormData,
): Promise<FrameImage[]> {
  const files = form
    .getAll("frames")
    .filter((v): v is File => v instanceof File);
  const ratios = form.getAll("frameAspectRatios").map(String);
  if (files.length !== ratios.length) {
    throw new Error("frames and frameAspectRatios must be paired");
  }

  const frames = new Map<AspectRatio, FrameImage>();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ratio = ratios[i] as AspectRatio;
    if (!file.size) continue;
    if (!ASPECT_RATIOS.includes(ratio)) {
      throw new Error(`invalid frame aspect ratio: ${ratio}`);
    }
    if (file.type !== "image/png") {
      throw new Error("frame images must be transparent PNG files");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFrameImage(
      buffer,
      "image/png",
      file.name.replace(/\.[^.]+$/, "") || "frame",
    );
    frames.set(ratio, { aspectRatio: ratio, ...uploaded });
  }
  return [...frames.values()];
}

// Composites the filter's frame PNG over the generated image, but only when a
// frame is registered for the selected aspect ratio. Returns the input
// untouched otherwise.
export async function applyFrameIfConfigured(params: {
  buffer: Buffer;
  mimeType: string;
  filter: PromptFilter;
  aspectRatio: AspectRatio;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const frame = params.filter.frameImages?.find(
    (f) => f.aspectRatio === params.aspectRatio,
  );
  if (!frame) return { buffer: params.buffer, mimeType: params.mimeType };

  const res = await fetch(frame.url);
  if (!res.ok) throw new Error(`Failed to fetch frame image: ${res.status}`);
  const frameBuffer = Buffer.from(await res.arrayBuffer());

  const base = sharp(params.buffer);
  const { width, height } = await base.metadata();
  if (!width || !height) {
    throw new Error("Could not read generated image dimensions");
  }

  // The frame shares the slot's aspect ratio but not necessarily its pixel
  // size; stretch it to cover the generated image exactly.
  const overlay = await sharp(frameBuffer)
    .resize(width, height, { fit: "fill" })
    .png()
    .toBuffer();

  const composited = await base
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer();

  return { buffer: composited, mimeType: "image/png" };
}
