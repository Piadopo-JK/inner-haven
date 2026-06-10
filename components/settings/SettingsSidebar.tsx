"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { User, Calendar, Shield } from "lucide-react";

type SettingCategory = "profile" | "schedule" | "integrations";

interface SettingsSidebarProps {
  userRole: "student" | "counselor";
}

const CATEGORIES: {
  id: SettingCategory;
  label: string;
  icon: React.ReactNode;
  roles: ("student" | "counselor")[];
}[] = [
  {
    id: "profile",
    label: "Profile & Appearance",
    icon: <User className="w-4 h-4" />,
    roles: ["student", "counselor"],
  },
  {
    id: "schedule",
    label: "Booking Schedule",
    icon: <Calendar className="w-4 h-4" />,
    roles: ["counselor"],
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: <Shield className="w-4 h-4" />,
    roles: ["counselor"],
  },
];

export default function SettingsSidebar({ userRole }: SettingsSidebarProps) {
  const searchParams = useSearchParams();
  const activeCategory = (searchParams.get("category") || "profile") as SettingCategory;

  const visibleCategories = CATEGORIES.filter((cat) => cat.roles.includes(userRole));

  return (
    <aside className="flex flex-col gap-2 w-full md:w-56 md:border-r md:pr-4" style={{ borderColor: "var(--md-sys-color-outline-variant)" }}>
      {visibleCategories.map((category) => (
        <Link
          key={category.id}
          href={`/settings?category=${category.id}`}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200"
          style={{
            background:
              activeCategory === category.id
                ? "var(--md-sys-color-primary-container)"
                : "transparent",
            color:
              activeCategory === category.id
                ? "var(--md-sys-color-on-primary-container)"
                : "var(--md-sys-color-on-surface-variant)",
          }}
          onMouseEnter={(e) => {
            if (activeCategory !== category.id) {
              e.currentTarget.style.background = "var(--md-sys-color-surface-container-low)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeCategory !== category.id) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <span style={{
            color: activeCategory === category.id
              ? "var(--md-sys-color-on-primary-container)"
              : "var(--md-sys-color-on-surface-variant)",
          }}>
            {category.icon}
          </span>
          {category.label}
        </Link>
      ))}
    </aside>
  );
}
