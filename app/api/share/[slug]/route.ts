import { NextResponse } from "next/server";
import { getFilterByShareSlug } from "@/lib/filters";

export const runtime = "nodejs";

// Public endpoint — used by /s/[slug] page. Returns a minimal projection of the
// filter (no createdBy, no internal IDs beyond what's needed to render & call
// generate-share).
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const filter = await getFilterByShareSlug(slug);
  if (!filter) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    filter: {
      shareSlug: filter.shareSlug,
      name: filter.name,
      thumbnailUrl: filter.thumbnailUrl ?? null,
    },
  });
}
