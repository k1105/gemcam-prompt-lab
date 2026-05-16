"use client";

import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID / APP_ID must be set",
    );
  }
  return { apiKey, authDomain, projectId, appId };
}

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  cachedApp = getApps().length ? getApp() : initializeApp(getFirebaseConfig());
  return cachedApp;
}

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;
  cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
}

export function buildGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
}

export const ALLOWED_EMAIL_DOMAIN = "@dentsu.co.jp";

export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}
