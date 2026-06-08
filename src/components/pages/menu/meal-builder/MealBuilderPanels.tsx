import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  MenuCategory,
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
} from "@/types/menuTypes";
import type { MealPlannerMenuContract } from "@/types/mealPlannerMenuTypes";
import type { MealBuilderSection, MealBuilderValidation } from "@/types/mealBuilderTypes";
import { SECTION_LABELS } from "./mealBuilderConstants";
import { SECTION_RULE_BADGES } from "./mealBuilderConstants";
import { IssueRow, StatusBadge } from "./MealBuilderBadges";
import {
  nameOf,
  orderSections,
  sectionTitle,
  selectionLabel,
  visualSectionKey,
} from "./mealBuilderUtils";

export function ValidationPanel({
  title,
  validation,
}: {
  title: string;
  validation: MealBuilderValidation | null;
}) {
  const issues = validation ? [...validation.errors, ...validation.warnings] : [];
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>الباكند هو المرجع النهائي قبل النشر.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {validation ? <StatusBadge validation={validation} /> : <p className="text-sm text-muted-foreground">لا توجد نتيجة بعد.</p>}
        {issues.slice(0, 8).map((issue, index) => (
          <IssueRow key={index} issue={issue} />
        ))}
        {validation && !issues.length ? (
          <p className="text-sm text-muted-foreground">لا توجد أخطاء أو تحذيرات.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function PreviewPanel({
  sections,
  plannerPreview,
  plannerLoading,
  products,
  categories,
  groups,
  options,
}: {
  sections: MealBuilderSection[];
  plannerPreview: MealPlannerMenuContract | null;
  plannerLoading: boolean;
  products: MenuProduct[];
  categories: MenuCategory[];
  groups: MenuOptionGroup[];
  options: MenuOption[];
}) {
  const draftPreview = {
    contractVersion: "subscription_meal_builder.v1",
    preview: "مسودة غير منشورة",
    sections: orderSections(sections).map((section, index) => {
      const visualKey = visualSectionKey(section, options, products);
      return {
        order: index + 1,
        key: visualKey,
        type: SECTION_LABELS[section.sectionType],
        selectionType: selectionLabel(section.selectionType),
        title: sectionTitle(
          section,
          groups.find((item) => item.id === section.sourceGroupId),
          categories.find((item) => item.id === section.sourceCategoryId),
          visualKey
        ),
        rules: SECTION_RULE_BADGES[visualKey] ?? [],
        required: section.required,
        minSelections: section.minSelections,
        maxSelections: section.maxSelections,
        selectedOptionIds: section.selectedOptionIds,
        selectedProductIds: section.selectedProductIds,
        optionNames: options.filter((item) => section.selectedOptionIds.includes(item.id)).map(nameOf),
        productNames: products.filter((item) => section.selectedProductIds.includes(item.id)).map(nameOf),
      };
    }),
  };

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">معاينة plannerCatalog للتطبيق</CardTitle>
        <CardDescription>
          المعاينة الأساسية من plannerCatalog.sections في /api/subscriptions/meal-planner-menu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {plannerLoading ? (
          <p className="text-sm text-muted-foreground">جار تحميل معاينة plannerCatalog...</p>
        ) : plannerPreview ? (
          <PreviewJson title="plannerCatalog.sections" value={plannerPreview.sections} />
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد معاينة plannerCatalog متاحة.</p>
        )}
        <PreviewJson title="معاينة المسودة المحلية" value={draftPreview} />
      </CardContent>
    </Card>
  );
}

function PreviewJson({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      <pre className="max-h-72 overflow-auto rounded-lg bg-muted p-3 text-left text-xs" dir="ltr">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
