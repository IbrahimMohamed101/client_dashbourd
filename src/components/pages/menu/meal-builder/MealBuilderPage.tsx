import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MenuEmptyState,
  MenuKeyBadge,
} from "@/components/pages/menu/MenuTabScaffold";
import {
  MEAL_BUILDER_KEY,
  MEAL_BUILDER_READINESS_KEY,
  useCreateMealBuilderDraftMutation,
  useMealBuilderQuery,
  useMealBuilderReadinessQuery,
  useMealPlannerMenuPreviewQuery,
  useMenuCategoriesQuery,
  useMenuOptionGroupsQuery,
  useMenuOptionsQuery,
  useMenuProductsQuery,
  usePublishMealBuilderDraftMutation,
  useSaveMealBuilderDraftMutation,
  useValidateMealBuilderDraftMutation,
} from "@/hooks/menu";
import type {
  MenuCategory,
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
} from "@/types/menuTypes";
import type { MealPlannerMenuContract } from "@/types/mealPlannerMenuTypes";
import type {
  MealBuilderConfig,
  MealBuilderSection,
  MealBuilderSectionType,
  MealBuilderValidation,
} from "@/types/mealBuilderTypes";
import { MealBuilderCardEditor } from "./MealBuilderCardEditor";
import { MealBuilderStatusCards } from "./MealBuilderStatusCards";
import { MealBuilderSectionEditor } from "./MealBuilderSectionEditor";
import { MealBuilderVisualCard } from "./MealBuilderVisualCard";
import { PreviewPanel, ValidationPanel } from "./MealBuilderPanels";
import {
  orderSections,
  toBackendSections,
} from "./mealBuilderUtils";
import { buildMealBuilderVisualCards } from "./mealBuilderVisualModel";

type EditorState = {
  type: MealBuilderSectionType;
  index: number | null;
} | null;

