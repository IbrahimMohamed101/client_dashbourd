import { useEffect, useState, type ReactNode } from "react";
import { Check, ChevronDown, Minus, Plus, Search, ShoppingBasket, Pencil, Trash2, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogClose,
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
import { validatePosCheckoutReview } from "./checkoutReview";
import { PosFinancialCheckout } from "./PosFinancialCheckout";
import { PosInvoiceReceipt } from "./PosInvoiceReceipt";
import { PosDiscountEditor } from "./PosDiscountEditor";
import { toPosDiscount, type PosDiscountInput } from "./posDiscountMath";
import { fetchFinancialQuote, type PosFinanceQuote, type PosFinanceQuoteRequest, type PosInvoice } from "./financialApi";
import { validateFinancialQuote } from "./financialReview";
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
  // Manager-published POS choice wins, when priceable for the chosen channel.
  if (product.defaultVariantId) {
    return priced.find((item) => item.id === product.defaultVariantId) ?? priced[0];
  }
  // 150g fallback is for meals only, never beverages such as 150ml.
  if (product.category === "meals") {
    return priced.find((item) => item.id === "150" || /(^|\D)150\s*(?:جم|g(?:ram)?s?)(?:$|\b)/i.test(item.label))
      ?? priced[0];
  }
  return priced[0];
}


