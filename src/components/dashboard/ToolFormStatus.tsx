"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ToolFormState } from "@/lib/tool-form-state";

/** Submit button that reflects the enclosing form's pending state. */
export function SubmitButton({
  children,
  variant = "primary",
  size = "md",
}: {
  children: ReactNode;
  variant?: "primary" | "positive" | "danger";
  size?: "sm" | "md";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} size={size}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {pending ? "Working..." : children}
    </Button>
  );
}

/** Inline error banner shown once a tool call fails validation or execution. */
export function ToolFormError({ state }: { state: ToolFormState }) {
  if (!state.error) return null;
  return (
    <p
      role="alert"
      className="bg-negative-soft text-negative flex items-center gap-2 rounded-md px-3 py-2 text-sm"
    >
      <AlertCircle className="size-4 shrink-0" />
      {state.error}
    </p>
  );
}
