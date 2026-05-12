import { NextRequest, NextResponse } from "next/server";
import { formatPromptFromDescription } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description string is required" },
        { status: 400 },
      );
    }

    const prompt = await formatPromptFromDescription(description);

    return NextResponse.json({ prompt }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
