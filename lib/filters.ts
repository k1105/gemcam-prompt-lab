import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { FILTERS_COLLECTION, getDb } from "./firebase";
import { generateShareSlug } from "./slug";
import type { PromptFilter, ReferenceImage } from "./types";

type DocData = {
  projectId?: string;
  shareSlug?: string;
  name: string;
  prompt: string;
  referenceImages: ReferenceImage[];
  thumbnailUrl?: string | null;
  createdBy?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

function docToFilter(id: string, data: DocData): PromptFilter {
  return {
    id,
    projectId: data.projectId ?? "",
    shareSlug: data.shareSlug ?? "",
    name: data.name,
    prompt: data.prompt,
    referenceImages: data.referenceImages ?? [],
    thumbnailUrl: data.thumbnailUrl ?? undefined,
    createdBy: data.createdBy ?? undefined,
    createdAt: data.createdAt.toMillis(),
    updatedAt: data.updatedAt.toMillis(),
  };
}

export async function listFilters(projectId?: string): Promise<PromptFilter[]> {
  const db = getDb();
  if (projectId) {
    // Sort in memory to avoid requiring a composite (projectId+createdAt) index.
    const snap = await db
      .collection(FILTERS_COLLECTION)
      .where("projectId", "==", projectId)
      .get();
    return snap.docs
      .map((d) => docToFilter(d.id, d.data() as DocData))
      .sort((a, b) => a.createdAt - b.createdAt);
  }
  const snap = await db
    .collection(FILTERS_COLLECTION)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => docToFilter(d.id, d.data() as DocData));
}

export async function listAllFilters(): Promise<PromptFilter[]> {
  const db = getDb();
  const snap = await db.collection(FILTERS_COLLECTION).get();
  return snap.docs.map((d) => docToFilter(d.id, d.data() as DocData));
}

export async function getFilter(id: string): Promise<PromptFilter | null> {
  const db = getDb();
  const snap = await db.collection(FILTERS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return docToFilter(snap.id, snap.data() as DocData);
}

export async function createFilter(input: {
  projectId: string;
  name: string;
  prompt: string;
  referenceImages: ReferenceImage[];
  createdBy?: string;
}): Promise<PromptFilter> {
  const db = getDb();
  const ref = await db.collection(FILTERS_COLLECTION).add({
    projectId: input.projectId,
    shareSlug: generateShareSlug(),
    name: input.name,
    prompt: input.prompt,
    referenceImages: input.referenceImages,
    createdBy: input.createdBy ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const snap = await ref.get();
  return docToFilter(snap.id, snap.data() as DocData);
}

export async function getFilterByShareSlug(
  slug: string,
): Promise<PromptFilter | null> {
  const db = getDb();
  const snap = await db
    .collection(FILTERS_COLLECTION)
    .where("shareSlug", "==", slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return docToFilter(doc.id, doc.data() as DocData);
}

export async function backfillShareSlugs(): Promise<number> {
  const db = getDb();
  const snap = await db.collection(FILTERS_COLLECTION).get();
  const missing = snap.docs.filter((d) => {
    const data = d.data() as DocData;
    return !data.shareSlug;
  });
  if (missing.length === 0) return 0;
  const batch = db.batch();
  for (const doc of missing) {
    batch.update(doc.ref, {
      shareSlug: generateShareSlug(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  return missing.length;
}

export async function deleteFilter(id: string): Promise<void> {
  const db = getDb();
  await db.collection(FILTERS_COLLECTION).doc(id).delete();
}

export async function updateFilter(
  id: string,
  input: Partial<{
    name: string;
    prompt: string;
    referenceImages: ReferenceImage[];
    thumbnailUrl: string | null;
    createdBy: string | null;
  }>,
): Promise<PromptFilter | null> {
  const db = getDb();
  const ref = db.collection(FILTERS_COLLECTION).doc(id);

  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.prompt !== undefined) updates.prompt = input.prompt;
  if (input.referenceImages !== undefined)
    updates.referenceImages = input.referenceImages;
  if (input.thumbnailUrl !== undefined) updates.thumbnailUrl = input.thumbnailUrl;
  if (input.createdBy !== undefined) updates.createdBy = input.createdBy;

  await ref.update(updates);
  return getFilter(id);
}

export async function backfillFiltersToProject(
  projectId: string,
): Promise<number> {
  const db = getDb();
  const snap = await db.collection(FILTERS_COLLECTION).get();
  const orphans = snap.docs.filter((d) => {
    const data = d.data() as DocData;
    return !data.projectId;
  });
  if (orphans.length === 0) return 0;
  const batch = db.batch();
  for (const doc of orphans) {
    batch.update(doc.ref, {
      projectId,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  return orphans.length;
}
