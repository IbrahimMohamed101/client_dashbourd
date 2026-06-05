import { Eye, Layers3, RefreshCw } from "lucide-react";

import { usePublicMenuPreviewQuery } from "@/hooks/menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MenuEmptyState,
  MenuKeyBadge,
  MenuSectionCard,
} from "@/components/pages/menu/MenuTabScaffold";
import type {
  PublicMenuOptionGroup,
  PublicMenuProduct,
  PublicMenuSection,
} from "@/types/publicMenuTypes";

const formatSar = (halala: number, currency = "SAR") =>
  `${(Number(halala || 0) / 100).toFixed(2)} ${currency}`;

const PRICING_LABELS: Record<string, string> = {
  fixed: "سعر ثابت",
  per_100g: "حسب الوزن",
};

const ACTION_LABELS: Record<string, string> = {
  direct_add: "إضافة مباشرة",
  open_builder: "يفتح المخصص",
  customize_optional_addons: "تخصيص الخيارات",
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  product_collection: "مجموعة منتجات",
};

function ProductActionBadge({ product }: { product: PublicMenuProduct }) {
  if (product.action.canAddDirectly) {
    return <Badge variant="secondary">إضافة مباشرة</Badge>;
  }
  if (product.action.requiresBuilder) {
    return <Badge variant="outline">يحتاج تخصيص</Badge>;
  }
  return (
    <Badge variant="outline">
      {ACTION_LABELS[product.action.type] || product.action.type}
    </Badge>
  );
}

function OptionGroupSummary({ group }: { group: PublicMenuOptionGroup }) {
  const maxSelections =
    group.maxSelections === null ? "غير محدود" : group.maxSelections;

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{group.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <MenuKeyBadge value={group.key} />
            <span className="text-xs text-muted-foreground">
              {group.minSelections} - {maxSelections}
            </span>
          </div>
        </div>
        <Badge variant={group.isRequired ? "default" : "outline"}>
          {group.isRequired ? "إجباري" : "اختياري"}
        </Badge>
      </div>
      {group.options.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {group.options.slice(0, 8).map((option) => (
            <Badge key={option.optionId || option.id} variant="secondary">
              {option.name}
            </Badge>
          ))}
          {group.options.length > 8 ? (
            <Badge variant="outline">+{group.options.length - 8}</Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ProductPreviewCard({ product }: { product: PublicMenuProduct }) {
  const cardVariant = String(product.ui.cardVariant || "standard");

  return (
    <div className="flex min-h-44 flex-col gap-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <MenuKeyBadge value={product.key} />
            <Badge variant="outline">{product.itemType}</Badge>
          </div>
        </div>
        <ProductActionBadge product={product} />
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>
          {formatSar(product.pricing.priceHalala, product.pricing.currency)}
        </span>
        <span>
          {PRICING_LABELS[product.pricing.model] || product.pricing.model}
        </span>
        <span>{cardVariant}</span>
      </div>

      {product.optionGroups.length ? (
        <div className="grid gap-2">
          {product.optionGroups.map((group) => (
            <OptionGroupSummary key={group.groupId || group.id} group={group} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          لا توجد مجموعات خيارات
        </p>
      )}
    </div>
  );
}

function SectionPreview({ section }: { section: PublicMenuSection }) {
  const sectionVariant = String(section.ui.cardVariant || section.type);

  return (
    <section className="rounded-lg border bg-muted/10 p-4">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{section.name}</h3>
            <MenuKeyBadge value={section.key} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="outline">
              {SECTION_TYPE_LABELS[section.type] || section.type}
            </Badge>
            <Badge variant="secondary">{sectionVariant}</Badge>
            <Badge variant="outline">{section.products.length} منتج</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {section.products.map((product) => (
          <ProductPreviewCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

function PreviewSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-48 rounded-lg" />
      ))}
    </div>
  );
}

export function PublicMenuPreviewTab() {
  const { data, isLoading, isFetching, refetch } = usePublicMenuPreviewQuery();
  const contract = data?.data;
  const sections = contract?.sections || [];
  const productCount = sections.reduce(
    (total, section) => total + section.products.length,
    0
  );

  return (
    <MenuSectionCard
      title="معاينة قائمة العميل"
      description="معاينة قراءة فقط مبنية على عقد publicMenuV2 القادم من الخادم."
      action={
        <Button
          type="button"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw data-icon="inline-start" />
          تحديث
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="size-4 text-primary" />
            {contract?.contractVersion || "one_time_menu.v2"}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">العقد</p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layers3 className="size-4 text-primary" />
            {sections.length}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">الأقسام</p>
        </div>
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="text-sm font-medium">{productCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">المنتجات</p>
        </div>
      </div>

      {isLoading ? <PreviewSkeleton /> : null}

      {!isLoading && sections.length === 0 ? (
        <MenuEmptyState
          title="لا توجد قائمة منشورة"
          description="انشر عناصر القائمة أولا حتى تظهر في معاينة العميل."
        />
      ) : null}

      {!isLoading && sections.length ? (
        <div className="grid gap-4">
          {sections.map((section) => (
            <SectionPreview key={section.id || section.key} section={section} />
          ))}
        </div>
      ) : null}
    </MenuSectionCard>
  );
}
