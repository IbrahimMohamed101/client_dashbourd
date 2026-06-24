import { useCallback, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
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
import { Switch } from "@/components/ui/switch";
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
import { Archive, PlusIcon, SearchIcon, Ticket } from "lucide-react";
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
  useTogglePromoCodeMutation,
} from "@/hooks/usePromoCodesQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import type { PromoCodeDTO, StatusFilter } from "@/types/financeTypes";
import { PromoCodeDialog } from "./PromoCodeDialog";
import PromoCodeDetailDialog from "./PromoCodeDetailDialog";
import { PromoCodeValidationDialog } from "./PromoCodeValidationDialog";

interface PromoCodesToolbarProps {
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  includeDeleted: boolean;
  onIncludeDeletedChange: (value: boolean) => void;
  onAdd: () => void;
  table: ReturnType<typeof useReactTable<PromoCodeDTO>>;
}

function readApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data;

    if (
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof data.error === "object" &&
      data.error !== null &&
      "message" in data.error &&
      typeof data.error.message === "string"
    ) {
      return data.error.message;
    }
  }

  return fallback;
}

function PromoCodesToolbar({
  statusFilter,
  onStatusFilterChange,
  searchInput,
  onSearchInputChange,
  includeDeleted,
  onIncludeDeletedChange,
  onAdd,
  table,
}: PromoCodesToolbarProps) {
  return (
    <div className="rounded-xl border border-muted-foreground/10 bg-card px-3 py-2.5 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              onStatusFilterChange(value as StatusFilter)
            }
          >
            <SelectTrigger className="w-full sm:w-44" size="sm">
              <SelectValue placeholder={promoCodeText.status} />
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectGroup>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="active">{promoCodeText.active}</SelectItem>
                <SelectItem value="expired">{promoCodeText.expired}</SelectItem>
                <SelectItem value="inactive">
                  {promoCodeText.inactive}
                </SelectItem>
                <SelectItem value="archived">
                  {promoCodeText.archived}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <label className="flex h-9 items-center justify-between gap-3 rounded-xl border border-muted-foreground/10 px-3 text-sm font-medium sm:min-w-44">
            <span>عرض المؤرشفة</span>
            <Switch
              checked={includeDeleted}
              onCheckedChange={onIncludeDeletedChange}
            />
          </label>
        </div>

        <div className="relative min-w-0 flex-1">
          <SearchIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث عن الكود، الاسم أو الوصف..."
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            className="pr-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onAdd} className="bg-primary">
            <PlusIcon />
            إضافة كود جديد
          </Button>

          <DataTableViewOptions table={table} />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        البحث والصفحات تتم محليًا لضمان تجربة مستقرة لأن العقد الحالي لا يضمن
        دعم q/page/limit من الباك اند.
      </p>
    </div>
  );
}

