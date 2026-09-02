import type { CSSProperties } from "react";
import type { ProjectTheme } from "./types";

export const DEFAULT_PRIMARY_COLOR = "#ffd200";
export const DEFAULT_ACCENT_COLOR = "#e4002b";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return isHexColor(withHash) ? withHash.toLowerCase() : null;
}

// Returns inline CSS-variable overrides for a project. Apply to the page root
// so every descendant that reads --color-yellow / --color-red picks up the
// project palette without per-component changes.
export function projectThemeStyle(
  theme: ProjectTheme | null | undefined,
): CSSProperties {
  const style: Record<string, string> = {};
  if (theme?.primaryColor && isHexColor(theme.primaryColor)) {
    style["--color-yellow"] = theme.primaryColor;
  }
  if (theme?.accentColor && isHexColor(theme.accentColor)) {
    style["--color-red"] = theme.accentColor;
  }
  return style as CSSProperties;
}
