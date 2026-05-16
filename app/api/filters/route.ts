import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserOrResponse } from "@/lib/auth-server";
import { createFilter, listFilters } from "@/lib/filters";
import { uploadReferenceImage } from "@/lib/storage";
import { ensureDefaultProject, seedIfEmpty } from "@/lib/seed";
import { getProject } from "@/lib/projects";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  try {
    await seedIfEmpty();
    const projectId = req.nextUrl.searchParams.get("projectId") ?? undefined;
    const filters = await listFilters(projectId);
    return NextResponse.json({ filters });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  try {
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const prompt = String(form.get("prompt") ?? "").trim();
    const createdBy = String(form.get("createdBy") ?? "").trim() || undefined;
    let projectId = String(form.get("projectId") ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 },
      );
    }
    if (!projectId) {
      // Fallback for legacy clients: attach to default project.
      projectId = await ensureDefaultProject();
    } else {
      const project = await getProject(projectId);
      if (!project) {
        return NextResponse.json(
          { error: "project not found" },
          { status: 404 },
        );
      }
    }

    const files = form
      .getAll("references")
      .filter((v): v is File => v instanceof File);
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
      projectId,
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
