import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { Copy, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MenuKeyBadge, MenuStatusBadge } from "./MenuTabScaffold";
import type {
  MenuCategory,
  MenuProduct,
  MenuOptionGroup,
  MenuOption,
  MenuAuditLog,
} from "@/types/menuTypes";

const ACTION_LABELS: Record<string, string> = {
  create: "إنشاء",
  update: "تحديث",
  delete: "حذف",
  publish: "نشر",
  validate: "تحقق",
};

const ENTITY_LABELS: Record<string, string> = {
  category: "تصنيف",
  product: "منتج",
  option_group: "مجموعة خيارات",
  option: "خيار",
  menu: "القائمة",
};

const formatDate = (dateStr: string) => {
  try {
    return new Intl.DateTimeFormat("ar-SA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
};

const formatPrice = (halala: number) => (halala / 100).toFixed(2);

interface CategoryActions {
  onDelete: (id: string) => void;
}

export const getCategoryColumns = ({
  onDelete,
}: CategoryActions): ColumnDef<MenuCategory>[] => [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">{row.index + 1}</div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "key",
    header: "المفتاح",
    cell: ({ row }) => <MenuKeyBadge value={row.original.key} />,
  },
  {
    id: "nameAr",
    accessorFn: (row) => row.name.ar,
    header: "الاسم العربي",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name.ar}</span>
    ),
  },
  {
    id: "nameEn",
    accessorFn: (row) => row.name.en,
    header: "الاسم الإنجليزي",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.name.en}</span>
    ),
  },
  {
    accessorKey: "isActive",
    header: () => <div className="text-center">الحالة</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <MenuStatusBadge
          active={row.original.isActive}
          activeLabel="نشط"
          inactiveLabel="غير نشط"
        />
      </div>
    ),
  },
  {
    accessorKey: "isAvailable",
    header: () => <div className="text-center">التوفر</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <MenuStatusBadge
          active={row.original.isAvailable}
          activeLabel="متوفر"
          inactiveLabel="غير متوفر"
        />
      </div>
    ),
  },
  {
    accessorKey: "sortOrder",
    header: () => <div className="text-center">الترتيب</div>,
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">
        {row.original.sortOrder}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-center">الإجراءات</div>,
    cell: ({ row }) => {
      const cat = row.original;
      return (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/menu/categories/$categoryId/update"
              params={{ categoryId: cat.id }}
            >
              <Pencil data-icon="inline-start" />
              تعديل
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(cat.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      );
    },
    size: 150,
  },
];

interface ProductActions {
  onToggleAvailability: (id: string, isAvailable: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const getProductColumns = ({
  onToggleAvailability,
  onDuplicate,
  onDelete,
}: ProductActions): ColumnDef<MenuProduct>[] => [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">{row.index + 1}</div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "key",
    header: "المفتاح",
    cell: ({ row }) => <MenuKeyBadge value={row.original.key} />,
  },
  {
    id: "product",
    header: "المنتج",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex min-w-44 flex-col gap-1">
          <span className="font-medium">{product.name?.ar}</span>
          <span className="text-xs text-muted-foreground">
            {product.name?.en}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "itemType",
    header: "النوع",
    cell: ({ row }) => <Badge variant="outline">{row.original.itemType}</Badge>,
  },
  {
    accessorKey: "pricingModel",
    header: "التسعير",
    cell: ({ row }) => {
      const isFixed = row.original.pricingModel === "fixed";
      return (
        <Badge variant={isFixed ? "secondary" : "default"}>
          {isFixed ? "ثابت" : "بالوزن"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "priceHalala",
    header: () => <div className="text-center">السعر</div>,
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="text-center font-medium">
          {formatPrice(product.priceHalala)} ر.س
          {product.pricingModel === "per_100g" ? (
            <span className="block text-xs text-muted-foreground">
              لكل {product.baseUnitGrams || 100}غ
            </span>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "isAvailable",
    header: () => <div className="text-center">التوفر</div>,
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer"
            onClick={() => onToggleAvailability(product.id, !product.isAvailable)}
          >
            {product.isAvailable ? (
              <Eye data-icon="inline-start" />
            ) : (
              <EyeOff data-icon="inline-start" />
            )}
            {product.isAvailable ? "متوفر" : "مخفي"}
          </Button>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">الإجراءات</div>,
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/menu/products/$productId/update"
              params={{ productId: product.id }}
            >
              <Pencil data-icon="inline-start" />
              تعديل
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDuplicate(product.id)}
          >
            <Copy />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(product.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      );
    },
    size: 150,
  },
];

interface OptionGroupActions {
  onDelete: (id: string) => void;
}

export const getOptionGroupColumns = ({
  onDelete,
}: OptionGroupActions): ColumnDef<MenuOptionGroup>[] => [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">{row.index + 1}</div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "key",
    header: "المفتاح",
    cell: ({ row }) => <MenuKeyBadge value={row.original.key} />,
  },
  {
    id: "nameAr",
    accessorFn: (row) => row.name.ar,
    header: "الاسم العربي",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name.ar}</span>
    ),
  },
  {
    id: "nameEn",
    accessorFn: (row) => row.name.en,
    header: "الاسم الإنجليزي",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.name.en}</span>
    ),
  },
  {
    accessorKey: "isActive",
    header: () => <div className="text-center">الحالة</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <MenuStatusBadge
          active={row.original.isActive}
          activeLabel="نشط"
          inactiveLabel="غير نشط"
        />
      </div>
    ),
  },
  {
    accessorKey: "isAvailable",
    header: () => <div className="text-center">التوفر</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <MenuStatusBadge
          active={row.original.isAvailable}
          activeLabel="متوفر"
          inactiveLabel="غير متوفر"
        />
      </div>
    ),
  },
  {
    accessorKey: "sortOrder",
    header: () => <div className="text-center">الترتيب</div>,
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">
        {row.original.sortOrder}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-center">الإجراءات</div>,
    cell: ({ row }) => {
      const group = row.original;
      return (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/menu/option-groups/$groupId/update"
              params={{ groupId: group.id }}
            >
              <Pencil data-icon="inline-start" />
              تعديل
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(group.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      );
    },
    size: 150,
  },
];

