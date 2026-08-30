"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./navigation";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col border-r md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b px-5">
        <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
          <Compass className="size-4" />
        </span>
        <span className="text-foreground text-base font-semibold tracking-tight">
          AdPilot
        </span>
      </div>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <p className="text-muted-foreground border-t px-5 py-4 text-xs leading-relaxed">
        Agent-operated workspace. Writes that change spend always wait for your
        approval.
      </p>
    </aside>
  );
}
