import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserOrResponse } from "@/lib/auth-server";
import { describeImageStyle } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  try {
    const form = await req.formData();
    const imageFile = form.get("image");

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: "Image file is required" },
        { status: 400 },
      );
    }

    if (!imageFile.size) {
      return NextResponse.json(
        { error: "Image file is empty" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const mimeType = imageFile.type || "image/jpeg";

    const description = await describeImageStyle(buffer, mimeType);

    return NextResponse.json({ description }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
