// [M4] Subscriptions per lifecycle status: one-hue horizontal bars with direct value labels
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatusCount } from "../types";

const LABEL: Record<string, string> = {
  DRAFT: "Draft", QUOTATION: "Quotation", CONFIRMED: "Confirmed", ACTIVE: "Active", PAUSED: "Paused", CLOSED: "Closed",
};

export function SubscriptionsStatusChart({ data }: { data?: StatusCount[] }) {
  const rows = data?.map((d) => ({ ...d, label: LABEL[d.status] ?? d.status }));
  return (
    <Card>
      <CardHeader><CardTitle>Subscriptions by status</CardTitle></CardHeader>
      <CardContent>
        {!rows ? <Skeleton className="h-64 w-full" /> : (
          <div className="h-64" role="img" aria-label="Bar chart of subscription counts by status">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }} barCategoryGap={6}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" width={80} tickLine={false} axisLine={false} tick={{ fill: "#52514e", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "rgba(15,23,42,0.05)" }} formatter={(v) => [Number(v).toLocaleString("en-IN"), "Subscriptions"]}
                  contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 13 }} />
                <Bar dataKey="count" fill="#2a78d6" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  <LabelList dataKey="count" position="right" style={{ fill: "#0b0b0b", fontSize: 12 }} formatter={(v) => Number(v).toLocaleString("en-IN")} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
