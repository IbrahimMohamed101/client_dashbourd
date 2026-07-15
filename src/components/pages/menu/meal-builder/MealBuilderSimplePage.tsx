import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileEdit,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  Sparkles,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { MenuEmptyState } from "@/components/pages/menu/MenuTabScaffold";
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
  MEAL_BUILDER_DRAFT_KEY,
  MEAL_BUILDER_HYDRATED_KEY,
  MEAL_BUILDER_KEY,
  MEAL_BUILDER_PUBLISHED_KEY,
  MEAL_BUILDER_READINESS_KEY,
  useMealBuilderDraftQuery,
  useMealBuilderHydratedQuery,
  useMealBuilderPublishedQuery,
  useMealBuilderQuery,
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
  MealBuilderContract,
  MealBuilderContractItem,
  MealBuilderContractSection,
  MealBuilderCheck,
  MealBuilderHydratedDraft,
  MealBuilderHydratedItem,
  MealBuilderLifecycleResponseData,
  MealBuilderPremiumSection,
  MealBuilderSection,
  MealBuilderSectionType,
  MealBuilderState,
  MealBuilderValidation,
} from "@/types/mealBuilderTypes";
import { MealBuilderSectionEditor } from "./MealBuilderSectionEditor";
import { MealBuilderSimpleCard } from "./MealBuilderSimpleCard";
import { MealBuilderSimpleCardEditor } from "./MealBuilderSimpleCardEditor";
import {
  mealBuilderErrorMessage,
  toEditableMealBuilderSections,
} from "./mealBuilderFrontendUtils";
import { mealBuilderIssueText } from "./mealBuilderIssueText";
import { orderSections, toBackendSections } from "./mealBuilderUtils";
import { buildMealBuilderVisualCards } from "./mealBuilderVisualModel";

type PageMode = "published" | "draft";
type EditorState = {
  type: MealBuilderSectionType;
  index: number | null;
} | null;

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

