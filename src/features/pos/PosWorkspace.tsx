import { useState } from "react";
import { ArrowRight, Minus, Plus, Search, ShoppingBasket } from "lucide-react";
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
import {
  categories,
  channels,
  formatPreviewAmount,
  previewAddons,
  previewProducts,
  previewUnitPrice,
  type Addon,
  type Category,
  type Channel,
  type Product,
  type Variant,
} from "./previewCatalog";

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
  onClose,
  onAdd,
}: {
  product: Product;
  channel: Channel;
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
              disabled={option.prices[channel] === null}
              className="h-auto min-h-14 flex-col gap-1 py-2 whitespace-normal"
              onClick={() => setVariant(option)}
            >
              {option.label}
              <span className="text-xs">
                {option.prices[channel] === null
                  ? "غير مسعّر"
                  : formatPreviewAmount(option.prices[channel])}
              </span>
            </Button>
          ))}
        </div>
        {product.hasAddons && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 font-semibold">الإضافات الاختيارية</legend>
            {previewAddons.map((addon) => {
              const price = addon.prices[channel];
              const selected = addons.includes(addon);
              return (
                <Button
                  key={addon.id}
                  type="button"
                  variant={selected ? "secondary" : "outline"}
                  aria-pressed={selected}
                  disabled={price === null}
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
                    {price === null ? "غير مسعّر" : formatPreviewAmount(price)}
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

export function PosWorkspace() {
  const [channel, setChannel] = useState<Channel>("restaurant");
  const [pendingChannel, setPendingChannel] = useState<Channel | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);

  const total = cartTotal(cart, channel);
  const nextTotal = pendingChannel ? cartTotal(cart, pendingChannel) : null;
  const searchTerm = search.trim();
  const visibleProducts = searchTerm
    ? previewProducts.filter((item) => item.name.includes(searchTerm))
    : previewProducts.filter((item) => item.category === category);

  function chooseChannel(next: Channel) {
    if (next === channel) return;
    if (cart.length) setPendingChannel(next);
    else setChannel(next);
  }

  function addToCart(selection: Selection) {
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
      variant.prices[channel] !== null
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
      dir="rtl"
      className="flex min-w-0 flex-col gap-4 px-3 sm:px-4 lg:h-[calc(100dvh-var(--header-height)-4rem)] lg:min-h-[29rem] lg:px-6"
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">نقطة البيع</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            معاينة تجريبية للأصناف والأسعار والسلة
          </p>
        </div>
        <div
          role="group"
          aria-label="قناة البيع"
          className="flex flex-wrap gap-2"
        >
          {channels.map((option) => (
            <Button
              key={option.id}
              type="button"
              variant={channel === option.id ? "default" : "outline"}
              aria-pressed={channel === option.id}
              className="min-h-12 px-3"
              onClick={() => chooseChannel(option.id)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </header>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,21rem)]">
        <section
          aria-label="الكتالوج التجريبي"
          className="flex min-h-0 min-w-0 flex-col gap-4 rounded-2xl border bg-card p-4"
        >
          <div className="relative shrink-0">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute start-3 top-3.5 size-5 text-muted-foreground"
            />
            <Input
              type="search"
              aria-label="ابحث عن صنف"
              placeholder="ابحث عن صنف"
              className="h-12 ps-10"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-2">
            {(category || searchTerm) && (
              <Button
                type="button"
                variant="outline"
                className="min-h-12"
                onClick={() => {
                  setCategory(null);
                  setSearch("");
                }}
              >
                <ArrowRight aria-hidden="true" /> التصنيفات
              </Button>
            )}
            <h2 className="font-bold">
              {searchTerm
                ? "نتائج البحث"
                : (categories.find((item) => item.id === category)?.label ??
                  "اختر تصنيفًا")}
            </h2>
          </div>
          <div className="min-h-0 overflow-auto overscroll-contain">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {category || searchTerm
                ? visibleProducts.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="outline"
                      className="h-auto min-h-20 px-2 text-center text-sm whitespace-normal"
                      onClick={() => chooseProduct(item)}
                    >
                      {item.name}
                    </Button>
                  ))
                : categories.map((item) => (
                    <Button
                      key={item.id}
                      type="button"
                      variant="secondary"
                      className="h-auto min-h-20 text-base font-semibold whitespace-normal"
                      onClick={() => setCategory(item.id)}
                    >
                      {item.label}
                    </Button>
                  ))}
            </div>
            {(category || searchTerm) && visibleProducts.length === 0 && (
              <p role="status" className="py-6 text-sm text-muted-foreground">
                لا توجد أصناف مطابقة.
              </p>
            )}
          </div>
        </section>

        <aside
          aria-label="السلة التجريبية"
          className="flex min-h-0 min-w-0 flex-col gap-3 rounded-2xl border bg-card p-4"
        >
          <div className="flex shrink-0 items-center gap-2">
            <ShoppingBasket
              aria-hidden="true"
              className="size-5 text-primary"
            />
            <h2 className="font-bold">السلة التجريبية</h2>
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
            <Button type="button" disabled className="min-h-12">
              الدفع غير متاح في المعاينة
            </Button>
          </div>
        </aside>
      </div>
      {product && (
        <ProductOptions
          product={product}
          channel={channel}
          onClose={() => setProduct(null)}
          onAdd={addToCart}
        />
      )}
      <Dialog
        open={pendingChannel !== null}
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
    </div>
  );
}
