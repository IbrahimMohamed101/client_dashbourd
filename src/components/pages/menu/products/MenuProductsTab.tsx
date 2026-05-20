import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import {
  flexRender,
  getCoreRowModel, useReactTable
} from "@tanstack/react-table";

import {
  useDeleteMenuProductMutation,
  useMenuProductsQuery,
  useToggleMenuProductAvailabilityMutation,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getProductColumns } from "../menu-columns";
import type { MenuProduct } from "@/types/menuTypes";

export function MenuProductsTab() {
  const [search, setSearch] = useState("");
  const [pricingFilter, setPricingFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: response, isLoading } = useMenuProductsQuery({
    q: debouncedSearch || undefined,
    pricingModel:
      pricingFilter !== "all"
        ? (pricingFilter as "fixed" | "per_100g")
        : undefined,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });
  
  const deleteMutation = useDeleteMenuProductMutation();
  const toggleAvailability = useToggleMenuProductAvailabilityMutation();
  const responseData = response?.data;
  const products = (
    Array.isArray(responseData) ? responseData : responseData?.items || []
  ) as MenuProduct[];
  
  const meta = responseData?.pagination ?? {
    total: products.length,
    pages: 1,
    page: 1,
    limit: pagination.pageSize,
  };

  const columns = useMemo(
    () =>
      getProductColumns({
        onToggleAvailability: (id, isAvailable) =>
          toggleAvailability.mutate({ id, isAvailable }),
        onDelete: setDeleteId,
      }),
    [toggleAvailability]
  );

  const table = useReactTable({
    data: products,
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
      title="المنتجات"
      description="أدر عناصر القائمة، نماذج التسعير، والتوفر قبل ربطها بالخيارات."
      action={
        <Button asChild>
          <Link to="/menu/products/create">
            <Plus data-icon="inline-start" />
            إضافة منتج
          </Link>
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <MenuSearchInput
            placeholder="بحث في المنتجات..."
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          />
          <Select
            value={pricingFilter}
            onValueChange={(v) => {
              setPricingFilter(v);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="نوع التسعير" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">كل الأسعار</SelectItem>
                <SelectItem value="fixed">سعر ثابت</SelectItem>
                <SelectItem value="per_100g">بالوزن</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
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
                      لا توجد منتجات بعد. أضف المنتجات الأساسية لتظهر هنا.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            table={table}
            totalItems={meta.total}
            itemsLabel="منتجات"
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
              حذف المنتج
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-right">
              هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.
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
