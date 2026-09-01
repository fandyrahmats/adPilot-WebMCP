import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdPilot - Agent-native ads workspace",
  description:
    "Plan, launch, monitor, and optimize ad campaigns together with an AI agent.",
};

/** Applies the stored theme before first paint to avoid a flash. */
const themeScript = `try{var t=localStorage.getItem("adpilot-theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      // The inline script below sets the "dark" class before React hydrates,
      // based on localStorage/matchMedia the server cannot see. That is an
      // intentional, expected mismatch for flash-free dark mode, so this
      // element's attributes are exempted from the hydration check instead
      // of silencing hydration warnings globally.
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
