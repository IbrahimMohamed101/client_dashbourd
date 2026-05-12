import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
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
import { PlusIcon, SearchIcon, Ticket, Trash2 } from "lucide-react";
import { DataTableViewOptions } from "@/components/ui/data-table-view-options";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { getPromoCodesColumns } from "./promo-codes-columns";
import {
  usePromoCodesListQuery,
  useDeletePromoCodeMutation,
} from "@/hooks/usePromoCodesQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import type { PromoCodeDTO } from "@/types/financeTypes";
import { PromoCodeDialog } from "./PromoCodeDialog";

export function PromoCodesTable() {
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [globalFilter, setGlobalFilter] = React.useState("");
  const debouncedSearch = useDebounce(globalFilter, 500);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editData, setEditData] = React.useState<PromoCodeDTO | undefined>();

  // Delete state
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const deleteMutation = useDeletePromoCodeMutation();

  const { data: response, isLoading } = usePromoCodesListQuery(
    pagination.pageIndex + 1,
    pagination.pageSize,
    debouncedSearch
  );

  const data = response?.data || [];
  const meta = response?.meta || {
    total: 0,
    totalPages: 1,
    currentPage: 1,
    lastPage: 1,
  };

  const handleEdit = React.useCallback((promo: PromoCodeDTO) => {
    setEditData(promo);
    setIsDialogOpen(true);
  }, []);

  const handleAdd = React.useCallback(() => {
    setEditData(undefined);
    setIsDialogOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("تم حذف الكوبون بنجاح");
      setDeleteId(null);
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  const handleSetDeleteId = React.useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const columns = React.useMemo(
    () => getPromoCodesColumns({ onEdit: handleEdit, onDelete: handleSetDeleteId }),
    [handleEdit, handleSetDeleteId]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    pageCount: meta.lastPage ?? meta.totalPages,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="w-full flex-col justify-start gap-6" dir="rtl">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="w-40" size="sm">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectGroup>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="expired">منتهي</SelectItem>
                <SelectItem value="disabled">معطل</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Search box */}
          <div className="relative flex-1">
            <SearchIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="البحث عن كود خصم..."
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
              }}
              className="max-w-lg pr-9"
            />
          </div>

          {/* Add button */}
          <Button onClick={handleAdd} className="bg-primary">
            <PlusIcon />
            إضافة كوبون جديد
          </Button>

          {/* Column visibility */}
          <DataTableViewOptions table={table} />
        </div>
      </div>

      {/* Table */}
      <div className="relative mt-4 flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
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
                      <td key={cell.id} className="px-4 py-4 text-right">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-64 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-4 opacity-50 grayscale">
                      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                        <Ticket className="size-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-muted-foreground">
                          لا توجد كوبونات خصم
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground/60">
                          جرب تغيير كلمة البحث أو أضف كوبوناً جديداً
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <DataTablePagination
          table={table}
          totalItems={meta.total}
          itemsLabel="الكوبونات"
        />
      </div>

      {/* Create/Edit Dialog */}
      <PromoCodeDialog
        key={editData?.id ?? "new"}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editData={editData}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-black">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Trash2 className="size-5" />
              </div>
              هل أنت متأكد من الحذف؟
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-right font-medium text-muted-foreground">
              سيتم حذف كوبون الخصم بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="h-11 rounded-xl bg-rose-500 px-6 transition-all hover:bg-rose-600 active:scale-95"
            >
              نعم، احذف الكوبون
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-11 rounded-xl border-muted-foreground/10 px-6 hover:bg-muted/50">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