export function MealBuilderPage() {
  const queryClient = useQueryClient();
  const builderQuery = useMealBuilderQuery();
  const readinessQuery = useMealBuilderReadinessQuery();
  const plannerPreviewQuery = useMealPlannerMenuPreviewQuery();
  const productsQuery = useMenuProductsQuery({ limit: 500, includeInactive: true });
  const categoriesQuery = useMenuCategoriesQuery({ limit: 500, includeInactive: true });
  const groupsQuery = useMenuOptionGroupsQuery({ limit: 500, includeInactive: true });
  const optionsQuery = useMenuOptionsQuery({ limit: 1000, includeInactive: true });
  const createDraft = useCreateMealBuilderDraftMutation();

  const state = builderQuery.data?.data;
  const draft = state?.draft ?? null;
  const published = state?.published ?? null;
  const readiness = readinessQuery.data?.data ?? null;
  const catalog = {
    products: productsQuery.data?.data.items ?? [],
    categories: categoriesQuery.data?.data.items ?? [],
    groups: groupsQuery.data?.data.items ?? [],
    options: optionsQuery.data?.data.items ?? [],
  };
  const loading =
    builderQuery.isLoading ||
    readinessQuery.isLoading ||
    productsQuery.isLoading ||
    categoriesQuery.isLoading ||
    groupsQuery.isLoading ||
    optionsQuery.isLoading;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_KEY] });
    queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_READINESS_KEY] });
    queryClient.invalidateQueries({ queryKey: ["menu.mealPlannerPreview"] });
  }

  return (
    <div className="grid gap-5" dir="rtl">
      <HeaderCard onCreateDraft={() => createDraft.mutate()} onRefresh={refresh} pending={createDraft.isPending} />
      <MealBuilderStatusCards draft={draft} published={published} readiness={readiness} />
      <BootstrapMeta draft={draft} />

      {draft ? (
        <MealBuilderWorkspace
          key={`${draft.id}:${draft.updatedAt ?? ""}`}
          draft={draft}
          readiness={readiness}
          initialValidation={state?.validation.draft ?? null}
          plannerPreview={plannerPreviewQuery.data?.data ?? null}
          plannerLoading={plannerPreviewQuery.isLoading}
          catalog={catalog}
          loading={loading}
        />
      ) : (
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-4 pt-6">
            <MenuEmptyState
              title="لا توجد مسودة"
              description="ابدأ من النسخة المنشورة الحالية أو من الإعداد الافتراضي."
            />
            <div className="flex justify-center">
              <Button type="button" onClick={() => createDraft.mutate()} disabled={createDraft.isPending}>
                <Plus data-icon="inline-start" />
                إنشاء مسودة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HeaderCard({
  pending,
  onCreateDraft,
  onRefresh,
}: {
  pending: boolean;
  onCreateDraft: () => void;
  onRefresh: () => void;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-primary" />
              منشئ الوجبات
            </CardTitle>
            <CardDescription>
              رتّب شاشة تخصيص وجبات الاشتراك التي تظهر في تطبيق العميل.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={pending} onClick={onCreateDraft}>
              <Plus data-icon="inline-start" />
              إنشاء مسودة
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={onRefresh}>
              <RefreshCw data-icon="inline-start" />
              تحديث
            </Button>
          </div>
        </div>
        <PremiumNotice />
      </CardHeader>
    </Card>
  );
}

function MealBuilderWorkspace({
  draft,
  readiness,
  initialValidation,
  plannerPreview,
  plannerLoading,
  catalog,
  loading,
}: {
  draft: MealBuilderConfig;
  readiness: MealBuilderValidation | null;
  initialValidation: MealBuilderValidation | null;
  plannerPreview: MealPlannerMenuContract | null;
  plannerLoading: boolean;
  catalog: {
    products: MenuProduct[];
    categories: MenuCategory[];
    groups: MenuOptionGroup[];
    options: MenuOption[];
  };
  loading: boolean;
}) {
  const saveDraft = useSaveMealBuilderDraftMutation();
  const validateDraft = useValidateMealBuilderDraftMutation();
  const publishDraft = usePublishMealBuilderDraftMutation();
  const [sections, setSections] = useState(() => orderSections(draft.sections));
  const [notes, setNotes] = useState(draft.notes ?? "");
  const [dirty, setDirty] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);
  const [cardEditorKey, setCardEditorKey] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [validation, setValidation] = useState<MealBuilderValidation | null>(initialValidation);

  const currentValidation = validation ?? initialValidation;
  const visualCards = buildMealBuilderVisualCards({
    sections,
    products: catalog.products,
    categories: catalog.categories,
    options: catalog.options,
    issues: [
      ...(currentValidation?.errors ?? []),
      ...(currentValidation?.warnings ?? []),
    ],
  });
  const hasErrors =
    Boolean(currentValidation?.errors.length) || Boolean(readiness?.errors.length);
  const pending = saveDraft.isPending || validateDraft.isPending || publishDraft.isPending;
  const payload = { sections: toBackendSections(sections), notes };

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug(
      "[meal-builder] visual editor cards",
      visualCards.map((card) => ({
        key: card.key,
        titleOverride: card.labelAr,
        sourceKind: card.sourceKinds,
        sortOrder: card.sortOrder,
        metadata: { itemKeys: card.items.map((item) => item.key) },
        rules: card.rules,
      }))
    );
  }, [visualCards]);

  function replaceSections(next: MealBuilderSection[]) {
    setSections(orderSections(next).map((item, index) => ({ ...item, sortOrder: index + 1 })));
    setDirty(true);
  }

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="border-border/80 shadow-none">
          <CardHeader className="gap-3 border-b">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <CardTitle>بطاقات منشئ الوجبات</CardTitle>
                <CardDescription>
                  العرض التحريري يستخدم قالب العائلات السبعة من بيانات المسودة والكتالوج فقط.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                {dirty ? <Badge variant="secondary">تغييرات غير محفوظة</Badge> : null}
                <ToolbarButton icon={Plus} label="مجموعة خيارات" onClick={() => setEditor({ type: "option_group", index: null })} variant="secondary" />
                <ToolbarButton icon={Plus} label="تصنيف منتجات" onClick={() => setEditor({ type: "product_category", index: null })} variant="secondary" />
                <ToolbarButton icon={Plus} label="قائمة منتجات" onClick={() => setEditor({ type: "product_list", index: null })} variant="secondary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <DraftActions
              dirty={dirty}
              hasErrors={hasErrors}
              pending={pending}
              onSave={() => saveDraft.mutate(payload, { onSuccess: () => setDirty(false) })}
              onValidate={() => validateDraft.mutate(payload, { onSuccess: (result) => setValidation(result.data) })}
              onPublish={() => setPublishOpen(true)}
            />

            {loading ? (
              <div className="rounded-lg border bg-muted/20 p-5 text-sm text-muted-foreground">
                جار تحميل بيانات منشئ الوجبات والكتالوج...
              </div>
            ) : null}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950">
              مصدر التحرير هو مسودة Dashboard Meal Builder. معاينة plannerCatalog في اللوحة الجانبية فقط ولا تستبدل هذه البطاقات.
            </div>

            {visualCards.map((card) => (
              <MealBuilderVisualCard
                key={card.key}
                card={card}
                onEdit={() => setCardEditorKey(card.key)}
              />
            ))}

            <div className="space-y-2">
              <Label>ملاحظات النشر</Label>
              <Textarea
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  setDirty(true);
                }}
                placeholder="ملاحظة اختيارية تظهر في سجل الإدارة"
              />
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-5">
          <ValidationPanel title="التحقق" validation={currentValidation} />
          <ValidationPanel title="الجاهزية" validation={readiness} />
          <PreviewPanel
            sections={sections}
            plannerPreview={plannerPreview}
            plannerLoading={plannerLoading}
            products={catalog.products}
            categories={catalog.categories}
            groups={catalog.groups}
            options={catalog.options}
          />
        </aside>
      </div>

      {editor ? (
        <MealBuilderSectionEditor
          key={`${editor.type}:${editor.index ?? "new"}:${sections[editor.index ?? -1]?.id ?? ""}`}
          open
          type={editor.type}
          initial={editor.index == null ? null : sections[editor.index] ?? null}
          products={catalog.products}
          categories={catalog.categories}
          groups={catalog.groups}
          options={catalog.options}
          onClose={() => setEditor(null)}
          onSave={(section) => {
            if (editor.index == null) {
              replaceSections([...sections, { ...section, sortOrder: sections.length + 1 }]);
            } else {
              replaceSections(sections.map((item, index) => (index === editor.index ? section : item)));
            }
            setEditor(null);
          }}
        />
      ) : null}

      {cardEditorKey ? (
        <MealBuilderCardEditor
          key={cardEditorKey}
          open
          card={visualCards.find((card) => card.key === cardEditorKey) ?? visualCards[0]}
          sections={sections}
          catalog={catalog}
          onClose={() => setCardEditorKey(null)}
          onSave={(nextSections) => {
            replaceSections(nextSections);
            setCardEditorKey(null);
          }}
        />
      ) : null}

      <PublishDialog
        open={publishOpen}
        pending={publishDraft.isPending}
        warnings={currentValidation?.warnings.length ?? 0}
        onClose={() => setPublishOpen(false)}
        onPublish={() =>
          publishDraft.mutate(notes, {
            onSuccess: (result) => {
              setPublishOpen(false);
              setDirty(false);
              setValidation(result.data.validation);
            },
          })
        }
      />
    </>
  );
}

