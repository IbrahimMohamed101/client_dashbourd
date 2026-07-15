import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { MenuEmptyState } from "@/components/pages/menu/MenuTabScaffold";
import {
  MEAL_BUILDER_DRAFT_KEY,
  MEAL_BUILDER_HYDRATED_KEY,
  MEAL_BUILDER_KEY,
  MEAL_BUILDER_PUBLISHED_KEY,
  MEAL_BUILDER_READINESS_KEY,
  useCreateMealBuilderDraftMutation,
  useMealBuilderDraftQuery,
  useMealBuilderHydratedQuery,
  useMealBuilderPublishedQuery,
  useMenuCategoriesQuery,
  useMenuOptionGroupsQuery,
  useMenuOptionsQuery,
  useMenuProductsQuery,
  usePublishMealBuilderDraftMutation,
  useResetMealBuilderDraftMutation,
  useSaveMealBuilderDraftMutation,
  useValidateMealBuilderDraftMutation,
} from "@/hooks/menu";
import type {
  MenuCategory,
  MenuOption,
  MenuOptionGroup,
  MenuProduct,
} from "@/types/menuTypes";
import type {
  MealBuilderConfig,
  MealBuilderHydratedDraft,
  MealBuilderLifecycleResponseData,
  MealBuilderPremiumSection,
  MealBuilderSection,
  MealBuilderSectionType,
  MealBuilderValidation,
} from "@/types/mealBuilderTypes";
import { MealBuilderCardEditor } from "./MealBuilderCardEditor";
import { MealBuilderSectionEditor } from "./MealBuilderSectionEditor";
import { MealBuilderVisualCard } from "./MealBuilderVisualCard";
import { mealBuilderIssueText } from "./mealBuilderIssueText";
import { formatDate, orderSections, toBackendSections } from "./mealBuilderUtils";
import { buildMealBuilderVisualCards } from "./mealBuilderVisualModel";

type PageMode = "published" | "draft";
type EditorState = {
  type: MealBuilderSectionType;
  index: number | null;
} | null;

