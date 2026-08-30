import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Everything under this group sits behind the session gate enforced in
 * src/proxy.ts. The shell (sidebar, top bar, tool runtime) only ever renders
 * for a signed-in request.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
