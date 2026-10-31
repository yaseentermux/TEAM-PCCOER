// [M4] Oldest overdue invoices with a "Chase" (email reminder) action
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { useRemindInvoice } from "../api";
import type { OverdueInvoice } from "../types";

export function OverdueTable({ data }: { data?: OverdueInvoice[] }) {
  const remind = useRemindInvoice();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue invoices</CardTitle>
        <CardAction><Link to="/app/invoices?tab=OVERDUE" className="text-sm text-indigo-700 hover:underline">View all</Link></CardAction>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500">
            <tr>
              <th className="pb-2 font-medium">Invoice</th><th className="pb-2 font-medium">Customer</th>
              <th className="pb-2 font-medium">Due</th><th className="pb-2 text-right font-medium">Balance</th><th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {data?.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="py-2 font-medium text-indigo-700"><Link to={`/app/invoices/${i.id}`}>{i.number}</Link></td>
                <td className="py-2">{i.customer.name}</td>
                <td className="py-2">
                  {formatDate(i.dueDate)} <span className="text-xs font-medium text-amber-700">{i.daysOverdue}d late</span>
                </td>
                <td className="py-2 text-right font-medium tabular-nums">{formatMoney(i.balance)}</td>
                <td className="py-2 text-right">
                  <Button size="sm" variant="outline" disabled={remind.isPending && remind.variables === i.id} onClick={() => remind.mutate(i.id)}>
                    <Mail /> Chase
                  </Button>
                </td>
              </tr>
            ))}
            {data?.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-slate-500">Nothing overdue</td></tr>}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
