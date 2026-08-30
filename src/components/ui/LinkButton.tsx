import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClasses } from "./Button";

type ButtonVariant = Parameters<typeof buttonClasses>[0];
type ButtonSize = Parameters<typeof buttonClasses>[1];

interface Props extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function LinkButton({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Props) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
