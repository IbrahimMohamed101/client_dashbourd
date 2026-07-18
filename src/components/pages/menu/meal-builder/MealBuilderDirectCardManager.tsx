import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Loader2,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useCreateMealBuilderProductSectionMutation,
  useDeleteMealBuilderProductSectionMutation,
  useAddMealBuilderProductsMutation,
  useMealBuilderPickerQuery,
  useRemoveMealBuilderProductMutation,
  useUpdateMealBuilderProductSectionMutation,
} from "@/hooks/menu";
import { parseApiError } from "@/lib/apiErrors";
import type {
  MealBuilderAssignmentConflict,
  MealBuilderCardActionResponse,
  MealBuilderPickerCandidate,
  MealBuilderSection,
  MealBuilderValidation,
} from "@/types/mealBuilderTypes";
import { halalaToRiyal } from "@/utils/price";
import { mealBuilderIssueText } from "./mealBuilderIssueText";
import { isDirectProductCard } from "./mealBuilderDirectCardUtils";

const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{1,63}$/;

type FieldErrors = {
  key?: string;
  title?: string;
  products?: string;
  sortOrder?: string;
  general?: string;
  conflicts?: MealBuilderAssignmentConflict[];
  wouldBeEmpty?: boolean;
};

type DirectCardDialogMode =
  | { type: "create" }
  | { type: "edit"; sectionKey: string };

