import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Compass, LockKeyhole } from "lucide-react";
import { isValidSessionCookie, SESSION_COOKIE } from "@/lib/server/auth";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in - AdPilot",
};

export default async function LoginPage() {
  const cookieStore = await cookies();
  if (await isValidSessionCookie(cookieStore.get(SESSION_COOKIE)?.value)) {
    redirect("/");
  }

  return (
    <div className="bg-muted flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-md">
            <Compass className="size-5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Sign in to AdPilot
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Agent-native ads workspace
            </p>
          </div>
        </div>

        <LoginForm />

        <p className="text-muted-foreground mt-4 flex items-center justify-center gap-1.5 text-center text-xs">
          <LockKeyhole className="size-3.5" />
          Demo account. Credentials are provided by the project owner.
        </p>
      </div>
    </div>
  );
}
