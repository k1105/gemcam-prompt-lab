import { NextRequest, NextResponse } from "next/server";
import { getAuthedUserOrResponse } from "@/lib/auth-server";
import { createProject, listProjects } from "@/lib/projects";
import { ensureDefaultProject } from "@/lib/seed";

export const runtime = "nodejs";

export async function GET() {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  try {
    await ensureDefaultProject();
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  try {
    const body = (await req.json()) as { name?: string; createdBy?: string };
    const name = (body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const project = await createProject({
      name,
      createdBy: body.createdBy?.trim() || auth.user.email,
    });
    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
