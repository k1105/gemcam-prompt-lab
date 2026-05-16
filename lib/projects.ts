import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { PROJECTS_COLLECTION, getDb } from "./firebase";
import type { Project } from "./types";

type DocData = {
  name: string;
  createdBy?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

function docToProject(id: string, data: DocData): Project {
  return {
    id,
    name: data.name,
    createdBy: data.createdBy ?? undefined,
    createdAt: data.createdAt.toMillis(),
    updatedAt: data.updatedAt.toMillis(),
  };
}

export async function listProjects(): Promise<Project[]> {
  const db = getDb();
  const snap = await db
    .collection(PROJECTS_COLLECTION)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map((d) => docToProject(d.id, d.data() as DocData));
}

export async function getProject(id: string): Promise<Project | null> {
  const db = getDb();
  const snap = await db.collection(PROJECTS_COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return docToProject(snap.id, snap.data() as DocData);
}

export async function createProject(input: {
  name: string;
  createdBy?: string;
}): Promise<Project> {
  const db = getDb();
  const ref = await db.collection(PROJECTS_COLLECTION).add({
    name: input.name,
    createdBy: input.createdBy ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const snap = await ref.get();
  return docToProject(snap.id, snap.data() as DocData);
}

export async function updateProject(
  id: string,
  input: Partial<{ name: string; createdBy: string | null }>,
): Promise<Project | null> {
  const db = getDb();
  const ref = db.collection(PROJECTS_COLLECTION).doc(id);
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (input.name !== undefined) updates.name = input.name;
  if (input.createdBy !== undefined) updates.createdBy = input.createdBy;
  await ref.update(updates);
  return getProject(id);
}

export async function deleteProject(id: string): Promise<void> {
  const db = getDb();
  await db.collection(PROJECTS_COLLECTION).doc(id).delete();
}
