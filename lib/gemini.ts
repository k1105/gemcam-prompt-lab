import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AspectRatio } from "./camera";
import { fetchAsInlineData } from "./storage";
import type { PromptFilter } from "./types";

const GEMINI_TIMEOUT_MS = 100_000;
const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";

export async function generateImage(params: {
  imageBuffer: Buffer;
  mimeType: string;
  filter: PromptFilter;
  aspectRatio: AspectRatio;
}): Promise<{ buffer: Buffer; mimeType: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    {
      model: process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
      generationConfig: {
        // @ts-expect-error responseModalities is supported but not yet in types
        responseModalities: ["IMAGE"],
        imageConfig: {
          aspectRatio: params.aspectRatio,
        },
      },
    },
    { timeout: GEMINI_TIMEOUT_MS },
  );

  const parts: Array<
    string | { inlineData: { data: string; mimeType: string } }
  > = [
    params.filter.prompt,
    {
      inlineData: {
        data: params.imageBuffer.toString("base64"),
        mimeType: params.mimeType,
      },
    },
  ];

  for (const ref of params.filter.referenceImages) {
    const { data, mimeType } = await fetchAsInlineData(ref.url);
    parts.push({ inlineData: { data, mimeType } });
  }

  const result = await model.generateContent(parts);
  const candidates = result.response.candidates?.[0]?.content?.parts ?? [];
  for (const part of candidates) {
    if (part.inlineData) {
      return {
        buffer: Buffer.from(part.inlineData.data!, "base64"),
        mimeType: part.inlineData.mimeType ?? "image/png",
      };
    }
  }
  throw new Error("Gemini did not return an image");
}

export async function describeImageStyle(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const textModelName = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash";
  const model = genAI.getGenerativeModel(
    { model: textModelName },
    { timeout: GEMINI_TIMEOUT_MS },
  );

  const describePrompt = "Analyze the visual style, color palette, lighting, textures, background, and overall atmosphere of this image. Do not focus on the specific identity or facial features of the person, but rather the artistic rendering style, the tone, and any distinctive thematic elements (like clothing style or background props).";
  const describeResult = await model.generateContent([
    describePrompt,
    {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: mimeType,
      },
    },
  ]);
  const description = describeResult.response.text();
  if (!description) throw new Error("Failed to generate description");

  return description;
}

export async function formatPromptFromDescription(
  description: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const genAI = new GoogleGenerativeAI(apiKey);
  const textModelName = process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash";
  const model = genAI.getGenerativeModel(
    { model: textModelName },
    { timeout: GEMINI_TIMEOUT_MS },
  );

  const formatPrompt = `
You are an expert AI image generation prompt engineer.
Your task is to take a description of an artistic style/tone extracted from a reference image, and write a prompt that applies this exact style to a NEW photo of a user.

CRITICAL RULES:
1. The prompt is a "filter". It should instruct the AI to keep the user's original pose, identity, and features from the input photo, but render them in the extracted style.
2. The style, rendering type (e.g., flat 2D illustration, 3DCG, plushie, watercolor), color palette, and textures MUST be purely based on the style analysis provided. Do NOT default to 3DCG or plastic unless the analysis says so! If the analysis says it's a flat illustration, tell the AI to render a flat illustration.

Below are examples of how a good prompt is STRUCTURED. You should mimic the detail, clarity, and the "Important Instructions" format of these examples, but REPLACE the actual style rules (like 3DCG, plastic, gyaru makeup) with the ones from the style analysis!

[Example 1 (Structure only)]
Based on everyone in this photo, Product photos for Designers Toy merchandise featuring stylized cartoon 3DCG characters stylized with “gyaru makeup” (false eyelashes and brightly colored hair: vibrant color gradients or multi-tonal **Strictly preserve the original hairstyle from the photo.**). The color scheme is “Commercial Pop.” The saturation is extremely high, with colors close to primary hues. Poses should be kept, and the images must be full-body shot. 【Important Instructions】- Avoid flat, two-dimensional rendering; ensure a consistent 3DCG-style appearance. - The background should be a low-angle view looking up from the stands toward the sky and the entire stadium. The color should be a deep blue darker than the uniforms, with glitter mixed in. All textures should be plastic-like. The background should be blurred. Do not include any text in the background. - Confetti is floating throughout the entire frame. - Retain the subject’s facial features and gender. Do not alter body type, skin tone. - All textures should be seamless plastic-like with simplified geometry and no visible wrinkles or fabric creases. The characters should have smooth, unblemished surfaces to emphasize the designer toy aesthetic.

[Example 2 (Structure only)]
この写真に写っている人たち全員をモチーフにした、3DCG製のポップでコミカルなキャラクターにデフォルメされたDesigners Toyの商材写真を制作して。配色はCommercial Pop。彩度が極めて高く、原色に近い構成をしている。ポーズを誇張して、頭からつま先まで全身が入った画像にすること。

重要な指示:
- 平面的な表現を避け、3DCG風の表現を徹底すること。
- 背景は完全に均一な白色で塗りつぶしてください
- 被写体と背景の境界は明確にしてください
- 背景にグラデーションや影を入れないでください
- 人物の特徴は保持し、体格・肌の色を極端に誇張するような表現を避けること。

---

Here is the style analysis of the reference image:
"${description}"

Now, based on the style analysis above, generate a new image generation prompt. 
- Instruct the AI to transform "the person in this photo" (the user) into this style.
- Incorporate the specific rendering style (flat, 3D, plushie, etc.), color palette, textures, and background elements extracted from the analysis.
- Include an "Important Instructions" section outlining what NOT to do based on the style (e.g., if it's flat 2D, instruct to avoid 3D lighting. If it's 3D, instruct to avoid flat rendering).
- NEVER describe the specific identity, face, or specific outfit of the person from the reference image, unless it's a stylistic uniform you want everyone to wear.
- Output ONLY the generated prompt text, without any additional conversational text.
`;

  const formatResult = await model.generateContent(formatPrompt);
  const finalPrompt = formatResult.response.text();
  if (!finalPrompt) throw new Error("Failed to format prompt");

  return finalPrompt;
}
