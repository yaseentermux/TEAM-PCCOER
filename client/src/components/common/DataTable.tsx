import React from "react";
import { ChevronLeft, ChevronRight, Search, AlertCircle, Inbox } from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  emptyTitle?: string;
  emptyMessage?: string;
  actions?: React.ReactNode;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  limit,
  onPageChange,
  isLoading = false,
  error = null,
  onRetry,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  emptyTitle = "No records found",
  emptyMessage = "There are no entries to display at this time.",
  actions,
  keyExtractor,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      {(onSearchChange || actions) && (
        <div className="p-4 border-b border-slate-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          {onSearchChange && (
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchValue || ""}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-6 py-3.5 ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: Math.min(limit, 5) }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              // Error State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-red-600">
                    <AlertCircle className="w-8 h-8" />
                    <p className="font-semibold text-slate-900">{error}</p>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 rounded-md hover:bg-brand-100 transition-colors"
                      >
                        Try Again
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                      <Inbox className="w-7 h-7" />
                    </div>
                    <p className="font-semibold text-slate-800">{emptyTitle}</p>
                    <p className="text-sm text-slate-500 max-w-xs">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((item, rowIdx) => {
                const rowKey = keyExtractor
                  ? keyExtractor(item, rowIdx)
                  : ((item as Record<string, unknown>).id as string | number) || rowIdx;

                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-6 py-4 whitespace-nowrap ${col.className || ""}`}
                      >
                        {col.render
                          ? col.render(item, rowIdx)
                          : (item as Record<string, unknown>)[col.key] !== undefined &&
                            (item as Record<string, unknown>)[col.key] !== null
                          ? String((item as Record<string, unknown>)[col.key])
                          : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing <span className="font-medium text-slate-700">{startItem}</span> to{" "}
          <span className="font-medium text-slate-700">{endItem}</span> of{" "}
          <span className="font-medium text-slate-700">{total}</span> records
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <span className="px-2 font-medium text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
