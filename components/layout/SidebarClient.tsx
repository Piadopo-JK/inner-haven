"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useSidebar } from "@/lib/context/sidebar-context";
import {
  logoutNavItem,
  primaryNavItems,
  systemNavItems,
  type NavItem,
} from "@/lib/config/navigation-config";
import { useSignOut } from "@/lib/query/hooks/useSignOut";
import { SessionRole } from "@/lib/supabase/get-session-user";

const ICON_COL = 74;
const PANEL_W = 280;
const LABEL_COL = PANEL_W - ICON_COL;
const LOGO_CONTAINER_HEIGHT = 50;

function normalizePath(pathname: string): string {
  return pathname === "/" ? "/dashboard" : pathname;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavRow({
  item,
  isActive,
  markerActive,
  expanded,
  onHoverChange,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  markerActive: boolean;
  expanded: boolean;
  onHoverChange?: (hovering: boolean) => void;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      aria-current={isActive ? "page" : undefined}
      title={item.label}
      className="group relative flex items-center py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-[var(--guidance-sidebar-hover-bg)]"
      style={{
        width: "100%",
        color: markerActive ? "var(--guidance-sidebar-active-text)" : "var(--guidance-sidebar-text)",
        fontWeight: markerActive ? 600 : 500,
        background: markerActive ? "var(--guidance-sidebar-active-bg)" : undefined,
        boxShadow: markerActive ? "var(--md-sys-elevation-level1)" : undefined,
      }}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: `${ICON_COL}px` }}
      >
        <Icon className="h-5 w-5" />
      </span>

      <span
        className="whitespace-nowrap pr-6 text-sm leading-none transition-opacity duration-200"
        style={{
          width: `${LABEL_COL}px`,
          opacity: expanded ? 1 : 0,
          transitionDelay: expanded ? "75ms" : "0ms",
        }}
      >
        {item.label}
      </span>

      <span
        aria-hidden
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l-full transition-opacity duration-200"
        style={{
          width: "4px",
          height: "26px",
          background: "var(--guidance-sidebar-active-text)",
          opacity: markerActive ? 1 : 0,
        }}
      />
    </Link>
  );
}

function LogoutRow({
  onClick,
  expanded,
  markerActive,
  onHoverChange,
}: {
  onClick: () => void;
  expanded: boolean;
  markerActive: boolean;
  onHoverChange?: (hovering: boolean) => void;
}) {
  const Icon = logoutNavItem.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      title={logoutNavItem.label}
      className="group relative flex items-center py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-[var(--guidance-sidebar-hover-bg)]"
      style={{
        width: "100%",
        color: "var(--guidance-logout-text)",
        fontWeight: 500,
        background: markerActive ? "color-mix(in srgb, var(--guidance-logout-text) 10%, transparent)" : undefined,
        boxShadow: markerActive ? "var(--md-sys-elevation-level1)" : undefined,
      }}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: `${ICON_COL}px` }}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span
        className="whitespace-nowrap pr-6 text-left text-sm leading-none transition-opacity duration-200"
        style={{
          width: `${LABEL_COL}px`,
          opacity: expanded ? 1 : 0,
          transitionDelay: expanded ? "75ms" : "0ms",
        }}
      >
        {logoutNavItem.label}
      </span>
      <span
        aria-hidden
        className="absolute right-0 top-1/2 -translate-y-1/2 rounded-l-full transition-opacity duration-200"
        style={{
          width: "4px",
          height: "26px",
          background: "var(--guidance-logout-text)",
          opacity: markerActive ? 1 : 0,
        }}
      />
    </button>
  );
}

function LogoRow({ expanded }: { expanded: boolean }) {
  return (
    <div
      className="flex items-center"
      style={{ height: `${LOGO_CONTAINER_HEIGHT}px`, width: "100%" }}
    >
      <div
        className="shrink-0 flex items-center justify-center"
        style={{ width: `${ICON_COL}px`, height: `${LOGO_CONTAINER_HEIGHT}px` }}
      >
        <Image
          src="/assets/IconRet.png"
          alt="GuidanceGO logo"
          width={64}
          height={52}
          className="object-contain"
          priority
        />
      </div>

      <span
        className="flex flex-col justify-center transition-opacity duration-200"
        style={{
          width: `${LABEL_COL}px`,
          opacity: expanded ? 1 : 0,
          transitionDelay: expanded ? "75ms" : "0ms",
        }}
      >
        {/* Main text: "Guidance" and "GO" */}
        <div className="flex items-baseline gap-0">
          <span
            className="whitespace-nowrap leading-tight"
            style={{
              fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#003D99",
            }}
          >
            Guidance
          </span>
          <span
            className="whitespace-nowrap leading-tight"
            style={{
              fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Inter', sans-serif",
              fontWeight: 700,
              fontSize: "18px",
              color: "#4CAF50",
            }}
          >
            GO
          </span>
        </div>
        <span
          className="whitespace-nowrap leading-tight"
          style={{
            fontFamily: "system-ui, -apple-system, 'Segoe UI', 'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "10px",
            color: "#666666",
            marginTop: "2px",
          }}
        >
          Fast & Secure
        </span>
      </span>
    </div>
  );
}

function LogoutConfirmModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [signingOut, setSigningOut] = useState(false);
  const signOut = useSignOut();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !signingOut) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, signingOut]);

  if (!open) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0"
        style={{ background: "rgba(15, 23, 42, 0.45)" }}
        onClick={onClose}
        aria-label="Close logout confirmation"
      />
      <div
        className="relative w-full max-w-sm rounded-2xl border p-5"
        style={{
          background: "var(--md-sys-color-surface)",
          borderColor: "var(--md-sys-color-outline-variant)",
          boxShadow: "var(--md-sys-elevation-level3)",
        }}
      >
        <h2 className="text-base font-semibold" style={{ color: "var(--md-sys-color-on-surface)" }}>
          Log Out
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--md-sys-color-on-surface-variant)" }}>
          Are you sure you want to log out of GuidanceGO?
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{
              color: "var(--md-sys-color-on-surface-variant)",
              background: "var(--md-sys-color-surface-container)",
            }}
            disabled={signingOut}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--guidance-logout-text)" }}
            disabled={signingOut}
            onClick={() => { void handleSignOut(); }}
          >
            {signingOut ? "Signing out…" : "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SidebarClient({
  isVisible,
  role,
}: {
  isVisible: boolean;
  role?: SessionRole;
}) {
  const pathname = usePathname();
  const normalizedPath = useMemo(() => normalizePath(pathname), [pathname]);
  const { isExpanded, setExpanded, isMobileOpen, setMobileOpen } = useSidebar();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const visiblePrimaryNavItems = useMemo(
    () =>
      primaryNavItems.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        if (!role) return false;
        return item.roles.includes(role);
      }),
    [role],
  );

  const visibleSystemNavItems = useMemo(
    () =>
      systemNavItems.filter((item) => {
        if (!item.roles || item.roles.length === 0) return true;
        if (!role) return false;
        return item.roles.includes(role);
      }),
    [role],
  );

  const activeItemId = useMemo(() => {
    const allItems = [...visiblePrimaryNavItems, ...visibleSystemNavItems];
    const activeItem = allItems.find((item) => isItemActive(normalizedPath, item.href));
    return activeItem?.id ?? null;
  }, [normalizedPath, visiblePrimaryNavItems, visibleSystemNavItems]);

  const markerItemId = hoveredItemId ?? activeItemId;

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileOpen]);

  useEffect(() => {
    if (!isMobileOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileOpen, setMobileOpen]);

  if (!isVisible) return null;

  return (
    <>
      <aside
        className="hidden md:block shrink-0 sticky top-0 z-50 h-screen"
        style={{ width: `${ICON_COL}px` }}
      >
        <div className="relative h-full">

          <div
            className="absolute inset-y-0 left-0 flex flex-col justify-between overflow-hidden py-6"
            style={{
              width: isExpanded ? `${PANEL_W}px` : `${ICON_COL}px`,
              transition: "width 300ms ease",
              background: "var(--guidance-sidebar-bg)",
              borderRight: "1px solid var(--guidance-sidebar-divider)",
              zIndex: 80,
            }}
            onMouseEnter={() => setExpanded(true)}
            onMouseLeave={() => setExpanded(false)}
          >
            <div>
              <LogoRow expanded={isExpanded} />
              <nav className="mt-6 flex flex-col">
                {visiblePrimaryNavItems.map((item) => (
                  <NavRow
                    key={item.id}
                    item={item}
                    isActive={isItemActive(normalizedPath, item.href)}
                    markerActive={markerItemId === item.id}
                    expanded={isExpanded}
                    onHoverChange={(hovering) => setHoveredItemId(hovering ? item.id : null)}
                  />
                ))}
              </nav>
            </div>

            <nav className="flex flex-col">
              {visibleSystemNavItems.map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  isActive={isItemActive(normalizedPath, item.href)}
                  markerActive={markerItemId === item.id}
                  expanded={isExpanded}
                  onHoverChange={(hovering) => setHoveredItemId(hovering ? item.id : null)}
                />
              ))}
              <LogoutRow
                onClick={() => setLogoutOpen(true)}
                expanded={isExpanded}
                markerActive={markerItemId === logoutNavItem.id}
                onHoverChange={(hovering) => setHoveredItemId(hovering ? logoutNavItem.id : null)}
              />
            </nav>
          </div>

        </div>
      </aside>

      <div
        className={`fixed inset-0 z-[70] md:hidden ${isMobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!isMobileOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 transition-opacity duration-300 ${isMobileOpen ? "opacity-100" : "opacity-0"}`}
          style={{ background: "rgba(15, 23, 42, 0.4)" }}
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        />

        <aside
          className={`relative flex h-full flex-col justify-between overflow-hidden py-6 transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{
            width: "min(86vw, 320px)",
            background: "var(--guidance-sidebar-bg)",
            borderRight: "1px solid var(--guidance-sidebar-divider)",
          }}
        >
          <div>
            <LogoRow expanded />
            <nav className="mt-6 flex flex-col">
              {visiblePrimaryNavItems.map((item) => (
                <NavRow
                  key={item.id}
                  item={item}
                  isActive={isItemActive(normalizedPath, item.href)}
                  markerActive={isItemActive(normalizedPath, item.href)}
                  expanded
                  onNavigate={() => setMobileOpen(false)}
                />
              ))}
            </nav>
          </div>

          <nav className="flex flex-col">
            {visibleSystemNavItems.map((item) => (
              <NavRow
                key={item.id}
                item={item}
                isActive={isItemActive(normalizedPath, item.href)}
                markerActive={isItemActive(normalizedPath, item.href)}
                expanded
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
            <LogoutRow onClick={() => setLogoutOpen(true)} expanded markerActive={false} />
          </nav>
        </aside>
      </div>

      <LogoutConfirmModal
        open={logoutOpen}
        onClose={() => {
          setLogoutOpen(false);
          setMobileOpen(false);
        }}
      />
    </>
  );
}
