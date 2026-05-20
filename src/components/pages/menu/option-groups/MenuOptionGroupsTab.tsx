import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  useDeleteMenuOptionGroupMutation,
  useMenuOptionGroupsQuery,
} from "@/hooks/useMenuQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  MenuSearchInput,
  MenuSectionCard,
} from "@/components/pages/menu/MenuTabScaffold";
import { getOptionGroupColumns } from "../menu-columns";
import type { MenuOptionGroup } from "@/types/menuTypes";

export function MenuOptionGroupsTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: response, isLoading } = useMenuOptionGroupsQuery({
    q: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });
  
  const deleteMutation = useDeleteMenuOptionGroupMutation();
  const responseData = response?.data;
  const groups = (
    Array.isArray(responseData) ? responseData : responseData?.items || []
  ) as MenuOptionGroup[];
    

  const meta = responseData?.pagination ?? {
    total: groups.length,
    pages: 1,
    page: 1,
    limit: pagination.pageSize,
  };

  const columns = useMemo(
    () =>
      getOptionGroupColumns({
        onDelete: setDeleteId,
      }),
    []
  );

  const table = useReactTable({
    data: groups,
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

  async function handleDeleteConfirm() {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // Error handled by mutation defaults
    }
  }

  return (
    <MenuSectionCard
      title="مجموعات الخيارات"
      description="حدد مجموعات الإضافات التي يمكن ربطها بالمنتجات مثل الحجم أو نوع البروتين."
      action={
        <Button asChild>
          <Link to="/menu/option-groups/create">
            <Plus data-icon="inline-start" />
            إضافة مجموعة
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <MenuSearchInput
            placeholder="بحث في المجموعات..."
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
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : undefined,
                        }}
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
                      لا توجد مجموعات خيارات. أنشئ مجموعة مثل اختيار الحجم أو الصوص.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            table={table}
            totalItems={meta.total}
            itemsLabel="مجموعات"
          />
        </div>
      </div>

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Trash2 className="size-5" />
              </div>
              حذف المجموعة
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-right">
              هل أنت متأكد من حذف هذه المجموعة؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              نعم، احذف
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MenuSectionCard>
  );
}
