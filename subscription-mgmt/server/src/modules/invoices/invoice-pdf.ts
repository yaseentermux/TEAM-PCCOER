// [M4] PDFKit invoice renderer -> Buffer (used by /pdf, /send, portal)
import PDFDocument from "pdfkit";
import type { InvoiceDetail } from "./invoices.service.js";

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (d: Date) => d.toISOString().slice(0, 10);
const ACCENT = "#4f46e5";
const MUTED = "#6b7280";

export function renderInvoicePdf(inv: InvoiceDetail): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const L = 50, R = 545;

    // Header
    doc.fillColor(ACCENT).fontSize(20).font("Helvetica-Bold").text("Brightloop Software", L, 50);
    doc.fillColor(MUTED).fontSize(9).font("Helvetica").text("Subscription billing", L, 75);
    doc.fillColor("#111827").fontSize(18).font("Helvetica-Bold").text("INVOICE", 350, 50, { width: R - 350, align: "right" });
    doc.fontSize(10).font("Helvetica").text(inv.number ?? `#${inv.id}`, 350, 74, { width: R - 350, align: "right" });
    doc.fillColor(inv.status === "PAID" ? "#059669" : inv.isOverdue ? "#dc2626" : MUTED)
      .font("Helvetica-Bold").text(inv.isOverdue ? "OVERDUE" : inv.status, 350, 88, { width: R - 350, align: "right" });

    // Bill to + meta
    doc.fillColor(MUTED).font("Helvetica").fontSize(9).text("BILL TO", L, 125);
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(11).text(inv.customer.name, L, 138);
    doc.font("Helvetica").fontSize(9.5);
    const billTo = [inv.customer.company, inv.customer.email, inv.customer.phone, inv.customer.address].filter(Boolean) as string[];
    billTo.forEach((t, i) => doc.text(t, L, 153 + i * 13));

    const meta: [string, string][] = [
      ["Invoice date", day(inv.invoiceDate)],
      ["Due date", day(inv.dueDate)],
      ["Period", `${day(inv.periodStart)} to ${day(inv.periodEnd)}`],
      ["Subscription", inv.subscription.number ?? `#${inv.subscription.id}`],
      ["Plan", inv.subscription.plan.name],
    ];
    meta.forEach(([k, v], i) => {
      doc.fillColor(MUTED).text(k, 330, 125 + i * 14, { width: 80 });
      doc.fillColor("#111827").text(v, 410, 125 + i * 14, { width: R - 410, align: "right" });
    });

    // Lines table
    let y = 215;
    const cols = { desc: L, qty: 290, price: 330, disc: 400, tax: 450, amt: 495 };
    doc.rect(L, y, R - L, 20).fill(ACCENT);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(9);
    doc.text("Description", cols.desc + 6, y + 6);
    doc.text("Qty", cols.qty, y + 6, { width: 35, align: "right" });
    doc.text("Unit price", cols.price, y + 6, { width: 65, align: "right" });
    doc.text("Discount", cols.disc, y + 6, { width: 45, align: "right" });
    doc.text("Tax", cols.tax, y + 6, { width: 40, align: "right" });
    doc.text("Amount", cols.amt, y + 6, { width: R - cols.amt - 4, align: "right" });
    y += 26;

    doc.font("Helvetica").fontSize(9).fillColor("#111827");
    for (const l of inv.lines) {
      if (y > 720) { doc.addPage(); y = 50; }
      const h = Math.max(14, doc.heightOfString(l.description, { width: 230 }));
      doc.text(l.description, cols.desc + 6, y, { width: 230 });
      doc.text(String(l.quantity), cols.qty, y, { width: 35, align: "right" });
      doc.text(money(l.unitPrice), cols.price, y, { width: 65, align: "right" });
      doc.text(l.discountAmount ? `-${money(l.discountAmount)}` : "-", cols.disc, y, { width: 45, align: "right" });
      doc.text(money(l.taxAmount), cols.tax, y, { width: 40, align: "right" });
      doc.text(money(l.amount), cols.amt, y, { width: R - cols.amt - 4, align: "right" });
      y += h + 6;
      doc.moveTo(L, y - 3).lineTo(R, y - 3).strokeColor("#e5e7eb").lineWidth(0.5).stroke();
    }

    // Totals
    y += 8;
    const totals: [string, string, boolean?][] = [
      ["Subtotal", money(inv.subtotal)],
      ...(inv.discountTotal ? [[`Discount${inv.discount ? ` (${inv.discount.name})` : ""}`, `-${money(inv.discountTotal)}`] as [string, string]] : []),
      ["Tax", money(inv.taxTotal)],
      ["Total", money(inv.total), true],
      ["Paid", money(inv.amountPaid)],
      ["Balance due", money(inv.balance), true],
    ];
    for (const [k, v, bold] of totals) {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 10.5 : 9.5).fillColor("#111827");
      doc.text(k, 330, y, { width: 120 });
      doc.text(v, 450, y, { width: R - 450 - 4, align: "right" });
      y += bold ? 17 : 14;
    }

    // Payments
    if (inv.payments.length) {
      y += 12;
      doc.font("Helvetica-Bold").fontSize(10).text("Payments", L, y);
      y += 15;
      doc.font("Helvetica").fontSize(9);
      for (const p of inv.payments) {
        doc.text(`${day(p.paymentDate)}  ${p.method.replace("_", " ")}${p.note ? `  (${p.note})` : ""}`, L, y, { width: 350 });
        doc.text(money(p.amount), 450, y, { width: R - 450 - 4, align: "right" });
        y += 13;
      }
    }

    doc.page.margins.bottom = 0; // footer sits inside the bottom margin; without this PDFKit adds a blank page
    doc.fillColor(MUTED).fontSize(8).text("Thank you for your business. Brightloop Software", L, 790, { width: R - L, align: "center" });
    doc.end();
  });
}
