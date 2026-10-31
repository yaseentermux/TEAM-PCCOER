import { cn } from "@/lib/utils";
import type { SubscriptionStatus } from "../types";

const statusConfig: Record<
  SubscriptionStatus,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  DRAFT: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    border: "border-slate-200",
  },
  QUOTATION: {
    label: "Quotation",
    bg: "bg-sky-50",
    text: "text-sky-700",
    dot: "bg-sky-500",
    border: "border-sky-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    dot: "bg-indigo-500",
    border: "border-indigo-200",
  },
  ACTIVE: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  PAUSED: {
    label: "Paused",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-200",
  },
};

export function SubscriptionStatusBadge({
  status,
  className,
}: {
  status: SubscriptionStatus;
  className?: string;
}) {
  const config = statusConfig[status] ?? statusConfig.DRAFT;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full shrink-0", config.dot)} />
      {config.label}
    </span>
  );
}

