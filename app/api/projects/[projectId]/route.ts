import { NextResponse } from "next/server";
import { getAuthedUserOrResponse } from "@/lib/auth-server";
import {
  deleteProject,
  getProject,
  updateProject,
} from "@/lib/projects";
import { isSupportedLogoMimeType, uploadLogoImage } from "@/lib/storage";
import { normalizeHexColor } from "@/lib/theme";

export const runtime = "nodejs";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

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

// Parses a color field: undefined = untouched, "" = clear, "#rrggbb" = set.
function parseColorField(
  form: FormData,
  key: string,
): string | null | undefined | { error: string } {
  if (!form.has(key)) return undefined;
  const raw = String(form.get(key) ?? "").trim();
  if (!raw) return null;
  const normalized = normalizeHexColor(raw);
  if (!normalized) return { error: `${key} must be a #rrggbb hex color` };
  return normalized;
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ projectId: string }> },
) {
  const auth = await getAuthedUserOrResponse();
  if (auth.response) return auth.response;
  try {
    const { projectId } = await ctx.params;
    const existing = await getProject(projectId);
    if (!existing) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    let form: FormData;
    if (contentType.includes("multipart/form-data")) {
      form = await req.formData();
    } else {
      // Backwards-compatible JSON body ({ name }).
      const body = (await req.json()) as { name?: string };
      form = new FormData();
      if (body.name !== undefined) form.set("name", body.name);
    }

    const updates: Parameters<typeof updateProject>[1] = {};

    if (form.has("name")) {
      const name = String(form.get("name") ?? "").trim();
      if (!name) {
        return NextResponse.json({ error: "name is required" }, { status: 400 });
      }
      updates.name = name;
    }

    for (const key of ["primaryColor", "accentColor"] as const) {
      const parsed = parseColorField(form, key);
      if (parsed !== undefined && parsed !== null && typeof parsed === "object") {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      if (parsed !== undefined) updates[key] = parsed;
    }

    const logo = form.get("logo");
    if (logo instanceof File && logo.size > 0) {
      if (!isSupportedLogoMimeType(logo.type)) {
        return NextResponse.json(
          { error: "logo must be PNG, JPEG, WebP, GIF or SVG" },
          { status: 400 },
        );
      }
      if (logo.size > MAX_LOGO_BYTES) {
        return NextResponse.json(
          { error: "logo must be 2MB or smaller" },
          { status: 400 },
        );
      }
      const buffer = Buffer.from(await logo.arrayBuffer());
      const uploaded = await uploadLogoImage(
        buffer,
        logo.type,
        logo.name.replace(/\.[^.]+$/, "") || "logo",
      );
      updates.logoUrl = uploaded.url;
    } else if (String(form.get("removeLogo") ?? "") === "1") {
      updates.logoUrl = null;
    }

    const updated = await updateProject(projectId, updates);
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
