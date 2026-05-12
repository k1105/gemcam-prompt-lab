import { NextRequest, NextResponse } from "next/server";
import { createFilter, listFilters } from "@/lib/filters";
import { uploadReferenceImage } from "@/lib/storage";
import { seedIfEmpty } from "@/lib/seed";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  try {
    await seedIfEmpty();
    const filters = await listFilters();
    return NextResponse.json({ filters });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const prompt = String(form.get("prompt") ?? "").trim();
    const createdBy = String(form.get("createdBy") ?? "").trim() || undefined;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 },
      );
    }

    const files = form.getAll("references").filter((v): v is File => v instanceof File);
    const refs = [];
    for (const file of files) {
      if (!file.size) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || "image/jpeg";
      const uploaded = await uploadReferenceImage(
        buffer,
        mimeType,
        file.name.replace(/\.[^.]+$/, "") || "reference",
      );
      refs.push(uploaded);
    }

    const filter = await createFilter({
      name,
      prompt,
      referenceImages: refs,
      createdBy,
    });
    return NextResponse.json({ filter }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
