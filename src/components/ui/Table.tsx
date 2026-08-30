import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function TableWrap({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full overflow-x-auto", className)}
      {...props}
    />
  );
}

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full min-w-3xl caption-bottom text-sm", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: ComponentProps<"thead">) {
  return (
    <thead
      className={cn("bg-muted/50 text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y", className)} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn("hover:bg-muted/40 transition-colors", className)}
      {...props}
    />
  );
}

interface CellProps extends ComponentProps<"td"> {
  numeric?: boolean;
}

export function TableCell({ className, numeric, ...props }: CellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle",
        numeric && "text-right tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

interface HeaderCellProps extends ComponentProps<"th"> {
  numeric?: boolean;
}

export function TableHeaderCell({
  className,
  numeric,
  scope = "col",
  ...props
}: HeaderCellProps) {
  return (
    <th
      scope={scope}
      className={cn(
        "px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}
