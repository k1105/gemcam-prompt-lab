import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gemcam Prompt Lab",
  description: "Camera for testing image-generation prompt filters.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFD200",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
