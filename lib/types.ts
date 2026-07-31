import type { AspectRatio } from "./camera";

export type ReferenceImage = {
  url: string;
  mimeType: string;
};

// PNG overlay composited onto generated images. One frame per aspect ratio;
// applied only when the matching aspect ratio is selected at generation time.
export type FrameImage = {
  aspectRatio: AspectRatio;
  url: string;
  mimeType: string;
};

export type Project = {
  id: string;
  name: string;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
};

export type PromptFilter = {
  id: string;
  projectId: string;
  shareSlug: string;
  name: string;
  prompt: string;
  referenceImages: ReferenceImage[];
  frameImages: FrameImage[];
  thumbnailUrl?: string;
  createdBy?: string;
  createdAt: number;
  updatedAt: number;
};

export type GenerateRequest = {
  imageDataUrl: string;
  filterId: string;
  aspectRatio: AspectRatio;
};

export type GenerateResponse =
  | { ok: true; imageDataUrl: string }
  | { ok: false; error: string };
