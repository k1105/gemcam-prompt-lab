import { NextResponse } from "next/server";
import { getAuthedUserOrResponse } from "@/lib/auth-server";
import {
  deleteProject,
  getProject,
  updateProject,
} from "@/lib/projects";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  const { projectId } = await ctx.params;
  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ project });
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  try {
    const { projectId } = await ctx.params;
    const body = (await req.json()) as { name?: string };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const updated = await updateProject(projectId, { name });
    if (!updated) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ project: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  const { projectId } = await ctx.params;
  await deleteProject(projectId);
  return NextResponse.json({ ok: true });
}
