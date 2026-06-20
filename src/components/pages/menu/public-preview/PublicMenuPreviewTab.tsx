import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  ImageOff,
  Layers3,
  RefreshCw,
  Settings2,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";

import { usePublicMenuPreviewQuery } from "@/hooks/menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  MenuEmptyState,
  MenuKeyBadge,
  MenuSectionCard,
} from "@/components/pages/menu/MenuTabScaffold";
import type {
  PublicMenuOption,
  PublicMenuOptionGroup,
  PublicMenuProduct,
  PublicMenuSection,
} from "@/types/publicMenuTypes";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/apiErrors";

type PreviewWarning = {
  id: string;
  label: string;
  severity: "error" | "warning";
  productId?: string;
};

const formatSar = (halala: number, currency = "SAR") =>
  `${(Number(halala || 0) / 100).toFixed(2)} ${currency}`;

const isEnabled = (item: {
  isActive?: boolean;
  isAvailable?: boolean;
  isVisible?: boolean;
}) =>
  item.isActive !== false &&
  item.isAvailable !== false &&
  item.isVisible !== false;

const isCustomizable = (product: PublicMenuProduct) =>
  product.isCustomizable === true ||
  product.action.requiresBuilder ||
  product.optionGroups.length > 0;

const getSelectionRange = (group: PublicMenuOptionGroup) => {
  const maxSelections =
    group.maxSelections === null ? "غير محدود" : group.maxSelections;
  return `${group.minSelections} - ${maxSelections}`;
};

function buildPreviewWarnings(sections: PublicMenuSection[]): PreviewWarning[] {
  const warnings: PreviewWarning[] = [];

  sections.forEach((section) => {
    if (!section.products.length) {
      warnings.push({
        id: `section-empty-${section.id || section.key}`,
        label: `التصنيف "${section.name}" لا يحتوي على منتجات.`,
        severity: "warning",
      });
    }

    section.products.forEach((product) => {
      if (!product.imageUrl) {
        warnings.push({
          id: `product-image-${product.id || product.key}`,
          label: `المنتج "${product.name}" بدون صورة.`,
          severity: "warning",
          productId: product.id,
        });
      }

      if (isCustomizable(product) && product.optionGroups.length === 0) {
        warnings.push({
          id: `product-groups-${product.id || product.key}`,
          label: `المنتج "${product.name}" قابل للتخصيص لكن لا يحتوي على مجموعات خيارات.`,
          severity: "error",
          productId: product.id,
        });
      }

      product.optionGroups.forEach((group) => {
        const activeOptions = group.options.filter(isEnabled);
        if (group.isRequired && activeOptions.length < group.minSelections) {
          warnings.push({
            id: `group-min-${product.id || product.key}-${group.groupId || group.key}`,
            label: `مجموعة "${group.name}" في المنتج "${product.name}" لا تحتوي خيارات فعالة كافية للحد الأدنى.`,
            severity: "error",
            productId: product.id,
          });
        }

        if (!group.options.length) {
          warnings.push({
            id: `group-empty-${product.id || product.key}-${group.groupId || group.key}`,
            label: `مجموعة "${group.name}" في المنتج "${product.name}" بدون خيارات.`,
            severity: "warning",
            productId: product.id,
          });
        }
      });
    });
  });

  return warnings;
}

function PreviewSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-72 rounded-lg" />
      ))}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-primary" />
        {value}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ProductImage({ product }: { product: PublicMenuProduct }) {
  if (!product.imageUrl) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
        <ImageOff className="size-8" />
      </div>
    );
  }

  return (
    <img
      src={product.imageUrl}
      alt={product.name}
      className="aspect-[4/3] w-full object-cover"
      loading="lazy"
    />
  );
}

