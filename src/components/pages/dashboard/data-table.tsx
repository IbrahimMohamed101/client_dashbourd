import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Columns3Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DataTable<TData, TValue>({
  columns,
  data: initialData,
  onTabChange,
  activeTab,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  title?: string;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
}) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  React.useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [activeTab]);

  const table = useReactTable({
    data: initialData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const rowCount = table.getFilteredRowModel().rows.length;

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="px-4 lg:px-6"
      dir="rtl"
    >
      <Card className="rounded-lg">
        <CardHeader className="gap-4 border-b pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                آخر النشاط
              </CardTitle>
              <CardDescription>
                أحدث الاشتراكات والطلبات التي يرجعها ملخص لوحة التحكم.
              </CardDescription>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label htmlFor="view-selector" className="sr-only">
                عرض
              </Label>
              <Select value={activeTab} onValueChange={onTabChange}>
                <SelectTrigger
                  className="flex w-full sm:w-52 @4xl/main:hidden"
                  size="sm"
                  id="view-selector"
                >
                  <SelectValue placeholder="اختر عرض" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectGroup>
                    <SelectItem value="subscriptions">
                      الاشتراكات الأخيرة
                    </SelectItem>
                    <SelectItem value="orders">الطلبات الأخيرة</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <TabsList className="hidden rounded-lg bg-muted/70 @4xl/main:flex">
                <TabsTrigger value="subscriptions">
                  الاشتراكات الأخيرة
                </TabsTrigger>
                <TabsTrigger value="orders">الطلبات الأخيرة</TabsTrigger>
              </TabsList>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Columns3Icon className="ml-2 size-4" />
                    الأعمدة
                    <ChevronDownIcon className="mr-2 size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {table
                    .getAllColumns()
                    .filter(
                      (column) =>
                        typeof column.accessorFn !== "undefined" &&
                        column.getCanHide()
                    )
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="text-right capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {typeof column.columnDef.header === "string"
                          ? column.columnDef.header
                          : column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="overflow-hidden rounded-lg border bg-background/40">
            <div className="overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow
                      key={headerGroup.id}
                      className="border-b hover:bg-transparent"
                    >
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="py-4 text-right text-xs font-semibold tracking-normal whitespace-nowrap text-muted-foreground uppercase"
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
                  {table.getRowModel().rows.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="border-b transition-colors last:border-0 hover:bg-muted/35"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="max-w-[280px] truncate py-4 text-right align-middle text-sm"
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
                        className="h-28 text-center text-muted-foreground"
                      >
                        لا توجد نتائج.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              إجمالي الصفوف ({rowCount})
            </div>
            <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-fit sm:justify-end lg:gap-8">
              <div className="hidden items-center gap-2 lg:flex">
                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                  الصفوف في الصفحة
                </Label>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectGroup>
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex w-fit items-center justify-center text-sm font-medium tabular-nums">
                صفحة {table.getState().pagination.pageIndex + 1} من{" "}
                {table.getPageCount() || 1}
              </div>

              <div className="mr-auto flex items-center gap-1 sm:mr-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="hidden size-8 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">الصفحة الأولى</span>
                  <ChevronsRightIcon className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">الصفحة السابقة</span>
                  <ChevronRightIcon className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">الصفحة التالية</span>
                  <ChevronLeftIcon className="size-4" />
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  className="hidden size-8 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">الصفحة الأخيرة</span>
                  <ChevronsLeftIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tabs>
  );
}
