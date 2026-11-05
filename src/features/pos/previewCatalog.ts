export const channels = [
  { id: "restaurant", label: "المطعم" },
  { id: "hungerstation", label: "HungerStation" },
  { id: "keeta", label: "Keeta" },
] as const;

export type Channel = string;
export type PosChannel = { id: string; label: string };

export const categories = [
  { id: "meals", label: "الوجبات" },
  { id: "salads", label: "السلطات" },
  { id: "desserts", label: "الحلويات" },
  { id: "drinks", label: "المشروبات" },
  { id: "addons", label: "الإضافات" },
] as const;

export type Category = string;
export type Prices = Record<Channel, number | null>;
export type Variant = { id: string; label: string; prices: Prices };
export type Addon = { id: string; name: string; prices: Prices };
export type Product = {
  id: string;
  name: string;
  category: Category;
  variants: Variant[];
  hasAddons?: boolean;
  active?: boolean;
};

export type Catalog = {
  channels?: PosChannel[];
  categories: { id: string; label: string }[];
  products: Product[];
};

function prices(
  restaurant: number,
  hungerstation: number,
  keeta: number | null
): Prices {
  return { restaurant, hungerstation, keeta };
}

export const previewAddons: Addon[] = [
  {
    id: "extra-chicken",
    name: "زيادة دجاج 50 جم",
    prices: prices(500, 600, 600),
  },
  { id: "extra-beef", name: "زيادة لحم 50 جم", prices: prices(600, 700, 700) },
];

// Fixture prices in halalas for the preview, separate from the app catalog.
export const previewProducts: Product[] = [
  {
    id: "butter",
    name: "دجاج بالزبدة",
    category: "meals",
    hasAddons: true,
    variants: [
      { id: "100", label: "100 جم", prices: prices(2400, 2800, 2700) },
      { id: "150", label: "150 جم", prices: prices(3200, 3600, 3500) },
      { id: "200", label: "200 جم", prices: prices(3900, 4400, 4200) },
    ],
  },
  {
    id: "tikka",
    name: "دجاج تكا",
    category: "meals",
    hasAddons: true,
    variants: [
      { id: "100", label: "100 جم", prices: prices(2400, 2800, 2700) },
      { id: "150", label: "150 جم", prices: prices(3200, 3700, 3500) },
      { id: "200", label: "200 جم", prices: prices(3900, 4500, null) },
    ],
  },
  {
    id: "salad",
    name: "سلطة بيسك",
    category: "salads",
    hasAddons: true,
    variants: [
      { id: "portion", label: "حصة", prices: prices(2900, 3400, 3200) },
    ],
  },
  {
    id: "brownie",
    name: "براونيز",
    category: "desserts",
    variants: [
      { id: "portion", label: "قطعة", prices: prices(1400, 1700, 1600) },
    ],
  },
  {
    id: "water",
    name: "مياه",
    category: "drinks",
    variants: [{ id: "bottle", label: "عبوة", prices: prices(300, 400, 400) }],
  },
  ...previewAddons.map(
    ({ id, name, prices }): Product => ({
      id,
      name,
      category: "addons",
      variants: [{ id: "portion", label: "حصة", prices }],
    })
  ),
];

export function previewUnitPrice(
  variant: Variant,
  addons: Addon[],
  channel: Channel
) {
  const base = variant.prices[channel];
  const extras = addons.map((addon) => addon.prices[channel]);
  if (base == null || extras.some((amount) => amount == null)) return null;
  return extras.reduce<number>((total, amount) => total + (amount ?? 0), base);
}

const formatter = new Intl.NumberFormat("ar-SA-u-nu-latn", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPreviewAmount(halalas: number) {
  return `${formatter.format(halalas / 100)} ر.س`;
}
