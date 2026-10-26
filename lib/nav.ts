import { CalendarDays, Headset, IdCard, LayoutDashboard, Wrench, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const HOME: NavItem = {
  href: "/",
  label: "Overview",
  description: "Everything in the portal at a glance.",
  icon: LayoutDashboard,
};

/** The four main areas of the portal, in the order they appear in the navigation. */
export const MODULES: NavItem[] = [
  {
    href: "/pims",
    label: "PIMS",
    description: "Your personal information: profile, contact details and account.",
    icon: IdCard,
  },
  {
    href: "/tools",
    label: "Tools",
    description: "AI and everyday tools, split into open source and closed & paid.",
    icon: Wrench,
  },
  {
    href: "/calendar",
    label: "Calendar & holidays",
    description: "Public holidays for the Dubai and Cairo offices, month by month.",
    icon: CalendarDays,
  },
  {
    href: "/support",
    label: "IT & support",
    description: "Tools for diagnosing and fixing problems, plus quick fixes.",
    icon: Headset,
  },
];
