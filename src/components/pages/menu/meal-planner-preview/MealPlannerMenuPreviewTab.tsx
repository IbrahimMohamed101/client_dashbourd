import { CalendarCheck2, Layers3, RefreshCw, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMealPlannerMenuPreviewQuery } from "@/hooks/menu";
import {
  MenuEmptyState,
  MenuKeyBadge,
  MenuSectionCard,
} from "@/components/pages/menu/MenuTabScaffold";
import type {
  MealPlannerOptionGroup,
  MealPlannerProduct,
  MealPlannerSection,
} from "@/types/mealPlannerMenuTypes";

const formatSar = (halala: number, currency = "SAR") =>
  `${(Number(halala || 0) / 100).toFixed(2)} ${currency}`;

const SECTION_TYPE_LABELS: Record<string, string> = {
  configurable_product: "منتج قابل للتخصيص",
  product_list: "قائمة منتجات",
  meal_builder: "مخصص الوجبات",
};

const DISPLAY_STYLE_LABELS: Record<string, string> = {
  radio_cards: "بطاقات اختيار",
  checkbox_grid: "شبكة متعددة",
  chips: "شرائح",
  dropdown: "قائمة",
  stepper: "عداد",
};

const CARD_VARIANT_LABELS: Record<string, string> = {
  standard: "بطاقة عادية",
  premium: "بطاقة بريميوم",
  compact: "بطاقة مختصرة",
  detailed: "بطاقة مفصلة",
};

const PRICING_MODEL_LABELS: Record<string, string> = {
  fixed: "سعر ثابت",
  base_plus_options: "سعر مع الإضافات",
  included: "ضمن الاشتراك",
};

const SELECTION_TYPE_LABELS: Record<string, string> = {
  single: "اختيار واحد",
  multiple: "اختيار متعدد",
};

function PlannerGroupSummary({ group }: { group: MealPlannerOptionGroup }) {
  const maxSelections =
    group.maxSelections === null ? "بدون حد" : String(group.maxSelections);
  const displayStyle = String(group.ui.displayStyle || "");

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
            {displayStyle ? (
              <Badge variant="secondary">
                {DISPLAY_STYLE_LABELS[displayStyle] || displayStyle}
              </Badge>
            ) : null}
          </div>
        </div>
        <Badge variant={group.isRequired ? "default" : "outline"}>
          {group.isRequired ? "إجباري" : "اختياري"}
        </Badge>
      </div>

      {group.optionSections.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {group.optionSections.map((section) => (
            <Badge key={section.key} variant="outline">
              {section.name} {section.optionIds.length}
            </Badge>
          ))}
        </div>
      ) : null}

      {group.options.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {group.options.slice(0, 10).map((option) => (
            <Badge
              key={option.optionId || option.id}
              variant={option.isPremium ? "default" : "secondary"}
            >
              {option.name}
              {option.extraPriceHalala
                ? ` +${formatSar(option.extraPriceHalala)}`
                : ""}
            </Badge>
          ))}
          {group.options.length > 10 ? (
            <Badge variant="outline">+{group.options.length - 10}</Badge>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">لا توجد خيارات فعالة</p>
      )}
    </div>
  );
}

