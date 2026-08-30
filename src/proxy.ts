import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionCookie, SESSION_COOKIE } from "@/lib/server/auth";

/**
 * Gates every route except the login page and static assets. This is where
 * the approval endpoint stops being reachable by anonymous requests: without
 * a valid session cookie, /review and the /api/webmcp/* tool endpoint both
 * redirect or reject before any handler runs, so an unauthenticated caller
 * can no longer approve a change or invoke a write tool against this
 * deployment.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await isValidSessionCookie(sessionCookie);

  if (authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        ok: false,
        summary: "Not signed in",
        error: "This account requires a signed-in session.",
      },
      { status: 401 },
    );
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
