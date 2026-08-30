import {
  Activity,
  BadgeCheck,
  LayoutDashboard,
  LineChart,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Overview",
    icon: LayoutDashboard,
    description: "Goal progress and account performance",
  },
  {
    href: "/campaigns",
    label: "Campaigns",
    icon: Megaphone,
    description: "Campaign, ad set, and ad structure",
  },
  {
    href: "/insights",
    label: "Insights",
    icon: LineChart,
    description: "Trends, creative, and spend allocation",
  },
  {
    href: "/review",
    label: "Review",
    icon: BadgeCheck,
    description: "Approve or reject proposed changes",
  },
  {
    href: "/activity",
    label: "Agent Activity",
    icon: Activity,
    description: "Tool executions on this account",
  },
];