export function MealBuilderSimplePage() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<PageMode>("published");
  const [dirty, setDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const builderQuery = useMealBuilderQuery();
  const publishedQuery = useMealBuilderPublishedQuery();
  const draftQuery = useMealBuilderDraftQuery(mode === "draft");
  const hydratedQuery = useMealBuilderHydratedQuery(
    mode === "draft" && draftQuery.isSuccess
  );
  const loadEditableCatalog = mode === "draft";

  const productsQuery = useMenuProductsQuery({
    limit: 500,
    includeInactive: true,
  }, loadEditableCatalog);
  const categoriesQuery = useMenuCategoriesQuery({
    limit: 500,
    includeInactive: true,
  }, loadEditableCatalog);
  const groupsQuery = useMenuOptionGroupsQuery({
    limit: 500,
    includeInactive: true,
  }, loadEditableCatalog);
  const optionsQuery = useMenuOptionsQuery({
    limit: 1000,
    includeInactive: true,
  }, loadEditableCatalog);

  const state = builderQuery.data?.data ?? null;
  const publishedView = useMemo(
    () => normalizePublished(publishedQuery.data?.data ?? null, state),
    [publishedQuery.data, state]
  );
  const draftView = useMemo(
    () =>
      normalizeDraft(
        draftQuery.data?.data ?? null,
        hydratedQuery.data?.data ?? null,
        state
      ),
    [draftQuery.data, hydratedQuery.data, state]
  );
  const activeView = mode === "draft" ? draftView : publishedView;

  const catalog: Catalog = {
    products: productsQuery.data?.data.items ?? [],
    categories: categoriesQuery.data?.data.items ?? [],
    groups: groupsQuery.data?.data.items ?? [],
    options: optionsQuery.data?.data.items ?? [],
  };

  const loading =
    publishedQuery.isLoading ||
    (mode === "draft" &&
      (builderQuery.isLoading ||
        productsQuery.isLoading ||
        categoriesQuery.isLoading ||
        groupsQuery.isLoading ||
        optionsQuery.isLoading ||
        draftQuery.isLoading ||
        hydratedQuery.isLoading));

  const loadError = firstQueryError([
    publishedQuery,
    ...(mode === "draft"
      ? [
          builderQuery,
          productsQuery,
          categoriesQuery,
          groupsQuery,
          optionsQuery,
          draftQuery,
          ...(draftQuery.isSuccess ? [hydratedQuery] : []),
        ]
      : []),
  ]);

  const hasDraft = Boolean(
    state?.metadata?.hasDraft || state?.draft || draftView.config
  );

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_KEY] }),
      queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_PUBLISHED_KEY] }),
      queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_DRAFT_KEY] }),
      queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_HYDRATED_KEY] }),
      queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_READINESS_KEY] }),
    ]);
    toast.success("تم تحديث منشئ الوجبات");
  }

  function openDraft() {
    if (mode === "draft") return;
    setDirty(false);
    queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_DRAFT_KEY] });
    queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_HYDRATED_KEY] });
    setMode("draft");
  }

  function showPublished() {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    setDirty(false);
    setMode("published");
  }

  function confirmShowPublished() {
    setDirty(false);
    setDiscardOpen(false);
    setMode("published");
  }

  async function retry() {
    await Promise.all([
      builderQuery.refetch(),
      publishedQuery.refetch(),
      productsQuery.refetch(),
      categoriesQuery.refetch(),
      groupsQuery.refetch(),
      optionsQuery.refetch(),
      ...(mode === "draft"
        ? [draftQuery.refetch(), hydratedQuery.refetch()]
        : []),
    ]);
  }

  return (
    <div className="grid gap-4" dir="rtl">
      <SimpleHeader
        mode={mode}
        dirty={dirty}
        loading={loading}
        hasDraft={hasDraft}
        onRefresh={refresh}
        onOpenDraft={openDraft}
        onShowPublished={showPublished}
      />
      <VersionStrip view={activeView} mode={mode} hasDraft={hasDraft} />

      {loadError ? (
        <LoadError error={loadError} onRetry={retry} />
      ) : mode === "draft" &&
        (draftQuery.isLoading ||
          (draftQuery.isSuccess && hydratedQuery.isLoading)) ? (
        <DraftLoadingState hydrated={draftQuery.isSuccess} />
      ) : activeView.config ? (
        mode === "draft" ? (
          <SimpleWorkspace
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
              builderQuery.refetch();
            }}
          />
        ) : (
          <PublishedView
            config={activeView.config}
            validation={activeView.validation}
            premiumSection={activeView.premiumSection}
            onOpenDraft={openDraft}
          />
        )
      ) : (
        <EmptyState mode={mode} loading={loading} onOpenDraft={openDraft} />
      )}

      <DiscardDraftDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={confirmShowPublished}
      />
    </div>
  );
}

function SimpleHeader({
  mode,
  dirty,
  loading,
  hasDraft,
  onOpenDraft,
  onShowPublished,
  onRefresh,
}: {
  mode: PageMode;
  dirty: boolean;
  loading: boolean;
  hasDraft: boolean;
  onOpenDraft: () => void;
  onShowPublished: () => void;
  onRefresh: () => void;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">ترتيب خيارات وجبات الاشتراك</h2>
              {dirty ? (
                <Badge variant="secondary">غير محفوظ</Badge>
              ) : mode === "draft" ? (
                <Badge variant="outline">مسودة محفوظة</Badge>
              ) : null}
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              اختر ما يظهر للعميل داخل كل بطاقة، ثم احفظ وانشر التغييرات.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="grid grid-cols-2 rounded-lg border bg-muted/30 p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === "published" ? "default" : "ghost"}
              disabled={loading}
              onClick={onShowPublished}
            >
              <Eye data-icon="inline-start" /> المعروض للعميل
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "draft" ? "default" : "ghost"}
              disabled={loading}
              onClick={onOpenDraft}
            >
              <FileEdit data-icon="inline-start" />
              {hasDraft ? "المسودة" : "تعديل"}
            </Button>
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={loading}
            onClick={onRefresh}
            aria-label="تحديث البيانات"
            title="تحديث البيانات"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function VersionStrip({
  view,
  mode,
  hasDraft,
}: {
  view: NormalizedMealBuilderView;
  mode: PageMode;
  hasDraft: boolean;
}) {
  const isDraft = mode === "draft";
  const items = isDraft
    ? [
        ["الحالة", "مسودة"],
        ["رقم النسخة", view.versionNumber ?? "-"],
        [
          "مبنية على النسخة المنشورة",
          view.basedOnPublishedVersionId ? "آخر نسخة منشورة" : "غير محدد",
        ],
        [
          "تغييرات غير منشورة",
          view.hasUnpublishedChanges ? "نعم" : "لا",
        ],
        ["آخر تحديث", formatSafeDate(view.updatedAt)],
      ]
    : [
        ["الحالة", "منشور"],
        ["رقم النسخة", view.versionNumber ?? "-"],
        ["توجد مسودة", hasDraft ? "نعم" : "لا"],
        [
          "تغييرات غير منشورة",
          view.hasUnpublishedChanges ? "نعم" : "لا",
        ],
        ["تاريخ النشر", formatSafeDate(view.publishedAt)],
        ["آخر تحديث", formatSafeDate(view.updatedAt)],
      ];

  return (
    <div className="grid gap-2 rounded-lg border bg-card p-3 text-sm shadow-none sm:grid-cols-2 xl:grid-cols-6">
      {items.map(([label, value]) => (
        <MetaPill key={String(label)} label={String(label)} value={value} />
      ))}
    </div>
  );
}

function MetaPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-md bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}

