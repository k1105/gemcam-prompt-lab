import { NextRequest, NextResponse } from "next/server";
import { dataUrlToBuffer, ASPECT_RATIOS, type AspectRatio } from "@/lib/camera";
import { getFilter } from "@/lib/filters";
import { generateImage } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      imageDataUrl?: string;
      filterId?: string;
      aspectRatio?: AspectRatio;
    };

    if (!body.imageDataUrl || !body.filterId || !body.aspectRatio) {
      return NextResponse.json(
        { ok: false, error: "imageDataUrl, filterId, aspectRatio are required" },
        { status: 400 },
      );
    }
    if (!ASPECT_RATIOS.includes(body.aspectRatio)) {
      return NextResponse.json(
        { ok: false, error: "invalid aspectRatio" },
        { status: 400 },
      );
    }

    const filter = await getFilter(body.filterId);
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
