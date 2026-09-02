import type { Metadata } from "next";
import { cache } from "react";
import { AppHeader } from "@/components/AppHeader/AppHeader";
import { getFilterByShareSlug } from "@/lib/filters";
import { getProject } from "@/lib/projects";
import { ShareCameraClient } from "./ShareCameraClient";
import styles from "./page.module.css";

const loadFilter = cache(async (slug: string) => {
  return getFilterByShareSlug(slug);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const filter = await loadFilter(slug);
  if (!filter) {
    return {
      title: "gemcam — shared filter",
      description: "AI camera filter",
    };
  }
  const title = `${filter.name} — gemcam`;
  const description = `${filter.name} で写真を生成する AI カメラフィルター`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: filter.thumbnailUrl ? [{ url: filter.thumbnailUrl }] : undefined,
    },
    twitter: {
      card: filter.thumbnailUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: filter.thumbnailUrl ? [filter.thumbnailUrl] : undefined,
    },
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const filter = await loadFilter(slug);

  if (!filter) {
    return (
      <main className={styles.app}>
        <AppHeader />
        <div className={styles.missing}>
          <p>このシェアリンクは無効か、もう利用できません。</p>
        </div>
      </main>
    );
  }

  // Project theme (colors / logo). Missing project just means default look.
  const project = filter.projectId
    ? await getProject(filter.projectId).catch(() => null)
    : null;

  return (
    <ShareCameraClient
      slug={slug}
      filter={{
        shareSlug: filter.shareSlug,
        name: filter.name,
        thumbnailUrl: filter.thumbnailUrl ?? null,
      }}
      theme={{
        primaryColor: project?.primaryColor ?? null,
        accentColor: project?.accentColor ?? null,
        logoUrl: project?.logoUrl ?? null,
      }}
    />
  );
}