function PublishedView({
  config,
  validation,
  premiumSection,
  onOpenDraft,
}: {
  config: MealBuilderConfig;
  validation: MealBuilderValidation | null;
  premiumSection: MealBuilderPremiumSection | null;
  onOpenDraft: () => void;
}) {
  const cards = buildCards(
    config.sections,
    emptyCatalog(),
    validation,
    premiumSection
  );

  return (
    <Card className="border-border/80 shadow-none">
      <CardHeader className="flex flex-col gap-3 border-b lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-base">ما يراه العميل حاليًا</CardTitle>
          <CardDescription>
            هذه النسخة للقراءة فقط. افتح المسودة لتعديلها.
          </CardDescription>
        </div>
        <Button type="button" onClick={onOpenDraft}>
          <FileEdit data-icon="inline-start" /> تعديل القائمة
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 p-4 lg:p-5">
        <ValidationNotice validation={validation} dirty={false} />
        <PremiumNotice premiumSection={premiumSection} />
        <CardsGrid cards={cards} readOnly />
      </CardContent>
    </Card>
  );
}

function DraftLoadingState({ hydrated }: { hydrated: boolean }) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground">
        <Loader2 className="size-4 shrink-0 animate-spin" />
        {hydrated
          ? "جاري تحميل بيانات المسودة التفصيلية..."
          : "جاري فتح مسودة العمل..."}
      </CardContent>
    </Card>
  );
}