export function MealBuilderDirectCardManager({
  sections,
  validation,
  pending,
  onBeforeAction,
  onActionApplied,
  onPendingChange,
}: {
  sections: MealBuilderSection[];
  validation: MealBuilderValidation | null;
  pending: boolean;
  onBeforeAction: () => Promise<void>;
  onActionApplied: (response: MealBuilderCardActionResponse) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [dialogMode, setDialogMode] = useState<DirectCardDialogMode | null>(null);
  const [deleteSection, setDeleteSection] = useState<MealBuilderSection | null>(null);
  const directSections = useMemo(
    () => sections.filter(isDirectProductCard),
    [sections]
  );
  const maxSortOrder = directSections.reduce(
    (max, section) => Math.max(max, Number(section.sortOrder || 0)),
    0
  );
  const deleteMutation = useDeleteMealBuilderProductSectionMutation();
  const actionPending = pending || deleteMutation.isPending;

  useEffect(() => {
    onPendingChange?.(actionPending);
  }, [actionPending, onPendingChange]);

  async function deleteCard(section: MealBuilderSection) {
    if (actionPending) return;
    try {
      await onBeforeAction();
      const response = await deleteMutation.mutateAsync(section.key || "");
      onActionApplied(response);
      setDeleteSection(null);
    } catch (error) {
      toast.error(mealBuilderError(error, "تعذر حذف البطاقة"));
    }
  }

  return (
    <section className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">بطاقات المنتجات المباشرة</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            هذه البطاقات تحفظ مباشرة في مسودة الخادم، وتظل النسخة العامة بدون تغيير حتى النشر.
          </p>
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={actionPending}
          onClick={() => setDialogMode({ type: "create" })}
        >
          <Plus data-icon="inline-start" />
          إضافة بطاقة منتجات
        </Button>
      </div>

      {directSections.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {directSections.map((section) => (
            <DirectSectionCard
              key={section.key}
              section={section}
              validation={validation}
              pending={actionPending}
              onEdit={() => setDialogMode({ type: "edit", sectionKey: section.key || "" })}
              onDelete={() => setDeleteSection(section)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          لا توجد بطاقات منتجات مباشرة في المسودة. ابدأ بإضافة بطاقة واختر منتجات غير مخصصة.
        </div>
      )}

      {dialogMode ? (
        <DirectCardDialog
          key={dialogMode.type === "edit" ? dialogMode.sectionKey : "create"}
          mode={dialogMode}
          sections={sections}
          defaultSortOrder={maxSortOrder + 10}
          pending={actionPending}
          onClose={() => setDialogMode(null)}
          onBeforeAction={onBeforeAction}
          onPendingChange={onPendingChange}
          onActionApplied={(response) => {
            onActionApplied(response);
            const nextKey = response.data.sectionKey;
            if (response.data.action === "deleted" || !nextKey) {
              setDialogMode(null);
              return;
            }
            setDialogMode({ type: "edit", sectionKey: nextKey });
          }}
        />
      ) : null}

      <DeleteCardDialog
        section={deleteSection}
        pending={actionPending}
        onClose={() => setDeleteSection(null)}
        onConfirm={() => deleteSection && deleteCard(deleteSection)}
      />
    </section>
  );
}

function DirectSectionCard({
  section,
  validation,
  pending,
  onEdit,
  onDelete,
}: {
  section: MealBuilderSection;
  validation: MealBuilderValidation | null;
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const issues = validationIssuesForSection(validation, section);
  const hasErrors = issues.some((issue) => issue.level === "error");
  const products = selectedProducts(section);

  return (
    <div className="space-y-3 rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-words text-sm font-semibold">
              {section.titleOverride?.ar || section.titleOverride?.en || section.key}
            </h4>
            <Badge variant={hasErrors ? "destructive" : "outline"}>
              {hasErrors ? "تحتاج مراجعة" : "جاهزة"}
            </Badge>
            <Badge variant="secondary">
              {section.visible === false ? "مخفية" : "ظاهرة"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            المفتاح: <bdi dir="ltr">{section.key}</bdi> · الترتيب {section.sortOrder}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={pending}
            onClick={onEdit}
            aria-label={`تعديل ${section.key}`}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={pending}
            onClick={onDelete}
            aria-label={`حذف ${section.key}`}
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline">{products.length} منتجات</Badge>
        <Badge variant="outline">مسودة</Badge>
        <Badge variant="outline">تغييرات غير منشورة حتى النشر</Badge>
      </div>

      {products.length ? (
        <div className="grid gap-2">
          {products.slice(0, 3).map((product) => (
            <ProductChip key={product.productId || product.id || product.key} product={product} />
          ))}
          {products.length > 3 ? (
            <p className="text-xs text-muted-foreground">+{products.length - 3} منتجات أخرى</p>
          ) : null}
        </div>
      ) : (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
          لا يمكن أن تبقى بطاقة المنتجات فارغة.
        </p>
      )}

      {issues.length ? (
        <div className="space-y-1 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
          {issues.slice(0, 3).map((issue, index) => (
            <p key={`${issue.code ?? "issue"}-${index}`}>{mealBuilderIssueText(issue)}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DirectCardDialog({
  mode,
  sections,
  defaultSortOrder,
  pending,
  onClose,
  onBeforeAction,
  onPendingChange,
  onActionApplied,
}: {
  mode: DirectCardDialogMode;
  sections: MealBuilderSection[];
  defaultSortOrder: number;
  pending: boolean;
  onClose: () => void;
  onBeforeAction: () => Promise<void>;
  onPendingChange?: (pending: boolean) => void;
  onActionApplied: (response: MealBuilderCardActionResponse) => void;
}) {
  const existing =
    mode.type === "edit"
      ? sections.find((section) => section.key === mode.sectionKey) ?? null
      : null;
  const [key, setKey] = useState(existing?.key ?? "");
  const [titleAr, setTitleAr] = useState(existing?.titleOverride?.ar ?? "");
  const [titleEn, setTitleEn] = useState(existing?.titleOverride?.en ?? "");
  const [sortOrder, setSortOrder] = useState(String(existing?.sortOrder ?? defaultSortOrder));
  const [visible, setVisible] = useState(existing?.visible !== false);
  const [productIds, setProductIds] = useState<string[]>(
    existing ? productIdsForSection(existing) : []
  );
  const [query, setQuery] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const deferredQuery = useDeferredValue(query.trim());
  const firstInputRef = useRef<HTMLInputElement>(null);
  const createMutation = useCreateMealBuilderProductSectionMutation();
  const addMutation = useAddMealBuilderProductsMutation();
  const updateMutation = useUpdateMealBuilderProductSectionMutation();
  const removeMutation = useRemoveMealBuilderProductMutation();
  const pickerSectionKey = mode.type === "edit" ? mode.sectionKey : "products";
  const pickerQuery = useMealBuilderPickerQuery(pickerSectionKey, {
    q: deferredQuery || undefined,
    search: deferredQuery || undefined,
    limit: 1000,
    unassignedOnly: true,
    includeUnavailable: false,
    targetSectionKey: mode.type === "edit" ? mode.sectionKey : undefined,
  });
  const candidates = pickerQuery.data?.data.candidates ?? [];
  const actionPending =
    pending ||
    createMutation.isPending ||
    addMutation.isPending ||
    updateMutation.isPending ||
    removeMutation.isPending;

  useEffect(() => {
    onPendingChange?.(actionPending);
  }, [actionPending, onPendingChange]);
  const selectedCount = productIds.length;
  const title = mode.type === "edit" ? "تعديل بطاقة منتجات" : "إضافة بطاقة منتجات";

  useEffect(() => {
    if (!fieldErrors.key && !fieldErrors.title && !fieldErrors.products) return;
    firstInputRef.current?.focus();
  }, [fieldErrors]);

  function toggleProduct(candidate: MealBuilderPickerCandidate) {
    const id = candidate.productId || candidate.id;
    const selectable = candidate.selected || candidate.assignable;
    if (!selectable) return;
    setProductIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
    setFieldErrors((current) => ({ ...current, products: undefined }));
  }

  async function save() {
    const parsedSortOrder = Number(sortOrder);
    const nextErrors: FieldErrors = {};
    if (!KEY_PATTERN.test(key.trim())) {
      nextErrors.key = "المفتاح مطلوب ويجب أن يبدأ بحرف أو رقم ويحتوي 2-64 حرفا صغيرا أو رقما أو _ أو -.";
    }
    if (!titleAr.trim() && !titleEn.trim()) {
      nextErrors.title = "أدخل عنوانا عربيا أو إنجليزيا على الأقل.";
    }
    if (!Number.isInteger(parsedSortOrder) || parsedSortOrder < 0) {
      nextErrors.sortOrder = "الترتيب يجب أن يكون رقما صحيحا غير سالب.";
    }
    if (!productIds.length) {
      nextErrors.products = "اختر منتجا واحدا على الأقل.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      await onBeforeAction();
      const payload = {
        key: key.trim(),
        titleOverride: {
          ar: titleAr.trim() || titleEn.trim(),
          en: titleEn.trim() || titleAr.trim(),
        },
        selectedProductIds: productIds,
        sortOrder: parsedSortOrder,
        visible,
      };
      const response =
        mode.type === "create"
          ? await createMutation.mutateAsync(payload)
          : await saveExistingCard({
              sectionKey: mode.sectionKey,
              existing,
              payload,
              addProducts: addMutation.mutateAsync,
              updateSection: updateMutation.mutateAsync,
            });
      onActionApplied(response);
      setFieldErrors({});
      toast.success(mode.type === "create" ? "تم إنشاء البطاقة" : "تم حفظ البطاقة");
    } catch (error) {
      const mapped = mapCardActionError(error);
      setFieldErrors(mapped);
      toast.error(mapped.general || mealBuilderError(error, "تعذر حفظ بطاقة المنتجات"));
      if (mapped.conflicts?.length) {
        pickerQuery.refetch();
      }
    }
  }

  async function removeProduct(productId: string) {
    if (productIds.length <= 1) {
      setFieldErrors({
        products: "لا يمكن حذف آخر منتج كإجراء عادي. استخدم حذف البطاقة بدلا من ذلك.",
        wouldBeEmpty: true,
      });
      return;
    }
    try {
      await onBeforeAction();
      const response = await removeMutation.mutateAsync({
        sectionKey: mode.type === "edit" ? mode.sectionKey : key,
        productId,
      });
      onActionApplied(response);
      setProductIds((current) => current.filter((item) => item !== productId));
      pickerQuery.refetch();
    } catch (error) {
      const mapped = mapCardActionError(error);
      setFieldErrors(mapped);
      toast.error(mapped.general || mealBuilderError(error, "تعذر حذف المنتج"));
      pickerQuery.refetch();
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !actionPending) onClose();
      }}
    >
      <DialogContent
        className="grid h-[min(92dvh,860px)] w-[calc(100vw-1rem)] !max-w-[calc(100vw-1rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:!max-w-[min(94vw,72rem)]"
        dir="rtl"
      >
        <DialogHeader className="border-b px-4 py-4 text-right sm:px-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            اختر منتجات مباشرة من مرشح الخادم. المنتج المخصص في بطاقة أخرى يبقى معطلا ولا يتم نقله تلقائيا.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.85fr)_minmax(26rem,1.15fr)]">
            <section className="space-y-4 rounded-xl border bg-muted/10 p-4">
              <FieldError message={fieldErrors.general} />
              <ConflictList conflicts={fieldErrors.conflicts} onRefresh={() => pickerQuery.refetch()} />
              {fieldErrors.wouldBeEmpty ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
                  بطاقة المنتجات لا يمكن أن تكون فارغة. أغلق المحرر واستخدم زر حذف البطاقة إذا أردت تحرير منتجاتها.
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="direct-card-key">مفتاح البطاقة</Label>
                <Input
                  ref={firstInputRef}
                  id="direct-card-key"
                  dir="ltr"
                  value={key}
                  disabled={actionPending}
                  onChange={(event) => setKey(event.target.value.toLowerCase())}
                />
                <FieldError message={fieldErrors.key} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direct-card-title-ar">العنوان العربي</Label>
                <Input
                  id="direct-card-title-ar"
                  value={titleAr}
                  disabled={actionPending}
                  onChange={(event) => setTitleAr(event.target.value)}
                />
                <FieldError message={fieldErrors.title} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="direct-card-title-en">English title</Label>
                <Input
                  id="direct-card-title-en"
                  dir="ltr"
                  value={titleEn}
                  disabled={actionPending}
                  onChange={(event) => setTitleEn(event.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="direct-card-sort">الترتيب</Label>
                  <Input
                    id="direct-card-sort"
                    type="number"
                    min="0"
                    step="1"
                    value={sortOrder}
                    disabled={actionPending}
                    onChange={(event) => setSortOrder(event.target.value)}
                  />
                  <FieldError message={fieldErrors.sortOrder} />
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                  <Label htmlFor="direct-card-visible">ظاهرة للعميل</Label>
                  <Switch
                    id="direct-card-visible"
                    checked={visible}
                    disabled={actionPending}
                    onCheckedChange={setVisible}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>المنتجات المختارة</Label>
                  <Badge variant="outline">{selectedCount}</Badge>
                </div>
                <FieldError message={fieldErrors.products} />
                <div className="divide-y overflow-hidden rounded-lg border bg-background">
                  {productIds.length ? (
                    productIds.map((productId) => (
                      <SelectedProductRow
                        key={productId}
                        productId={productId}
                        candidate={candidates.find(
                          (candidate) => (candidate.productId || candidate.id) === productId
                        )}
                        pending={actionPending}
                        onRemove={() =>
                          mode.type === "edit"
                            ? removeProduct(productId)
                            : setProductIds((current) =>
                                current.filter((item) => item !== productId)
                              )
                        }
                      />
                    ))
                  ) : (
                    <p className="p-3 text-sm text-muted-foreground">لم يتم اختيار منتجات بعد.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-xl border bg-muted/10 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="direct-card-product-search">بحث المنتجات</Label>
                <Input
                  id="direct-card-product-search"
                  value={query}
                  disabled={actionPending}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="ابحث باسم المنتج أو المفتاح"
                />
              </div>

              <div className="overflow-hidden rounded-xl border bg-background">
                {pickerQuery.isLoading ? (
                  <PickerMessage loading>جاري تحميل المنتجات...</PickerMessage>
                ) : pickerQuery.isError ? (
                  <div className="space-y-3 p-4">
                    <p className="text-sm text-destructive">
                      {mealBuilderError(pickerQuery.error, "تعذر تحميل المنتجات")}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => pickerQuery.refetch()}
                    >
                      <RefreshCw data-icon="inline-start" /> إعادة المحاولة
                    </Button>
                  </div>
                ) : candidates.length ? (
                  <div className="divide-y">
                    {candidates.map((candidate) => {
                      const id = candidate.productId || candidate.id;
                      const checked = productIds.includes(id) || candidate.selected;
                      const selectable = candidate.selected || candidate.assignable;
                      return (
                        <CandidateRow
                          key={id}
                          candidate={candidate}
                          checked={checked}
                          disabled={!selectable || actionPending}
                          onToggle={() => toggleProduct(candidate)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <PickerMessage>لا توجد منتجات متاحة لهذا البحث.</PickerMessage>
                )}
              </div>
              <PickerMeta meta={pickerQuery.data?.data.meta} refreshing={pickerQuery.isFetching} />
            </section>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 border-t bg-popover/95 px-4 py-3 sm:flex-row sm:justify-start sm:px-6">
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={actionPending || pickerQuery.isLoading}
            onClick={save}
          >
            {actionPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode.type === "edit" ? "حفظ البطاقة" : "إنشاء البطاقة"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={actionPending}
            onClick={onClose}
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CandidateRow({
  candidate,
  checked,
  disabled,
  onToggle,
}: {
  candidate: MealBuilderPickerCandidate;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 ${
        disabled ? "bg-muted/20 opacity-70" : "cursor-pointer hover:bg-muted/40"
      }`}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={() => !disabled && onToggle()}
        aria-label={`اختيار ${candidateName(candidate)}`}
      />
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-3">
          {candidate.imageUrl ? (
            <img
              src={candidate.imageUrl}
              alt=""
              className="size-11 shrink-0 rounded-md object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
              <Package className="size-4" />
            </span>
          )}
          <span className="min-w-0">
            <span className="line-clamp-2 text-sm font-medium leading-5">
              {candidateName(candidate)}
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              <bdi dir="ltr">{candidate.key}</bdi>
              {candidate.category?.name?.ar ? ` · ${candidate.category.name.ar}` : ""}
              {candidate.itemType ? ` · ${candidate.itemType}` : ""}
            </span>
            {candidate.reasonCodes.length ? (
              <span className="mt-1 block text-xs text-muted-foreground">
                {candidate.reasonCodes.join("، ")}
              </span>
            ) : null}
          </span>
        </span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <Badge variant={candidate.selected ? "default" : candidate.assignable ? "outline" : "secondary"}>
          {candidateStateLabel(candidate)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatSar(candidate.pricing?.priceHalala, candidate.pricing?.currency)}
        </span>
      </span>
    </label>
  );
}

function SelectedProductRow({
  productId,
  candidate,
  pending,
  onRemove,
}: {
  productId: string;
  candidate?: MealBuilderPickerCandidate;
  pending: boolean;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
      <span className="min-w-0 text-sm">
        <span className="block truncate font-medium">
          {candidate ? candidateName(candidate) : productId}
        </span>
        <bdi dir="ltr" className="block truncate text-xs text-muted-foreground">
          {productId}
        </bdi>
      </span>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={pending}
        onClick={onRemove}
        aria-label={`حذف ${candidate ? candidateName(candidate) : productId}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function DeleteCardDialog({
  section,
  pending,
  onClose,
  onConfirm,
}: {
  section: MealBuilderSection | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!section) return null;
  const products = selectedProducts(section);
  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) onClose();
      }}
    >
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-xl" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>حذف بطاقة المنتجات؟</DialogTitle>
          <DialogDescription>
            سيتم حذف بطاقة {section.titleOverride?.ar || section.key} من المسودة فقط، وستصبح {products.length} منتجات متاحة لبطاقات أخرى. تطبيق العميل لا يتغير حتى النشر.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button type="button" variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : null}
            حذف البطاقة
          </Button>
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductChip({
  product,
}: {
  product: ReturnType<typeof selectedProducts>[number];
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-md border bg-muted/10 px-2 py-1.5 text-xs">
      <Package className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{product.label || product.name?.ar || product.name?.en || product.key || product.productId || product.id}</span>
    </div>
  );
}

function PickerMessage({
  children,
  loading = false,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </p>
  );
}

function PickerMeta({
  meta,
  refreshing,
}: {
  meta?: {
    total: number;
    catalogTotal?: number;
    selectedInCurrentCard?: number;
    assignedToOtherCards?: number;
    unavailable?: number;
  };
  refreshing: boolean;
}) {
  if (!meta) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : null}
      <span>{meta.total} نتائج</span>
      <span>الكتالوج {meta.catalogTotal ?? meta.total}</span>
      <span>المختار هنا {meta.selectedInCurrentCard ?? 0}</span>
      <span>مخصص لبطاقات أخرى {meta.assignedToOtherCards ?? 0}</span>
      <span>غير متاح {meta.unavailable ?? 0}</span>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="flex items-start gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      {message}
    </p>
  ) : null;
}

function ConflictList({
  conflicts,
  onRefresh,
}: {
  conflicts?: MealBuilderAssignmentConflict[];
  onRefresh: () => void;
}) {
  if (!conflicts?.length) return null;
  return (
    <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      <p className="font-semibold">تعارض تخصيص منتجات</p>
      {conflicts.map((conflict, index) => (
        <p key={`${conflict.productId ?? conflict.id ?? index}`}>
          المنتج <bdi dir="ltr">{conflict.productName ?? conflict.name ?? conflict.productId ?? conflict.id}</bdi> مخصص في بطاقة <bdi dir="ltr">{conflict.assignedSectionKey ?? conflict.sectionKey ?? "غير معروفة"}</bdi>.
        </p>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={onRefresh}>
        <RefreshCw data-icon="inline-start" /> تحديث المرشح
      </Button>
    </div>
  );
}

function changedPatch(
  current: MealBuilderSection | null,
  next: {
    key: string;
    titleOverride: { ar: string; en: string };
    selectedProductIds: string[];
    sortOrder: number;
    visible: boolean;
  }
) {
  if (!current) return next;
  const patch: Partial<typeof next> = {};
  if (current.key !== next.key) patch.key = next.key;
  if (
    current.titleOverride?.ar !== next.titleOverride.ar ||
    current.titleOverride?.en !== next.titleOverride.en
  ) {
    patch.titleOverride = next.titleOverride;
  }
  if (Number(current.sortOrder || 0) !== next.sortOrder) {
    patch.sortOrder = next.sortOrder;
  }
  if ((current.visible !== false) !== next.visible) patch.visible = next.visible;
  if (!sameIds(productIdsForSection(current), next.selectedProductIds)) {
    patch.selectedProductIds = next.selectedProductIds;
  }
  return patch;
}

async function saveExistingCard({
  sectionKey,
  existing,
  payload,
  addProducts,
  updateSection,
}: {
  sectionKey: string;
  existing: MealBuilderSection | null;
  payload: {
    key: string;
    titleOverride: { ar: string; en: string };
    selectedProductIds: string[];
    sortOrder: number;
    visible: boolean;
  };
  addProducts: (value: { sectionKey: string; productIds: string[] }) => Promise<MealBuilderCardActionResponse>;
  updateSection: (value: { sectionKey: string; patch: ReturnType<typeof changedPatch> }) => Promise<MealBuilderCardActionResponse>;
}) {
  const previousProductIds = existing ? productIdsForSection(existing) : [];
  const added = payload.selectedProductIds.filter(
    (productId) => !previousProductIds.includes(productId)
  );
  const removed = previousProductIds.filter(
    (productId) => !payload.selectedProductIds.includes(productId)
  );
  const patch = changedPatch(existing, payload);
  const patchKeys = Object.keys(patch);
  const onlyAddingProducts =
    added.length > 0 &&
    removed.length === 0 &&
    patchKeys.length === 1 &&
    patch.selectedProductIds;

  if (onlyAddingProducts) {
    return addProducts({ sectionKey, productIds: added });
  }

  return updateSection({ sectionKey, patch });
}

function mapCardActionError(error: unknown): FieldErrors {
  const parsed = parseApiError(error);
  const details = isRecord(parsed.details) ? parsed.details : {};
  const conflicts = Array.isArray(details.conflicts)
    ? (details.conflicts as MealBuilderAssignmentConflict[])
    : undefined;
  const base: FieldErrors = {
    general: parsed.message,
    conflicts,
  };

  if (parsed.code === "MEAL_BUILDER_CARD_KEY_INVALID" || parsed.code === "MEAL_BUILDER_CARD_KEY_DUPLICATE") {
    return { ...base, key: parsed.message };
  }
  if (parsed.code === "MEAL_BUILDER_CARD_NUMBER_INVALID") {
    return { ...base, sortOrder: parsed.message };
  }
  if (
    parsed.code === "MEAL_BUILDER_PRODUCT_IDS_REQUIRED" ||
    parsed.code === "MEAL_BUILDER_CARD_PRODUCTS_REQUIRED" ||
    parsed.code === "MEAL_BUILDER_PRODUCT_IDS_INVALID"
  ) {
    return { ...base, products: parsed.message };
  }
  if (parsed.code === "MEAL_BUILDER_CARD_WOULD_BE_EMPTY") {
    return { ...base, products: parsed.message, wouldBeEmpty: true };
  }
  return base;
}

function selectedProducts(section: MealBuilderSection) {
  return [
    ...(section.selectedProducts ?? []),
    ...(section.items ?? []).filter((item) => item.type?.includes("product")),
  ];
}

function productIdsForSection(section: MealBuilderSection) {
  const hydratedIds = selectedProducts(section)
    .map((item) => item.productId || item.id)
    .filter((id): id is string => Boolean(id));
  return hydratedIds.length ? uniqueIds(hydratedIds) : uniqueIds(section.selectedProductIds);
}

function validationIssuesForSection(
  validation: MealBuilderValidation | null,
  section: MealBuilderSection
) {
  const key = section.key || "";
  return (validation?.checks ?? []).filter(
    (issue) =>
      issue.cardKey === key ||
      issue.sectionKey === key ||
      issue.sectionType === section.sectionType
  );
}

function candidateName(candidate: MealBuilderPickerCandidate) {
  return candidate.label || candidate.name?.ar || candidate.name?.en || candidate.key || candidate.id;
}

function candidateStateLabel(candidate: MealBuilderPickerCandidate) {
  if (candidate.selected) return "مختار";
  if (candidate.state === "assigned_elsewhere") return "مخصص لبطاقة أخرى";
  if (candidate.assignable) return "متاح";
  return "غير متاح";
}

function formatSar(value?: number | null, currency?: string | null) {
  return `${halalaToRiyal(value ?? 0).toFixed(2)} ${currency || "SAR"}`;
}

function mealBuilderError(error: unknown, fallback: string) {
  return parseApiError(error).message || fallback;
}

function sameIds(left: string[], right: string[]) {
  const a = uniqueIds(left).sort();
  const b = uniqueIds(right).sort();
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids.filter(Boolean)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