function PlannerProductCard({ product }: { product: MealPlannerProduct }) {
  const cardVariant = String(product.ui.cardVariant || "standard");
  const pricingModel = String(product.pricing.model || "");
  const groups = product.optionGroups;
  const optionCount = groups.reduce(
    (total, group) => total + group.options.length,
    0
  );

  return (
    <div className="flex min-h-48 flex-col gap-3 rounded-lg border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{product.name}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <MenuKeyBadge value={product.key} />
            {product.selectionType ? (
              <Badge variant="outline">
                {SELECTION_TYPE_LABELS[product.selectionType] ||
                  product.selectionType}
              </Badge>
            ) : null}
          </div>
        </div>
        <Badge variant={product.action.requiresBuilder ? "default" : "outline"}>
          {product.action.requiresBuilder ? "تخصيص" : "مباشر"}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span>
          {formatSar(
            product.pricing.basePriceHalala || product.pricing.priceHalala,
            product.pricing.currency
          )}
        </span>
        {pricingModel ? (
          <span>{PRICING_MODEL_LABELS[pricingModel] || pricingModel}</span>
        ) : null}
        <span>{CARD_VARIANT_LABELS[cardVariant] || cardVariant}</span>
        <span>{groups.length} مجموعة</span>
        <span>{optionCount} خيار</span>
      </div>

      {product.extraFeeHalala ? (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
          رسوم بريميوم إضافية: {formatSar(product.extraFeeHalala)}
        </div>
      ) : null}

      {groups.length ? (
        <div className="grid gap-2">
          {groups.map((group) => (
            <PlannerGroupSummary
              key={group.groupId || group.id}
              group={group}
            />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">لا توجد مجموعات خيارات</p>
      )}
    </div>
  );
}

function PlannerSectionPreview({ section }: { section: MealPlannerSection }) {
  const products = section.products;
  const directGroups = section.optionGroups;
  const cardVariant = String(section.ui.cardVariant || "standard");
  const productGroupCount = products.reduce(
    (total, product) => total + product.optionGroups.length,
    0
  );

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
            <Badge variant="secondary">
              {CARD_VARIANT_LABELS[cardVariant] || cardVariant}
            </Badge>
            <Badge variant="outline">{products.length} منتج</Badge>
            <Badge variant="outline">
              {productGroupCount || directGroups.length} مجموعة
            </Badge>
          </div>
        </div>
      </div>

      {products.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {products.map((product) => (
            <PlannerProductCard
              key={product.id || product.key}
              product={product}
            />
          ))}
        </div>
      ) : directGroups.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {directGroups.map((group) => (
            <PlannerGroupSummary key={group.groupId || group.id} group={group} />
          ))}
        </div>
      ) : (
        <MenuEmptyState
          title="قسم فارغ في مخطط الوجبات"
          description="الخادم أعاد هذا القسم بدون منتجات أو مجموعات خيارات."
        />
      )}
    </section>
  );
}

function PreviewSkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-56 rounded-lg" />
      ))}
    </div>
  );
}

export function MealPlannerMenuPreviewTab() {
  const { data, isLoading, isFetching, refetch } =
    useMealPlannerMenuPreviewQuery();
  const contract = data?.data;
  const sections = contract?.sections || [];
  const productCount = sections.reduce(
    (total, section) => total + section.products.length,
    0
  );
  const groupCount = sections.reduce(
    (total, section) =>
      total +
      section.optionGroups.length +
      section.products.reduce(
        (productTotal, product) => productTotal + product.optionGroups.length,
        0
      ),
    0
  );

  return (
    <MenuSectionCard
      title="معاينة مخطط الوجبات"
      description="مراجعة قراءة فقط لعقد مخطط الاشتراكات القادم من الخادم."
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
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarCheck2 className="size-4 text-primary" />
            {contract?.contractVersion || contract?.catalogVersion || "pending"}
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
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4 text-primary" />
            {groupCount}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">مجموعات القواعد</p>
        </div>
      </div>

      {contract?.legacyIncluded ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          استجابة الخادم ما زالت تحتوي على حقول قديمة للمخطط. تم توحيدها هنا
          إلى شكل الأقسام الجديد للمراجعة داخل لوحة التحكم.
        </div>
      ) : null}

      {isLoading ? <PreviewSkeleton /> : null}

      {!isLoading && sections.length === 0 ? (
        <MenuEmptyState
          title="لا يوجد عقد مخطط وجبات"
          description="انشر القائمة أو تحقق من تفعيل نقطة نهاية مخطط الوجبات."
        />
      ) : null}

      {!isLoading && sections.length ? (
        <div className="grid gap-4">
          {sections.map((section) => (
            <PlannerSectionPreview
              key={section.id || section.key}
              section={section}
            />
          ))}
        </div>
      ) : null}
    </MenuSectionCard>
  );
}
