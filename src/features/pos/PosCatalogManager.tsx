import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Layers, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseApiError } from "@/lib/apiErrors";
import { getPosCatalogChanges } from "./catalogChangeReview";
import { copyChannelPrices, duplicateDraftProduct, type PriceCopyMode, type PriceCopyRounding } from "./catalogBulkOps";
import {
  channels as defaultChannels,
  type PosChannel,
  type Catalog,
  type Channel,
  type Prices,
  type Product,
  type Variant,
} from "./previewCatalog";
import {
  fetchPosManager,
  posCatalogKey,
  posManagerKey,
  publishPosDraft,
  savePosDraft,
  type PosCatalogManagerState,
} from "./catalogApi";

type EditVariant = Omit<Variant, "prices"> & {
  prices: Record<Channel, string>;
};
type EditProduct = Omit<Product, "variants"> & { variants: EditVariant[] };
type EditCatalog = Omit<Catalog, "products" | "channels"> & {
  channels: PosChannel[];
  products: EditProduct[];
};
type EditorView = "individual" | "bulk" | "channels";
const selectStyle = "min-h-11 w-full rounded-md border bg-background px-2";

function recategorize(product: EditProduct, category: string): EditProduct {
  if (category === product.category) return product;
  return {
    ...product,
    category,
    sellStandalone: category === "addons" ? false : undefined,
    ...(category === "addons" ? { hasAddons: false, allowedAddonIds: undefined } : {}),
  };
}

function removeAddonReferences(products: EditProduct[], addonId: string) {
  return products.map((item) => item.allowedAddonIds?.includes(addonId) ? {
    ...item, allowedAddonIds: item.allowedAddonIds.filter((id) => id !== addonId),
  } : item);
}

function emptyVariant(label = "حصة", currentChannels: PosChannel[] = [...defaultChannels]): EditVariant {
  return {
    id: crypto.randomUUID(),
    label,
    prices: Object.fromEntries(currentChannels.map(({ id }) => [id, ""])),
  };
}

function editableCatalog(catalog: Catalog): EditCatalog {
  const currentChannels = catalog.channels ?? [...defaultChannels];
  return {
    channels: currentChannels,
    categories: catalog.categories,
    products: catalog.products.map((item) => ({
      ...item,
      variants: item.variants.map((variant) => ({
        ...variant,
        prices: Object.fromEntries(
          currentChannels.map(({ id }) => {
            const amount = variant.prices[id];
            return [id, amount == null ? "" : (amount / 100).toFixed(2)];
          })
        ) as EditVariant["prices"],
      })),
    })),
  };
}

function serializeDraft(edit: EditCatalog): Catalog {
  return {
    channels: edit.channels,
    categories: edit.categories,
    products: edit.products.map((item) => ({
      ...item,
      active: item.active !== false,
      variants: item.variants.map((variant) => ({
        ...variant,
        prices: Object.fromEntries(
          edit.channels.map(({ id, label }) => {
            const input = (variant.prices[id] ?? "").trim();
            if (!input) return [id, null];
            if (
              !/^\d{1,6}(\.\d{1,2})?$/.test(input) ||
              Number(input) > 100_000
            ) {
              throw new Error(
                `راجع سعر «${item.name || "الصنف الجديد"}» لقناة ${label}.`
              );
            }
            return [id, Math.round(Number(input) * 100)];
          })
        ) as Prices,
      })),
    })),
  };
}

