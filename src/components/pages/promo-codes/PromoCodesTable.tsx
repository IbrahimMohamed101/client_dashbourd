import { useMemo, useState } from "react";
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
import {
  getPromoCodeName,
  getPromoCodeStatus,
  getPromoCodesColumns,
  promoCodeText,
} from "./promo-codes-columns";
import {
  useDeletePromoCodeMutation,
  usePromoCodesListQuery,
} from "@/hooks/usePromoCodesQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import type { PromoCodeDTO, StatusFilter } from "@/types/financeTypes";
import { PromoCodeDialog } from "./PromoCodeDialog";
import PromoCodeDetailDialog from "./PromoCodeDetailDialog";

interface PromoCodesToolbarProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onAdd: () => void;
  table: ReturnType<typeof useReactTable<PromoCodeDTO>>;
}

function PromoCodesToolbar({
  statusFilter,
  onStatusFilterChange,
  searchInput,
  onSearchInputChange,
  onAdd,
  table,
}: PromoCodesToolbarProps) {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusFilterChange(value as StatusFilter)}
        >
          <SelectTrigger className="w-40" size="sm">
            <SelectValue placeholder={promoCodeText.status} />
          </SelectTrigger>
          <SelectContent dir="rtl">
            <SelectGroup>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="active">{promoCodeText.active}</SelectItem>
              <SelectItem value="expired">{promoCodeText.expired}</SelectItem>
              <SelectItem value="inactive">{promoCodeText.inactive}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <SearchIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث عن كود خصم..."
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            className="max-w-lg pr-9"
          />
        </div>

        <Button onClick={onAdd} className="bg-primary">
          <PlusIcon />
          إضافة كود جديد
        </Button>

        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

export function PromoCodesTable() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 500);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState<PromoCodeDTO | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const deleteMutation = useDeletePromoCodeMutation();
  const { data: response, isLoading } = usePromoCodesListQuery(
    pagination.pageIndex + 1,
    pagination.pageSize,
    searchQuery
  );

  const data = useMemo(() => {
    const serverData = response?.data || [];
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const searchFilteredData = normalizedSearchQuery
      ? serverData.filter((promo) => {
          const promoName = getPromoCodeName(promo).toLowerCase();
          const promoCode = promo.code.toLowerCase();
          return (
            promoCode.includes(normalizedSearchQuery) ||
            promoName.includes(normalizedSearchQuery)
          );
        })
      : serverData;

    if (statusFilter === "all") {
      return searchFilteredData;
    }

    return searchFilteredData.filter(
      (promo) => getPromoCodeStatus(promo.state) === statusFilter
    );
  }, [response?.data, searchQuery, statusFilter]);

  const meta = response?.meta || {
    total: 0,
    totalPages: 1,
    currentPage: 1,
    lastPage: 1,
  };

  // Stable column definitions avoid unnecessary react-table recalculation.
  const columns = useMemo(
    () =>
      getPromoCodesColumns({
        onEdit: (promo) => {
          setEditData(promo);
          setIsDialogOpen(true);
        },
        onDelete: setDeleteId,
        onView: setDetailId,
      }),
    []
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

  async function handleDeleteConfirm() {
    if (!deleteId) return;

    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("تم حذف كود الخصم بنجاح");
      setDeleteId(null);
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  }

  function handleAdd() {
    setEditData(undefined);
    setIsDialogOpen(true);
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  return (
    <div className="w-full flex-col justify-start gap-6" dir="rtl">
      <PromoCodesToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        searchInput={searchInput}
        onSearchInputChange={handleSearchInputChange}
        onAdd={handleAdd}
        table={table}
      />

      <div className="relative mt-4 flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div
          className="overflow-hidden rounded-lg border bg-card"
          style={{ contain: "layout paint" }}
        >
          <Table className="table-fixed">
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
                          لا توجد أكواد خصم
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground/60">
                          جرّب تغيير كلمة البحث أو أضف كودًا جديدًا
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination
          table={table}
          totalItems={meta.total}
          itemsLabel="أكواد الخصم"
        />
      </div>

      <PromoCodeDialog
        key={editData?.id ?? "new"}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editData={editData}
      />

      <PromoCodeDetailDialog
        promoCodeId={detailId}
        onClose={() => setDetailId(null)}
      />

      <AlertDialog
        open={Boolean(deleteId)}
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
              سيتم حذف كود الخصم بشكل ناعم مع الحفاظ على سجل الاستخدامات.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="h-11 rounded-xl bg-rose-500 px-6 transition-all hover:bg-rose-600 active:scale-95"
            >
              نعم، احذف الكود
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