function SimpleWorkspace({
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
  const queryClient = useQueryClient();
  const saveDraft = useSaveMealBuilderDraftMutation();
  const validateDraft = useValidateMealBuilderDraftMutation();
  const publishDraft = usePublishMealBuilderDraftMutation();
  const resetDraft = useResetMealBuilderDraftMutation();

  const [sections, setSections] = useState(() =>
    toEditableMealBuilderSections(orderSections(draft.sections))
  );
  const [notes, setNotes] = useState(draft.notes ?? "");
  const [editor, setEditor] = useState<EditorState>(null);
  const [cardEditorKey, setCardEditorKey] = useState<string | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [validation, setValidation] =
    useState<MealBuilderValidation | null>(initialValidation);

  const cards = buildCards(sections, catalog, validation, premiumSection);
  const selectedCard = cardEditorKey
    ? cards.find((card) => card.key === cardEditorKey) ?? null
    : null;
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

  function markChanged() {
    setValidation(null);
    onDirtyChange(true);
  }

  function replaceSections(next: MealBuilderSection[]) {
    const editable = toEditableMealBuilderSections(orderSections(next)).map(
      (section, index) => ({ ...section, sortOrder: index + 1 })
    );
    setSections(editable);
    markChanged();
  }

  function syncSaved(saved: MealBuilderConfig) {
    setSections(toEditableMealBuilderSections(orderSections(saved.sections)));
    setNotes(saved.notes ?? notes);
    setValidation(null);
    onDirtyChange(false);
  }

  function saveCurrent(onSaved?: () => void) {
    saveDraft.mutate(payload, {
      onSuccess: (response) => {
        syncSaved(response.data);
        onSaved?.();
      },
    });
  }

  function validateCurrent({
    serverDraft = false,
    onValid,
  }: {
    serverDraft?: boolean;
    onValid?: () => void;
  } = {}) {
    validateDraft.mutate(serverDraft ? undefined : payload, {
      onSuccess: (response) => {
        setValidation(response.data);
        if (!response.data.ready || response.data.errors.length > 0) return;
        onValid?.();
      },
    });
  }

  function publishFlow() {
    const validateSaved = () =>
      validateCurrent({
        serverDraft: true,
        onValid: () => setPublishOpen(true),
      });

    if (dirty) {
      saveCurrent(validateSaved);
      return;
    }
    validateSaved();
  }

  function saveAdvancedSection(nextSection: MealBuilderSection) {
    setSections((current) => {
      if (editor?.index == null) {
        return [
          ...current,
          { ...nextSection, sortOrder: current.length + 1 },
        ];
      }
      return current.map((section, index) =>
        index === editor.index ? nextSection : section
      );
    });
    setEditor(null);
    markChanged();
  }

  return (
    <>
      <div className="space-y-4">
        <Card className="sticky top-2 z-20 border-border/80 bg-background/95 shadow-sm backdrop-blur">
          <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between lg:p-4">
            <div>
              <p className="font-semibold">تعديل المسودة</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {dirty
                  ? "لديك تغييرات تحتاج إلى الحفظ."
                  : "كل التغييرات محفوظة."}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                onClick={() => saveCurrent()}
                disabled={pending || !dirty}
              >
                {saveDraft.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save data-icon="inline-start" />
                )}
                حفظ
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => validateCurrent()}
                disabled={pending}
              >
                {validateDraft.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 data-icon="inline-start" />
                )}
                فحص
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={publishFlow}
                disabled={pending}
              >
                {publishDraft.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                نشر
              </Button>
            </div>
          </CardContent>
        </Card>

        <ValidationNotice validation={validation} dirty={dirty} />
        <PremiumNotice premiumSection={premiumSection} />

        <div className="grid gap-4 xl:grid-cols-2">
          {cards.map((card) => (
            <MealBuilderSimpleCard
              key={card.key}
              card={card}
              readOnly={card.key === "premium" || loading}
              onEdit={() => setCardEditorKey(card.key)}
            />
          ))}
        </div>

        <details className="rounded-lg border bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            إعدادات متقدمة وملاحظات النشر
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                استخدم هذه الأدوات فقط لإضافة قسم جديد غير موجود ضمن البطاقات الأساسية.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditor({ type: "option_group", index: null })}
                >
                  <Plus data-icon="inline-start" /> مجموعة خيارات
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setEditor({ type: "product_category", index: null })
                  }
                >
                  <Plus data-icon="inline-start" /> تصنيف منتجات
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditor({ type: "product_list", index: null })}
                >
                  <Plus data-icon="inline-start" /> قائمة منتجات
                </Button>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setResetOpen(true)}
                disabled={pending}
              >
                <RotateCcw data-icon="inline-start" /> إلغاء تعديلات المسودة
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meal-builder-publish-notes">ملاحظات النشر</Label>
              <Textarea
                id="meal-builder-publish-notes"
                value={notes}
                onChange={(event) => {
                  setNotes(event.target.value);
                  markChanged();
                }}
                className="min-h-24"
                placeholder="مثال: تحديث خيارات الساندويتش"
              />
            </div>
          </div>
        </details>
      </div>

      {selectedCard ? (
        <MealBuilderSimpleCardEditor
          key={selectedCard.key}
          open
          card={selectedCard}
          sections={sections}
          catalog={catalog}
          onClose={() => setCardEditorKey(null)}
          onSave={(nextSections) => {
            replaceSections(nextSections);
            setCardEditorKey(null);
          }}
        />
      ) : null}

      {editor ? (
        <MealBuilderSectionEditor
          key={`${editor.type}:${editor.index ?? "new"}`}
          open
          type={editor.type}
          initial={
            editor.index == null ? null : (sections[editor.index] ?? null)
          }
          products={catalog.products}
          categories={catalog.categories}
          groups={catalog.groups}
          options={catalog.options}
          onClose={() => setEditor(null)}
          onSave={saveAdvancedSection}
        />
      ) : null}

      <PublishDialog
        open={publishOpen}
        pending={publishDraft.isPending}
        warnings={validation?.warnings.length ?? 0}
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
        dirty={dirty}
        onClose={() => setResetOpen(false)}
        onReset={() =>
          resetDraft.mutate(undefined, {
            onSuccess: (response) => {
              const resetView = normalizeDraft(response.data, null, null);
              if (resetView.config) {
                setSections(
                  toEditableMealBuilderSections(
                    orderSections(resetView.config.sections)
                  )
                );
                setNotes(resetView.config.notes ?? "");
                setValidation(resetView.validation);
              }
              onDirtyChange(false);
              setResetOpen(false);
              queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_KEY] });
              queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_DRAFT_KEY] });
              queryClient.invalidateQueries({ queryKey: [MEAL_BUILDER_HYDRATED_KEY] });
            },
          })
        }
      />
    </>
  );
}

