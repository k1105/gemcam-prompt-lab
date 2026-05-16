import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import type { Bucket } from "@google-cloud/storage";

export function getAdminApp(): App {
  if (getApps().length) return getApp();
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
    FIREBASE_STORAGE_BUCKET,
  } = process.env;
  if (
    !FIREBASE_PROJECT_ID ||
    !FIREBASE_CLIENT_EMAIL ||
    !FIREBASE_PRIVATE_KEY ||
    !FIREBASE_STORAGE_BUCKET
  ) {
    throw new Error(
      "Firebase env vars (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_STORAGE_BUCKET) must be set",
    );
  }
  return initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Vercel stores envs as flat strings; literal "\n" must become real newlines.
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
    storageBucket: FIREBASE_STORAGE_BUCKET,
  });
}

export function getDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getBucket(): Bucket {
  return getStorage(getAdminApp()).bucket();
}

export const FILTERS_COLLECTION = "filters";
export const PROJECTS_COLLECTION = "projects";
