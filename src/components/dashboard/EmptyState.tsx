import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface Props {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
        <Inbox className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground max-w-sm text-xs leading-relaxed">
        {description}
      </p>
      {action}
    </div>
  );
}
