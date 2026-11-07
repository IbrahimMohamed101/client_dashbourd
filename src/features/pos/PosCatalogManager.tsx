import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
const selectStyle = "min-h-11 w-full rounded-md border bg-background px-2";

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
  reload,
}: {
  data: PosCatalogManagerState;
  reload: () => void;
}) {
  const client = useQueryClient();
  const [edit, setEdit] = useState(() =>
    editableCatalog(data.draft ?? data.published)
  );
  const [selection, setSelection] = useState(edit.products[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(edit.categories[0]?.id ?? "");
  const [dirty, setDirty] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [confirm, setConfirm] = useState(false);
  const [zeroPriceDialog, setZeroPriceDialog] = useState(false);
  const [error, setError] = useState("");
  const [editorView, setEditorView] = useState<"individual" | "bulk">("individual");
  const [bulkChannel, setBulkChannel] = useState<Channel>("restaurant");
  const [newChannelId, setNewChannelId] = useState("");
  const [newChannelLabel, setNewChannelLabel] = useState("");
  const channels = edit.channels;
  const search = productSearch.trim().toLocaleLowerCase();
  const visibleProducts = edit.products.filter((item) =>
    (!search || item.name.toLocaleLowerCase().includes(search)
      || edit.categories.some((entry) => entry.id === item.category && entry.label.toLocaleLowerCase().includes(search)))
    && (visibilityFilter === "all" || (visibilityFilter === "visible" ? item.active !== false : item.active === false))
  );
  const reviewChanges = data.draft ? getPosCatalogChanges(data.published, data.draft) : [];
  const product =
    edit.products.find((item) => item.id === selection) ?? edit.products[0];
  const category =
    edit.categories.find((item) => item.id === categoryId) ??
    edit.categories[0];
  const update = (next: EditCatalog) => {
    setEdit(next);
    setDirty(true);
    setError("");
  };
  const updateProduct = (next: EditProduct) =>
    update({
      ...edit,
      products: edit.products.map((item) =>
        item.id === next.id ? next : item
      ),
    });
  const updateVariant = (next: EditVariant) => {
    if (product)
      updateProduct({
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
    const id = crypto.randomUUID();
    update({ ...edit, categories: [...edit.categories, { id, label: "" }] });
    setCategoryId(id);
  }

  function addProduct() {
    const id = crypto.randomUUID();
    if (!category) return;
    update({
      ...edit,
      products: [
        ...edit.products,
        {
          id,
          name: "",
          category: category.id,
          active: true,
          hasAddons: false,
          variants: [emptyVariant("حصة", channels)],
        },
      ],
    });
    setSelection(id);
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div>
          <p className="font-semibold">
            النسخة المنشورة {data.publishedRevision}
          </p>
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
          تعديل صنف
        </Button>
        <Button
          type="button"
          variant={editorView === "bulk" ? "default" : "outline"}
          aria-pressed={editorView === "bulk"}
          onClick={() => setEditorView("bulk")}
        >
          جدول الأسعار
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
      <section aria-label="إدارة قنوات البيع" className="grid gap-3 rounded-xl border bg-card p-4">
        <div>
          <h2 className="font-bold">قنوات البيع المستقلة</h2>
          <p className="text-sm text-muted-foreground">أضف قناة جديدة دون تعديل الكود. الأسعار الجديدة تظل غير مسعّرة إلى أن تدخلها وتنشر المسودة.</p>
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
            <label className="grid min-w-48 gap-1 text-sm">
              قناة البيع
              <select
                className={selectStyle}
                value={bulkChannel}
                onChange={(event) => setBulkChannel(event.target.value as Channel)}
              >
                {channels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="grid gap-1 text-sm">
            بحث في جدول الأسعار
            <Input type="search" aria-label="بحث في جدول أسعار الكاشير"
              placeholder="اسم الصنف أو التصنيف" value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)} />
          </label>
          <p className="text-xs text-muted-foreground">عرض {visibleProducts.length} من {edit.products.length} صنف.</p>
          <div className="max-h-[65dvh] overflow-auto rounded-xl border">
            <table className="w-full min-w-[38rem] border-collapse text-right text-sm">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-3">الصنف</th>
                  <th className="p-3">الحجم</th>
                  <th className="p-3">التوفر</th>
                  <th className="p-3">السعر بالريال · {channels.find((item) => item.id === bulkChannel)?.label}</th>
                </tr>
              </thead>
              <tbody>
                {visibleProducts.flatMap((item) =>
                  item.variants.map((variant) => (
                    <tr key={`${item.id}/${variant.id}`} className="border-t">
                      <td className="p-3 font-semibold">{item.name}</td>
                      <td className="p-3">{variant.label}</td>
                      <td className="p-3">{item.active ? "ظاهر" : "مخفي"}</td>
                      <td className="p-2">
                        <Input
                          aria-label={`سعر ${item.name} ${variant.label} في ${bulkChannel}`}
                          className="min-h-11 w-full"
                          dir="ltr"
                          inputMode="decimal"
                          placeholder="غير مسعّر"
                          value={variant.prices[bulkChannel]}
                          disabled={busy}
                          onChange={(event) =>
                            update({
                              ...edit,
                              products: edit.products.map((entry) =>
                                entry.id !== item.id
                                  ? entry
                                  : {
                                      ...entry,
                                      variants: entry.variants.map((size) =>
                                        size.id !== variant.id
                                          ? size
                                          : {
                                              ...size,
                                              prices: {
                                                ...size.prices,
                                                [bulkChannel]: event.target.value,
                                              },
                                            }
                                      ),
                                    }
                              ),
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
      <fieldset
        disabled={busy}
        className="grid min-w-0 gap-4 lg:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)]"
      >
        <section className="flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-4">
          <h2 className="font-bold">التصنيفات والأصناف</h2>
          <label className="grid gap-1 text-sm">
            التصنيف
            <select
              className={selectStyle}
              value={category?.id ?? ""}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {!category && <option value="">أضف تصنيفًا</option>}
              {edit.categories.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.label || "تصنيف جديد"}
                </option>
              ))}
            </select>
          </label>
          {category && (
            <label className="grid gap-1 text-sm">
              اسم التصنيف
              <Input
                className="min-h-11"
                value={category.label}
                maxLength={100}
                onChange={(event) =>
                  update({
                    ...edit,
                    categories: edit.categories.map((entry) =>
                      entry.id === category.id
                        ? { ...entry, label: event.target.value }
                        : entry
                    ),
                  })
                }
              />
            </label>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={addCategory}
            disabled={edit.categories.length >= 50}
          >
            إضافة تصنيف
          </Button>
          <hr />
          <label className="grid gap-1 text-sm">
            البحث في الأصناف
            <Input
              type="search"
              aria-label="بحث في أصناف الكاشير"
              placeholder="اسم الصنف أو التصنيف"
              value={productSearch}
              onChange={(event) => setProductSearch(event.target.value)}
            />
          </label>
          <div role="group" aria-label="عرض الأصناف" className="flex flex-wrap gap-2">
            {([
              ["all", "الكل"], ["visible", "الظاهرة"], ["hidden", "المخفية"],
            ] as const).map(([id, label]) => (
              <Button key={id} type="button" size="sm"
                variant={visibilityFilter === id ? "default" : "outline"}
                aria-pressed={visibilityFilter === id}
                onClick={() => setVisibilityFilter(id)}
              >{label}</Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground" role="status">
            عرض {visibleProducts.length} من {edit.products.length} صنف
          </p>
          <div role="group" aria-label="قائمة أصناف الكاشير"
            className="grid max-h-[40dvh] gap-1.5 overflow-y-auto rounded-lg border p-2">
            {visibleProducts.map((item) => (
              <button type="button" key={item.id}
                aria-pressed={product?.id === item.id}
                onClick={() => setSelection(item.id)}
                className={"flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-right text-sm transition-colors " +
                  (product?.id === item.id ? "border-primary bg-primary/10 font-semibold" : "border-transparent hover:bg-muted")}
              >
                <span className="min-w-0 truncate">{item.name || "صنف جديد"}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.active === false ? "مخفي" : "ظاهر"}
                </span>
              </button>
            ))}
            {visibleProducts.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">لا توجد أصناف مطابقة. غيّر البحث أو فلتر الظهور.</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addProduct}
            disabled={!category || edit.products.length >= 500}
          >
            إضافة صنف
          </Button>
        </section>
        <section className="grid min-w-0 content-start gap-4 rounded-xl border bg-card p-4">
          <h2 className="font-bold">بيانات الصنف وأسعاره</h2>
          {product ? (
            <>
              <label className="grid gap-1 text-sm">
                اسم الصنف
                <Input
                  className="min-h-11"
                  value={product.name}
                  maxLength={100}
                  onChange={(event) =>
                    updateProduct({ ...product, name: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-1 text-sm">
                تصنيف الصنف
                <select
                  className={selectStyle}
                  value={product.category}
                  onChange={(event) =>
                    updateProduct({
                      ...product,
                      category: event.target.value,
                      sellStandalone: event.target.value === "addons" ? product.sellStandalone === true : undefined,
                      ...(event.target.value === "addons"
                        ? { hasAddons: false, allowedAddonIds: undefined } : {}),
                    })
                  }
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
              <label className="grid gap-1 text-sm">
                الحجم الافتراضي للكاشير
                <select
                  aria-label="الحجم الافتراضي للصنف"
                  className={selectStyle}
                  value={product.defaultVariantId ?? ""}
                  onChange={(event) =>
                    updateProduct({
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
                <label className="flex min-h-10 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={product.active !== false}
                    onChange={(event) =>
                      updateProduct({
                        ...product,
                        active: event.target.checked,
                      })
                    }
                  />
                  يظهر في الكاشير بعد النشر
                </label>
                {product.category === "addons" && (
                  <label className="flex min-h-12 items-center gap-2">
                    <input type="checkbox" aria-label="تباع الإضافة منفردة"
                      checked={product.sellStandalone === true}
                      onChange={(event) =>
                        updateProduct({ ...product, sellStandalone: event.target.checked })
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
                        updateProduct({
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
                            updateProduct({ ...product, allowedAddonIds: next });
                          }}
                        />
                        {addon.name || "إضافة جديدة"}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
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
                        updateProduct({
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
                    updateProduct({
                      ...product,
                      variants: [...product.variants, emptyVariant("", channels)],
                    })
                  }
                >
                  إضافة حجم
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              أضف صنفًا من قائمة التصنيفات والأصناف.
            </p>
          )}
        </section>
      </fieldset>
      )}
      {confirm && data.draft && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !publish.isPending) setConfirm(false);
          }}
        >
          <DialogContent dir="rtl">
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
                <table className="w-full min-w-[28rem] border-collapse text-right text-xs">
                  <thead className="bg-muted">
                    <tr><th className="p-2">التغيير</th><th className="p-2">قبل</th><th className="p-2">بعد</th></tr>
                  </thead>
                  <tbody>
                    {reviewChanges.map((entry) => (
                      <tr key={entry.id} className="border-t">
                        <td className="p-2 font-medium">{entry.label}</td>
                        <td className="p-2 text-muted-foreground">{entry.before}</td>
                        <td className="p-2">{entry.after}</td>
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