function CatalogEditor({
  data,
  editorView,
  setEditorView,
  reload,
}: {
  data: PosCatalogManagerState;
  editorView: EditorView;
  setEditorView: (view: EditorView) => void;
  reload: () => void;
}) {
  const client = useQueryClient();
  const [edit, setEdit] = useState(() =>
    editableCatalog(data.draft ?? data.published)
  );
  const [product, setProduct] = useState<EditProduct | null>(null);
  const [removeTarget, setRemoveTarget] = useState<EditProduct | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(edit.categories[0]?.id ?? "");
  const [categoryName, setCategoryName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dirty, setDirty] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [bulkSearch, setBulkSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [confirm, setConfirm] = useState(false);
  const [zeroPriceDialog, setZeroPriceDialog] = useState(false);
  const [error, setError] = useState("");
  const [bulkChannel, setBulkChannel] = useState<Channel>("restaurant");
  const [showAllChannels, setShowAllChannels] = useState(false);
  const [priceCopySource, setPriceCopySource] = useState<Channel>("restaurant");
  const [priceCopyTarget, setPriceCopyTarget] = useState<Channel>("hungerstation");
  const [priceCopyMode, setPriceCopyMode] = useState<PriceCopyMode>("missing");
  const [priceCopyMarkup, setPriceCopyMarkup] = useState("0");
  const [priceCopyRounding, setPriceCopyRounding] = useState<PriceCopyRounding>("none");
  const [allowNewPrices, setAllowNewPrices] = useState(false);
  const [priceCopyDialog, setPriceCopyDialog] = useState(false);
  const [newChannelId, setNewChannelId] = useState("");
  const [newChannelLabel, setNewChannelLabel] = useState("");
  const channels = edit.channels;
  const categoryLabels = new Map(edit.categories.map(({ id, label }) => [id, label]));
  const search = productSearch.trim().toLocaleLowerCase();
  const priceSearch = bulkSearch.trim().toLocaleLowerCase();
  const matches = (item: EditProduct, term: string) => !term
    || item.name.toLocaleLowerCase().includes(term)
    || categoryLabels.get(item.category)?.toLocaleLowerCase().includes(term);
  const visibleProducts = edit.products.filter((item) =>
    matches(item, search)
    && (!categoryFilter || item.category === categoryFilter)
    && (visibilityFilter === "all" || (visibilityFilter === "visible" ? item.active !== false : item.active === false))
  );
  const bulkProducts = edit.products.filter((item) => matches(item, priceSearch));
  const effectiveCopySource = channels.some((item) => item.id === priceCopySource)
    ? priceCopySource : channels[0]?.id ?? "";
  const effectiveCopyTarget = channels.some((item) => item.id === priceCopyTarget && item.id !== effectiveCopySource)
    ? priceCopyTarget : channels.find((item) => item.id !== effectiveCopySource)?.id ?? "";
  const validMarkup = /^(?:\d{1,3})(?:\.\d{1,2})?$/.test(priceCopyMarkup)
    && Number(priceCopyMarkup) <= 300;
  const copyPreview = copyChannelPrices(
    edit, effectiveCopySource, effectiveCopyTarget,
    new Set(bulkProducts.map((item) => item.id)), priceCopyMode,
    { increasePercent: validMarkup ? Number(priceCopyMarkup) : 0,
      rounding: priceCopyRounding, allowNewPrices },
  );
  const reviewChanges = data.draft ? getPosCatalogChanges(data.published, data.draft) : [];
  const editingExisting = product !== null && edit.products.some((item) => item.id === product.id);
  const selectedCategory = edit.categories.find((item) => item.id === categoryId);
  const update = (next: EditCatalog) => {
    setEdit(next);
    setDirty(true);
    setError("");
  };
  function saveProduct(next: EditProduct) {
    const previous = edit.products.find((item) => item.id === next.id);
    const products = previous
      ? edit.products.map((item) => item.id === next.id ? next : item)
      : [...edit.products, next];
    update({
      ...edit,
      products: previous?.category === "addons" && next.category !== "addons"
        ? removeAddonReferences(products, next.id) : products,
    });
  }
  const updateVariant = (next: EditVariant) => {
    if (product)
      setProduct({
        ...product,
        variants: product.variants.map((item) =>
          item.id === next.id ? next : item
        ),
      });
  };
  const save = useMutation({
    mutationFn: () => savePosDraft(data.revision, serializeDraft(edit)),
    onSuccess: (result) => client.setQueryData(posManagerKey, result),
    onError: (cause) =>
      setError(parseApiError(cause).message || "تعذر حفظ المسودة."),
  });
  const publish = useMutation({
    mutationFn: () => publishPosDraft(data.revision),
    onSuccess: (result) => {
      void client.invalidateQueries({ queryKey: posCatalogKey });
      client.setQueryData(posManagerKey, result);
    },
    onError: (cause) => {
      setConfirm(false);
      setError(parseApiError(cause).message || "تعذر نشر المنيو.");
    },
  });
  const busy = save.isPending || publish.isPending;
  const hasZeroPrice = edit.products.some((item) => item.active !== false
    && item.variants.some((variant) => Object.values(variant.prices).some(
      (value) => value.trim() !== "" && Number(value) === 0
    )));
  const requestSave = () => hasZeroPrice ? setZeroPriceDialog(true) : save.mutate();

  useEffect(() => {
    if (!dirty) return;
    const preventLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [dirty]);

  function addChannel() {
    const id = newChannelId.trim().toLowerCase();
    const label = newChannelLabel.trim();
    if (!/^[a-z][a-z0-9-]{1,63}$/.test(id)) {
      setError("معرف القناة يبدأ بحرف إنجليزي ويتكون من حروف وأرقام وشرطة فقط.");
      return;
    }
    if (!label || label.length > 100 || channels.length >= 30) {
      setError("اسم القناة مطلوب وبحد أقصى 100 حرف، والحد الأقصى 30 قناة.");
      return;
    }
    if (channels.some((item) => item.id === id)) {
      setError("قناة البيع موجودة بالفعل.");
      return;
    }
    update({
      ...edit,
      channels: [...channels, { id, label }],
      products: edit.products.map((item) => ({
        ...item,
        variants: item.variants.map((variant) => ({
          ...variant,
          prices: { ...variant.prices, [id]: "" },
        })),
      })),
    });
    setBulkChannel(id);
    setNewChannelId("");
    setNewChannelLabel("");
  }

  function addCategory() {
    const label = categoryName.trim();
    if (!label) return;
    const id = crypto.randomUUID();
    update({ ...edit, categories: [...edit.categories, { id, label }] });
    setCategoryId(id);
    setCategoryName("");
  }

  function addProduct() {
    const category = edit.categories.find((item) => item.id === categoryFilter) ?? edit.categories[0];
    if (!category) return;
    setProduct({
      id: crypto.randomUUID(),
      name: "",
      category: category.id,
      active: true,
      hasAddons: false,
      variants: [emptyVariant("حصة", channels)],
    });
  }

  function removeProduct(item: EditProduct) {
    const remaining = edit.products.filter(({ id }) => id !== item.id);
    update({
      ...edit,
      products: item.category === "addons" ? removeAddonReferences(remaining, item.id) : remaining,
    });
    setRemoveTarget(null);
  }

  return (
    <>
      <Dialog open={zeroPriceDialog} onOpenChange={setZeroPriceDialog}>
        <DialogContent dir="rtl" className="text-right">
          <DialogHeader>
            <DialogTitle>تأكيد سعر مجاني (0 ريال)</DialogTitle>
            <DialogDescription>
              يوجد صنف ظاهر للبيع سعره صفر في إحدى القنوات. الخانة الفارغة تعني
              غير مسعّر، أما الصفر فهو سعر مجاني فعلًا. هل تريد حفظ المسودة بهذا السعر؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZeroPriceDialog(false)}>مراجعة الأسعار</Button>
            <Button onClick={() => { setZeroPriceDialog(false); save.mutate(); }}
              disabled={busy}>تأكيد حفظ سعر صفر</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={priceCopyDialog} onOpenChange={setPriceCopyDialog}>
        <DialogContent dir="rtl" className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto text-right">
          <DialogHeader>
            <DialogTitle>نسخ أسعار بين القنوات</DialogTitle>
            <DialogDescription>
              النسخ يؤثر على الأصناف الظاهرة في البحث فقط. الأسعار غير المسعّرة في قناة المصدر لن تُنسخ أو تمسح أسعار الوجهة.
              التغييرات تبقى محلية حتى حفظ المسودة ثم نشرها.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm">قناة المصدر
              <select className={selectStyle} aria-label="قناة مصدر الأسعار" value={effectiveCopySource}
                onChange={(event) => { setPriceCopySource(event.target.value); setAllowNewPrices(false); }}>
                {channels.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">قناة الوجهة
              <select className={selectStyle} aria-label="قناة وجهة الأسعار" value={effectiveCopyTarget}
                onChange={(event) => { setPriceCopyTarget(event.target.value); setAllowNewPrices(false); }}>
                {channels.filter((item) => item.id !== effectiveCopySource)
                  .map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm">طريقة النسخ
              <select className={selectStyle} aria-label="طريقة نسخ الأسعار" value={priceCopyMode}
                onChange={(event) => { setPriceCopyMode(event.target.value as PriceCopyMode); setAllowNewPrices(false); }}>
                <option value="missing">ملء الأسعار الفارغة فقط</option>
                <option value="overwrite">استبدال الأسعار الموجودة</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">زيادة على سعر المصدر (%)
              <Input type="number" min="0" max="300" step="0.01" inputMode="decimal"
                aria-label="نسبة زيادة الأسعار" dir="ltr" value={priceCopyMarkup}
                onChange={(event) => setPriceCopyMarkup(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm">تقريب السعر الناتج
              <select className={selectStyle} aria-label="تقريب الأسعار" value={priceCopyRounding}
                onChange={(event) => setPriceCopyRounding(event.target.value as PriceCopyRounding)}>
                <option value="none">بدون تقريب (هللتان عشريتان)</option>
                <option value="half">لأعلى إلى أقرب 0.50 ريال</option>
                <option value="whole">لأعلى إلى أقرب 1 ريال</option>
              </select>
            </label>
            {!validMarkup && <p role="alert" className="text-sm text-destructive">أدخل نسبة زيادة صحيحة من 0 إلى 300.</p>}
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" aria-label="الموافقة على إتاحة أحجام غير مسعرة"
                checked={allowNewPrices} onChange={(event) => setAllowNewPrices(event.target.checked)} />
              أوافق صراحةً على تسعير أحجام كانت غير متاحة في قناة الوجهة (ستتاح للبيع بعد النشر).
            </label>
            <p role="status" className="rounded-lg border bg-muted p-3 text-sm">
              {copyPreview.changed} سعر سيتغير من أصل {bulkProducts.length} صنف مطابق للبحث.
              {priceCopyMode === "overwrite" ? " ستُستبدل الأسعار الموجودة في قناة الوجهة." : " لن تتغير الأسعار الموجودة."}
            </p>
            {copyPreview.blockedNewPrices.length > 0 && <p role="alert" className="rounded-lg border p-3 text-sm font-medium">
              {copyPreview.blockedNewPrices.length} حجم غير مسعّر لن يتاح للبيع تلقائيًا. فعّل الموافقة أعلاه لمراجعته وتسعيره.
            </p>}
            {copyPreview.firstTimeProducts.length > 0 && <p role="alert" className="rounded-lg border p-3 text-sm font-semibold">
              تحذير: {copyPreview.firstTimeProducts.length} صنف سيصبح متاحًا لأول مرة على {channels.find((entry) => entry.id === effectiveCopyTarget)?.label} بعد الحفظ والنشر: {copyPreview.firstTimeProducts.join("، ")}.
            </p>}
            <div role="region" aria-label="معاينة نسخ الأسعار" className="max-h-56 overflow-auto rounded-lg border">
              <table className="w-full table-fixed border-collapse text-right text-xs">
                <thead className="sticky top-0 bg-muted"><tr>
                  <th className="w-[38%] p-2">الصنف والحجم</th><th className="w-[19%] p-2">الحالي</th>
                  <th className="w-[19%] p-2">المقترح</th><th className="w-[24%] p-2">الحالة</th>
                </tr></thead>
                <tbody>
                  {[...copyPreview.changes, ...copyPreview.blockedNewPrices].map((change) => (
                    <tr key={change.productId + "-" + change.variantId} className="border-t">
                      <td className="break-words p-2">{change.productName} · {change.variantLabel}</td>
                      <td className="break-words p-2">{change.before}</td>
                      <td className="break-words p-2 font-medium">{change.after} ر.س</td>
                      <td className="break-words p-2">{copyPreview.blockedNewPrices.includes(change) ? "ممنوع حتى الموافقة" : change.newlyPriced ? "إتاحة جديدة" : "تغيير سعر"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {copyPreview.changed === 0 && copyPreview.blockedNewPrices.length === 0 &&
                <p className="p-3 text-sm text-muted-foreground">لا توجد أسعار ستتغير بالإعدادات الحالية.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPriceCopyDialog(false)}>إلغاء</Button>
            <Button type="button" disabled={busy || !validMarkup || copyPreview.changed === 0}
              onClick={() => { update(copyPreview.catalog); setPriceCopyDialog(false); }}>
              تطبيق على المسودة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3 shadow-sm sm:px-4">
        <div>
          <p className="font-semibold">
            النسخة المنشورة {data.publishedRevision}
          </p>
          <p className="text-xs text-muted-foreground" aria-label="ناشر منيو الكاشير">
            نشر بواسطة: {data.publishedBy
              ? (data.publishedBy.name || data.publishedBy.email) + " (" + data.publishedBy.role + ")"
              : "غير مسجّل للنسخ الأقدم"}
            {data.publishedAt && " · " + new Date(data.publishedAt).toLocaleString("ar-SA-u-nu-latn")}
          </p>
          {data.draft && (
            <p className="text-xs text-muted-foreground" aria-label="حافظ مسودة الكاشير">
              حفظ المسودة: {data.draftSavedBy
                ? data.draftSavedBy.name || data.draftSavedBy.email
                : "غير مسجّل"}
              {data.draftSavedAt && " · " + new Date(data.draftSavedAt).toLocaleString("ar-SA-u-nu-latn")}
            </p>
          )}
          <p className="text-sm text-muted-foreground" role="status">
            {dirty
              ? "تعديلات تحتاج حفظًا"
              : data.draft
                ? "مسودة محفوظة · " + reviewChanges.length + " تغيير للمراجعة"
                : "المنيو المنشور هو الظاهر للكاشير"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11"
            variant="outline"
            disabled={busy || !dirty}
            onClick={requestSave}
          >
            حفظ المسودة
          </Button>
          <Button
            type="button"
            className="min-h-11"
            disabled={busy || dirty || !data.draft}
            onClick={() => setConfirm(true)}
          >
            مراجعة ونشر
          </Button>
        </div>
      </div>
      <div
        role="group"
        aria-label="طريقة تعديل منيو الكاشير"
        className="flex flex-wrap gap-2"
      >
        <Button
          type="button"
          variant={editorView === "individual" ? "default" : "outline"}
          aria-pressed={editorView === "individual"}
          onClick={() => setEditorView("individual")}
        >
          الأصناف
        </Button>
        <Button
          type="button"
          variant={editorView === "bulk" ? "default" : "outline"}
          aria-pressed={editorView === "bulk"}
          onClick={() => setEditorView("bulk")}
        >
          جدول الأسعار
        </Button>
        <Button type="button" variant={editorView === "channels" ? "default" : "outline"}
          aria-pressed={editorView === "channels"} onClick={() => setEditorView("channels")}>
          قنوات البيع
        </Button>
      </div>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
        >
          <p>{error}</p>
          <Button type="button" variant="outline" onClick={reload}>
            تحميل آخر نسخة
          </Button>
        </div>
      )}
      {editorView === "channels" && (
      <section aria-label="إدارة قنوات البيع" className="grid gap-3 rounded-xl border bg-card p-4">
        <div>
          <h2 className="font-bold">قنوات البيع المستقلة</h2>
          <p className="text-sm text-muted-foreground">حدّد أسعار الأصناف في القناة الجديدة من جدول الأسعار.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {channels.map((item) => (
            <span key={item.id} className="rounded-full border px-3 py-1.5 text-sm">
              {item.label}
            </span>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-1 text-sm">
            معرف القناة (إنجليزي)
            <Input dir="ltr" aria-label="معرف قناة البيع الجديدة" value={newChannelId}
              placeholder="example-app" maxLength={64}
              onChange={(event) => setNewChannelId(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            اسم القناة
            <Input aria-label="اسم قناة البيع الجديدة" value={newChannelLabel} maxLength={100}
              placeholder="تطبيق جديد"
              onChange={(event) => setNewChannelLabel(event.target.value)} />
          </label>
          <Button type="button" variant="outline" className="min-h-11"
            disabled={busy || channels.length >= 30} onClick={addChannel}>إضافة قناة</Button>
        </div>
      </section>
      )}
      {editorView === "bulk" ? (
        <section className="grid gap-4 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-bold">جدول الأسعار الجماعي</h2>
              <p className="text-sm text-muted-foreground">
                أسعار مستقلة حسب القناة والحجم. اترك السعر فارغًا إذا كان الصنف غير متاح في القناة.
                جميع التعديلات تحفظ كمسودة، ولا تظهر للكاشير قبل النشر.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              {!showAllChannels && <label className="grid min-w-40 gap-1 text-sm">
                قناة البيع
                <select className={selectStyle} value={bulkChannel}
                  onChange={(event) => setBulkChannel(event.target.value as Channel)}>
                  {channels.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </label>}
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={showAllChannels}
                  onChange={(event) => setShowAllChannels(event.target.checked)} />
                عرض كل القنوات
              </label>
              <Button type="button" variant="outline" className="min-h-11"
                disabled={busy || channels.length < 2 || bulkProducts.length === 0}
                onClick={() => { setAllowNewPrices(false); setPriceCopyDialog(true); }}>نسخ أسعار قناة</Button>
            </div>
          </div>
          <label className="grid gap-1 text-sm">
            بحث في جدول الأسعار
            <Input type="search" aria-label="بحث في جدول أسعار الكاشير"
              placeholder="اسم الصنف أو التصنيف" value={bulkSearch}
              onChange={(event) => setBulkSearch(event.target.value)} />
          </label>
          <p className="text-xs text-muted-foreground">عرض {bulkProducts.length} من {edit.products.length} صنف.</p>
          <div className="max-h-[65dvh] overflow-auto rounded-xl border">
            <table className="w-full min-w-[38rem] border-collapse text-right text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-3">الصنف</th>
                  <th className="p-3">الحجم</th>
                  <th className="p-3">التوفر</th>
                  {(showAllChannels ? channels : channels.filter((item) => item.id === bulkChannel)).map((channel) => (
                    <th key={channel.id} scope="col" className="min-w-44 p-3">السعر بالريال · {channel.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bulkProducts.flatMap((item) =>
                  item.variants.map((variant) => (
                    <tr key={`${item.id}/${variant.id}`} className="border-t">
                      <td className="p-3 font-semibold">{item.name}</td>
                      <td className="p-3">{variant.label}</td>
                      <td className="p-3">{item.active !== false ? "ظاهر" : "مخفي"}</td>
                      {(showAllChannels ? channels : channels.filter((channel) => channel.id === bulkChannel)).map((channel) => (
                        <td className="p-2" key={channel.id}>
                          <Input
                            aria-label={`سعر ${item.name} ${variant.label} في ${channel.id}`}
                            className="min-h-11 w-full"
                            dir="ltr"
                            inputMode="decimal"
                            placeholder="غير مسعّر"
                            value={variant.prices[channel.id] ?? ""}
                            disabled={busy}
                            onChange={(event) =>
                              update({
                                ...edit,
                                products: edit.products.map((entry) =>
                                  entry.id !== item.id ? entry : {
                                    ...entry,
                                    variants: entry.variants.map((size) =>
                                      size.id !== variant.id ? size : {
                                        ...size, prices: { ...size.prices, [channel.id]: event.target.value },
                                      }
                                    ),
                                  }
                                ),
                              })
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : editorView === "individual" && (
        <section aria-label="إدارة أصناف الكاشير" className="min-w-0 rounded-xl border bg-card">
          <div className="grid gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">الأصناف</h2>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="min-h-11" disabled={busy}
                  onClick={() => setCategoryManagerOpen(true)}>
                  <Layers aria-hidden="true" /> إدارة التصنيفات
                </Button>
                <Button type="button" className="min-h-11" onClick={addProduct}
                  disabled={busy || edit.categories.length === 0 || edit.products.length >= 500}>
                  <Plus aria-hidden="true" /> إضافة صنف
                </Button>
              </div>
            </div>
            <div className="grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_auto]">
              <label className="grid min-w-0 gap-1 text-sm">
                البحث
                <span className="relative">
                  <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-3.5 size-4 text-muted-foreground" />
                  <Input type="search" aria-label="بحث في أصناف الكاشير" className="min-h-11 ps-9"
                    placeholder="اسم الصنف أو التصنيف" value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)} />
                </span>
              </label>
              <label className="grid gap-1 text-sm">
                التصنيف
                <select className={selectStyle} value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="">كل التصنيفات</option>
                  {edit.categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <div role="group" aria-label="عرض الأصناف" className="flex min-h-11 flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
                {([["all", "الكل"], ["visible", "الظاهرة"], ["hidden", "المخفية"]] as const).map(([id, label]) => (
                  <Button key={id} type="button" size="sm"
                    variant={visibilityFilter === id ? "default" : "ghost"}
                    aria-pressed={visibilityFilter === id} onClick={() => setVisibilityFilter(id)}>
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground" role="status">
              عرض {visibleProducts.length} من {edit.products.length} صنف
            </p>
          </div>
          <div role="group" aria-label="قائمة أصناف الكاشير" className="divide-y border-t">
            <div aria-hidden="true"
              className="hidden grid-cols-[minmax(0,1fr)_minmax(9rem,14rem)_6rem_9rem] items-center gap-4 bg-muted/50 px-5 py-2 text-xs font-medium text-muted-foreground md:grid">
              <span>الصنف</span><span>التصنيف</span><span>الظهور</span><span>الإجراءات</span>
            </div>
            {visibleProducts.map((item) => {
              const hidden = item.active === false;
              return (
                <div key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-3 hover:bg-muted/25 md:grid-cols-[minmax(0,1fr)_minmax(9rem,14rem)_6rem_9rem] md:gap-4 md:px-5">
                  <Button type="button" variant="ghost" onClick={() => setProduct(item)}
                    className="h-10 min-w-0 justify-start gap-2 px-1 text-start font-semibold"
                    title={item.name} disabled={busy}>
                    <Pencil aria-hidden="true" className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{item.name}</span>
                  </Button>
                  <select aria-label={`تصنيف ${item.name}`} className={selectStyle + " order-3 min-h-10 md:order-none"}
                    value={item.category} disabled={busy}
                    onChange={(event) => saveProduct(recategorize(item, event.target.value))}>
                    {edit.categories.map((entry) => (
                      <option key={entry.id} value={entry.id}
                        disabled={entry.id === "addons" && item.variants.length !== 1}>{entry.label}</option>
                    ))}
                  </select>
                  <span className={"order-2 w-fit rounded-full px-2.5 py-1 text-xs font-medium md:order-none " +
                    (hidden ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                    {hidden ? "مخفي" : "ظاهر"}
                  </span>
                  <div className="order-4 flex justify-end gap-1 md:order-none md:justify-start">
                    <Button type="button" variant="outline" size="sm" className="min-h-10"
                      aria-label={(hidden ? "إظهار " : "إخفاء ") + item.name} disabled={busy}
                      onClick={() => saveProduct({ ...item, active: hidden })}>
                      {hidden ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                      {hidden ? "إظهار" : "إخفاء"}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="size-10 text-destructive"
                      aria-label={`حذف ${item.name}`} title="حذف الصنف من المسودة" disabled={busy}
                      onClick={() => setRemoveTarget(item)}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {visibleProducts.length === 0 && (
              <p className="p-6 text-center text-sm text-muted-foreground">
                {edit.products.length ? "لا توجد أصناف مطابقة." : "ابدأ بإضافة أول صنف."}
              </p>
            )}
          </div>
        </section>
      )}
      <Dialog open={product !== null} onOpenChange={(open) => { if (!open) setProduct(null); }}>
        {product && (
          <DialogContent dir="rtl" className="grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingExisting ? "تعديل الصنف" : "إضافة صنف"}</DialogTitle>
              <DialogDescription>تظهر تغييرات الصنف في الكاشير بعد حفظ المسودة ونشرها.</DialogDescription>
            </DialogHeader>
            <div className="grid min-w-0 gap-4 overflow-y-auto overscroll-contain p-1">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  اسم الصنف
                  <Input
                    className="min-h-11"
                    value={product.name}
                    maxLength={100}
                    onChange={(event) =>
                      setProduct({ ...product, name: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  تصنيف الصنف
                  <select
                    className={selectStyle}
                    value={product.category}
                    onChange={(event) => setProduct(recategorize(product, event.target.value))}
                  >
                    {edit.categories.map((entry) => (
                      <option
                        key={entry.id}
                        value={entry.id}
                        disabled={
                          entry.id === "addons" && product.variants.length !== 1
                        }
                      >
                        {entry.label || "تصنيف جديد"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="flex min-h-10 items-center gap-2 text-sm">
                <input type="checkbox" checked={product.active !== false}
                  onChange={(event) => setProduct({ ...product, active: event.target.checked })} />
                يظهر في الكاشير بعد النشر
              </label>
              <section aria-label="أسعار وأحجام الصنف" className="grid gap-3 border-t pt-4">
                <h3 className="font-semibold">الأسعار والأحجام</h3>
                <p className="text-sm text-muted-foreground">
                  الأسعار بالريال. الخانة الفارغة تعني أن الحجم غير متاح للبيع في
                  القناة.
                </p>
                {product.variants.map((variant, index) => (
                  <fieldset
                    key={variant.id}
                    className="grid min-w-0 gap-2 rounded-lg border p-3 sm:grid-cols-2 xl:grid-cols-4"
                  >
                    <legend className="px-2 text-sm">الحجم {index + 1}</legend>
                    <label className="grid gap-1 text-sm">
                      اسم الحجم
                      <Input
                        value={variant.label}
                        maxLength={100}
                        onChange={(event) =>
                          updateVariant({ ...variant, label: event.target.value })
                        }
                      />
                    </label>
                    {channels.map((channel) => (
                      <label key={channel.id} className="grid gap-1 text-sm">
                        {channel.label}
                        <Input
                          inputMode="decimal"
                          dir="ltr"
                          placeholder="غير مسعّر"
                          value={variant.prices[channel.id]}
                          onChange={(event) =>
                            updateVariant({
                              ...variant,
                              prices: {
                                ...variant.prices,
                                [channel.id]: event.target.value,
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                    {product.variants.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="justify-self-start"
                        onClick={() =>
                          setProduct({
                            ...product,
                            variants: product.variants.filter(
                              (item) => item.id !== variant.id
                            ),
                            defaultVariantId: product.defaultVariantId === variant.id
                              ? undefined : product.defaultVariantId,
                          })
                        }
                      >
                        إزالة الحجم {index + 1}
                      </Button>
                    )}
                  </fieldset>
                ))}
                {product.category !== "addons" && (
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-self-start"
                    disabled={product.variants.length >= 10}
                    onClick={() =>
                      setProduct({
                        ...product,
                        variants: [...product.variants, emptyVariant("", channels)],
                      })
                    }
                  >
                    إضافة حجم
                  </Button>
                )}
              </section>
              <details className="rounded-lg border p-3" open={product.hasAddons || undefined}>
                <summary className="cursor-pointer text-sm font-semibold">إعدادات الحجم والإضافات</summary>
                <div className="mt-3 grid gap-3">
                <label className="grid gap-1 text-sm">
                  الحجم الافتراضي للكاشير
                  <select
                    aria-label="الحجم الافتراضي للصنف"
                    className={selectStyle}
                    value={product.defaultVariantId ?? ""}
                    onChange={(event) =>
                      setProduct({
                        ...product,
                        defaultVariantId: event.target.value || undefined,
                      })
                    }
                  >
                    <option value="">تلقائي (150 جم للوجبات إن توفر)</option>
                    {product.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>{variant.label || variant.id}</option>
                    ))}
                  </select>
                  <span className="text-xs text-muted-foreground">
                    لو الحجم المختار غير مسعّر في قناة بيع، الكاشير يختار أول حجم مسعّر بدلًا منه.
                  </span>
                </label>
                <div className="flex flex-wrap gap-4 text-sm">
                  {product.category === "addons" && (
                    <label className="flex min-h-12 items-center gap-2">
                      <input type="checkbox" aria-label="تباع الإضافة منفردة"
                        checked={product.sellStandalone === true}
                        onChange={(event) =>
                          setProduct({ ...product, sellStandalone: event.target.checked })
                        }
                      />
                      تباع الإضافة منفردة (بدون وجبة)
                    </label>
                  )}
                  {product.category !== "addons" && (
                    <label className="flex min-h-10 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={product.hasAddons === true}
                        onChange={(event) =>
                          setProduct({
                            ...product,
                            hasAddons: event.target.checked,
                            allowedAddonIds: event.target.checked ? product.allowedAddonIds : undefined,
                          })
                        }
                      />
                      يقبل إضافات
                    </label>
                  )}
                </div>
                {product.category === "addons" && !product.sellStandalone && (
                  <p className="text-xs text-muted-foreground">هذه الإضافة تظهر داخل خيارات الوجبات فقط ولا تظهر كبطاقة مستقلة للبيع.</p>
                )}
                {product.category !== "addons" && product.hasAddons === true && (
                  <fieldset className="grid gap-2 rounded-lg border p-3 text-sm">
                    <legend className="px-2 font-semibold">الإضافات المسموحة لهذا الصنف</legend>
                    <p className="text-muted-foreground">تحديد الإضافات يمنع بيع تركيبات غير مناسبة. الإضافات غير محددة القيود مسبقًا.</p>
                    <div className="flex flex-wrap gap-2">
                       <Button type="button" variant="outline" size="sm"
                         onClick={() => setProduct({ ...product, allowedAddonIds: undefined })}>
                         السماح بكل الإضافات
                       </Button>
                       <Button type="button" variant="outline" size="sm"
                         onClick={() => setProduct({ ...product, allowedAddonIds: [] })}>
                         منع كل الإضافات
                       </Button>
                     </div>
                     <p role="status" className="text-xs text-muted-foreground">
                       {product.allowedAddonIds === undefined
                         ? "جميع الإضافات مسموحة لهذا الصنف"
                         : `${product.allowedAddonIds.length} إضافة مسموحة لهذا الصنف`}
                     </p>
                     <div className="flex flex-wrap gap-4">
                      {edit.products.filter((addon) => addon.category === "addons").map((addon) => (
                        <label key={addon.id} className="flex min-h-10 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={product.allowedAddonIds === undefined
                              || product.allowedAddonIds.includes(addon.id)}
                            onChange={(event) => {
                              const allowed = product.allowedAddonIds ??
                                edit.products.filter((item) => item.category === "addons").map((item) => item.id);
                              const next = event.target.checked
                                ? [...new Set([...allowed, addon.id])]
                                : allowed.filter((id) => id !== addon.id);
                              setProduct({ ...product, allowedAddonIds: next });
                            }}
                          />
                          {addon.name || "إضافة جديدة"}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                )}
                </div>
              </details>
            </div>
            <DialogFooter className="sm:border-t sm:pt-3">
              {editingExisting && (
                <Button type="button" variant="ghost" className="sm:me-auto" disabled={edit.products.length >= 500}
                  onClick={() => setProduct(duplicateDraftProduct(product, crypto.randomUUID(),
                    product.variants.map(() => crypto.randomUUID())))}>
                  نسخ الصنف كمسودة مخفية
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setProduct(null)}>إلغاء</Button>
              <Button type="button" disabled={busy || !product.name.trim() || product.variants.some((item) => !item.label.trim())}
                onClick={() => {
                  saveProduct(product);
                  if (!editingExisting) {
                    setCategoryFilter("");
                    setProductSearch(product.name);
                    setVisibilityFilter("all");
                  }
                  setProduct(null);
                }}>
                {editingExisting ? "تطبيق التعديل" : "إضافة إلى المسودة"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={removeTarget !== null} onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}>
        {removeTarget && (
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>حذف «{removeTarget.name}»؟</DialogTitle>
              <DialogDescription>
                سيُحذف الصنف من المنيو بعد حفظ المسودة ونشرها. لو الإيقاف مؤقت، استخدم إخفاء الصنف.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>إلغاء</Button>
              <Button type="button" variant="destructive" onClick={() => removeProduct(removeTarget)}>حذف من المسودة</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={categoryManagerOpen} onOpenChange={setCategoryManagerOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إدارة التصنيفات</DialogTitle>
            <DialogDescription>أضف تصنيفًا أو غيّر اسم تصنيف موجود في المسودة.</DialogDescription>
          </DialogHeader>
          {selectedCategory && (
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                التصنيف الحالي
                <select className={selectStyle} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                  {edit.categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}
                </select>
              </label>
              <form key={categoryId} className="grid items-end gap-2 sm:grid-cols-[1fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault();
                  const label = String(new FormData(event.currentTarget).get("categoryLabel")).trim();
                  if (label && label !== selectedCategory.label) update({
                    ...edit,
                    categories: edit.categories.map((entry) =>
                      entry.id === categoryId ? { ...entry, label } : entry),
                  });
                }}>
                <label className="grid gap-1 text-sm">
                  اسم التصنيف
                  <Input name="categoryLabel" className="min-h-11" required
                    defaultValue={selectedCategory.label} maxLength={100} />
                </label>
                <Button type="submit" variant="outline" className="min-h-11">تعديل الاسم</Button>
              </form>
            </div>
          )}
          <form className="grid items-end gap-2 sm:grid-cols-[1fr_auto]"
            onSubmit={(event) => { event.preventDefault(); addCategory(); }}>
            <label className="grid gap-1 text-sm">
              اسم التصنيف الجديد
              <Input className="min-h-11" required maxLength={100} value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)} />
            </label>
            <Button type="submit" variant="outline" className="min-h-11"
              disabled={!categoryName.trim() || edit.categories.length >= 50}>إضافة تصنيف</Button>
          </form>
          <DialogFooter>
            <Button type="button" onClick={() => setCategoryManagerOpen(false)}>تم</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {confirm && data.draft && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !publish.isPending) setConfirm(false);
          }}
        >
          <DialogContent dir="rtl" className="w-[calc(100vw-2rem)] max-w-2xl">
            <DialogHeader>
              <DialogTitle>مراجعة فروق منيو الكاشير قبل النشر</DialogTitle>
              <DialogDescription>
                هتظهر المسودة للكاشير بعد النشر. تضم{" "}
                {data.draft.products.filter((item) => item.active).length} صنفًا
                ظاهرًا.
              </DialogDescription>
            </DialogHeader>
            <div role="region" aria-label="مراجعة تغييرات منيو الكاشير"
              className="max-h-[45dvh] overflow-auto rounded-lg border">
              <p className="sticky top-0 border-b bg-background p-3 text-sm font-semibold">
                {reviewChanges.length} تغيير مقارنة بالمنيو المنشور · أسعار: {reviewChanges.filter((entry) => entry.kind === "price").length}
              </p>
              {reviewChanges.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">لا توجد فروق بين المسودة والمنيو المنشور.</p>
              ) : (
                <table className="w-full table-fixed border-collapse text-right text-xs">
                  <colgroup><col className="w-[48%]" /><col className="w-[26%]" /><col className="w-[26%]" /></colgroup>
                  <thead className="bg-muted">
                    <tr><th className="p-2">التغيير</th><th className="p-2">قبل</th><th className="p-2">بعد</th></tr>
                  </thead>
                  <tbody>
                    {reviewChanges.map((entry) => (
                      <tr key={entry.id} className="border-t">
                        <td className="break-words p-1 font-medium sm:p-2">{entry.label}</td>
                        <td className="break-words p-1 text-muted-foreground sm:p-2">{entry.before}</td>
                        <td className="break-words p-1 sm:p-2" aria-label={`بعد: ${entry.after}`}>{entry.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={publish.isPending}
                onClick={() => setConfirm(false)}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                disabled={publish.isPending || reviewChanges.length === 0}
                onClick={() => publish.mutate()}
              >
                نشر المنيو
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function PosCatalogManager() {
  const client = useQueryClient();
  const [reloadCount, setReloadCount] = useState(0);
  const [editorView, setEditorView] = useState<EditorView>("individual");
  const query = useQuery({
    queryKey: posManagerKey,
    queryFn: fetchPosManager,
    refetchOnWindowFocus: false,
  });
  return (
    <section dir="rtl" className="flex min-w-0 flex-col gap-4 px-4 lg:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">منيو الكاشير</h1>
          <p className="text-sm text-muted-foreground">
            إدارة أصناف وأسعار الكاشير. احفظ التعديلات كمسودة قبل النشر.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/pos">ارجع لنقطة البيع</Link>
        </Button>
      </header>
      {query.data ? (
        <CatalogEditor
          key={`${query.data.revision}/${reloadCount}`}
          data={query.data}
          editorView={editorView}
          setEditorView={setEditorView}
          reload={() => {
            void client
              .fetchQuery({
                queryKey: posManagerKey,
                queryFn: fetchPosManager,
                staleTime: 0,
              })
              .then(
                () => setReloadCount((count) => count + 1),
                () => {}
              );
          }}
        />
      ) : (
        <div className="rounded-xl border p-4" aria-live="polite">
          <p>
            {query.isError ? "تعذر تحميل منيو الكاشير." : "جاري تحميل المنيو…"}
          </p>
          {query.isError && (
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => void query.refetch()}
            >
              إعادة المحاولة
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
