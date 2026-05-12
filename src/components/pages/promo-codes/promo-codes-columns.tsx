import type { ColumnDef } from "@tanstack/react-table";
import type { PromoCodeDTO } from "@/types/financeTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Ticket,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const statusConfig: Record<
  PromoCodeDTO["status"],
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  active: {
    label: "نشط",
    icon: CheckCircle2,
    className:
      "gap-1.5 rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-bold text-emerald-500",
  },
  expired: {
    label: "منتهي",
    icon: Clock,
    className:
      "gap-1.5 rounded-full border-orange-500/20 bg-orange-500/10 px-3 py-1 font-bold text-orange-500",
  },
  disabled: {
    label: "معطل",
    icon: Ban,
    className:
      "gap-1.5 rounded-full border-rose-500/20 bg-rose-500/10 px-3 py-1 font-bold text-rose-500",
  },
};

const defaultStatusConfig = {
  label: "غير معروف",
  icon: Ticket,
  className: "gap-1.5 rounded-full border-muted/20 bg-muted/10 px-3 py-1 font-bold text-muted-foreground",
};

interface PromoCodesColumnsOptions {
  onEdit: (promo: PromoCodeDTO) => void;
  onDelete: (id: string) => void;
}

export function getPromoCodesColumns({
  onEdit,
  onDelete,
}: PromoCodesColumnsOptions): ColumnDef<PromoCodeDTO>[] {
  return [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => (
        <span className="font-medium text-muted-foreground">
          {row.index + 1}
        </span>
      ),
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "code",
      header: "الكود",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Ticket className="size-5" />
          </div>
          <span className="font-mono text-lg font-black tracking-wider text-foreground/90 uppercase">
            {row.original.code}
          </span>
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "discountValue",
      header: "القيمة",
      cell: ({ row }) => {
        const promo = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-base font-bold">
              {promo.discountType === "percentage"
                ? `${promo.discountValue}%`
                : `${promo.discountValue} ر.س`}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">
              {promo.discountType === "percentage" ? "خصم مئوي" : "مبلغ ثابت"}
            </span>
          </div>
        );
      },
    },
    {
      id: "usage",
      header: "الاستخدامات",
      cell: ({ row }) => {
        const promo = row.original;
        return (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold">{promo.usageCount}</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">
                {promo.maxUsage || "∞"}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min((promo.usageCount / (promo.maxUsage || promo.usageCount + 10)) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "expiryDate",
      header: "تاريخ الانتهاء",
      cell: ({ row }) => {
        const expiryDate = row.original.expiryDate;
        const isValid =
          expiryDate && !isNaN(new Date(expiryDate).getTime());
        return (
          <div className="flex items-center gap-2 font-medium text-muted-foreground">
            <CalendarIcon className="size-4 opacity-50" />
            {isValid ? (
              format(new Date(expiryDate), "dd MMM yyyy", { locale: ar })
            ) : (
              <span className="text-muted-foreground/50 italic">غير محدد</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const status = row.original.status;
        const config = statusConfig[status] || defaultStatusConfig;
        const Icon = config.icon;
        return (
          <Badge variant="outline" className={config.className}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "إجراءات",
      cell: ({ row }) => {
        const promo = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="size-10 rounded-xl p-0 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-muted-foreground/10 p-2 shadow-2xl"
            >
              <DropdownMenuLabel className="px-3 pb-2 text-xs font-bold text-muted-foreground">
                خيارات التحكم
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onEdit(promo)}
                className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 transition-colors focus:bg-primary/10 focus:text-primary"
              >
                <Edit className="size-4" />
                تعديل الكوبون
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-muted-foreground/10" />
              <DropdownMenuItem
                onClick={() => onDelete(promo.id)}
                className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-rose-500 transition-colors focus:bg-rose-500/10 focus:text-rose-600"
              >
                <Trash2 className="size-4" />
                حذف الكوبون
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
    },
  ];
}
