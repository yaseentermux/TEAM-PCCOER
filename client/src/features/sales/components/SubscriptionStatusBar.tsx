import {
  Send,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SubscriptionDetail, SubscriptionStatus } from "../types";

const PIPELINE_STEPS: { status: SubscriptionStatus; label: string }[] = [
  { status: "DRAFT", label: "Draft" },
  { status: "QUOTATION", label: "Quotation" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "ACTIVE", label: "Active" },
  { status: "CLOSED", label: "Closed" },
];

const STEP_ORDER: Record<SubscriptionStatus, number> = {
  DRAFT: 0,
  QUOTATION: 1,
  CONFIRMED: 2,
  ACTIVE: 3,
  PAUSED: 3, // Paused is a variant of active state
  CLOSED: 4,
};

type Props = {
  subscription: SubscriptionDetail;
  onSendQuotation: () => void;
  onConfirm: () => void;
  onActivate: () => void;
  onPause: () => void;
  onResume: () => void;
  onCloseClick: () => void;
  onRenew: () => void;
  isPending?: boolean;
};

export function SubscriptionStatusBar({
  subscription,
  onSendQuotation,
  onConfirm,
  onActivate,
  onPause,
  onResume,
  onCloseClick,
  onRenew,
  isPending,
}: Props) {
  const currentStatus = subscription.status;
  const currentStepIndex = STEP_ORDER[currentStatus];
  const isPaused = currentStatus === "PAUSED";
  const plan = subscription.plan;

  // Check if quotation is expired
  const isQuoteExpired =
    currentStatus === "QUOTATION" &&
    Boolean(
      subscription.quoteValidUntil &&
        new Date(subscription.quoteValidUntil) < new Date()
    );

  // Behavior flags from plan
  const canPause = isPaused ? false : plan?.pausable !== false;
  const canClose =
    currentStatus === "QUOTATION" || plan?.closable !== false;
  const canRenew = plan?.renewable !== false;

  return (
    <div className="space-y-3">
      {/* Paused alert banner if currently paused */}
      {isPaused && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800">
          <Pause className="size-4 text-amber-600" />
          <span>This subscription is currently paused. Recurring billing and automated invoices are suspended.</span>
        </div>
      )}

      {/* Quote expired alert banner */}
      {isQuoteExpired && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-800">
          <AlertTriangle className="size-4 text-rose-600" />
          <span>This quotation expired on {subscription.quoteValidUntil ? new Date(subscription.quoteValidUntil).toLocaleDateString() : ""}. Please send an updated quotation before confirming.</span>
        </div>
      )}

      {/* Action Buttons & Pipeline Status Bar Container */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        {/* Context-Sensitive Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. DRAFT -> Send Quotation */}
          {currentStatus === "DRAFT" && (
            <Button
              size="sm"
              disabled={isPending || subscription.lines?.length === 0}
              onClick={onSendQuotation}
              className="gap-1.5 bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 shadow-sm"
            >
              <Send className="size-3.5" />
              Send Quotation
            </Button>
          )}

          {/* 2. QUOTATION -> Confirm */}
          {currentStatus === "QUOTATION" && (
            <Button
              size="sm"
              disabled={isPending || isQuoteExpired}
              onClick={onConfirm}
              className="gap-1.5 bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 shadow-sm"
            >
              <CheckCircle className="size-3.5" />
              Confirm Quotation
            </Button>
          )}

          {/* 3. CONFIRMED -> Activate */}
          {currentStatus === "CONFIRMED" && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={onActivate}
              className="gap-1.5 bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700 shadow-sm"
            >
              <Play className="size-3.5" />
              Activate Subscription
            </Button>
          )}

          {/* 4. ACTIVE -> Pause */}
          {currentStatus === "ACTIVE" && canPause && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={onPause}
              className="gap-1.5 text-xs text-amber-700 hover:bg-amber-50 hover:text-amber-800 border-amber-300"
            >
              <Pause className="size-3.5 text-amber-600" />
              Pause
            </Button>
          )}

          {/* 5. PAUSED -> Resume */}
          {currentStatus === "PAUSED" && (
            <Button
              size="sm"
              disabled={isPending}
              onClick={onResume}
              className="gap-1.5 bg-emerald-600 text-xs font-medium text-white hover:bg-emerald-700 shadow-sm"
            >
              <Play className="size-3.5" />
              Resume Subscription
            </Button>
          )}

          {/* 6. Close (ACTIVE, PAUSED, QUOTATION) */}
          {(currentStatus === "ACTIVE" ||
            currentStatus === "PAUSED" ||
            currentStatus === "QUOTATION") &&
            canClose && (
              <Button
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={onCloseClick}
                className="gap-1.5 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800 border-rose-300"
              >
                <XCircle className="size-3.5 text-rose-600" />
                Close Subscription
              </Button>
            )}

          {/* 7. Renew (CLOSED or ACTIVE) */}
          {(currentStatus === "CLOSED" || currentStatus === "ACTIVE") && canRenew && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={onRenew}
              className="gap-1.5 text-xs text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 border-indigo-300"
            >
              <RotateCcw className="size-3.5 text-indigo-600" />
              Renew
            </Button>
          )}
        </div>

        {/* Visual Lifecycle Pipeline Bar (Odoo-style step bar) */}
        <div className="flex items-center overflow-x-auto rounded-lg bg-slate-50 p-1 text-xs">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCurrent =
              currentStatus === step.status || (isPaused && step.status === "ACTIVE");
            const isPast = currentStepIndex > idx;

            return (
              <div key={step.status} className="flex items-center">
                {idx > 0 && (
                  <div
                    className={cn(
                      "h-0.5 w-4 sm:w-6",
                      isPast ? "bg-indigo-500" : "bg-slate-200"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                    isCurrent && !isPaused && "bg-white text-indigo-700 shadow-xs font-semibold ring-1 ring-slate-200",
                    isCurrent && isPaused && "bg-amber-100 text-amber-800 font-semibold",
                    isPast && "text-slate-600",
                    !isCurrent && !isPast && "text-slate-400"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full shrink-0",
                      isCurrent && !isPaused && "bg-indigo-600",
                      isCurrent && isPaused && "bg-amber-600",
                      isPast && "bg-indigo-400",
                      !isCurrent && !isPast && "bg-slate-300"
                    )}
                  />
                  <span>
                    {isCurrent && isPaused && step.status === "ACTIVE"
                      ? "Paused"
                      : step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

