import { cn } from "@/lib/utils";

type Md3MessageTone = "error" | "info" | "success";

const toneClass: Record<Md3MessageTone, string> = {
  error: "text-[var(--md-sys-color-error)]",
  info: "text-[var(--md-sys-color-on-surface-variant)]",
  success: "text-[var(--md-sys-color-primary)]",
};

export function Md3Message({
  tone,
  children,
  className,
}: {
  tone: Md3MessageTone;
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={cn("text-sm", toneClass[tone], className)}>{children}</p>;
}
