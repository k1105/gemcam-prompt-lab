import { getBucket } from "./firebase";

// Uses the same "download token" URL pattern that Firebase clients use by default.
// Works regardless of bucket-level access settings (no makePublic, no signed URLs).
function buildDownloadUrl(bucketName: string, path: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(
    path,
  )}?alt=media&token=${token}`;
}

export async function uploadReferenceImage(
  buffer: Buffer,
  mimeType: string,
  filename = "reference",
): Promise<{ url: string; mimeType: string }> {
  const bucket = getBucket();
  const ext = mimeType.split("/")[1] ?? "jpg";
  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40);
  const path = `references/${crypto.randomUUID()}-${safeName}.${ext}`;
  const token = crypto.randomUUID();

  const file = bucket.file(path);
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: mimeType,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  return { url: buildDownloadUrl(bucket.name, path, token), mimeType };
}

export async function uploadFrameImage(
  buffer: Buffer,
  mimeType: string,
  filename = "frame",
): Promise<{ url: string; mimeType: string }> {
  const bucket = getBucket();
  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40);
  const path = `frames/${crypto.randomUUID()}-${safeName}.png`;
  const token = crypto.randomUUID();

  const file = bucket.file(path);
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: mimeType,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  return { url: buildDownloadUrl(bucket.name, path, token), mimeType };
}

const LOGO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/gif": "gif",
};

export function isSupportedLogoMimeType(mimeType: string): boolean {
  return mimeType in LOGO_EXT;
}

export async function uploadLogoImage(
  buffer: Buffer,
  mimeType: string,
  filename = "logo",
): Promise<{ url: string; mimeType: string }> {
  const bucket = getBucket();
  const ext = LOGO_EXT[mimeType] ?? "png";
  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40);
  const path = `logos/${crypto.randomUUID()}-${safeName}.${ext}`;
  const token = crypto.randomUUID();

  const file = bucket.file(path);
  await file.save(buffer, {
    resumable: false,
    metadata: {
      contentType: mimeType,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  return { url: buildDownloadUrl(bucket.name, path, token), mimeType };
}

export async function fetchAsInlineData(
  url: string,
): Promise<{ data: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch reference: ${res.status}`);
  const mimeType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = Buffer.from(await res.arrayBuffer());
  return { data: buffer.toString("base64"), mimeType };
}
