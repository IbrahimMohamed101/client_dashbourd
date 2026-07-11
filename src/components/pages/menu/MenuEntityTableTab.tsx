import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";

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
  MenuLoadingTable,
  MenuSearchInput,
  MenuSectionCard,
  MenuTableFrame,
  MenuToolbar,
} from "@/components/pages/menu/MenuTabScaffold";
import type { MenuListParams, PaginatedResponse } from "@/types/menuTypes";

type MenuCreatePath =
  | "/menu/categories/create"
  | "/menu/products/create"
  | "/menu/option-groups/create"
  | "/menu/options/create";

interface QueryResult<T> {
  data?: PaginatedResponse<T>;
  isLoading: boolean;
  isError?: boolean;
}

interface DeleteMutation {
  mutateAsync: (id: string) => Promise<unknown>;
}

interface MenuEntityTableTabProps<
  TData,
  TParams extends MenuListParams = MenuListParams,
> {
  title: string;
  description: string;
  createTo: MenuCreatePath;
  createLabel: string;
  searchPlaceholder: string;
  itemsLabel: string;
  emptyMessage: string;
  deleteTitle: string;
  deleteDescription: string;
  columns: (onDelete: (id: string) => void) => ColumnDef<TData>[];
  useQuery: (params: TParams) => QueryResult<TData>;
  useDeleteMutation: () => DeleteMutation;
  buildQueryParams?: (params: MenuListParams) => TParams;
  renderToolbarFilters?: (resetPagination: () => void) => ReactNode;
}

export function MenuEntityTableTab<
  TData,
  TParams extends MenuListParams = MenuListParams,
>({
  title,
  description,
  createTo,
  createLabel,
  searchPlaceholder,
  itemsLabel,
  emptyMessage,
  deleteTitle,
  deleteDescription,
  columns: getColumns,
  useQuery,
  useDeleteMutation,
  buildQueryParams,
  renderToolbarFilters,
}: MenuEntityTableTabProps<TData, TParams>) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const resetPagination = () =>
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const baseParams: MenuListParams = {
    q: debouncedSearch || undefined,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  };
  const queryParams = buildQueryParams
    ? buildQueryParams(baseParams)
    : (baseParams as TParams);
  const { data: response, isLoading, isError } = useQuery(queryParams);
  const deleteMutation = useDeleteMutation();

  const items = response?.data.items ?? [];
  const meta = response?.data.pagination ?? {
    total: items.length,
    pages: 1,
    page: 1,
    limit: pagination.pageSize,
  };

  const columns = useMemo(() => getColumns(setDeleteId), [getColumns]);
  const table = useReactTable({
    data: items,
    columns,
    state: { pagination },
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
      // Error handled by mutation defaults.
    }
  }

  return (
    <MenuSectionCard
      title={title}
      description={description}
      action={
        <Button asChild>
          <Link to={createTo}>
            <Plus data-icon="inline-start" />
            {createLabel}
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <MenuToolbar>
          <div className="flex w-full items-center gap-3">
            <MenuSearchInput
              placeholder={searchPlaceholder}
              value={search}
              onChange={(value) => {
                setSearch(value);
                resetPagination();
              }}
            />
            {renderToolbarFilters?.(resetPagination)}
            <DataTableViewOptions table={table} />
          </div>
        </MenuToolbar>

        <div className="relative flex flex-col gap-4 overflow-auto">
          {isLoading ? (
            <MenuLoadingTable columns={columns.length} />
          ) : (
            <MenuTableFrame>
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
                  {isError ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-destructive"
                      >
                        تعذر تحميل البيانات. حاول تحديث الصفحة أو تحقق من الاتصال.
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
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </MenuTableFrame>
          )}

          <DataTablePagination
            table={table}
            totalItems={meta.total}
            itemsLabel={itemsLabel}
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
              {deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-right">
              {deleteDescription}
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