function ProductCard({
  product,
  onOpen,
}: {
  product: PublicMenuProduct;
  onOpen: (product: PublicMenuProduct) => void;
}) {
  const enabled = isEnabled(product);
  const customizable = isCustomizable(product);

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className={cn(
        "group flex min-h-full flex-col overflow-hidden rounded-lg border bg-background text-right shadow-xs transition hover:border-primary/50 hover:shadow-sm",
        !enabled && "opacity-60"
      )}
    >
      <ProductImage product={product} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="line-clamp-2 text-sm font-semibold leading-6">
              {product.name}
            </h4>
            {product.description ? (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {product.description}
              </p>
            ) : null}
          </div>
          <Badge variant={enabled ? "default" : "outline"}>
            {enabled ? "متاح" : "غير نشط"}
          </Badge>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {formatSar(product.pricing.priceHalala, product.pricing.currency)}
          </Badge>
          <Badge variant={customizable ? "outline" : "secondary"}>
            {customizable ? "قابل للتخصيص" : "إضافة مباشرة"}
          </Badge>
          {product.optionGroups.length ? (
            <Badge variant="outline">{product.optionGroups.length} مجموعة</Badge>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function OptionBadge({ option }: { option: PublicMenuOption }) {
  const enabled = isEnabled(option);
  return (
    <Badge
      variant={enabled ? "secondary" : "outline"}
      className={cn("gap-1", !enabled && "text-muted-foreground")}
    >
      {option.name}
      {option.extraPriceHalala ? ` +${formatSar(option.extraPriceHalala)}` : ""}
      {!enabled ? " غير نشط" : ""}
    </Badge>
  );
}

function OptionGroupPreview({ group }: { group: PublicMenuOptionGroup }) {
  const activeOptions = group.options.filter(isEnabled).length;
  return (
    <div className="rounded-lg border bg-muted/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold">{group.name}</h4>
            <MenuKeyBadge value={group.key} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {getSelectionRange(group)} اختيارات، {activeOptions} فعال من{" "}
            {group.options.length}
          </p>
        </div>
        <Badge variant={group.isRequired ? "default" : "outline"}>
          {group.isRequired ? "إجباري" : "اختياري"}
        </Badge>
      </div>

      {group.options.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {group.options.map((option) => (
            <OptionBadge key={option.optionId || option.id} option={option} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          لا توجد خيارات داخل هذه المجموعة.
        </p>
      )}
    </div>
  );
}

function ProductPreviewSheet({
  product,
  open,
  onOpenChange,
}: {
  product: PublicMenuProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const customizable = product ? isCustomizable(product) : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-2xl">
        {product ? (
          <>
            <SheetHeader className="border-b">
              <SheetTitle className="pl-8 text-lg">{product.name}</SheetTitle>
              <SheetDescription>
                معاينة قراءة فقط لما سيظهر للعميل من المنتج وخياراته.
              </SheetDescription>
            </SheetHeader>

            <div className="grid gap-5 px-4 pb-6">
              <div className="overflow-hidden rounded-lg border">
                <ProductImage product={product} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {formatSar(product.pricing.priceHalala, product.pricing.currency)}
                </Badge>
                <Badge variant={customizable ? "default" : "outline"}>
                  {customizable ? "قابل للتخصيص" : "إضافة مباشرة"}
                </Badge>
                <Badge variant={isEnabled(product) ? "default" : "outline"}>
                  {isEnabled(product) ? "نشط" : "غير نشط"}
                </Badge>
                <MenuKeyBadge value={product.key} />
              </div>

              {product.description ? (
                <p className="text-sm leading-7 text-muted-foreground">
                  {product.description}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/menu/products/$productId/update"
                    params={{ productId: product.id }}
                  >
                    <Settings2 data-icon="inline-start" />
                    تعديل المنتج
                  </Link>
                </Button>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <h3 className="text-sm font-semibold">مجموعات التخصيص</h3>
                </div>

                {product.optionGroups.length ? (
                  product.optionGroups.map((group) => (
                    <OptionGroupPreview
                      key={group.groupId || group.id}
                      group={group}
                    />
                  ))
                ) : (
                  <MenuEmptyState
                    title="لا توجد مجموعات خيارات"
                    description={
                      customizable
                        ? "هذا المنتج يحتاج مجموعات خيارات حتى يكتمل التخصيص."
                        : "هذا المنتج يعمل كإضافة مباشرة بدون تخصيص."
                    }
                  />
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SectionPreview({
  section,
  onOpenProduct,
}: {
  section: PublicMenuSection;
  onOpenProduct: (product: PublicMenuProduct) => void;
}) {
  return (
    <section className="grid gap-4 rounded-lg border bg-muted/10 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{section.name}</h3>
            <MenuKeyBadge value={section.key} />
          </div>
          {section.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {section.description}
            </p>
          ) : null}
        </div>
        <Badge variant="outline">{section.products.length} منتج</Badge>
      </div>

      {section.products.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {section.products.map((product) => (
            <ProductCard
              key={product.id || product.key}
              product={product}
              onOpen={onOpenProduct}
            />
          ))}
        </div>
      ) : (
        <MenuEmptyState
          title="تصنيف فارغ"
          description="هذا التصنيف لا يحتوي على منتجات في عقد المعاينة الحالي."
        />
      )}
    </section>
  );
}

export function PublicMenuPreviewTab() {
  const [selectedProduct, setSelectedProduct] =
    useState<PublicMenuProduct | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const { data, isLoading, isFetching, isError, error, refetch } =
    usePublicMenuPreviewQuery();
  const contract = data?.data;
  const sections = useMemo(() => contract?.sections || [], [contract?.sections]);

  const visibleSections = useMemo(() => {
    if (showInactive) return sections;
    return sections
      .filter(isEnabled)
      .map((section) => ({
        ...section,
        products: section.products.filter(isEnabled),
      }));
  }, [sections, showInactive]);

  const warnings = useMemo(() => buildPreviewWarnings(sections), [sections]);
  const products = sections.flatMap((section) => section.products);
  const customizableCount = products.filter(isCustomizable).length;
  const optionGroupCount = products.reduce(
    (total, product) => total + product.optionGroups.length,
    0
  );

  return (
    <MenuSectionCard
      title="معاينة قائمة العميل"
      description="معاينة قراءة فقط لعقد الطلب الفردي كما سيصل للواجهة والموبايل."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Switch
              id="show-inactive-preview"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label htmlFor="show-inactive-preview" className="text-xs">
              عرض غير النشط
            </Label>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw data-icon="inline-start" />
            تحديث
          </Button>
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={Eye}
          label="العقد"
          value={contract?.contractVersion || "one_time_menu.v2"}
        />
        <StatCard icon={Layers3} label="التصنيفات" value={sections.length} />
        <StatCard icon={ShoppingBag} label="المنتجات" value={products.length} />
        <StatCard
          icon={SlidersHorizontal}
          label="قابلة للتخصيص"
          value={customizableCount}
        />
        <StatCard
          icon={Settings2}
          label="مجموعات الخيارات"
          value={optionGroupCount}
        />
        <StatCard
          icon={warnings.length ? AlertTriangle : CheckCircle2}
          label="ملاحظات الفحص"
          value={warnings.length}
        />
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>تعذر تحميل المعاينة</AlertTitle>
          <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
        </Alert>
      ) : null}

      {warnings.length ? (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>ملاحظات قبل النشر</AlertTitle>
          <AlertDescription>
            <div className="mt-2 grid gap-2">
              {warnings.slice(0, 6).map((warning) => (
                <div key={warning.id} className="flex items-start gap-2">
                  <Badge
                    variant={
                      warning.severity === "error" ? "destructive" : "outline"
                    }
                  >
                    {warning.severity === "error" ? "مهم" : "تنبيه"}
                  </Badge>
                  <span>{warning.label}</span>
                </div>
              ))}
              {warnings.length > 6 ? (
                <p className="text-xs text-muted-foreground">
                  +{warnings.length - 6} ملاحظات أخرى
                </p>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? <PreviewSkeleton /> : null}

      {!isLoading && !isError && visibleSections.length === 0 ? (
        <MenuEmptyState
          title="لا توجد قائمة للمعاينة"
          description="انشر عناصر القائمة أو فعّل المنتجات حتى تظهر في معاينة العميل."
        />
      ) : null}

      {!isLoading && !isError && visibleSections.length ? (
        <div className="grid gap-5">
          {visibleSections.map((section) => (
            <SectionPreview
              key={section.id || section.key}
              section={section}
              onOpenProduct={setSelectedProduct}
            />
          ))}
        </div>
      ) : null}

      <ProductPreviewSheet
        product={selectedProduct}
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
        }}
      />
    </MenuSectionCard>
  );
}
