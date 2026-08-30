import { CalendarRange, ChevronDown, FlaskConical, LogOut } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WebMcpRuntime } from "@/components/webmcp/WebMcpRuntime";
import { getAdAccount, REPORTING_REFERENCE } from "@/lib/ads-service";
import { formatDate } from "@/lib/format";
import { ThemeToggle } from "./ThemeToggle";

export async function Topbar() {
  const account = await getAdAccount();

  return (
    <header className="bg-card/80 sticky top-0 z-10 flex h-16 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="sm" className="gap-2 px-2">
        <span className="bg-accent text-accent-foreground flex size-6 items-center justify-center rounded text-[11px] font-semibold">
          {account.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden max-w-40 truncate sm:inline">{account.name}</span>
        <ChevronDown className="text-muted-foreground" />
      </Button>

      <Badge tone="warning" className="gap-1.5">
        <FlaskConical />
        {account.providerLabel}
      </Badge>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-muted-foreground hidden items-center gap-1.5 text-xs lg:flex">
          <CalendarRange className="size-3.5" />
          Last 28 days, through {formatDate(REPORTING_REFERENCE.date)}
        </span>
        <WebMcpRuntime />
        <ThemeToggle />
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
            <LogOut />
          </Button>
        </form>
      </div>
    </header>
  );
}