function DraftActions({
  dirty,
  hasErrors,
  pending,
  onSave,
  onValidate,
  onPublish,
}: {
  dirty: boolean;
  hasErrors: boolean;
  pending: boolean;
  onSave: () => void;
  onValidate: () => void;
  onPublish: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <ToolbarButton icon={Save} label="حفظ" onClick={onSave} disabled={pending} />
      <ToolbarButton icon={CheckCircle2} label="تحقق" onClick={onValidate} disabled={pending} variant="secondary" />
      <ToolbarButton icon={Send} label="نشر" onClick={onPublish} disabled={pending || dirty || hasErrors} />
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  variant,
}: {
  icon: typeof Save;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "outline" | "secondary";
}) {
  return (
    <Button type="button" variant={variant} disabled={disabled} onClick={onClick}>
      <Icon data-icon="inline-start" />
      {label}
    </Button>
  );
}

function PremiumNotice() {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <ShieldAlert className="mt-0.5 size-4 shrink-0" />
      <p>
        أسعار البريميوم هنا للعرض فقط. حساب الرصيد والدفع يتم في الباكند عند حفظ يوم الاشتراك، ولا توجد هنا أي أداة تجعل الترقية مجانية.
      </p>
    </div>
  );
}

function BootstrapMeta({ draft }: { draft: MealBuilderConfig | null }) {
  if (!draft?.bootstrapKey && !draft?.source) return null;
  return (
    <Card className="border-border/80 shadow-none">
      <CardContent className="flex flex-wrap gap-2 pt-6 text-sm">
        <Badge variant="outline">المصدر: {draft.source === "bootstrap" ? "بيانات أولية" : "لوحة التحكم"}</Badge>
        {draft.createdBySystem ? <Badge variant="secondary">تم إنشاؤه تلقائيا</Badge> : null}
        {draft.bootstrapKey ? <MenuKeyBadge value={draft.bootstrapKey} /> : null}
      </CardContent>
    </Card>
  );
}

function PublishDialog({
  open,
  pending,
  warnings,
  onClose,
  onPublish,
}: {
  open: boolean;
  pending: boolean;
  warnings: number;
  onClose: () => void;
  onPublish: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>نشر منشئ الوجبات</DialogTitle>
          <DialogDescription>
            النشر سيغيّر ترتيب وأقسام منشئ الوجبات في تطبيق العملاء.
          </DialogDescription>
        </DialogHeader>
        {warnings ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            توجد تحذيرات. يمكن المتابعة فقط إذا كان الباكند يسمح بالنشر.
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" disabled={pending} onClick={onPublish}>
            <Send data-icon="inline-start" />
            نشر
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
