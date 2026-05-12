import type { AspectRatio } from "./camera";

export type ReferenceImage = {
  url: string;
  mimeType: string;
};

export type PromptFilter = {
  id: string;
  name: string;
  prompt: string;
  referenceImages: ReferenceImage[];
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
