import type { ColumnDef } from "@tanstack/react-table";
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
  Ban,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Edit,
  Eye,
  MoreHorizontal,
  Ticket,
  Trash2,
} from "lucide-react";
import type {
  PromoCodeDisplayStatus,
  PromoCodeDTO,
  PromoCodeStateDTO,
} from "@/types/financeTypes";

export const promoCodeText = {
  code: "الكود",
  name: "الاسم",
  discount: "القيمة",
  usage: "الاستخدامات",
  expiresAt: "تاريخ الانتهاء",
  status: "الحالة",
  actions: "إجراءات",
  options: "خيارات التحكم",
  viewDetails: "عرض التفاصيل",
  edit: "تعديل الكود",
  delete: "حذف الكود",
  notSpecified: "غير محدد",
  unnamed: "بدون اسم",
  active: "نشط",
  expired: "منتهي",
  inactive: "غير نشط",
  percentage: "خصم مئوي",
  fixed: "مبلغ ثابت",
} as const;

export function getPromoCodeStatus(
  state: PromoCodeStateDTO
): PromoCodeDisplayStatus {
  if (state.isExpired) return "expired";

  if (state.isCurrentlyValid && state.isStarted && !state.isDeleted) {
    return "active";
  }

  return "inactive";
}

export function getPromoCodeName(promo: PromoCodeDTO): string {
  return promo.name?.ar || promo.name?.en || "";
}

export function formatPromoCodeDate(value: string | null | undefined): string {
  if (!value) return promoCodeText.notSpecified;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return promoCodeText.notSpecified;

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatPromoCodeDiscount(promo: PromoCodeDTO): string {
  if (promo.discountType === "percentage") {
    return `${promo.discountValue}%`;
  }

  return `${promo.discountValue} ${promo.currency || "SAR"}`;
}

const statusConfig: Record<
  PromoCodeDisplayStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    className: string;
  }
> = {
  active: {
    label: promoCodeText.active,
    icon: CheckCircle2,
    className:
      "gap-1.5 rounded-full border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-bold text-emerald-600",
  },
  expired: {
    label: promoCodeText.expired,
    icon: Clock,
    className:
      "gap-1.5 rounded-full border-orange-500/20 bg-orange-500/10 px-3 py-1 font-bold text-orange-600",
  },
  inactive: {
    label: promoCodeText.inactive,
    icon: Ban,
    className:
      "gap-1.5 rounded-full border-muted/30 bg-muted/40 px-3 py-1 font-bold text-muted-foreground",
  },
};

interface PromoCodesColumnsOptions {
  onEdit: (promo: PromoCodeDTO) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function getPromoCodesColumns({
  onEdit,
  onDelete,
  onView,
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
      header: promoCodeText.code,
      cell: ({ row }) => {
        const promo = row.original;
        const promoName = getPromoCodeName(promo);

        return (
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Ticket className="size-5" />
            </div>
            <div className="min-w-0">
              <span className="block font-mono text-lg font-black tracking-wider text-foreground/90 uppercase">
                {promo.code}
              </span>
              <span className="block max-w-48 truncate text-xs text-muted-foreground">
                {promoName || promoCodeText.unnamed}
              </span>
            </div>
          </div>
        );
      },
      enableHiding: false,
    },
    {
      accessorKey: "discountValue",
      header: promoCodeText.discount,
      cell: ({ row }) => {
        const promo = row.original;
        const isPercentage = promo.discountType === "percentage";

        return (
          <div className="flex flex-col">
            <span className="text-base font-bold">
              {formatPromoCodeDiscount(promo)}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase">
              {isPercentage ? promoCodeText.percentage : promoCodeText.fixed}
            </span>
          </div>
        );
      },
    },
    {
      id: "usage",
      header: promoCodeText.usage,
      cell: ({ row }) => {
        const promo = row.original;
        const usageCount = promo.currentUsageCount ?? promo.usedCount ?? 0;
        const usageLimit = promo.usageLimitTotal;
        const usagePercentage = usageLimit
          ? Math.min((usageCount / usageLimit) * 100, 100)
          : 0;

        return (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5" dir="ltr">
              <span className="text-base font-bold">{usageCount}</span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs text-muted-foreground">
                {usageLimit ?? "∞"}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-20 overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full origin-right bg-primary"
                style={{ transform: `scaleX(${usagePercentage / 100})` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "expiresAt",
      header: promoCodeText.expiresAt,
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium text-muted-foreground">
          <CalendarIcon className="size-4 opacity-50" />
          {formatPromoCodeDate(row.original.expiresAt)}
        </div>
      ),
    },
    {
      id: "derivedStatus",
      header: promoCodeText.status,
      cell: ({ row }) => {
        const status = getPromoCodeStatus(row.original.state);
        const config = statusConfig[status];
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
      header: promoCodeText.actions,
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
                {promoCodeText.options}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onView(promo.id)}
                className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 transition-colors focus:bg-primary/10 focus:text-primary"
              >
                <Eye className="size-4" />
                {promoCodeText.viewDetails}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(promo)}
                className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 transition-colors focus:bg-primary/10 focus:text-primary"
              >
                <Edit className="size-4" />
                {promoCodeText.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-muted-foreground/10" />
              <DropdownMenuItem
                onClick={() => onDelete(promo.id)}
                className="cursor-pointer gap-2.5 rounded-xl px-3 py-2 text-rose-500 transition-colors focus:bg-rose-500/10 focus:text-rose-600"
              >
                <Trash2 className="size-4" />
                {promoCodeText.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableHiding: false,
    },
  ];
}
