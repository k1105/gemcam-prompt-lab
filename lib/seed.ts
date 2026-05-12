import { readFile } from "fs/promises";
import path from "path";
import { uploadReferenceImage } from "./storage";
import { createFilter, listFilters } from "./filters";

type SeedEntry = {
  name: string;
  prompt: string;
  references: { file: string; mimeType: string }[];
};

const SEEDS: SeedEntry[] = [
  {
    name: "BayGal",
    prompt: `この写真に写っている人たち全員をモチーフにした、つけまつげや髪の毛を染めていた、ギャルメイクをした3DCG製のポップでコミカルなキャラクターにデフォルメされたDesigners Toyの商材写真を制作して。配色はCommercial Pop。彩度が極めて高く、原色に近い構成をしている。ポーズを誇張して、頭からつま先まで全身が入った画像にすること。ただし、2枚目の写真のユニフォームを着せてください。
重要な指示:

- 平面的な表現を避け、3DCG風の表現を徹底すること。
- 背景は完全に均一な白色で塗りつぶしてください
- 被写体と背景の境界は明確にしてください
- 背景にグラデーションや影を入れないでください
- 人物の特徴は保持し、体格・肌の色を極端に誇張するような表現を避けること。
- 背景に写り込んでしまっている人物は除外すること。`,
    references: [{ file: "baygal-costume.jpg", mimeType: "image/jpeg" }],
  },
  {
    name: "Band Toy",
    prompt: `リファレンス画像のように、写真に写っている人物をモチーフにした、3DCGのモデルに対してトゥーンシェーダーを適用したような、ポップでコミカルなキャラクターへとデフォルメされたDesigners Toyのバンドメンバーキャラクターを制作して。写真の人物はロックバンドのメンバーで、なんらかの楽器を持っている。配色はリファレンス画像に準拠し、黄色、オレンジ、赤、白、黒とハーフトーンの効果を使用する。

重要な指示:
- 背景は完全に均一な白色で塗りつぶしてください
- 被写体と背景の境界は明確にしてください
- 背景にグラデーションや影を入れないでください
- ベース、ギター、ドラム、キーボードといった楽器の筐体の色は、全て赤の単色にしてください
- 画面内に存在しない人物を描かないでください`,
    references: [{ file: "band-reference.jpeg", mimeType: "image/jpeg" }],
  },
];

// Seeds initial filters when the database is completely empty.
// Idempotent: re-running with existing filters is a no-op.
export async function seedIfEmpty(): Promise<void> {
  const existing = await listFilters();
  if (existing.length > 0) return;

  for (const entry of SEEDS) {
    const refs = [];
    for (const ref of entry.references) {
      const filePath = path.join(process.cwd(), "public/seeds", ref.file);
      const buffer = await readFile(filePath);
      const uploaded = await uploadReferenceImage(
        buffer,
        ref.mimeType,
        ref.file.replace(/\.[^.]+$/, ""),
      );
      refs.push(uploaded);
    }
    await createFilter({
      name: entry.name,
      prompt: entry.prompt,
      referenceImages: refs,
      createdBy: "seed",
    });
  }
}