function ChannelSwitchMenu({
  channels, selected, onSelect, disabled, compact,
}: {
  channels: readonly { id: string; label: string }[];
  selected: string;
  onSelect: (channel: string) => void;
  disabled: boolean;
  compact: boolean;
}) {
  const selectedLabel = channels.find((entry) => entry.id === selected)?.label ?? selected;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" disabled={disabled}
          aria-label={compact ? `تغيير قناة البيع: ${selectedLabel}` : "قنوات أخرى"}
          className="flex min-h-12 max-w-full min-w-0 gap-2 border-2 border-primary px-3 text-sm">
          <span className="min-w-0 truncate font-semibold" title={selectedLabel}>
            {selectedLabel}
          </span>
          {!compact && <span className="hidden shrink-0 2xl:inline">قنوات أخرى</span>}
          <ChevronDown aria-hidden="true" className="size-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52 text-right">
        {channels.map((entry) => (
          <DropdownMenuItem key={entry.id} className="min-h-12 gap-2"
            disabled={entry.id === selected} onSelect={() => onSelect(entry.id)}>
            {entry.id === selected && <Check aria-hidden="true" className="size-4 text-primary" />}
            {entry.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
    initial?.addons.map((old): Addon | null => {
      const found = availableAddons.find((item) => item.id === old.id);
      return found ? { ...found, quantity: old.quantity ?? 1 } : null;
    }).filter((item): item is Addon => item != null) ?? []
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
      <DialogContent dir="rtl" className="text-right" showCloseButton={false}>
        <DialogClose asChild>
          <Button type="button" variant="ghost" size="icon-sm"
            className="absolute top-3 left-3 sm:top-4 sm:left-4" aria-label="إغلاق النافذة">
            <X aria-hidden="true" />
          </Button>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>
            {initial ? "عدّل الحجم والإضافات والكمية ثم احفظ السطر." : product.defaultVariantId ? "الحجم الافتراضي من إعدادات المنيو. راجع الإضافات والكمية." : product.category === "meals" ? "حجم 150 جم افتراضي عند توفر سعره. اختر الإضافات والكمية." : "اختر الحجم والإضافات والكمية."}
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
              const chosen = addons.find((item) => item.id === addon.id);
              const selected = Boolean(chosen);
              const addonQuantity = chosen?.quantity ?? 1;
              return (
                <div key={addon.id} className="rounded-lg border p-1">
                  <Button type="button" variant={selected ? "secondary" : "outline"}
                    aria-pressed={selected}
                    disabled={price == null || (!selected && addons.length >= 10)}
                    className={"min-h-12 w-full justify-between border-2 " + (
                      selected ? "border-primary bg-primary/10 font-semibold text-foreground"
                        : "border-transparent"
                    )}
                    onClick={() => setAddons(current =>
                      current.some(item => item.id === addon.id)
                        ? current.filter(item => item.id !== addon.id)
                        : [...current, { ...addon, quantity: 1 }])}>
                    <span className="flex min-w-0 items-center gap-2">
                      {selected && <Check aria-hidden="true" className="size-5 shrink-0 text-primary" />}
                      {addon.name}
                    </span>
                    <span>{price == null ? "غير مسعّر" : formatPreviewAmount(price)}</span>
                  </Button>
                  {selected && (
                    <div role="group" aria-label={"تكرار " + addon.name}
                      className="flex items-center justify-end gap-2 p-1">
                      <span className="ms-auto text-xs text-muted-foreground">عدد الإضافة لكل وجبة (1–10)</span>
                      <Button type="button" variant="outline" className="size-12"
                        aria-label="قلّل عدد الإضافة" disabled={addonQuantity <= 1}
                        onClick={() => setAddons(current => current.map(item =>
                          item.id === addon.id ? { ...item, quantity: Math.max(1, (item.quantity ?? 1) - 1) } : item))}>
                        <Minus aria-hidden="true" />
                      </Button>
                      <output aria-live="polite" className="min-w-8 text-center tabular-nums">
                        {addonQuantity}
                      </output>
                      <Button type="button" variant="outline" className="size-12"
                        aria-label="زِد عدد الإضافة" disabled={addonQuantity >= 10}
                        onClick={() => setAddons(current => current.map(item =>
                          item.id === addon.id ? { ...item, quantity: Math.min(10, (item.quantity ?? 1) + 1) } : item))}>
                        <Plus aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
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
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [lineDiscountInputs, setLineDiscountInputs] = useState<Record<string, PosDiscountInput>>({});
  const [invoiceDiscountInput, setInvoiceDiscountInput] = useState<PosDiscountInput>(null);
  const [financeReview, setFinanceReview] = useState<{ key: string; data: PosFinanceQuote } | null>(null);
  const [financeFailure, setFinanceFailure] = useState<{ key: string; message: string } | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [issuedInvoice, setIssuedInvoice] = useState<PosInvoice | null>(null);

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
      ...(line.addons.some(addon => (addon.quantity ?? 1) > 1)
        ? { addons: line.addons.map(addon => ({ productId: addon.id, quantity: addon.quantity ?? 1 })) }
        : { addonIds: line.addons.map(addon => addon.id) }),
    })),
  };
  const quoteKey = JSON.stringify(quoteRequest);
  const currentQuote = quoteReview?.key === quoteKey ? quoteReview.data : null;
  const currentQuoteError = quoteFailure?.key === quoteKey ? quoteFailure.message : null;
  const quoteValidationError = currentQuote ? validatePosCheckoutReview(quoteRequest, currentQuote) : null;
  const verifiedQuote = !staleCart && !quoteValidationError ? currentQuote : null;
  const invoiceDiscount = toPosDiscount(invoiceDiscountInput);
  const financeItems = cart.map((line) => ({
    productId: line.product.id, variantId: line.variant.id, quantity: line.quantity,
    discount: toPosDiscount(lineDiscountInputs[line.id] ?? null),
    addons: line.addons.map(addon => ({
      productId: addon.id, quantity: addon.quantity ?? 1,
      discount: toPosDiscount(lineDiscountInputs[line.id + ":" + addon.id] ?? null),
    })),
  }));
  const invalidDiscount = invoiceDiscount === undefined || financeItems.some(line =>
    line.discount === undefined || line.addons.some(addon => addon.discount === undefined));
  const financeRequest: PosFinanceQuoteRequest = {
    revision: catalog.revision, channel,
    invoiceDiscount: invoiceDiscount ?? null,
    items: financeItems.map(line => ({
      ...line, discount: line.discount ?? null,
      addons: line.addons.map(addon => ({ ...addon, discount: addon.discount ?? null })),
    })),
  };
  const financeKey = JSON.stringify(financeRequest);
  const currentFinanceQuote = financeReview?.key === financeKey ? financeReview.data : null;
  const currentFinanceError = financeFailure?.key === financeKey ? financeFailure.message : null;
  const financeValidationError = currentFinanceQuote
    ? validateFinancialQuote(financeRequest, currentFinanceQuote) : null;
  const verifiedFinanceQuote = !staleCart && !invalidDiscount && !financeValidationError
    ? currentFinanceQuote : null;
  // All pricing uses the backend's immutable published POS catalog. Discard
  // out-of-order responses on every cart/discount/channel/revision change.
  useEffect(() => {
    if (staleCart || invalidDiscount || !cart.length) {
      setFinanceReview(null);
      setFinanceFailure(null);
      setFinanceLoading(false);
      return;
    }
    const key = financeKey;
    let active = true;
    setFinanceLoading(true);
    const timer = window.setTimeout(() => {
      void fetchFinancialQuote(JSON.parse(key) as PosFinanceQuoteRequest)
        .then(data => {
          if (!active) return;
          setFinanceReview({ key, data });
          setFinanceFailure(null);
        }).catch(cause => {
          if (!active) return;
          const error = parseApiError(cause);
          setFinanceReview(null);
          setFinanceFailure({
            key, message: error.message ?? "تعذر احتساب الفاتورة من سيرفر Staging.",
          });
        }).finally(() => { if (active) setFinanceLoading(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [financeKey, staleCart, invalidDiscount, cart.length]);
  // App-channel price previews should update as soon as the cashier changes
  // the cart/channel. Requests are keyed to the exact snapshot: a late reply
  // cannot overwrite the current basket's price, and server money remains
  // authoritative in the separate financial quote above.
  useEffect(() => {
    if (channel === "restaurant" || staleCart || !cart.length || total === null) {
      setQuoteLoading(false);
      return;
    }
    const key = quoteKey;
    let active = true;
    setQuoteLoading(true);
    const timer = window.setTimeout(() => {
      void fetchPosQuote(JSON.parse(key) as typeof quoteRequest)
        .then(data => {
          if (!active) return;
          const error = validatePosCheckoutReview(JSON.parse(key) as typeof quoteRequest, data);
          if (error) {
            setQuoteReview(null);
            setQuoteFailure({ key, message: error });
            return;
          }
          setQuoteReview({ key, data });
          setQuoteFailure(null);
        })
        .catch(cause => {
          if (!active) return;
          const error = parseApiError(cause);
          setQuoteReview(null);
          setQuoteFailure({ key, message: error.code === "POS_CATALOG_CONFLICT"
            ? "تم نشر منيو أحدث. حدّث الصفحة وراجع الأسعار قبل البيع."
            : error.message || "تعذر تسعير التطبيق من سيرفر Staging." });
        })
        .finally(() => { if (active) setQuoteLoading(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [channel, quoteKey, staleCart, cart.length, total]);
  // An earlier open dialog may not silently reappear after a re-quote.
  useEffect(() => {
    if (!verifiedFinanceQuote) setCheckoutOpen(false);
  }, [verifiedFinanceQuote]);

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
          return updated && updated.active !== false && updated.variants.length === 1
            ? { id: updated.id, name: updated.name, prices: updated.variants[0].prices,
                quantity: addon.quantity ?? 1 }
            : null;
        });
        const valid = Boolean(
          revisedProduct && revisedProduct.active !== false && revisedVariant && revisedVariant.prices[channel] != null
          && (revisedProduct.category !== "addons" || revisedProduct.sellStandalone === true)
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
    item.active !== false && (item.category !== "addons" || item.sellStandalone === true)
  ).filter((item) =>
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
          className="flex min-w-0 max-w-[40vw] shrink-0 items-center whitespace-nowrap xl:max-w-[30vw]">
          {channels.length > 3 ? (
            <ChannelSwitchMenu channels={channels} selected={channel}
              onSelect={chooseChannel} disabled={staleCart} compact={false} />
          ) : (
            <>
              <div className="min-w-0 xl:hidden">
                <ChannelSwitchMenu channels={channels} selected={channel}
                  onSelect={chooseChannel} disabled={staleCart} compact />
              </div>
              <div className="hidden min-w-0 items-center gap-2 xl:flex">
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
            </>
          )}
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
                    aria-pressed={appPaymentStatus === "paid"}
                    className={"min-h-12 flex-1 gap-2 border-2 " + (
                      appPaymentStatus === "paid"
                        ? "border-primary bg-primary/10 font-bold text-foreground"
                        : "border-border"
                    )}
                    onClick={() => setAppPaymentStatus("paid")}>
                    {appPaymentStatus === "paid" && <Check aria-hidden="true" className="size-5 text-primary" />}
                    مدفوع
                  </Button>
                  <Button type="button"
                    variant={appPaymentStatus === "cash" ? "secondary" : "outline"}
                    aria-pressed={appPaymentStatus === "cash"}
                    className={"min-h-12 flex-1 gap-2 border-2 " + (
                      appPaymentStatus === "cash"
                        ? "border-primary bg-primary/10 font-bold text-foreground"
                        : "border-border"
                    )}
                    onClick={() => setAppPaymentStatus("cash")}>
                    {appPaymentStatus === "cash" && <Check aria-hidden="true" className="size-5 text-primary" />}
                    كاش
                  </Button>
                </div>
                <p role="status" className="text-sm font-semibold">
                  الحالة المختارة: {appPaymentStatus === "paid" ? "مدفوع" : "كاش"}
                </p>
                <p className="text-xs text-muted-foreground">
                  يُسجَّل البيع التجريبي كمستحق على التطبيق، وكاش التطبيقات لا يُضاف لدرج المطعم.
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
                          {line.addons.map((addon) => (addon.quantity ?? 1) + "× " + addon.name).join("، ")}
                        </p>
                      )}
                      {!staleCart && (
                        <div className="grid gap-1">
                          <PosDiscountEditor label={"خصم الصنف " + name}
                            value={lineDiscountInputs[line.id] ?? null}
                            onChange={value => setLineDiscountInputs(current => ({
                              ...current, [line.id]: value,
                            }))} />
                          {line.addons.map(addon => (
                            <PosDiscountEditor key={addon.id}
                              label={"خصم إضافة " + addon.name}
                              value={lineDiscountInputs[line.id + ":" + addon.id] ?? null}
                              onChange={value => setLineDiscountInputs(current => ({
                                ...current, [line.id + ":" + addon.id]: value,
                              }))} />
                          ))}
                        </div>
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
            {!staleCart && cart.length > 0 && (
              <PosDiscountEditor label="خصم الفاتورة" value={invoiceDiscountInput}
                onChange={setInvoiceDiscountInput} />
            )}
            {invalidDiscount && <p role="alert" className="text-xs text-destructive">
              صحّح قيمة الخصم قبل إصدار فاتورة.
            </p>}
            {currentFinanceError && <p role="alert" className="text-xs text-destructive">
              {currentFinanceError}
            </p>}
            {financeValidationError && <p role="alert" className="text-xs text-destructive">
              {financeValidationError}
            </p>}
            {verifiedFinanceQuote && (
              <section aria-label="تسعير الفاتورة النهائي" className="rounded-xl border bg-muted/50 p-3 text-sm">
                <h3 className="font-bold">تسعير سيرفر Staging · المنيو {verifiedFinanceQuote.revision}</h3>
                <div className="mt-1 flex justify-between gap-2">
                  <span>الخصم</span><strong>{formatPreviewAmount(verifiedFinanceQuote.totals.totalDiscountHalalas)}</strong>
                </div>
                <div className="mt-1 flex justify-between gap-2">
                  <span>الضريبة المضمنة 15%</span><strong>{formatPreviewAmount(verifiedFinanceQuote.totals.vatHalalas)}</strong>
                </div>
                <div className="mt-1 flex justify-between gap-2 font-bold">
                  <span>المستحق</span><strong>{formatPreviewAmount(verifiedFinanceQuote.totals.grossHalalas)}</strong>
                </div>
              </section>
            )}
            {(currentQuoteError || quoteValidationError) && (
              <p role="alert" className="text-xs text-destructive">
                {currentQuoteError || quoteValidationError}
              </p>
            )}
            {verifiedQuote && (
              <section aria-label="نتيجة تسعير السيرفر" className="rounded-xl border bg-muted/50 p-3 text-sm">
                <h3 className="font-bold">مراجعة السعر · نسخة {verifiedQuote.revision}</h3>
                <div className="mt-2 flex justify-between gap-2">
                  <span>الإجمالي المبدئي</span>
                  <strong>{formatPreviewAmount(verifiedQuote.provisionalSubtotalHalalas)}</strong>
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
              <span>الخصم</span><span>{verifiedFinanceQuote
                ? formatPreviewAmount(verifiedFinanceQuote.totals.totalDiscountHalalas) : "بانتظار السيرفر"}</span>
            </div>
            <div className="flex justify-between gap-2 text-sm text-muted-foreground">
              <span>الضريبة</span><span>{verifiedFinanceQuote
                ? formatPreviewAmount(verifiedFinanceQuote.totals.vatHalalas) : "بانتظار السيرفر"}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t pt-2"
              aria-live="polite">
              <span className="text-base font-bold">المستحق من السيرفر</span>
              <strong className="text-[28px] leading-none font-bold tabular-nums">
                {verifiedFinanceQuote ? formatPreviewAmount(verifiedFinanceQuote.totals.grossHalalas) : "—"}
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
            <Button type="button" className="min-h-14 w-full text-base font-bold"
              disabled={!verifiedFinanceQuote || financeLoading || invalidDiscount || staleCart}
              onClick={() => setCheckoutOpen(true)}>
              مراجعة الطلب قبل الفاتورة
            </Button>
          </div>
        </aside>
      </div>
      {checkoutOpen && verifiedFinanceQuote && (
        <PosFinancialCheckout
          quote={verifiedFinanceQuote}
          request={financeRequest}
          channelName={channels.find(item => item.id === channel)?.label ?? channel}
          serviceMode={serviceMode}
          externalOrderNumber={externalOrderNumber}
          externalPaymentStatus={appPaymentStatus}
          operatorId={operatorId}
          onClose={() => setCheckoutOpen(false)}
          onSale={invoice => {
            setCheckoutOpen(false);
            setIssuedInvoice(invoice);
            setCart([]);
            setCartRevision(catalog.revision);
            setUndoState(null);
            setLastAddedId(null);
            setCartNotice(null);
            setLineDiscountInputs({});
            setInvoiceDiscountInput(null);
            setQuoteReview(null);
            setQuoteFailure(null);
            setFinanceReview(null);
            setFinanceFailure(null);
            setExternalOrderNumber("");
            setAppPaymentStatus("paid");
          }}
        />
      )}
      {issuedInvoice && <PosInvoiceReceipt invoice={issuedInvoice}
        onClose={() => setIssuedInvoice(null)} />}
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
