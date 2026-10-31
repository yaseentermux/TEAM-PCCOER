import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  pending?: boolean;
  subscriptionNumber?: string | null;
};

export function CloseSubscriptionDialog({
  open,
  onOpenChange,
  onConfirm,
  pending,
  subscriptionNumber,
}: Props) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length >= 3) {
      onConfirm(reason.trim());
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-rose-900">
              Close Subscription {subscriptionNumber ?? ""}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to close this subscription? This will halt all recurring billing. A cancellation reason is required for audit records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="close-reason" className="text-xs font-semibold text-slate-700">
              Cancellation Reason <span className="text-rose-500">*</span>
            </Label>
            <Textarea
              id="close-reason"
              placeholder="e.g. Customer migrated to central suite, budget constraints, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              required
            />
            {reason.trim().length > 0 && reason.trim().length < 3 && (
              <p className="text-xs text-rose-500">
                Reason must be at least 3 characters.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => handleOpenChange(false)}
            >
              Keep Subscription
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || reason.trim().length < 3}
            >
              {pending ? "Closing..." : "Close Subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

