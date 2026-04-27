import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

export const primaryNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "counselor-directory",
    label: "Counselor Directory",
    href: "/counselors",
    icon: Users,
  },
  {
    id: "appointments",
    label: "My Appointments",
    href: "/appointments",
    icon: CalendarDays,
  },
  {
    id: "messaging",
    label: "Messaging",
    href: "/messaging",
    icon: MessageSquare,
  },
];

export const systemNavItems: NavItem[] = [
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const logoutNavItem = {
  id: "logout",
  label: "Logout",
  icon: LogOut,
};