function CardsGrid({
  cards,
  readOnly = false,
}: {
  cards: ReturnType<typeof buildMealBuilderVisualCards>;
  readOnly?: boolean;
}) {
  if (!cards.length) {
    return (
      <MenuEmptyState
        title="لا توجد بطاقات"
        description="افتح المسودة لإضافة خيارات الوجبات."
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {cards.map((card) => (
        <MealBuilderSimpleCard key={card.key} card={card} readOnly={readOnly} />
      ))}
    </div>
  );
}

function ValidationNotice({
  validation,
  dirty,
}: {
  validation: MealBuilderValidation | null;
  dirty: boolean;
}) {
  if (dirty) {
    return (
      <div className="flex items-start gap-2 rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        احفظ أو افحص التغييرات للحصول على نتيجة محدثة.
      </div>
    );
  }

  if (!validation) return null;
  const grouped = groupValidationIssues(validation);

  if (validation.errors.length) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
        <p className="font-medium">
          توجد {validation.errors.length} مشاكل تمنع النشر.
        </p>
        <p className="mt-1">{mealBuilderIssueText(validation.errors[0])}</p>
        <details className="mt-3 rounded-md border border-destructive/20 bg-background/80 p-3 text-foreground">
          <summary className="cursor-pointer font-medium text-destructive">
            عرض الأخطاء
          </summary>
          <ValidationIssueGroups groups={grouped} />
        </details>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
      <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      {validation.warnings.length
        ? `جاهزة للنشر مع ${validation.warnings.length} ملاحظات غير مانعة.`
        : "المسودة جاهزة للنشر."}
      </div>
      {validation.warnings.length ? (
        <details className="mt-3 rounded-md border border-emerald-200 bg-background/80 p-3 text-foreground">
          <summary className="cursor-pointer font-medium text-amber-700">
            عرض التنبيهات
          </summary>
          <ValidationIssueGroups groups={grouped} />
        </details>
      ) : null}
    </div>
  );
}

type ValidationIssueGroup = {
  key: string;
  label: string;
  errors: MealBuilderCheck[];
  warnings: MealBuilderCheck[];
};

