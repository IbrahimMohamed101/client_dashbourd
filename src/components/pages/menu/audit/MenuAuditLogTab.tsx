import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useMenuAuditLogsQuery } from "@/hooks/useMenuQuery";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import {
  MenuEmptyState,
  MenuSearchInput,
  MenuSectionCard,
} from "@/components/pages/menu/MenuTabScaffold";
import { getAuditLogColumns } from "../menu-columns";
import type { MenuAuditLog } from "@/types/menuTypes";

export function MenuAuditLogTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: response, isLoading } = useMenuAuditLogsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const responseData = response?.data;
  const logs = (
    Array.isArray(responseData) ? responseData : responseData?.items || []
  ) as MenuAuditLog[];

  const meta = (responseData as any)?.pagination || {
    total: logs.length,
    pages: 1,
    page: 1,
    limit: pagination.pageSize,
  };

  const columns = useMemo(() => getAuditLogColumns(), []);

  const table = useReactTable({
    data: logs,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: meta.pages,
    autoResetPageIndex: false,
  });

  return (
    <MenuSectionCard
      title="سجل التغييرات"
      description="راجع آخر عمليات الإنشاء والتعديل والحذف والنشر داخل دورة القائمة."
    >
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <MenuSearchInput
            placeholder="بحث في السجلات..."
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
          <DataTableViewOptions table={table} />
        </div>

        {/* Table Area */}
        <div className="relative flex flex-col gap-4 overflow-auto">
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-b hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="py-4 text-right font-medium"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-4 text-right">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      <MenuEmptyState
                        title="لا توجد سجلات بعد"
                        description="ستظهر هنا العمليات التي تتم على التصنيفات والمنتجات والخيارات."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            table={table}
            totalItems={meta.total}
            itemsLabel="سجلات"
          />
        </div>
      </div>
    </MenuSectionCard>
  );
}
