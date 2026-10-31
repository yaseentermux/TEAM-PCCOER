import React from "react";

interface MoneyTextProps {
  amount: number | string | null | undefined;
  currency?: string;
  className?: string;
  showZero?: boolean;
}

/**
 * Format currency amount with INR default (e.g. ₹1,250.00).
 * Gracefully handles null, undefined, strings, and zero amounts.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "INR",
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "₹0.00";
  }

  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return "₹0.00";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export const MoneyText: React.FC<MoneyTextProps> = ({
  amount,
  currency = "INR",
  className = "",
}) => {
  const formatted = formatCurrency(amount, currency);

  return <span className={`font-medium tabular-nums ${className}`}>{formatted}</span>;
};
