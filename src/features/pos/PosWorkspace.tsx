import { useEffect, useState, type ReactNode } from "react";
import { Minus, Plus, Search, ShoppingBasket, Pencil, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import {
  cartLineId, readPosCartDraft, writePosCartDraft,
  MAX_CART_LINES, MAX_LINE_QUANTITY,
  type PosSelection, type PosCartLine,
} from "./posCartDraft";

type Selection = PosSelection;
type CartLine = PosCartLine;

function defaultVariant(product: Product, channel: Channel): Variant | undefined {
  const priced = product.variants.filter((item) => item.prices[channel] != null);
  return priced.find((item) => item.id === "150" || /(^|\D)150(\D|$)/.test(item.label)) ?? priced[0];
}

type UndoState = { previous: CartLine[]; revision: number; channel: string; expiresAt: number };

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
  initial,
}: {
  product: Product;
  channel: Channel;
  availableAddons: Addon[];
  onClose: () => void;
  onAdd: (selection: Selection, quantity: number) => void;
  initial?: CartLine;
}) {
  const [variant, setVariant] = useState(() =>
    initial ? product.variants.find((item) => item.id === initial.variant.id)
      ?? defaultVariant(product, channel) : defaultVariant(product, channel)
  );
  const [addons, setAddons] = useState<Addon[]>(() =>
    initial?.addons.map((old) => availableAddons.find((item) => item.id === old.id)).filter(
      (item): item is Addon => item != null
    ) ?? []
  );
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
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
            {initial ? "عدّل الحجم والإضافات والكمية ثم احفظ السطر." : "الحجم الافتراضي 150 جم عند توافره. اختر الإضافات والكمية."}
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
              const selected = addons.some((item) => item.id === addon.id);
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
                      current.some((item) => item.id === addon.id)
                        ? current.filter((item) => item.id !== addon.id)
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
        <div role="group" aria-label="كمية الصنف" className="flex items-center justify-between rounded-lg border px-3 py-2">
          <span className="font-semibold">الكمية</span>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" className="size-12"
              aria-label="قلّل الكمية المختارة" disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
              <Minus aria-hidden="true" />
            </Button>
            <output aria-live="polite" className="min-w-8 text-center tabular-nums">{quantity}</output>
            <Button type="button" variant="outline" className="size-12"
              aria-label="زِد الكمية المختارة" disabled={quantity >= MAX_LINE_QUANTITY}
              onClick={() => setQuantity((current) => Math.min(MAX_LINE_QUANTITY, current + 1))}>
              <Plus aria-hidden="true" />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            className="min-h-12"
            disabled={!variant || amount === null}
            onClick={() => {
              if (variant && amount !== null)
                onAdd({ product, variant, addons }, quantity);
            }}
          >
            {amount === null
              ? "أضف للسلة"
              : `${initial ? "حفظ التعديل" : "أضف للسلة"} · ${formatPreviewAmount(amount * quantity)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PosWorkspace({ catalog, operatorName = "موظف", navigation, operatorId }: {
  catalog: PublishedPosCatalog;
  operatorName?: string;
  navigation?: ReactNode;
  operatorId?: string | null;
}) {
  // Read business-only draft references once per signed-in operator. No
  // client-side total is ever considered an approved payable amount.
  const [restored] = useState(() => readPosCartDraft(operatorId, catalog));
  const [channel, setChannel] = useState<Channel>(restored?.channel ?? "restaurant");
  const [pendingChannel, setPendingChannel] = useState<Channel | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartLine[]>(restored?.lines ?? []);
  const [cartRevision, setCartRevision] = useState(restored?.revision ?? catalog.revision);
  const [serviceMode, setServiceMode] = useState<"dine-in" | "takeaway" | "delivery">(restored?.serviceMode ?? "takeaway");
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [externalOrderNumber, setExternalOrderNumber] = useState("");
  const [appPaymentStatus, setAppPaymentStatus] = useState<"paid" | "cash">("paid");
  const [quoteReview, setQuoteReview] = useState<{ key: string; data: PosQuote } | null>(null);
  const [quoteFailure, setQuoteFailure] = useState<{ key: string; message: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  useEffect(() => {
    writePosCartDraft(operatorId, { revision: cartRevision, channel, serviceMode, lines: cart });
  }, [operatorId, cartRevision, channel, serviceMode, cart]);

  useEffect(() => {
    if (!undoState) return;
    const timer = window.setTimeout(() => setUndoState(null),
      Math.max(0, undoState.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [undoState]);

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
    setUndoState(null);
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
    else {
      setChannel(next);
      setUndoState(null);
      setCartNotice(null);
    }
  }

  function applySelection(selection: Selection, quantity = 1, editId: string | null = null) {
    if (staleCart || !Number.isSafeInteger(quantity)
      || quantity < 1 || quantity > MAX_LINE_QUANTITY) return;
    const id = cartLineId(selection);
    const originalIndex = editId ? cart.findIndex((line) => line.id === editId) : -1;
    if (editId && originalIndex < 0) return;
    const others = editId ? cart.filter((line) => line.id !== editId) : [...cart];
    const matching = others.find((line) => line.id === id);
    if (matching && matching.quantity + quantity > MAX_LINE_QUANTITY) {
      setCartNotice("الحد الأقصى 99 وحدة لكل صنف بالحجم والإضافات نفسها.");
      return;
    }
    if (!matching && others.length >= MAX_CART_LINES) {
      setCartNotice("الحد الأقصى 50 سطرًا في السلة. راجع الأصناف الحالية.");
      return;
    }
    const next = matching
      ? others.map((line) => line.id === id ? { ...line, quantity: line.quantity + quantity } : line)
      : [...others];
    if (!matching) {
      next.splice(originalIndex < 0 ? next.length : Math.min(originalIndex, next.length),
        0, { ...selection, id, quantity });
    }
    setCart(next);
    setLastAddedId(id);
    if (!cart.length) setCartRevision(catalog.revision);
    setCartNotice(null);
    setUndoState(null);
    setQuoteReview(null);
    setQuoteFailure(null);
    setProduct(null);
    setEditingLineId(null);
  }

  function chooseProduct(item: Product) {
    const variant = defaultVariant(item, channel);
    if (item.variants.length === 1 && !item.hasAddons && variant) {
      applySelection({ product: item, variant, addons: [] });
    } else {
      setEditingLineId(null);
      setProduct(item);
    }
  }

  function removeWithUndo(next: CartLine[]) {
    if (next.length === cart.length) return;
    setUndoState({
      previous: cart,
      revision: cartRevision,
      channel,
      expiresAt: Date.now() + 5000,
    });
    setCart(next);
    setLastAddedId(null);
    setQuoteReview(null);
    setQuoteFailure(null);
    setCartNotice(null);
  }

  function changeQuantity(id: string, delta: number) {
    if (staleCart) return;
    const line = cart.find((item) => item.id === id);
    if (!line) return;
    if (line.quantity + delta <= 0) {
      removeWithUndo(cart.filter((item) => item.id !== id));
      return;
    }
    if (line.quantity + delta > MAX_LINE_QUANTITY) {
      setCartNotice("الحد الأقصى 99 وحدة لكل صنف.");
      return;
    }
    setCart(cart.map((item) => item.id === id
      ? { ...item, quantity: item.quantity + delta } : item));
    setUndoState(null);
    setCartNotice(null);
    setQuoteReview(null);
    setQuoteFailure(null);
  }

  function undoRemoval() {
    if (!undoState || Date.now() > undoState.expiresAt
      || undoState.revision !== cartRevision || undoState.channel !== channel) return;
    setCart(undoState.previous);
    setLastAddedId(null);
    setUndoState(null);
    setQuoteReview(null);
    setQuoteFailure(null);
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
          {channels.length > 3 ? (
            <>
              <span role="status" title={channels.find((item) => item.id === channel)?.label ?? channel}
                className="flex min-h-12 max-w-[13vw] shrink-0 items-center truncate rounded-lg border-2 border-primary bg-secondary px-3 text-sm font-bold"
              >
                {channels.find((item) => item.id === channel)?.label ?? channel}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="min-h-12 shrink-0 px-2 text-sm" disabled={staleCart}>
                    قنوات أخرى
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-48 text-right">
                  {channels.map((option) => (
                    <DropdownMenuItem key={option.id} disabled={option.id === channel}
                      onSelect={() => chooseChannel(option.id)} className="min-h-12">
                      {option.label}{option.id === channel ? " ✓" : ""}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : channels.map((option) => (
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
                className={"min-h-12 shrink-0 px-2 text-sm " +
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
                  <Button size="sm" variant="outline" onClick={() => removeWithUndo(cart.filter((item) => item.id !== line.id))}>
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
              onClick={() => { setProduct(null); setPendingChannel(null); removeWithUndo([]); }}>
              إلغاء السلة
            </Button>
          </div>
        </section>
      )}
      <div className="grid min-h-0 flex-1 gap-1 overflow-hidden p-0 md:grid-cols-[minmax(0,1fr)_minmax(22.5rem,25rem)]">
        <section
          aria-label="الكتالوج التجريبي"
          className="flex min-h-0 min-w-0 flex-col gap-0 overflow-hidden rounded-2xl border bg-card p-1"
        >
          <div
            role="group"
            aria-label="تصفية التصنيفات"
            className="flex min-w-0 shrink-0 gap-2 overflow-x-auto"
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
            <span role="status" className="shrink-0 self-center px-2 text-sm text-muted-foreground">
              {visibleProducts.length} صنف
            </span>
          </div>
          <h2 className="sr-only">
            {searchTerm ? "نتائج البحث" :
              (categories.find((item) => item.id === category)?.label ?? "الأصناف")}
          </h2>
          <div className="min-h-0 overflow-auto overscroll-contain">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2.5">
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
                    className="h-auto min-h-24 min-w-0 flex-col gap-1.5 overflow-hidden px-2 py-3 text-center text-sm whitespace-normal"
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
                className="ms-auto min-h-12"
                onClick={() => removeWithUndo([])}
              >
                مسح السلة
              </Button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
            {undoState && !staleCart && (
              <div role="status" className="mb-2 flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-2 text-sm">
                <span>تم حذف صنف أو تفريغ السلة. التراجع متاح لمدة 5 ثوانٍ.</span>
                <Button type="button" variant="outline" aria-label="تراجع عن الحذف"
                  className="min-h-12 shrink-0" onClick={undoRemoval}>
                  <Undo2 aria-hidden="true" /> تراجع
                </Button>
              </div>
            )}
            {cartNotice && <p role="alert" className="mb-2 text-sm text-destructive">{cartNotice}</p>}
            {channel !== "restaurant" && (
              <div className="mb-3 grid gap-2 rounded-xl bg-muted/50 p-3">
                <label className="grid gap-1 text-sm">
                  رقم طلب التطبيق (اختياري)
                  <Input aria-label="الرقم الخارجي لطلب التطبيق" value={externalOrderNumber}
                    maxLength={60} placeholder="رقم الطلب"
                    className="h-12" onChange={(event) => setExternalOrderNumber(event.target.value)} />
                </label>
                <div role="group" aria-label="حالة دفع طلب التطبيق" className="flex gap-2">
                  <Button type="button"
                    variant={appPaymentStatus === "paid" ? "secondary" : "outline"}
                    aria-pressed={appPaymentStatus === "paid"} className="min-h-12 flex-1"
                    onClick={() => setAppPaymentStatus("paid")}>مدفوع</Button>
                  <Button type="button"
                    variant={appPaymentStatus === "cash" ? "secondary" : "outline"}
                    aria-pressed={appPaymentStatus === "cash"} className="min-h-12 flex-1"
                    onClick={() => setAppPaymentStatus("cash")}>كاش</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  معاينة فقط: لا يُسجّل بيع أو تحصيل، وكاش التطبيقات لا يُضاف لدرج المطعم.
                </p>
              </div>
            )}

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
                    <li key={line.id} className={"grid gap-2 rounded-lg py-3 transition-colors " + (lastAddedId === line.id ? "bg-primary/10" : "")}>
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
                          disabled={staleCart || line.quantity >= MAX_LINE_QUANTITY}
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
                          disabled={staleCart}
                          onClick={() => changeQuantity(line.id, -1)}
                        >
                          <Minus />
                        </Button>
                        <Button type="button" variant="outline" className="min-h-12 gap-1"
                          aria-label={`تعديل ${name}`} disabled={staleCart}
                          onClick={() => {
                            setEditingLineId(line.id);
                            setProduct(line.product);
                          }}>
                          <Pencil aria-hidden="true" className="size-4" /> تعديل
                        </Button>
                        <Button type="button" variant="ghost" className="size-12"
                          aria-label={`احذف ${name}`} disabled={staleCart}
                          onClick={() => removeWithUndo(cart.filter((item) => item.id !== line.id))}>
                          <Trash2 aria-hidden="true" className="size-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
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
          </div>
          <div className="grid shrink-0 gap-2 border-t bg-card pt-3">
            <div className="flex justify-between gap-2 text-sm tabular-nums">
              <span>المجموع</span>
              <span>{total === null ? "غير متاح" : formatPreviewAmount(total)}</span>
            </div>
            <div className="flex justify-between gap-2 text-sm text-muted-foreground">
              <span>الخصم</span><span>غير محسوب</span>
            </div>
            <div className="flex justify-between gap-2 text-sm text-muted-foreground">
              <span>الضريبة</span><span>غير محسوبة</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t pt-2"
              aria-live="polite">
              <span className="text-base font-bold">الإجمالي التجريبي</span>
              <strong className="text-[28px] leading-none font-bold tabular-nums">
                {total === null ? "غير متاح" : formatPreviewAmount(total)}
              </strong>
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
            <Button type="button" disabled className="min-h-14 w-full text-base">
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
          key={editingLineId ?? product.id}
          initial={cart.find((line) => line.id === editingLineId)}
          onClose={() => { setProduct(null); setEditingLineId(null); }}
          onAdd={(selection, quantity) => applySelection(selection, quantity, editingLineId)}
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
                  setUndoState(null);
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
