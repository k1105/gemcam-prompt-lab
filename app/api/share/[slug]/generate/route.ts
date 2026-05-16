import { NextRequest, NextResponse } from "next/server";
import { ASPECT_RATIOS, dataUrlToBuffer, type AspectRatio } from "@/lib/camera";
import { getFilterByShareSlug } from "@/lib/filters";
import { generateImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

// Public endpoint — generation through a share link. Auth-free by design;
// looked up only by shareSlug so callers cannot pick arbitrary filters.
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    const body = (await req.json()) as {
      imageDataUrl?: string;
      aspectRatio?: AspectRatio;
    };

    if (!body.imageDataUrl || !body.aspectRatio) {
      return NextResponse.json(
        { ok: false, error: "imageDataUrl, aspectRatio are required" },
        { status: 400 },
      );
    }
    if (!ASPECT_RATIOS.includes(body.aspectRatio)) {
      return NextResponse.json(
        { ok: false, error: "invalid aspectRatio" },
        { status: 400 },
      );
    }

    const filter = await getFilterByShareSlug(slug);
    if (!filter) {
      return NextResponse.json(
        { ok: false, error: "filter not found" },
        { status: 404 },
      );
    }

    const { buffer, mimeType } = dataUrlToBuffer(body.imageDataUrl);
    const result = await generateImage({
      imageBuffer: buffer,
      mimeType,
      filter,
      aspectRatio: body.aspectRatio,
    });

    const dataUrl = `data:${result.mimeType};base64,${result.buffer.toString("base64")}`;
    return NextResponse.json({ ok: true, imageDataUrl: dataUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
