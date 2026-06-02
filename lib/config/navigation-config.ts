import {
  CircleHelp,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import type { SessionRole } from "@/lib/supabase/get-session-user";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  roles?: SessionRole[];
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
    roles: ["student"],
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
    roles: ["student"],
  },
  {
    id: "anonymous-queue",
    label: "Anonymous Queue",
    href: "/messaging",
    icon: CircleHelp,
    roles: ["counselor"],
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
