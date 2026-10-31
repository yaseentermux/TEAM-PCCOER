import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  Edit,
  Trash2,
  Package,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { useQuotationTemplates, useDeleteQuotationTemplate } from "../api";
import { CreateFromTemplateDialog } from "../components/CreateFromTemplateDialog";
import type { QuotationTemplateItem } from "../types";

export default function QuotationTemplatesListPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Queries & Mutations
  const { data: templates = [], isLoading, isError, error, refetch } = useQuotationTemplates();
  const deleteMutation = useDeleteQuotationTemplate();

  // Dialog States
  const [createSubTemplate, setCreateSubTemplate] = useState<QuotationTemplateItem | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<QuotationTemplateItem | null>(null);

  // Filter templates by search term
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    const term = searchTerm.toLowerCase();
    return templates.filter((tpl) => {
      const matchName = tpl.name.toLowerCase().includes(term);
      const matchPlan = tpl.plan?.name?.toLowerCase().includes(term);
      const matchNotes = tpl.notes?.toLowerCase().includes(term);
      return matchName || matchPlan || matchNotes;
    });
  }, [templates, searchTerm]);

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!templateToDelete) return;
    deleteMutation.mutate(templateToDelete.id, {
      onSuccess: () => {
        setTemplateToDelete(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quotation Templates
          </h1>
          <p className="text-xs text-slate-500">
            Manage reusable subscription packages and contract templates for rapid quotation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="h-9 gap-1.5 text-xs text-slate-600 hover:text-slate-900"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => navigate("/app/quotation-templates/new")}
            className="h-9 gap-1.5 bg-indigo-600 text-xs font-medium text-white hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="size-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search templates by name, plan, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pl-9 text-xs"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{filteredTemplates.length}</span>{" "}
          template(s)
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="flex items-center gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="size-5 shrink-0 text-rose-500" />
          <div className="flex-1">
            <p className="font-semibold">Failed to load quotation templates</p>
            <p className="text-xs text-rose-700">
              {error instanceof Error ? error.message : "An unexpected server error occurred."}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[280px] text-xs font-semibold text-slate-700">
                Template Name
              </TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Plan</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Validity</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Lines</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Subscriptions</TableHead>
              <TableHead className="text-xs font-semibold text-slate-700">Created</TableHead>
              <TableHead className="text-right text-xs font-semibold text-slate-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Loading Skeletons */}
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="ml-auto h-7 w-20" />
                  </TableCell>
                </TableRow>
              ))}

            {/* Empty State */}
            {!isLoading && !isError && filteredTemplates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="mx-auto flex max-w-sm flex-col items-center justify-center space-y-3">
                    <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <FileText className="size-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900">
                        {searchTerm ? "No matching templates found" : "No quotation templates yet"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {searchTerm
                          ? "Try adjusting your search criteria or clearing filters."
                          : "Create reusable quotation templates to standardize package offerings and accelerate sales drafting."}
                      </p>
                    </div>
                    {!searchTerm && (
                      <Button
                        size="sm"
                        onClick={() => navigate("/app/quotation-templates/new")}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="size-4 mr-1.5" />
                        Create First Template
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* Template Rows */}
            {!isLoading &&
              !isError &&
              filteredTemplates.map((template) => {
                const subCount = template._count?.subscriptions ?? 0;
                const linesCount = template.lines?.length ?? template._count?.lines ?? 0;

                return (
                  <TableRow
                    key={template.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80"
                    onClick={() => navigate(`/app/quotation-templates/${template.id}`)}
                  >
                    {/* Template Name & Notes */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <FileText className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 hover:text-indigo-600">
                            {template.name}
                          </p>
                          {template.notes && (
                            <p className="truncate text-[11px] text-slate-400 max-w-xs">
                              {template.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Plan */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Layers className="size-3.5 text-slate-400" />
                        <span className="font-medium">{template.plan?.name ?? `Plan #${template.planId}`}</span>
                        {template.plan?.billingPeriod && (
                          <Badge variant="outline" className="text-[10px] font-normal uppercase">
                            {template.plan.billingPeriod}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Validity Days */}
                    <TableCell className="text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3 text-slate-400" />
                        <span>{template.validityDays} days</span>
                      </div>
                    </TableCell>

                    {/* Lines Count */}
                    <TableCell>
                      <Badge variant="secondary" className="gap-1 text-[11px] font-normal">
                        <Package className="size-3 text-slate-500" />
                        {linesCount} item{linesCount === 1 ? "" : "s"}
                      </Badge>
                    </TableCell>

                    {/* Subscriptions Created */}
                    <TableCell className="text-xs text-slate-600">
                      <span className="font-medium text-slate-800">{subCount}</span>{" "}
                      subscription{subCount === 1 ? "" : "s"}
                    </TableCell>

                    {/* Created Date */}
                    <TableCell className="text-xs text-slate-500">
                      {formatDate(template.createdAt)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick create subscription button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCreateSubTemplate(template)}
                          className="h-7 gap-1 px-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 border-indigo-200"
                          title="Generate subscription from this template"
                        >
                          <Sparkles className="size-3" />
                          <span>Use</span>
                        </Button>

                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/app/quotation-templates/${template.id}`)}
                          className="size-7 p-0 text-slate-500 hover:text-slate-900"
                          title="Edit template"
                        >
                          <Edit className="size-3.5" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTemplateToDelete(template)}
                          className="size-7 p-0 text-slate-400 hover:text-rose-600"
                          title="Delete template"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {/* Create Subscription From Template Dialog */}
      <CreateFromTemplateDialog
        template={createSubTemplate}
        open={Boolean(createSubTemplate)}
        onOpenChange={(open) => !open && setCreateSubTemplate(null)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(templateToDelete)}
        onOpenChange={(open) => !open && setTemplateToDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-900 flex items-center gap-2">
              <AlertCircle className="size-5 text-rose-600" />
              Delete Quotation Template
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete template{" "}
              <strong className="text-slate-800">{templateToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {templateToDelete && (templateToDelete._count?.subscriptions ?? 0) > 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                <Info className="size-4 text-amber-600" />
                Linked Subscriptions Detected
              </div>
              <p>
                This template is currently associated with{" "}
                <strong>{templateToDelete._count?.subscriptions}</strong> subscription(s).
                The server prohibits deleting templates that have linked subscriptions.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-600">
              This action cannot be undone. Its pre-configured order line mappings will be removed permanently.
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTemplateToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={
                deleteMutation.isPending ||
                Boolean(templateToDelete && (templateToDelete._count?.subscriptions ?? 0) > 0)
              }
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

