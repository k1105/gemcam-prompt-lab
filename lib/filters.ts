import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { FILTERS_COLLECTION, getDb } from "./firebase";
import type { PromptFilter, ReferenceImage } from "./types";

type DocData = {
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
    name: data.name,
    prompt: data.prompt,
    referenceImages: data.referenceImages ?? [],
    thumbnailUrl: data.thumbnailUrl ?? undefined,
    createdBy: data.createdBy ?? undefined,
    createdAt: data.createdAt.toMillis(),
    updatedAt: data.updatedAt.toMillis(),
  };
}

export async function listFilters(): Promise<PromptFilter[]> {
  const db = getDb();
  const snap = await db
    .collection(FILTERS_COLLECTION)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => docToFilter(d.id, d.data() as DocData));
}

export async function getFilter(id: string): Promise<PromptFilter | null> {
  const db = getDb();
  const snap = await db.collection(FILTERS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return docToFilter(snap.id, snap.data() as DocData);
}

export async function createFilter(input: {
  name: string;
  prompt: string;
  referenceImages: ReferenceImage[];
  createdBy?: string;
}): Promise<PromptFilter> {
  const db = getDb();
  const ref = await db.collection(FILTERS_COLLECTION).add({
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
  }>
): Promise<PromptFilter | null> {
  const db = getDb();
  const ref = db.collection(FILTERS_COLLECTION).doc(id);

  const updates: Record<string, any> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (input.name !== undefined) updates.name = input.name;
  if (input.prompt !== undefined) updates.prompt = input.prompt;
  if (input.referenceImages !== undefined) updates.referenceImages = input.referenceImages;
  if (input.thumbnailUrl !== undefined) updates.thumbnailUrl = input.thumbnailUrl;
  if (input.createdBy !== undefined) updates.createdBy = input.createdBy;

  await ref.update(updates);
  return getFilter(id);
}
