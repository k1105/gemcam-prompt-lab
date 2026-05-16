import { NextResponse } from "next/server";
import { getAuthedUserOrResponse } from "@/lib/auth-server";
import { dataUrlToBuffer } from "@/lib/camera";
import { getFilter, updateFilter } from "@/lib/filters";
import { uploadReferenceImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  try {
    const { id } = await ctx.params;
    const filter = await getFilter(id);
    if (!filter) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const body = (await req.json()) as { imageDataUrl?: string };
    if (!body.imageDataUrl) {
      return NextResponse.json(
        { error: "imageDataUrl is required" },
        { status: 400 },
      );
    }

    const { buffer, mimeType } = dataUrlToBuffer(body.imageDataUrl);
    const uploaded = await uploadReferenceImage(buffer, mimeType, "thumbnail");

    const updated = await updateFilter(id, { thumbnailUrl: uploaded.url });
    return NextResponse.json({ filter: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