export function MealBuilderPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<PageMode>("published");
  const [dirty, setDirty] = useState(false);
  const publishedQuery = useMealBuilderPublishedQuery();
  const draftQuery = useMealBuilderDraftQuery(mode === "draft");
  const hydratedQuery = useMealBuilderHydratedQuery(mode === "draft");
  const createDraft = useCreateMealBuilderDraftMutation();

  const productsQuery = useMenuProductsQuery({ limit: 500, includeInactive: true });
  const categoriesQuery = useMenuCategoriesQuery({ limit: 500, includeInactive: true });
  const groupsQuery = useMenuOptionGroupsQuery({ limit: 500, includeInactive: true });
  const optionsQuery = useMenuOptionsQuery({ limit: 1000, includeInactive: true });

  const publishedView = useMemo(
    () => normalizePublished(publishedQuery.data?.data ?? null),
    [publishedQuery.data]
  );
  const draftView = useMemo(() => {
    const lifecycleView = normalizeDraft(draftQuery.data?.data ?? null);
    const hydratedView = normalizeDraft(hydratedQuery.data?.data ?? null);
    if (!hydratedView.config) return lifecycleView;
    return {
      ...lifecycleView,
      ...hydratedView,
      versionId: hydratedView.versionId || lifecycleView.versionId,
      versionNumber: hydratedView.versionNumber ?? lifecycleView.versionNumber,
      basedOnPublishedVersionId:
        hydratedView.basedOnPublishedVersionId ?? lifecycleView.basedOnPublishedVersionId,
      hasUnpublishedChanges: hydratedView.hasUnpublishedChanges || lifecycleView.hasUnpublishedChanges,
      publishedAt: hydratedView.publishedAt ?? lifecycleView.publishedAt,
      updatedAt: hydratedView.updatedAt ?? lifecycleView.updatedAt,
    };
  }, [draftQuery.data, hydratedQuery.data]);

  const activeView = mode === "draft" ? draftView : publishedView;
  const catalog = {
    products: productsQuery.data?.data.items ?? [],
    categories: categoriesQuery.data?.data.items ?? [],
    groups: groupsQuery.data?.data.items ?? [],
    options: optionsQuery.data?.data.items ?? [],
  };
  const loading =
    publishedQuery.isLoading ||
    (mode === "draft" && draftQuery.isLoading) ||
    (mode === "draft" && hydratedQuery.isLoading) ||
    productsQuery.isLoading ||
    categoriesQuery.isLoading ||
    groupsQuery.isLoading ||
    optionsQuery.isLoading;

  function refresh() {
    queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_KEY] });
    queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_PUBLISHED_KEY] });
    queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_DRAFT_KEY] });
    queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_HYDRATED_KEY] });
    queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_READINESS_KEY] });
  }

  function openDraft() {
    createDraft.mutate(undefined, {
      onSuccess: () => {
        setDirty(false);
        setMode("draft");
      },
    });
  }

  function showPublished() {
    if (dirty && !window.confirm("توجد تغييرات غير محفوظة. هل تريد عرض النسخة المنشورة؟")) {
      return;
    }
    setDirty(false);
    setMode("published");
  }

  return (
    <div className="grid gap-5" data-embedded={embedded || undefined} dir="rtl">
      <HeaderCard
        mode={mode}
        dirty={dirty}
        pending={createDraft.isPending}
        onRefresh={refresh}
        onOpenDraft={openDraft}
        onShowPublished={showPublished}
      />
      <VersionMetadataCard view={activeView} mode={mode} />

      {activeView.config ? (
        mode === "draft" ? (
          <MealBuilderWorkspace
            key={`${activeView.versionId ?? activeView.config.id}:${activeView.updatedAt ?? ""}`}
            draft={activeView.config}
            initialValidation={activeView.validation}
            premiumSection={activeView.premiumSection}
            catalog={catalog}
            loading={loading}
            dirty={dirty}
            onDirtyChange={setDirty}
            onPublished={() => {
              setDirty(false);
              setMode("published");
              publishedQuery.refetch();
            }}
          />
        ) : (
          <PublishedPreview
            config={activeView.config}
            validation={activeView.validation}
            premiumSection={activeView.premiumSection}
            catalog={catalog}
            loading={loading}
            onOpenDraft={openDraft}
          />
        )
      ) : (
        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-4 pt-6">
            <MenuEmptyState
              title={loading ? "جاري التحميل" : "لا توجد نسخة منشورة"}
              description="افتح المسودة لإنشاء نسخة عمل من آخر نسخة منشورة عند توفرها."
            />
            <div className="flex justify-center">
              <Button type="button" onClick={openDraft} disabled={createDraft.isPending}>
                <Plus data-icon="inline-start" />
                فتح المسودة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function HeaderCard({
  mode,
  dirty,
  pending,
  onOpenDraft,
  onShowPublished,
  onRefresh,
}: {
  mode: PageMode;
  dirty: boolean;
  pending: boolean;
  onOpenDraft: () => void;
  onShowPublished: () => void;
  onRefresh: () => void;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-primary" />
              منشئ وجبات الاشتراك
            </CardTitle>
            <CardDescription>
              النسخة المنشورة للقراءة فقط. كل تعديل يتم داخل مسودة منفصلة قبل النشر.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onRefresh}>
              <RefreshCw data-icon="inline-start" />
              تحديث
            </Button>
            <Button type="button" variant={mode === "published" ? "default" : "outline"} onClick={onShowPublished}>
              <Eye data-icon="inline-start" />
              عرض النسخة المنشورة
            </Button>
            <Button type="button" disabled={pending} variant={mode === "draft" ? "default" : "outline"} onClick={onOpenDraft}>
              <Plus data-icon="inline-start" />
              فتح المسودة
            </Button>
            {dirty ? <Badge variant="secondary">تغييرات غير محفوظة</Badge> : null}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

function VersionMetadataCard({
  view,
  mode,
}: {
  view: NormalizedMealBuilderView;
  mode: PageMode;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetaItem label="الحالة" value={mode === "draft" ? "مسودة" : "منشور"} />
        <MetaItem label="رقم النسخة" value={view.versionNumber ?? "-"} />
        <MetaItem label="مبنية على النسخة المنشورة" value={shortVersion(view.basedOnPublishedVersionId)} />
        <MetaItem label="آخر تحديث" value={formatDate(view.updatedAt)} />
        <MetaItem label="تاريخ النشر" value={formatDate(view.publishedAt)} />
        <MetaItem label="توجد تغييرات غير منشورة" value={view.hasUnpublishedChanges ? "نعم" : "لا"} />
      </CardContent>
    </Card>
  );
}

function PublishedPreview({
  config,
  validation,
  premiumSection,
  catalog,
  loading,
  onOpenDraft,
}: {
  config: MealBuilderConfig;
  validation: MealBuilderValidation | null;
  premiumSection: MealBuilderPremiumSection | null;
  catalog: Catalog;
  loading: boolean;
  onOpenDraft: () => void;
}) {
  const visualCards = buildMealBuilderVisualCards({
    sections: orderSections(config.sections),
    products: catalog.products,
    categories: catalog.categories,
    options: catalog.options,
    issues: [...(validation?.errors ?? []), ...(validation?.warnings ?? [])],
    premiumSection,
  });

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>النسخة المنشورة</CardTitle>
          <CardDescription>هذه هي النسخة المستخدمة حاليا في التطبيق.</CardDescription>
        </div>
        <Button type="button" onClick={onOpenDraft}>
          <Plus data-icon="inline-start" />
          فتح المسودة
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? <LoadingLine /> : null}
        <PremiumWarning premiumSection={premiumSection} />
        <div className="grid gap-4 xl:grid-cols-2">
          {visualCards.map((card) => (
            <MealBuilderVisualCard
              key={card.key}
              card={card}
              onEdit={() => undefined}
              readOnly
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MealBuilderWorkspace({
  draft,
  initialValidation,
  premiumSection,
  catalog,
  loading,
  dirty,
  onDirtyChange,
  onPublished,
}: {
  draft: MealBuilderConfig;
  initialValidation: MealBuilderValidation | null;
  premiumSection: MealBuilderPremiumSection | null;
  catalog: Catalog;
  loading: boolean;
  dirty: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onPublished: () => void;
}) {
  const saveDraft = useSaveMealBuilderDraftMutation();
  const validateDraft = useValidateMealBuilderDraftMutation();
  const publishDraft = usePublishMealBuilderDraftMutation();
  const resetDraft = useResetMealBuilderDraftMutation();
  const [sections, setSections] = useState(() => orderSections(draft.sections));
  const [notes, setNotes] = useState(draft.notes ?? "");
  const [editor, setEditor] = useState<EditorState>(null);
  const [cardEditorKey, setCardEditorKey] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [validation, setValidation] = useState<MealBuilderValidation | null>(initialValidation);

  const currentValidation = validation ?? initialValidation;
  const visualCards = buildMealBuilderVisualCards({
    sections,
    products: catalog.products,
    categories: catalog.categories,
    options: catalog.options,
    issues: [...(currentValidation?.errors ?? []), ...(currentValidation?.warnings ?? [])],
    premiumSection,
  });
  const hasErrors = Boolean(currentValidation?.errors.length);
  const pending =
    saveDraft.isPending ||
    validateDraft.isPending ||
    publishDraft.isPending ||
    resetDraft.isPending;
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

  function replaceSections(next: MealBuilderSection[]) {
    setSections(orderSections(next).map((item, index) => ({ ...item, sortOrder: index + 1 })));
    onDirtyChange(true);
  }

  function saveCurrentDraft(onSaved?: () => void) {
    saveDraft.mutate(payload, {
      onSuccess: () => {
        onDirtyChange(false);
        onSaved?.();
      },
    });
  }

  function validateCurrentDraft(onValid?: () => void) {
    validateDraft.mutate(payload, {
      onSuccess: (result) => {
        setValidation(result.data);
        if (!result.data.ready || result.data.errors.length) {
          toast.error("المسودة تحتوي على أخطاء ويجب إصلاحها قبل النشر");
          return;
        }
        onValid?.();
      },
    });
  }

  function publishFlow() {
    const continueAfterSave = () => validateCurrentDraft(() => setPublishOpen(true));
    if (dirty) {
      saveCurrentDraft(continueAfterSave);
      return;
    }
    continueAfterSave();
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="sticky top-2 z-20 border-border/80 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <CardContent className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">المسودة</CardTitle>
                <Badge variant="secondary">مسودة</Badge>
                {dirty ? <Badge variant="secondary">تغييرات غير محفوظة</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                عدّل الأقسام العادية فقط. قسم مميز تلقائي ولا تتم إدارة عضويته من هنا.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <Button type="button" onClick={() => saveCurrentDraft()} disabled={pending || !dirty}>
                <Save data-icon="inline-start" />
                حفظ المسودة
              </Button>
              <Button type="button" variant="outline" onClick={() => validateCurrentDraft()} disabled={pending}>
                <CheckCircle2 data-icon="inline-start" />
                فحص المسودة
              </Button>
              <Button type="button" variant="outline" onClick={publishFlow} disabled={pending || hasErrors}>
                <Send data-icon="inline-start" />
                نشر المسودة
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (dirty && !window.confirm("توجد تغييرات غير محفوظة. هل تريد متابعة إعادة المسودة؟")) return;
                  setResetOpen(true);
                }}
                disabled={pending}
              >
                <RotateCcw data-icon="inline-start" />
                إلغاء التعديلات والرجوع للنسخة المنشورة
              </Button>
            </div>
          </CardContent>
        </Card>

        <AdvancedBuilderTools
          onAddOptionGroup={() => setEditor({ type: "option_group", index: null })}
          onAddProductCategory={() => setEditor({ type: "product_category", index: null })}
          onAddProductList={() => setEditor({ type: "product_list", index: null })}
          notes={notes}
          onNotesChange={(nextNotes) => {
            setNotes(nextNotes);
            onDirtyChange(true);
          }}
        />

        <ValidationSummary validation={currentValidation} dirty={dirty} />

        <Card className="border-border/80 shadow-none">
          <CardContent className="space-y-4 pt-5">
            {loading ? <LoadingLine /> : null}
            <PremiumWarning premiumSection={premiumSection} />
            <div className="grid gap-4 xl:grid-cols-2">
              {visualCards.map((card) => (
                <MealBuilderVisualCard
                  key={card.key}
                  card={card}
                  readOnly={card.key === "premium"}
                  onEdit={() => {
                    if (card.key === "premium") return;
                    setCardEditorKey(card.key);
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {editor ? (
        <MealBuilderSectionEditor
          key={`${editor.type}:${editor.index ?? "new"}:${sections[editor.index ?? -1]?.id ?? ""}`}
          open
          type={editor.type}
          initial={editor.index == null ? null : (sections[editor.index] ?? null)}
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
            onSuccess: () => {
              setPublishOpen(false);
              onDirtyChange(false);
              onPublished();
            },
          })
        }
      />

      <ResetDialog
        open={resetOpen}
        pending={resetDraft.isPending}
        onClose={() => setResetOpen(false)}
        onReset={() =>
          resetDraft.mutate(undefined, {
            onSuccess: (response) => {
              const resetView = normalizeDraft(response.data);
              if (resetView.config) {
                setSections(orderSections(resetView.config.sections));
                setNotes(resetView.config.notes ?? "");
                setValidation(resetView.validation);
              }
              onDirtyChange(false);
              setResetOpen(false);
            },
          })
        }
      />
    </>
  );
}

function ValidationSummary({ validation, dirty }: { validation: MealBuilderValidation | null; dirty: boolean }) {
  const errors = validation?.errors ?? [];
  const warnings = validation?.warnings ?? [];
  if (!validation && !dirty) return null;

  return (
    <Card className="border-border/80 shadow-none">
      <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {errors.length ? <Badge variant="destructive"><ShieldAlert data-icon="inline-start" />{errors.length} أخطاء</Badge> : null}
          {warnings.length ? <Badge variant="secondary"><AlertTriangle data-icon="inline-start" />تنبيهات</Badge> : null}
          {!errors.length && validation ? <Badge><CheckCircle2 data-icon="inline-start" />جاهز</Badge> : null}
          {dirty ? <Badge variant="outline">يحتاج حفظ</Badge> : null}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground lg:text-end">
          {[...errors, ...warnings].map(mealBuilderIssueText).slice(0, 2).join(" • ") ||
            "لا توجد مشاكل في آخر فحص."}
        </p>
      </CardContent>
    </Card>
  );
}

function AdvancedBuilderTools({
  onAddOptionGroup,
  onAddProductCategory,
  onAddProductList,
  notes,
  onNotesChange,
}: {
  onAddOptionGroup: () => void;
  onAddProductCategory: () => void;
  onAddProductList: () => void;
  notes: string;
  onNotesChange: (notes: string) => void;
}) {
  return (
    <details className="rounded-lg border bg-background p-3 shadow-none">
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
        أدوات متقدمة وملاحظات النشر
      </summary>
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            تستخدم هذه الأدوات للأقسام العادية فقط. قسم مميز تلقائي.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onAddOptionGroup}><Plus data-icon="inline-start" />مجموعة خيارات</Button>
            <Button type="button" variant="secondary" onClick={onAddProductCategory}><Plus data-icon="inline-start" />تصنيف منتجات</Button>
            <Button type="button" variant="secondary" onClick={onAddProductList}><Plus data-icon="inline-start" />قائمة منتجات</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>ملاحظات النشر</Label>
          <Textarea className="min-h-20" value={notes} onChange={(event) => onNotesChange(event.target.value)} />
        </div>
      </div>
    </details>
  );
}

function PublishDialog({ open, pending, warnings, onClose, onPublish }: {
  open: boolean;
  pending: boolean;
  warnings: number;
  onClose: () => void;
  onPublish: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>نشر المسودة</DialogTitle>
          <DialogDescription>لن تتغير النسخة المنشورة إلا بعد نجاح النشر من الخادم.</DialogDescription>
        </DialogHeader>
        {warnings ? <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">توجد تحذيرات. راجعها قبل النشر.</div> : null}
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" disabled={pending} onClick={onPublish}><Send data-icon="inline-start" />نشر</Button>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetDialog({ open, pending, onClose, onReset }: {
  open: boolean;
  pending: boolean;
  onClose: () => void;
  onReset: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إلغاء تعديلات المسودة</DialogTitle>
          <DialogDescription>
            سيتم حذف جميع تعديلات المسودة وإعادتها لتطابق آخر نسخة منشورة. لن تتأثر النسخة الموجودة في التطبيق.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" variant="destructive" disabled={pending} onClick={onReset}>تأكيد الإعادة</Button>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PremiumWarning({ premiumSection }: { premiumSection: MealBuilderPremiumSection | null }) {
  const issues = [
    ...(premiumSection?.diagnostics ?? []),
    ...(premiumSection?.excluded ?? []),
    ...(premiumSection?.broken ?? []),
  ];
  if (!issues.length) return null;
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      بعض الوجبات المميزة غير متاحة بسبب مشكلة في المصدر أو الربط. راجع صفحة الوجبات المميزة.
    </div>
  );
}

function LoadingLine() {
  return <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">جاري تحميل بيانات منشئ الوجبات...</div>;
}

function MetaItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

type Catalog = {
  products: MenuProduct[];
  categories: MenuCategory[];
  groups: MenuOptionGroup[];
  options: MenuOption[];
};

type NormalizedMealBuilderView = {
  config: MealBuilderConfig | null;
  validation: MealBuilderValidation | null;
  premiumSection: MealBuilderPremiumSection | null;
  versionId: string | null;
  versionNumber: string | number | null;
  basedOnPublishedVersionId: string | null;
  hasUnpublishedChanges: boolean;
  publishedAt: string | null;
  updatedAt: string | null;
};

function normalizePublished(data: MealBuilderLifecycleResponseData | null): NormalizedMealBuilderView {
  const config = data?.config ?? data?.published ?? null;
  return {
    config,
    validation: data?.validation ?? null,
    premiumSection: data?.premiumSection ?? findPremiumSection(config?.sections),
    versionId: String(data?.versionId ?? config?.id ?? ""),
    versionNumber: data?.versionNumber ?? config?.revisionHash ?? null,
    basedOnPublishedVersionId: data?.basedOnPublishedVersionId ?? null,
    hasUnpublishedChanges: Boolean(data?.hasUnpublishedChanges),
    publishedAt: data?.publishedAt ?? config?.publishedAt ?? null,
    updatedAt: data?.updatedAt ?? config?.updatedAt ?? null,
  };
}

function normalizeDraft(data: (MealBuilderLifecycleResponseData | MealBuilderHydratedDraft) | null): NormalizedMealBuilderView {
  const lifecycle = data as MealBuilderLifecycleResponseData | null;
  const config = lifecycle?.config ?? data?.draft ?? null;
  const sections = data?.sections;
  const normalizedConfig = config && sections ? { ...config, sections } : config;
  return {
    config: normalizedConfig,
    validation: data?.validation ?? null,
    premiumSection: data?.premiumSection ?? findPremiumSection(normalizedConfig?.sections),
    versionId: String(data?.versionId ?? lifecycle?.draftVersionId ?? normalizedConfig?.id ?? ""),
    versionNumber: data?.versionNumber ?? normalizedConfig?.revisionHash ?? null,
    basedOnPublishedVersionId: data?.basedOnPublishedVersionId ?? null,
    hasUnpublishedChanges: Boolean(data?.hasUnpublishedChanges),
    publishedAt: lifecycle?.publishedAt ?? normalizedConfig?.publishedAt ?? null,
    updatedAt: data?.updatedAt ?? normalizedConfig?.updatedAt ?? null,
  };
}

function findPremiumSection(sections?: MealBuilderSection[] | null): MealBuilderPremiumSection | null {
  const premium = sections?.find((section) => section.key === "premium" || section.selectionType?.includes("premium"));
  if (!premium?.items?.length) return null;
  return {
    automatic: Boolean(premium.metadata?.automatic ?? premium.metadata?.source === "premium_upgrade_configs"),
    source: String(premium.metadata?.source ?? "premium_upgrade_configs"),
    items: premium.items,
  };
}

function shortVersion(value?: string | null) {
  if (!value) return "-";
  return value.length > 10 ? value.slice(0, 10) : value;
}
