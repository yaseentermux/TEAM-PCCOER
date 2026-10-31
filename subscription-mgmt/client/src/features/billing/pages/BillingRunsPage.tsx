// [M4] Billing runs: run now + history (created / skipped / failed)
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { useBillingRuns, useRunBilling } from "../api";

export default function BillingRunsPage() {
  const runs = useBillingRuns();
  const run = useRunBilling();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Billing runs</h1>
          <p className="text-sm text-slate-500">
            Runs automatically every day at 00:05. Each subscription period can be invoiced only once, so re-running never bills twice.
          </p>
        </div>
        <Button onClick={() => run.mutate(undefined)} disabled={run.isPending}><PlayCircle /> {run.isPending ? "Running..." : "Run billing now"}</Button>
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Run</TableHead><TableHead>Trigger</TableHead><TableHead>Started</TableHead>
                <TableHead className="text-right">Created</TableHead><TableHead className="text-right">Skipped</TableHead>
                <TableHead className="text-right">Failed</TableHead><TableHead>Errors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.data?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">#{r.id}</TableCell>
                  <TableCell>{r.trigger === "CRON" ? "Scheduled" : "Manual"}</TableCell>
                  <TableCell>{formatDateTime(r.startedAt)}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.created}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.skipped}</TableCell>
                  <TableCell className={`text-right tabular-nums ${r.failed ? "font-semibold text-red-600" : ""}`}>{r.failed}</TableCell>
                  <TableCell className="max-w-80 whitespace-pre-wrap text-xs text-slate-600">{r.log ?? "-"}</TableCell>
                </TableRow>
              ))}
              {runs.data?.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-slate-500">No runs yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