function ValidationIssueGroups({ groups }: { groups: ValidationIssueGroup[] }) {
  if (!groups.length) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        لا توجد تفاصيل إضافية.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {groups.map((group) => (
        <div key={group.key} className="rounded-md border bg-background p-3">
          <p className="font-medium">{group.label}</p>
          {group.errors.length ? (
            <IssueList title="أخطاء مانعة" issues={group.errors} />
          ) : null}
          {group.warnings.length ? (
            <IssueList title="تنبيهات" issues={group.warnings} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function IssueList({
  title,
  issues,
}: {
  title: string;
  issues: MealBuilderCheck[];
}) {
  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
        {issues.map((issue, index) => (
          <li key={`${issue.code ?? "issue"}-${index}`}>
            {validationIssueItemLabel(issue) ? (
              <span className="font-medium">
                {validationIssueItemLabel(issue)}:{" "}
              </span>
            ) : null}
            {mealBuilderIssueText(issue)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function groupValidationIssues(
  validation: MealBuilderValidation
): ValidationIssueGroup[] {
  const groups = new Map<string, ValidationIssueGroup>();
  const add = (issue: MealBuilderCheck, kind: "errors" | "warnings") => {
    const key = validationGroupKey(issue);
    const group =
      groups.get(key) ??
      ({
        key,
        label: validationGroupLabel(issue),
        errors: [],
        warnings: [],
      } satisfies ValidationIssueGroup);
    group[kind].push(issue);
    groups.set(key, group);
  };

  validation.errors.forEach((issue) => add(issue, "errors"));
  validation.warnings.forEach((issue) => add(issue, "warnings"));
  return Array.from(groups.values());
}

function validationGroupKey(issue: MealBuilderCheck) {
  if (typeof issue.sectionIndex === "number") return `section-${issue.sectionIndex}`;
  if (issue.sectionType) return `section-type-${issue.sectionType}`;
  return "general";
}

function validationGroupLabel(issue: MealBuilderCheck) {
  const section = sectionKeyFromIssue(issue);
  if (section) return sectionLabel(section);
  if (typeof issue.sectionIndex === "number") {
    return `قسم ${issue.sectionIndex + 1}`;
  }
  return "أخطاء عامة";
}

function validationIssueItemLabel(issue: MealBuilderCheck) {
  const value =
    issue.itemName ??
    issue.productName ??
    issue.optionName ??
    issue.itemKey ??
    issue.productKey ??
    issue.optionKey ??
    issue.groupKey;
  if (typeof value !== "string" || !value.trim()) return null;
  return value;
}

function sectionKeyFromIssue(issue: MealBuilderCheck) {
  const raw = String(issue.cardKey ?? issue.sectionKey ?? issue.sectionType ?? "");
  if (!raw) return null;
  return raw.replace(/_/g, "-").toLowerCase();
}

function sectionLabel(key: string) {
  const labels: Record<string, string> = {
    premium: "مميز",
    sandwich: "ساندويتشات",
    chicken: "دجاج",
    beef: "لحوم",
    fish: "أسماك",
    eggs: "بيض",
    carbs: "نشويات",
    option_group: "مجموعة خيارات",
    product_category: "تصنيف منتجات",
    product_list: "قائمة منتجات",
  };
  return labels[key] ?? "أخطاء عامة";
}

function PremiumNotice({
  premiumSection,
}: {
  premiumSection: MealBuilderPremiumSection | null;
}) {
  const count =
    (premiumSection?.diagnostics?.length ?? 0) +
    (premiumSection?.excluded?.length ?? 0) +
    (premiumSection?.broken?.length ?? 0);
  if (!count) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      يوجد {count} عناصر مميزة تحتاج إلى مراجعة من صفحة الوجبات المميزة.
    </div>
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
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>نشر التغييرات للعميل؟</DialogTitle>
          <DialogDescription>
            سيتم استبدال القائمة الحالية بالمسودة بعد تأكيد النشر.
          </DialogDescription>
        </DialogHeader>
        {warnings ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            توجد {warnings} ملاحظات غير مانعة.
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" disabled={pending} onClick={onPublish}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            تأكيد النشر
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscardDraftDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>عرض القائمة المنشورة؟</DialogTitle>
          <DialogDescription>
            توجد تغييرات محلية غير محفوظة في المسودة. سيبقى الخادم بدون تغيير،
            وسيتم الرجوع إلى النسخة التي يراها العميل الآن.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" variant="destructive" onClick={onConfirm}>
            ترك التغييرات المحلية
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetDialog({
  open,
  pending,
  dirty,
  onClose,
  onReset,
}: {
  open: boolean;
  pending: boolean;
  dirty: boolean;
  onClose: () => void;
  onReset: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-md" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>إلغاء تعديلات المسودة؟</DialogTitle>
          <DialogDescription>
            سيتم الرجوع إلى آخر نسخة منشورة ولن تتأثر القائمة الحالية للعميل.
          </DialogDescription>
        </DialogHeader>
        {dirty ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            توجد تغييرات محلية غير محفوظة، وسيتم تجاهلها عند تنفيذ الإلغاء.
          </p>
        ) : null}
        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={onReset}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            تأكيد الإلغاء
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            رجوع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Card className="border-destructive/30 shadow-none">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-semibold">تعذر تحميل منشئ الوجبات</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {mealBuilderErrorMessage(error, "تحقق من الاتصال ثم أعد المحاولة.")}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" onClick={onRetry}>
          <RefreshCw data-icon="inline-start" /> إعادة المحاولة
        </Button>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  mode,
  loading,
  onOpenDraft,
}: {
  mode: PageMode;
  loading: boolean;
  onOpenDraft: () => void;
}) {
  return (
    <Card className="border-border/80 shadow-none">
      <CardContent className="space-y-4 pt-6">
        <MenuEmptyState
          title={loading ? "جاري تحميل القائمة" : "لا توجد قائمة جاهزة"}
          description={
            mode === "published"
              ? "افتح المسودة لإعداد خيارات الوجبات ونشرها للعميل."
              : "سيقوم الخادم بإنشاء مسودة العمل عند فتحها."
          }
        />
        {!loading ? (
          <div className="flex justify-center">
            <Button type="button" onClick={onOpenDraft}>
              <FileEdit data-icon="inline-start" /> فتح المسودة
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function buildCards(
  sections: MealBuilderSection[],
  catalog: Catalog,
  validation: MealBuilderValidation | null,
  premiumSection: MealBuilderPremiumSection | null
) {
  return buildMealBuilderVisualCards({
    sections: orderSections(sections),
    products: catalog.products,
    categories: catalog.categories,
    options: catalog.options,
    issues: [
      ...(validation?.errors ?? []),
      ...(validation?.warnings ?? []),
    ],
    premiumSection,
  });
}

function emptyCatalog(): Catalog {
  return {
    products: [],
    categories: [],
    groups: [],
    options: [],
  };
}

function normalizePublished(
  data: MealBuilderLifecycleResponseData | null,
  state: MealBuilderState | null
): NormalizedMealBuilderView {
  const config = data?.config ?? data?.published ?? state?.published ?? null;
  const contract = data?.contract ?? state?.contract ?? state?.preview ?? null;
  const displayConfig =
    config && contract?.sections?.length
      ? {
          ...config,
          sections: contract.sections.map(contractSectionToMealBuilderSection),
        }
      : config;
  return {
    config: displayConfig,
    validation: data?.validation ?? state?.validation.published ?? null,
    premiumSection:
      data?.premiumSection ??
      contractPremiumSection(contract) ??
      state?.premiumSection ??
      findPremiumSection(config?.sections),
    versionId: nullableString(data?.versionId ?? config?.id),
    versionNumber: data?.versionNumber ?? null,
    basedOnPublishedVersionId: data?.basedOnPublishedVersionId ?? null,
    hasUnpublishedChanges: Boolean(data?.hasUnpublishedChanges),
    publishedAt: data?.publishedAt ?? config?.publishedAt ?? null,
    updatedAt: data?.updatedAt ?? config?.updatedAt ?? null,
  };
}

function normalizeDraft(
  lifecycleData: MealBuilderLifecycleResponseData | MealBuilderConfig | null,
  hydratedData: MealBuilderHydratedDraft | null,
  state: MealBuilderState | null
): NormalizedMealBuilderView {
  const lifecycle = isMealBuilderConfig(lifecycleData)
    ? ({ config: lifecycleData } satisfies MealBuilderLifecycleResponseData)
    : lifecycleData;
  const baseConfig =
    hydratedData?.draft ??
    lifecycle?.config ??
    lifecycle?.draft ??
    state?.draft ??
    null;
  const config =
    baseConfig && hydratedData?.sections
      ? { ...baseConfig, sections: hydratedData.sections }
      : baseConfig;
  const hydratedValidation = validationFromHydrated(hydratedData);

  return {
    config,
    validation:
      hydratedData?.validation ??
      lifecycle?.validation ??
      hydratedValidation ??
      state?.validation.draft ??
      null,
    premiumSection:
      hydratedData?.premiumSection ??
      lifecycle?.premiumSection ??
      state?.premiumSection ??
      findPremiumSection(config?.sections),
    versionId: nullableString(
      hydratedData?.versionId ??
        lifecycle?.versionId ??
        lifecycle?.draftVersionId ??
        config?.id
    ),
    versionNumber:
      hydratedData?.versionNumber ??
      lifecycle?.versionNumber ??
      null,
    basedOnPublishedVersionId:
      hydratedData?.basedOnPublishedVersionId ??
      lifecycle?.basedOnPublishedVersionId ??
      null,
    hasUnpublishedChanges: Boolean(
      hydratedData?.hasUnpublishedChanges ?? lifecycle?.hasUnpublishedChanges
    ),
    publishedAt: lifecycle?.publishedAt ?? config?.publishedAt ?? null,
    updatedAt:
      hydratedData?.updatedAt ?? lifecycle?.updatedAt ?? config?.updatedAt ?? null,
  };
}

function validationFromHydrated(
  data: MealBuilderHydratedDraft | null
): MealBuilderValidation | null {
  if (!data) return null;
  const errors = data.errors ?? [];
  const warnings = data.warnings ?? [];
  return {
    status: errors.length ? "error" : warnings.length ? "warning" : "ok",
    ready: Boolean(data.ready) && errors.length === 0,
    errors,
    warnings,
    checks: [...errors, ...warnings],
  };
}

function contractSectionToMealBuilderSection(
  section: MealBuilderContractSection,
  index: number
): MealBuilderSection {
  return {
    id: section.id,
    key: section.key || section.selectionType || section.id,
    sectionType: section.sectionType,
    sourceKind: section.sourceKind,
    productContextId: section.productContextId ?? null,
    sourceGroupId: section.sourceGroupId ?? null,
    sourceCategoryId: section.sourceCategoryId ?? null,
    selectedOptionIds: [],
    selectedProductIds: [],
    includeMode: section.includeMode ?? "selected",
    selectionType: section.selectionType || "",
    titleOverride: section.titleI18n ?? {
      ar: section.title ?? section.key ?? section.id,
      en: section.title ?? section.key ?? section.id,
    },
    sortOrder: Number(section.sortOrder || index + 1),
    required: Boolean(section.required),
    minSelections: Number(section.minSelections || 0),
    maxSelections: section.maxSelections ?? null,
    multiSelect: Boolean(section.multiSelect),
    visible: true,
    availableFor: ["subscription"],
    items: (section.items ?? []).map(contractItemToHydratedItem),
  };
}

function contractItemToHydratedItem(
  item: MealBuilderContractItem
): MealBuilderHydratedItem {
  const type = item.type || item.kind || "option";
  return {
    id: item.id,
    optionId: type === "option" ? item.id : null,
    productId: type === "product" ? item.id : null,
    type,
    key: item.key,
    label: item.label || item.name || item.nameI18n?.ar || item.nameI18n?.en,
    name: item.nameI18n,
    selectionType: item.selectionType,
    imageUrl: item.imageUrl,
    kind: item.kind,
    currency: item.currency,
    priceHalala: item.priceHalala ?? null,
    premiumPriceHalala: item.premiumPriceHalala ?? null,
    upgradePriceHalala: item.upgradePriceHalala ?? null,
    sortOrder: item.sortOrder ?? null,
    health: item.health ?? null,
    status: item.status ?? null,
    selected: true,
    eligible: item.eligible !== false,
    linked: item.linked !== false,
    available: item.available !== false,
    active: item.active !== false,
    visible: item.visible !== false,
    published: item.published !== false,
    subscriptionEnabled: item.subscriptionEnabled !== false,
    relationExists: item.relationExists !== false,
    catalogItemAvailable: item.catalogItemAvailable !== false,
    state: "selected",
  };
}

function contractPremiumSection(
  contract: MealBuilderContract | null | undefined
): MealBuilderPremiumSection | null {
  return contract?.premiumSection ?? null;
}

function findPremiumSection(
  sections?: MealBuilderSection[] | null
): MealBuilderPremiumSection | null {
  const premium = sections?.find(
    (section) =>
      section.key === "premium" || section.selectionType?.includes("premium")
  );
  if (!premium?.items?.length) return null;
  return {
    automatic: Boolean(
      premium.metadata?.automatic ??
        premium.metadata?.source === "premium_upgrade_configs"
    ),
    source: String(
      premium.metadata?.source ?? "premium_upgrade_configs"
    ),
    items: premium.items,
  };
}

function isMealBuilderConfig(
  value: MealBuilderLifecycleResponseData | MealBuilderConfig | null
): value is MealBuilderConfig {
  return Boolean(
    value && "sections" in value && Array.isArray(value.sections) && "id" in value
  );
}

function nullableString(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  return String(value);
}

function formatSafeDate(value?: string | null) {
  if (!value) return "لا يوجد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير متاح";
  return new Intl.DateTimeFormat("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function firstQueryError(
  queries: Array<{ isError: boolean; error: unknown }>
): unknown | null {
  return queries.find((query) => query.isError)?.error ?? null;
}