function buildPromoSearchText(promo: PromoCodeDTO): string {
  const metadataName =
    promo.metadata &&
    typeof promo.metadata === "object" &&
    "name" in promo.metadata &&
    typeof promo.metadata.name === "object" &&
    promo.metadata.name !== null
      ? Object.values(promo.metadata.name as Record<string, unknown>)
          .filter((value): value is string => typeof value === "string")
          .join(" ")
      : "";

  return [
    promo.code,
    getPromoCodeName(promo),
    promo.title,
    promo.description,
    metadataName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function PromoCodesTable() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState<PromoCodeDTO | undefined>();
  const [archivePromo, setArchivePromo] = useState<PromoCodeDTO | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [validationPromo, setValidationPromo] = useState<PromoCodeDTO | null>(
    null
  );
  const archiveMutation = useDeletePromoCodeMutation();
  const toggleMutation = useTogglePromoCodeMutation();
  const { data: response, isLoading } = usePromoCodesListQuery(includeDeleted);

  const handleTogglePromo = useCallback(
    async (promo: PromoCodeDTO) => {
      try {
        await toggleMutation.mutateAsync(promo.id);
        toast.success(
          promo.isActive ? "تم تعطيل كود الخصم" : "تم تفعيل كود الخصم"
        );
      } catch (error) {
        toast.error(
          readApiErrorMessage(error, "حدث خطأ أثناء تغيير حالة كود الخصم")
        );
      }
    },
    [toggleMutation]
  );

  const data = useMemo(() => {
    const serverData = response?.data || [];
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const searchFilteredData = normalizedSearchQuery
      ? serverData.filter((promo) =>
          buildPromoSearchText(promo).includes(normalizedSearchQuery)
        )
      : serverData;

    if (statusFilter === "all") {
      return searchFilteredData;
    }

    return searchFilteredData.filter(
      (promo) => getPromoCodeStatus(promo.state) === statusFilter
    );
  }, [response?.data, searchQuery, statusFilter]);

  const columns = useMemo(
    () =>
      getPromoCodesColumns({
        onEdit: (promo) => {
          setEditData(promo);
          setIsDialogOpen(true);
        },
        onArchive: setArchivePromo,
        onView: setDetailId,
        onValidate: setValidationPromo,
        onToggle: handleTogglePromo,
        isActionPending: archiveMutation.isPending || toggleMutation.isPending,
      }),
    [archiveMutation.isPending, handleTogglePromo, toggleMutation.isPending]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  async function handleArchiveConfirm() {
    if (!archivePromo) return;

    try {
      await archiveMutation.mutateAsync(archivePromo.id);
      toast.success("تمت أرشفة كود الخصم وتعطيله بنجاح");
      setArchivePromo(null);
    } catch (error) {
      toast.error(readApiErrorMessage(error, "حدث خطأ أثناء أرشفة كود الخصم"));
    }
  }

  function handleAdd() {
    setEditData(undefined);
    setIsDialogOpen(true);
  }

  function resetFirstPage() {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value);
    resetFirstPage();
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value);
    resetFirstPage();
  }

  function handleIncludeDeletedChange(value: boolean) {
    setIncludeDeleted(value);
    resetFirstPage();
  }

  return (
    <div
      className="flex min-h-[32rem] w-full flex-1 flex-col justify-start gap-3"
      dir="rtl"
    >
      <PromoCodesToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        searchInput={searchInput}
        onSearchInputChange={handleSearchInputChange}
        includeDeleted={includeDeleted}
        onIncludeDeletedChange={handleIncludeDeletedChange}
        onAdd={handleAdd}
        table={table}
      />

      <div className="relative flex min-h-[27rem] flex-1 flex-col gap-2 overflow-hidden">
        <div
          className="min-h-0 flex-1 overflow-auto rounded-xl border bg-card shadow-sm"
          style={{ contain: "layout paint" }}
        >
          <Table className="min-w-[1214px] table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="border-b hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-11 px-4 py-2 text-right text-xs font-black text-muted-foreground"
                      style={{ width: header.getSize() }}
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
                  <TableRow key={row.id} className="h-[66px]">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-2 text-right align-middle"
                        style={{ width: cell.column.getSize() }}
                      >
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
                    className="h-64 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-4 opacity-70">
                      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                        <Ticket className="size-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-muted-foreground">
                          لا توجد أكواد خصم.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground/70">
                          جرّب تغيير الفلاتر أو أضف كود خصم جديد للاشتراكات.
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
          totalItems={data.length}
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

      <PromoCodeValidationDialog
        promoCode={validationPromo}
        onClose={() => setValidationPromo(null)}
      />

      <AlertDialog
        open={Boolean(archivePromo)}
        onOpenChange={(open) => !open && setArchivePromo(null)}
      >
        <AlertDialogContent
          className="rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl"
          dir="rtl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-black">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Archive className="size-5" />
              </div>
              هل تريد أرشفة كود الخصم؟
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-right font-medium text-muted-foreground">
              سيتم أرشفة كود الخصم وتعطيله. هل تريد المتابعة؟
              {archivePromo ? (
                <span
                  className="mt-3 block font-mono text-sm font-black text-foreground uppercase"
                  dir="ltr"
                >
                  {archivePromo.code}
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={archiveMutation.isPending}
              className="h-11 rounded-xl bg-rose-500 px-6 transition-all hover:bg-rose-600 active:scale-95"
            >
              {archiveMutation.isPending
                ? "جاري الأرشفة..."
                : "نعم، أرشف الكود"}
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