interface OptionActions {
  onDelete: (id: string) => void;
}

export const getOptionColumns = ({
  onDelete,
}: OptionActions): ColumnDef<MenuOption>[] => [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">{row.index + 1}</div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "key",
    header: "المفتاح",
    cell: ({ row }) => <MenuKeyBadge value={row.original.key} />,
  },
  {
    id: "option",
    header: "الخيار",
    cell: ({ row }) => {
      const option = row.original;
      return (
        <div className="flex min-w-44 flex-col gap-1">
          <span className="font-medium">{option.name?.ar}</span>
          <span className="text-xs text-muted-foreground">
            {option.name?.en}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "extraPriceHalala",
    header: () => <div className="text-center">السعر الإضافي</div>,
    cell: ({ row }) => {
      const val = row.original.extraPriceHalala;
      return (
        <div className="text-center font-medium">
          {val > 0 ? `+${formatPrice(val)} ر.س` : "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "isAvailable",
    header: () => <div className="text-center">التوفر</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <MenuStatusBadge
          active={row.original.isAvailable}
          activeLabel="متوفر"
          inactiveLabel="غير متوفر"
        />
      </div>
    ),
  },
  {
    accessorKey: "sortOrder",
    header: () => <div className="text-center">الترتيب</div>,
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">
        {row.original.sortOrder}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-center">الإجراءات</div>,
    cell: ({ row }) => {
      const option = row.original;
      return (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link
              to="/menu/options/$optionId/update"
              params={{ optionId: option.id }}
            >
              <Pencil data-icon="inline-start" />
              تعديل
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(option.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      );
    },
  },
];

export const getAuditLogColumns = (): ColumnDef<MenuAuditLog>[] => [
  {
    id: "index",
    header: "#",
    cell: ({ row }) => (
      <div className="text-center text-muted-foreground">{row.index + 1}</div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "action",
    header: "الإجراء",
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.action === "delete"
            ? "destructive"
            : row.original.action === "create"
              ? "default"
              : "secondary"
        }
      >
        {ACTION_LABELS[row.original.action] || row.original.action}
      </Badge>
    ),
  },
  {
    accessorKey: "entityType",
    header: "النوع",
    cell: ({ row }) => (
      <span>
        {ENTITY_LABELS[row.original.entityType] || row.original.entityType}
      </span>
    ),
  },
  {
    accessorKey: "entityId",
    header: "المعرف",
    cell: ({ row }) => (
      <MenuKeyBadge value={`${row.original.entityId.slice(0, 8)}...`} />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "التاريخ",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];
