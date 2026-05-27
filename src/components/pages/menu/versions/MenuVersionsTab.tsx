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
    if (!window.confirm("Rollback menu to this version?")) return;
    rollback.mutate(versionId);
  };

  return (
    <MenuSectionCard
      title="Menu versions"
      description="Review published menu versions and restore a confirmed version when needed."
    >
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 text-right">Version</TableHead>
              <TableHead className="py-4 text-right">Status</TableHead>
              <TableHead className="py-4 text-right">Published</TableHead>
              <TableHead className="py-4 text-right">Notes</TableHead>
              <TableHead className="py-4 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading versions...
                </TableCell>
              </TableRow>
            ) : versions.length ? (
              versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-medium">
                    {version.version ?? version.id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{version.status ?? "saved"}</Badge>
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
                      Rollback
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <MenuEmptyState
                    title="No versions yet"
                    description="Published menu versions will appear here."
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
        itemsLabel="versions"
      />
    </MenuSectionCard>
  );
}
