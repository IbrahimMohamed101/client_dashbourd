import { useState } from "react";
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
import {
  channels,
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
type EditCatalog = Omit<Catalog, "products"> & { products: EditProduct[] };
const selectStyle = "min-h-11 w-full rounded-md border bg-background px-2";

function emptyVariant(label = "حصة"): EditVariant {
  return {
    id: crypto.randomUUID(),
    label,
    prices: { restaurant: "", hungerstation: "", keeta: "" },
  };
}

function editableCatalog(catalog: Catalog): EditCatalog {
  return {
    categories: catalog.categories,
    products: catalog.products.map((item) => ({
      ...item,
      variants: item.variants.map((variant) => ({
        ...variant,
        prices: Object.fromEntries(
          channels.map(({ id }) => {
            const amount = variant.prices[id];
            return [id, amount === null ? "" : (amount / 100).toFixed(2)];
          })
        ) as EditVariant["prices"],
      })),
    })),
  };
}

function serializeDraft(edit: EditCatalog): Catalog {
  return {
    categories: edit.categories,
    products: edit.products.map((item) => ({
      ...item,
      variants: item.variants.map((variant) => ({
        ...variant,
        prices: Object.fromEntries(
          channels.map(({ id, label }) => {
            const input = variant.prices[id].trim();
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
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
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
          variants: [emptyVariant()],
        },
      ],
    });
    setSelection(id);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
        <div>
          <p className="font-semibold">
            النسخة المنشورة {data.publishedRevision}
          </p>
          <p className="text-sm text-muted-foreground" role="status">
            {dirty
              ? "تعديلات تحتاج حفظًا"
              : data.draft
                ? "مسودة محفوظة جاهزة للمراجعة"
                : "المنيو المنشور هو الظاهر للكاشير"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11"
            variant="outline"
            disabled={busy || !dirty}
            onClick={() => save.mutate()}
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
            الصنف
            <select
              className={selectStyle}
              value={product?.id ?? ""}
              onChange={(event) => setSelection(event.target.value)}
            >
              {!product && <option value="">أضف صنفًا</option>}
              {edit.products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || "صنف جديد"}
                  {item.active === false ? " · مخفي" : ""}
                </option>
              ))}
            </select>
          </label>
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
                    updateProduct({ ...product, category: event.target.value })
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
                {product.category !== "addons" && (
                  <label className="flex min-h-10 items-center gap-2">
                    <input
                      type="checkbox"
                      checked={product.hasAddons === true}
                      onChange={(event) =>
                        updateProduct({
                          ...product,
                          hasAddons: event.target.checked,
                        })
                      }
                    />
                    يقبل إضافات
                  </label>
                )}
              </div>
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
                      variants: [...product.variants, emptyVariant("")],
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
      {confirm && data.draft && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !publish.isPending) setConfirm(false);
          }}
        >
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>نشر منيو الكاشير</DialogTitle>
              <DialogDescription>
                هتظهر المسودة للكاشير بعد النشر. تضم{" "}
                {data.draft.products.filter((item) => item.active).length} صنفًا
                ظاهرًا.
              </DialogDescription>
            </DialogHeader>
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
                disabled={publish.isPending}
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
