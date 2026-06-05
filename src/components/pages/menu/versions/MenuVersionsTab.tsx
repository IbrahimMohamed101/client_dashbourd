import { useState } from "react";
import { RotateCcw } from "lucide-react";

import {
  useMenuVersionsQuery,
  useRollbackMenuVersionMutation,
} from "@/hooks/useMenuQuery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  MenuEmptyState,
  MenuSectionCard,
} from "@/components/pages/menu/MenuTabScaffold";
import type { MenuVersion } from "@/types/menuTypes";

const STATUS_LABELS: Record<string, string> = {
  saved: "محفوظ",
  published: "منشور",
  rolled_back: "مسترجع",
};

const formatDate = (date?: string) => {
  if (!date) return "-";

  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  } catch {
    return date;
  }
};

export function MenuVersionsTab() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const rollback = useRollbackMenuVersionMutation();
  const { data: response, isLoading } = useMenuVersionsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const responseData = response?.data;
  const versions = (
    Array.isArray(responseData) ? responseData : responseData?.items || []
  ) as MenuVersion[];
  const meta = responseData?.pagination ?? {
    total: versions.length,
    pages: 1,
    page: 1,
    limit: pagination.pageSize,
  };
  const pageCount = meta.pages || 1;

  const table = {
    getState: () => ({ pagination }),
    setPageIndex: (pageIndex: number) =>
      setPagination((prev) => ({ ...prev, pageIndex })),
    setPageSize: (pageSize: number) =>
      setPagination({ pageIndex: 0, pageSize }),
    getCanPreviousPage: () => pagination.pageIndex > 0,
    getCanNextPage: () => pagination.pageIndex + 1 < pageCount,
    previousPage: () =>
      setPagination((prev) => ({
        ...prev,
        pageIndex: Math.max(prev.pageIndex - 1, 0),
      })),
    nextPage: () =>
      setPagination((prev) => ({
        ...prev,
        pageIndex: Math.min(prev.pageIndex + 1, pageCount - 1),
      })),
    getPageCount: () => pageCount,
  };

  const handleRollback = (versionId: string) => {
    if (!window.confirm("هل تريد استرجاع القائمة إلى هذا الإصدار؟")) return;
    rollback.mutate(versionId);
  };

  return (
    <MenuSectionCard
      title="إصدارات القائمة"
      description="راجع الإصدارات المنشورة واسترجع إصدارا مؤكدا عند الحاجة."
    >
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 text-right">الإصدار</TableHead>
              <TableHead className="py-4 text-right">الحالة</TableHead>
              <TableHead className="py-4 text-right">تاريخ النشر</TableHead>
              <TableHead className="py-4 text-right">الملاحظات</TableHead>
              <TableHead className="py-4 text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  جار تحميل الإصدارات...
                </TableCell>
              </TableRow>
            ) : versions.length ? (
              versions.map((version) => {
                const status = version.status ?? "saved";

                return (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      {version.version ?? version.id}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {STATUS_LABELS[status] || status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(version.publishedAt ?? version.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate">
                      {version.notes ?? "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={rollback.isPending}
                        onClick={() => handleRollback(version.id)}
                      >
                        <RotateCcw data-icon="inline-start" />
                        استرجاع
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <MenuEmptyState
                    title="لا توجد إصدارات بعد"
                    description="ستظهر إصدارات القائمة المنشورة هنا."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table as never}
        totalItems={meta.total}
        itemsLabel="إصدارات"
      />
    </MenuSectionCard>
  );
}
