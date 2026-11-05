import { useState, type ReactNode } from "react";
import { Minus, Plus, Search, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  channels as defaultChannels,
  formatPreviewAmount,
  previewUnitPrice,
  type Addon,
  type Category,
  type Channel,
  type Product,
  type Variant,
} from "./previewCatalog";
import type { PublishedPosCatalog } from "./catalogApi";
import { fetchPosQuote, type PosQuote } from "./quoteApi";
import { parseApiError } from "@/lib/apiErrors";

type Selection = { product: Product; variant: Variant; addons: Addon[] };
type CartLine = Selection & { id: string; quantity: number };

function cartTotal(cart: CartLine[], channel: Channel) {
  let total = 0;
  for (const line of cart) {
    const price = previewUnitPrice(line.variant, line.addons, channel);
    if (price === null) return null;
    total += price * line.quantity;
  }
  return total;
}

function ProductOptions({
  product,
  channel,
  availableAddons,
  onClose,
  onAdd,
}: {
  product: Product;
  channel: Channel;
  availableAddons: Addon[];
  onClose: () => void;
  onAdd: (selection: Selection) => void;
}) {
  const [variant, setVariant] = useState(() =>
    product.variants.length === 1 ? product.variants[0] : undefined
  );
  const [addons, setAddons] = useState<Addon[]>([]);
  const amount = variant ? previewUnitPrice(variant, addons, channel) : null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent dir="rtl" className="text-right">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            اختر الحجم والإضافات من أسعار المعاينة للقناة الحالية.
          </DialogDescription>
        </DialogHeader>
        <div
          role="group"
          aria-label="حجم الصنف"
          className="grid grid-cols-3 gap-2"
        >
          {product.variants.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={variant === option ? "default" : "outline"}
              aria-pressed={variant === option}
              disabled={option.prices[channel] == null}
              className="h-auto min-h-14 flex-col gap-1 py-2 whitespace-normal"
              onClick={() => setVariant(option)}
            >
              {option.label}
              <span className="text-xs">
                {option.prices[channel] == null
                  ? "غير مسعّر"
                  : formatPreviewAmount(option.prices[channel])}
              </span>
            </Button>
          ))}
        </div>
        {product.hasAddons && availableAddons.length > 0 && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 font-semibold">الإضافات الاختيارية</legend>
            {availableAddons.map((addon) => {
              const price = addon.prices[channel];
              const selected = addons.includes(addon);
              return (
                <Button
                  key={addon.id}
                  type="button"
                  variant={selected ? "secondary" : "outline"}
                  aria-pressed={selected}
                  disabled={price == null}
                  className="min-h-12 justify-between"
                  onClick={() =>
                    setAddons((current) =>
                      current.includes(addon)
                        ? current.filter((item) => item !== addon)
                        : [...current, addon]
                    )
                  }
                >
                  {addon.name}
                  <span>
                    {price == null ? "غير مسعّر" : formatPreviewAmount(price)}
                  </span>
                </Button>
              );
            })}
          </fieldset>
        )}
        <DialogFooter>
          <Button
            type="button"
            className="min-h-12"
            disabled={!variant || amount === null}
            onClick={() => {
              if (variant && amount !== null)
                onAdd({ product, variant, addons });
            }}
          >
            {amount === null
              ? "أضف للسلة"
              : `أضف للسلة · ${formatPreviewAmount(amount)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PosWorkspace({ catalog, operatorName = "موظف", navigation }: {
  catalog: PublishedPosCatalog;
  operatorName?: string;
  navigation?: ReactNode;
}) {
  const [channel, setChannel] = useState<Channel>("restaurant");
  const [pendingChannel, setPendingChannel] = useState<Channel | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartRevision, setCartRevision] = useState(catalog.revision);
  const [serviceMode, setServiceMode] = useState<"dine-in" | "takeaway" | "delivery">("takeaway");
  const [externalOrderNumber, setExternalOrderNumber] = useState("");
  const [appPaymentStatus, setAppPaymentStatus] = useState<"paid" | "cash">("paid");
  const [quoteReview, setQuoteReview] = useState<{ key: string; data: PosQuote } | null>(null);
  const [quoteFailure, setQuoteFailure] = useState<{ key: string; message: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const { categories, products } = catalog;
  const channels = catalog.channels ?? defaultChannels;
  const availableAddons = products
    .filter((item) => item.category === "addons")
    .map(({ id, name, variants }) => ({
      id,
      name,
      prices: variants[0].prices,
    }));
  const staleCart = cart.length > 0 && cartRevision !== catalog.revision;
  const itemCount = cart.reduce((count, line) => count + line.quantity, 0);
  const total = cartTotal(cart, channel);
  const nextTotal = pendingChannel ? cartTotal(cart, pendingChannel) : null;
  const quoteRequest = {
    revision: catalog.revision,
    channel,
    items: cart.map((line) => ({
      productId: line.product.id,
      variantId: line.variant.id,
      quantity: line.quantity,
      addonIds: line.addons.map((addon) => addon.id),
    })),
  };
  const quoteKey = JSON.stringify(quoteRequest);
  const currentQuote = quoteReview?.key === quoteKey ? quoteReview.data : null;
  const currentQuoteError = quoteFailure?.key === quoteKey ? quoteFailure.message : null;
  async function reviewServerPrice() {
    if (staleCart || !cart.length || total === null || quoteLoading) return;
    const key = quoteKey;
    setQuoteLoading(true);
    setQuoteFailure(null);
    try {
      const data = await fetchPosQuote(quoteRequest);
      setQuoteReview({ key, data });
    } catch (cause) {
      const error = parseApiError(cause);
      const messages: Record<string, string> = {
        POS_CATALOG_CONFLICT: "تم نشر منيو أحدث. حدّث الصفحة وراجع السعر القديم والجديد قبل الاعتماد.",
        POS_PRICE_UNAVAILABLE: "الصنف أو الإضافة غير مسعّرة في هذه القناة؛ غيّر القناة أو احذفها.",
        POS_PRODUCT_UNAVAILABLE: "صنف أو حجم في السلة لم يعد متاحًا. راجع المنيو المنشور.",
        POS_ADDON_UNAVAILABLE: "إضافة في السلة لم تعد متاحة لهذا الصنف.",
        POS_QUOTE_INVALID: "راجع الأحجام والكميات وأصناف السلة.",
      };
      setQuoteReview(null);
      setQuoteFailure({
        key,
        message: messages[error.code ?? ""] ?? (
          error.status === 401 || error.status === 403
            ? "الجلسة أو الصلاحيات غير صالحة. سجّل الدخول مرة أخرى."
            : "تعذر الاتصال بتسعير Staging. لم يتم تسجيل أي عملية بيع."
        ),
      });
    } finally {
      setQuoteLoading(false);
    }
  }

  const revisedLines = staleCart
    ? cart.map((line) => {
        const revisedProduct = products.find((item) => item.id === line.product.id);
        const revisedVariant = revisedProduct?.variants.find((item) => item.id === line.variant.id);
        const revisedAddons = line.addons.map((addon) => {
          const updated = products.find((item) => item.id === addon.id && item.category === "addons");
          return updated && updated.variants.length === 1
            ? { id: updated.id, name: updated.name, prices: updated.variants[0].prices }
            : null;
        });
        const valid = Boolean(
          revisedProduct && revisedVariant && revisedVariant.prices[channel] != null
          && revisedAddons.every((addon) => addon && addon.prices[channel] != null
            && (revisedProduct?.allowedAddonIds === undefined || revisedProduct.allowedAddonIds.includes(addon.id)))
          && (!line.addons.length || revisedProduct?.hasAddons)
        );
        const nextSelection: Selection | null = valid && revisedProduct && revisedVariant
          ? { product: revisedProduct, variant: revisedVariant, addons: revisedAddons as Addon[] }
          : null;
        const oldUnit = previewUnitPrice(line.variant, line.addons, channel);
        const newUnit = nextSelection
          ? previewUnitPrice(nextSelection.variant, nextSelection.addons, channel)
          : null;
        return { line, oldUnit, newUnit, nextSelection };
      })
    : [];
  const canAcceptReprice = staleCart
    && channels.some((item) => item.id === channel)
    && revisedLines.every(({ nextSelection }) => nextSelection !== null);
  const revisedTotal = canAcceptReprice
    ? revisedLines.reduce((sum, { line, newUnit }) => sum + (newUnit ?? 0) * line.quantity, 0)
    : null;
  function acceptReprice() {
    if (!canAcceptReprice) return;
    setCart(revisedLines.map(({ line, nextSelection }) => ({
      ...line,
      ...nextSelection!,
    })));
    setCartRevision(catalog.revision);
    setProduct(null);
    setPendingChannel(null);
    setQuoteReview(null);
    setQuoteFailure(null);
  }

  const searchTerm = search.trim();
  const visibleProducts = products.filter((item) =>
    searchTerm
      ? item.name.includes(searchTerm)
      : category === null || item.category === category
  );

  function chooseChannel(next: Channel) {
    if (next === channel || staleCart) return;
    if (cart.length) setPendingChannel(next);
    else setChannel(next);
  }

  function addToCart(selection: Selection) {
    if (staleCart) return;
    if (!cart.length) setCartRevision(catalog.revision);
    const { product, variant, addons } = selection;
    const id = [
      product.id,
      variant.id,
      ...addons.map((addon) => addon.id).sort(),
    ].join("/");
    setCart((current) =>
      current.some((line) => line.id === id)
        ? current.map((line) =>
            line.id === id ? { ...line, quantity: line.quantity + 1 } : line
          )
        : [...current, { ...selection, id, quantity: 1 }]
    );
    setProduct(null);
  }

  function chooseProduct(item: Product) {
    const variant = item.variants[0];
    if (
      item.variants.length === 1 &&
      !item.hasAddons &&
      variant.prices[channel] != null
    ) {
      addToCart({ product: item, variant, addons: [] });
    } else {
      setProduct(item);
    }
  }

  function changeQuantity(id: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.id === id ? { ...line, quantity: line.quantity + delta } : line
        )
        .filter((line) => line.quantity > 0)
    );
  }

  return (
    <div
      data-testid="pos-sale-viewport"
      dir="rtl"
      className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background"
    >
      <header aria-label="شريط البيع"
        className="flex h-16 max-h-16 min-h-16 shrink-0 items-center gap-2 overflow-hidden border-b bg-card px-2 sm:px-3">
        <SidebarTrigger aria-label="فتح القائمة الجانبية" className="size-12 shrink-0" />
        <img src="/logo.png" alt="بيسك دايت" className="hidden size-10 shrink-0 object-contain sm:block" />
        <div role="group" aria-label="قناة البيع"
          className="flex min-w-0 max-w-[30vw] shrink-0 gap-2 overflow-x-auto whitespace-nowrap py-1 lg:max-w-[25vw]">
          {channels.map((option) => (
            <Button key={option.id} type="button"
              variant={channel === option.id ? "secondary" : "outline"}
              aria-pressed={channel === option.id}
              disabled={staleCart}
              className={"min-h-12 shrink-0 border-2 px-3 text-sm " +
                (channel === option.id ? "border-primary font-bold" : "border-transparent")}
              onClick={() => chooseChannel(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
        {channel === "restaurant" && (
          <div role="group" aria-label="نوع طلب المطعم"
            className="flex shrink-0 gap-1 rounded-lg border p-0.5">
            {([
              ["dine-in", "محلي"],
              ["takeaway", "سفري"],
              ["delivery", "توصيل"],
            ] as const).map(([mode, label]) => (
              <Button key={mode} type="button"
                variant={serviceMode === mode ? "secondary" : "ghost"}
                aria-pressed={serviceMode === mode}
                className={"min-h-11 shrink-0 px-2 text-sm " +
                  (serviceMode === mode ? "border border-primary font-semibold" : "")}
                onClick={() => setServiceMode(mode)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
        <div className="relative min-w-24 flex-1">
          <Search aria-hidden="true"
            className="pointer-events-none absolute start-3 top-3.5 size-5 text-muted-foreground" />
          <Input type="search" aria-label="ابحث عن صنف" placeholder="بحث"
            className="h-12 w-full ps-10"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              if (event.target.value) setCategory(null);
            }}
          />
        </div>
        <span className="hidden max-w-32 shrink-0 truncate text-sm text-muted-foreground xl:inline"
          title={operatorName}>{operatorName}</span>
        {navigation}
      </header>
      {staleCart && (
        <section role="status" aria-label="مراجعة اختلاف أسعار المنيو"
          className="grid shrink-0 gap-3 rounded-xl border bg-card p-4 text-sm">
          <div>
            <h2 className="font-bold">تم نشر منيو جديد — السلة محفوظة للمراجعة</h2>
            <p className="mt-1 text-muted-foreground">نسخة السلة {cartRevision}، والنسخة الجديدة {catalog.revision}. لازم تؤكد الأسعار الجديدة قبل المتابعة.</p>
          </div>
          <div className="max-h-48 space-y-2 overflow-auto">
            {revisedLines.map(({ line, oldUnit, newUnit }) => (
              <div key={line.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0">
                <span className="font-semibold">{line.product.name} · {line.variant.label} × {line.quantity}</span>
                <span className="text-xs">
                  القديم: {oldUnit == null ? "غير متاح" : formatPreviewAmount(oldUnit * line.quantity)}
                  {" — "}الجديد: {newUnit == null ? "لم يعد متاحًا" : formatPreviewAmount(newUnit * line.quantity)}
                </span>
                {newUnit === null && (
                  <Button size="sm" variant="outline" onClick={() => setCart((list) => list.filter((item) => item.id !== line.id))}>
                    حذف الصنف غير المتاح
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-between gap-3 font-semibold">
            <span>إجمالي السلة القديم: {total == null ? "غير متاح" : formatPreviewAmount(total)}</span>
            <span>الجديد: {revisedTotal === null ? "يحتوي أصنافًا غير متاحة" : formatPreviewAmount(revisedTotal)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!canAcceptReprice} onClick={acceptReprice} className="min-h-11">
              تأكيد الأسعار الجديدة
            </Button>
            <Button type="button" variant="outline" className="min-h-11"
              onClick={() => { setProduct(null); setPendingChannel(null); setCart([]); }}>
              إلغاء السلة
            </Button>
          </div>
        </section>
      )}
      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden p-2 md:grid-cols-[minmax(0,1fr)_minmax(22.5rem,25rem)]">
        <section
          aria-label="الكتالوج التجريبي"
          className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden rounded-2xl border bg-card p-2"
        >
          <div
            role="group"
            aria-label="تصفية التصنيفات"
            className="flex min-w-0 shrink-0 gap-2 overflow-x-auto pb-1"
          >
            <Button
              type="button"
              variant={category === null ? "default" : "outline"}
              aria-pressed={category === null}
              className="min-h-12 shrink-0"
              onClick={() => {
                setCategory(null);
                setSearch("");
              }}
            >
              كل الأصناف
            </Button>
            {categories.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={category === item.id ? "default" : "outline"}
                aria-pressed={category === item.id}
                className="min-h-12 shrink-0"
                onClick={() => {
                  setCategory(item.id);
                  setSearch("");
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2">
            <h2 className="font-bold">
              {searchTerm
                ? "نتائج البحث"
                : (categories.find((item) => item.id === category)?.label ??
                  "الأصناف")}
            </h2>
            <span role="status" className="text-sm text-muted-foreground">
              {visibleProducts.length} صنف
            </span>
          </div>
          <div className="min-h-0 overflow-auto overscroll-contain">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((item) => {
                const pricedVariants = item.variants
                  .map((variant) => variant.prices[channel])
                  .filter((value): value is number => typeof value === "number");
                const startingPrice = pricedVariants.length
                  ? Math.min(...pricedVariants)
                  : null;
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant="outline"
                    className="h-auto min-h-24 flex-col gap-2 px-2 py-3 text-center text-sm whitespace-normal"
                    disabled={staleCart || startingPrice === null}
                    onClick={() => chooseProduct(item)}
                  >
                    <span className="font-semibold">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {startingPrice === null
                        ? "غير مسعّر"
                        : item.variants.length > 1
                          ? `من ${formatPreviewAmount(startingPrice)}`
                          : formatPreviewAmount(startingPrice)}
                    </span>
                  </Button>
                );
              })}
            </div>
            {visibleProducts.length === 0 && (
              <p role="status" className="py-6 text-sm text-muted-foreground">
                لا توجد أصناف مطابقة.
              </p>
            )}
          </div>
        </section>

        <aside
          id="pos-cart"
          aria-label="السلة التجريبية"
          className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden rounded-2xl border border-s-4 border-s-primary bg-card p-3"
        >
          <div className="flex shrink-0 items-center gap-2">
            <ShoppingBasket
              aria-hidden="true"
              className="size-5 text-primary"
            />
            <h2 className="font-bold">سلة {channels.find((item) => item.id === channel)?.label ?? channel}</h2>
            <span
              className="rounded-full bg-muted px-2 text-sm"
              aria-label="عدد الأصناف"
            >
              {itemCount}
            </span>
            {cart.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                className="ms-auto min-h-10"
                onClick={() => setCart([])}
              >
                مسح السلة
              </Button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
            {cart.length === 0 ? (
              <p className="py-5 text-sm text-muted-foreground">
                اختر صنفًا لتجربة إضافته إلى السلة.
              </p>
            ) : (
              <ul className="divide-y">
                {cart.map((line) => {
                  const name = `${line.product.name} ${line.variant.label}`;
                  const price = previewUnitPrice(
                    line.variant,
                    line.addons,
                    channel
                  );
                  return (
                    <li key={line.id} className="grid gap-2 py-3">
                      <div className="flex items-start justify-between gap-2 text-sm font-semibold">
                        <span>{name}</span>
                        <span className="shrink-0">
                          {price === null
                            ? "غير مسعّر"
                            : formatPreviewAmount(price * line.quantity)}
                        </span>
                      </div>
                      {line.addons.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {line.addons.map((addon) => addon.name).join("، ")}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="size-12"
                          aria-label={`زِد كمية ${name}`}
                          disabled={staleCart}
                          onClick={() => changeQuantity(line.id, 1)}
                        >
                          <Plus />
                        </Button>
                        <span className="min-w-6 text-center tabular-nums">
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          className="size-12"
                          aria-label={`قلّل كمية ${name}`}
                          onClick={() => changeQuantity(line.id, -1)}
                        >
                          <Minus />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="grid shrink-0 gap-2 border-t pt-3">
            <div
              className="flex justify-between gap-2 font-bold"
              aria-live="polite"
            >
              <span>الإجمالي التجريبي</span>
              <span>
                {total === null ? "غير متاح" : formatPreviewAmount(total)}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              className="min-h-12"
              disabled={!cart.length || total === null || staleCart || quoteLoading}
              onClick={() => void reviewServerPrice()}
            >
              {quoteLoading ? "مراجعة الأسعار..." : "مراجعة الأسعار من السيرفر"}
            </Button>
            {currentQuoteError && (
              <p role="alert" className="text-xs text-destructive">{currentQuoteError}</p>
            )}
            {currentQuote && (
              <section aria-label="نتيجة تسعير السيرفر" className="rounded-xl border bg-muted/50 p-3 text-sm">
                <h3 className="font-bold">مراجعة السعر · نسخة {currentQuote.revision}</h3>
                <div className="mt-2 flex justify-between gap-2">
                  <span>الإجمالي المبدئي</span>
                  <strong>{formatPreviewAmount(currentQuote.provisionalSubtotalHalalas)}</strong>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  هذا ليس إجمالي الفاتورة النهائي؛ الضريبة والخصومات والسداد غير مفعّلة.
                </p>
              </section>
            )}
            <Button type="button" disabled className="min-h-12">
              الدفع غير متاح في المعاينة
            </Button>
          </div>
        </aside>
      </div>
      {product && !staleCart && (
        <ProductOptions
          product={product}
          channel={channel}
          availableAddons={availableAddons.filter((addon) =>
            product.allowedAddonIds === undefined || product.allowedAddonIds.includes(addon.id)
          )}
          onClose={() => setProduct(null)}
          onAdd={addToCart}
        />
      )}
      {pendingChannel && !staleCart && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingChannel(null);
          }}
        >
          <DialogContent dir="rtl" className="text-right">
            <DialogHeader>
              <DialogTitle>تغيير قناة البيع</DialogTitle>
              <DialogDescription>
                {nextTotal === null
                  ? "بعض الأصناف غير مسعّرة في القناة الجديدة. أزلها من السلة قبل التغيير."
                  : `الإجمالي الحالي ${formatPreviewAmount(total ?? 0)}، والجديد ${formatPreviewAmount(nextTotal)}.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="min-h-12"
                onClick={() => setPendingChannel(null)}
              >
                إلغاء
              </Button>
              <Button
                type="button"
                className="min-h-12"
                disabled={nextTotal === null}
                onClick={() => {
                  if (!pendingChannel || nextTotal === null) return;
                  setChannel(pendingChannel);
                  setPendingChannel(null);
                }}
              >
                تأكيد تغيير القناة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
