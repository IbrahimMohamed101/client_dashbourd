import type { ColumnDef } from "@tanstack/react-table";
import type { Package } from "@/types/packageTypes";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { StatusBadge } from "./StatusBadge";
import { fetchRemovePackage } from "@/utils/fetchRemovePackage";
import { ToastMessage } from "@/components/global/ToastMessage";

async function removePackage(pkg: Package) {
  const confirmed = window.confirm(
    `تأكيد إزالة الباقة: ${pkg.name.ar}?\nقد يرفض النظام العملية إذا كانت الباقة مستخدمة في اشتراكات حالية.`
  );

  if (!confirmed) return;

  try {
    await fetchRemovePackage(pkg._id);
    ToastMessage("تمت إزالة الباقة بنجاح", "success");
    window.location.reload();
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    ToastMessage(
      err?.response?.data?.message || "تعذرت إزالة الباقة",
      "error"
    );
  }
}

export const packagesColumns: ColumnDef<Package>[] = [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <span className="font-medium text-muted-foreground">{row.index + 1}</span>
    ),
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "name.ar",
    header: "اسم الباقة بالعربي",
    cell: ({ row }) => (
      <span className="font-semibold">{row.original.name.ar}</span>
    ),
    filterFn: (row, _columnId, filterValue) => {
      const nameAr = row.original.name.ar.toLowerCase();
      const nameEn = row.original.name.en.toLowerCase();
      const search = filterValue.toLowerCase();
      return nameAr.includes(search) || nameEn.includes(search);
    },
  },
  {
    accessorKey: "name.en",
    header: "Name [EN]",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.name.en}</span>
    ),
  },
  {
    accessorKey: "daysCount",
    header: "عدد الأيام",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.daysCount}</span>
    ),
  },
  {
    accessorKey: "isActive",
    header: "الحالة",
    cell: ({ row }) => <StatusBadge pkg={row.original} />,
    filterFn: (row, _columnId, filterValue) => {
      if (filterValue === "all") return true;
      return filterValue === "active"
        ? row.original.isActive
        : !row.original.isActive;
    },
  },
  {
    accessorKey: "sortOrder",
    header: "الترتيب",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.sortOrder}</span>
    ),
  },
  {
    id: "gramsOptions",
    header: "خيارات الجرام",
    cell: ({ row }) => {
      const count = row.original.gramsOptions?.length || 0;
      return (
        <Badge variant="secondary" className="font-medium">
          {count} خيارات
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "الإجراءات",
    cell: ({ row }) => (
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/packages/$planId/update" params={{ planId: row.original._id }}>
            <PencilIcon className="ml-1 size-3.5" />
            تعديل
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => removePackage(row.original)}
        >
          <Trash2Icon className="ml-1 size-3.5" />
          إزالة
        </Button>
      </div>
    ),
    enableHiding: false,
  },
];
