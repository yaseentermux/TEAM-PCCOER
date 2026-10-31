import React from "react";
import { Check } from "lucide-react";

export interface StatusStep {
  id: string;
  label: string;
}

interface StatusBarProps {
  steps: StatusStep[];
  currentStepId: string;
  onStepClick?: (stepId: string) => void;
  className?: string;
}

/**
 * Odoo-style horizontal status pipeline / stepper.
 * Visualizes completed, current, and upcoming stages.
 */
export const StatusBar: React.FC<StatusBarProps> = ({
  steps,
  currentStepId,
  onStepClick,
  className = "",
}) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div
      className={`flex items-center overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-xs ${className}`}
    >
      <div className="flex w-full min-w-max items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          let stateClasses = "bg-slate-50 text-slate-500 hover:bg-slate-100";
          if (isCurrent) {
            stateClasses =
              "bg-brand-600 text-white font-semibold shadow-xs ring-1 ring-brand-700";
          } else if (isCompleted) {
            stateClasses = "bg-emerald-50 text-emerald-800 font-medium hover:bg-emerald-100";
          }

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                disabled={!onStepClick}
                onClick={() => onStepClick?.(step.id)}
                className={`flex flex-1 items-center justify-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs sm:text-sm ${stateClasses} ${
                  onStepClick ? "cursor-pointer" : "cursor-default"
                }`}
              >
                {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                {isCurrent && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
                <span>{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className="mx-1 text-slate-300 select-none">›</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
