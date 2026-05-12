import { NextResponse } from "next/server";
import { deleteFilter, getFilter, updateFilter } from "@/lib/filters";
import { uploadReferenceImage } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const filter = await getFilter(id);
  if (!filter) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ filter });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const filter = await getFilter(id);
    if (!filter) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const form = await req.formData();
    const name = form.has("name") ? String(form.get("name") ?? "").trim() : undefined;
    const prompt = form.has("prompt") ? String(form.get("prompt") ?? "").trim() : undefined;
    const createdBy = form.has("createdBy") ? String(form.get("createdBy") ?? "").trim() || null : undefined;

    // existing references to keep (URLs)
    const existingUrls = form.getAll("existingReferenceUrls").map(String);
    const keptReferences = filter.referenceImages.filter(ref => existingUrls.includes(ref.url));

    // new references to upload
    const files = form.getAll("references").filter((v): v is File => v instanceof File);
    const newRefs = [];
    for (const file of files) {
      if (!file.size) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || "image/jpeg";
      const uploaded = await uploadReferenceImage(
        buffer,
        mimeType,
        file.name.replace(/\.[^.]+$/, "") || "reference",
      );
      newRefs.push(uploaded);
    }

    const updatedFilter = await updateFilter(id, {
      ...(name !== undefined && { name }),
      ...(prompt !== undefined && { prompt }),
      ...(createdBy !== undefined && { createdBy }),
      referenceImages: [...keptReferences, ...newRefs],
    });

    return NextResponse.json({ filter: updatedFilter });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await deleteFilter(id);
  return NextResponse.json({ ok: true });
}
