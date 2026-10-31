// [M4] Invoiced vs collected per month (grouped bars, one axis) with a table view
import { useState } from "react";
import dayjs from "dayjs";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import type { TrendPoint } from "../types";

// Categorical slots 1 and 2 of the validated reference palette (blue, orange).
const SERIES = [
  { key: "invoiced", label: "Invoiced", color: "#2a78d6" },
  { key: "collected", label: "Collected", color: "#eb6834" },
] as const;

const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const monthLabel = (m: string) => dayjs(`${m}-01`).format("MMM YY");

export function RevenueTrendChart({ data }: { data?: TrendPoint[] }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue, last 12 months</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" onClick={() => setAsTable((t) => !t)}>{asTable ? "Show chart" : "Show table"}</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {!data ? <Skeleton className="h-64 w-full" /> : asTable ? (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th className="py-1 font-medium">Month</th>{SERIES.map((s) => <th key={s.key} className="py-1 text-right font-medium">{s.label}</th>)}</tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.month} className="border-t">
                  <td className="py-1">{monthLabel(d.month)}</td>
                  {SERIES.map((s) => <td key={s.key} className="py-1 text-right tabular-nums">{formatMoney(d[s.key])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-64" role="img" aria-label="Bar chart of invoiced and collected revenue per month">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2} barCategoryGap="24%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" tickFormatter={monthLabel} tickLine={false} axisLine={{ stroke: "#d1d5db" }} tick={{ fill: "#52514e", fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => compact.format(v)} tickLine={false} axisLine={false} width={48} tick={{ fill: "#52514e", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.05)" }}
                  formatter={(v) => formatMoney(Number(v))}
                  labelFormatter={(m) => dayjs(`${m}-01`).format("MMMM YYYY")}
                  contentStyle={{ borderRadius: 8, borderColor: "#e5e7eb", fontSize: 13 }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, color: "#52514e" }} />
                {SERIES.map((s) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={22} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
