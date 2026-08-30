"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSession,
  revokeSessionCookie,
  sessionCookieOptions,
  SESSION_COOKIE,
  verifyCredentials,
} from "@/lib/server/auth";
import { recordExecution } from "@/lib/server/store";

export interface LoginState {
  error: string | null;
}

function logLogin(status: "success" | "error", summary: string): void {
  recordExecution({
    id: `exec_${Date.now().toString(36)}`,
    toolName: "human_login",
    kind: "write",
    status,
    actor: "human",
    summary,
    startedAt: new Date().toISOString(),
    durationMs: 1,
  });
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!verifyCredentials({ email, password })) {
    logLogin("error", "Failed sign-in attempt");
    return { error: "Incorrect email or password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await createSession(), sessionCookieOptions);
  logLogin("success", "Signed in to the workspace");
  redirect("/");
}

/**
 * Revokes the session server-side, not just in the browser. A signed cookie
 * would otherwise stay valid until its expiry even after the user signs out,
 * since signature checks alone cannot tell a revoked token from an active one.
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  revokeSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
  cookieStore.delete(SESSION_COOKIE);
  logLogin("success", "Signed out of the workspace");
  redirect("/login");
}
