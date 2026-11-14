import type { PublishedPosCatalog } from "./catalogApi";
import type { Addon, Channel, Product, Variant } from "./previewCatalog";

export type PosSelection = { product: Product; variant: Variant; addons: Addon[] };
export type PosCartLine = PosSelection & { id: string; quantity: number };
export type ServiceMode = "restaurant" | "dine-in" | "takeaway" | "delivery";
export type PosCartDraft = {
  revision: number;
  channel: Channel;
  serviceMode: ServiceMode;
  lines: PosCartLine[];
};

const PREFIX = "basicdiet:pos:draft:v1:";
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
const MAX_BYTES = 150_000;
export const MAX_CART_LINES = 50;
export const MAX_LINE_QUANTITY = 99;

export function cartLineId(selection: PosSelection) {
  return [selection.product.id, selection.variant.id,
    ...selection.addons.map((addon) => addon.id + ((addon.quantity ?? 1) > 1 ? "@" + addon.quantity : "")).sort()].join("/");
}

function keyFor(operatorId?: string | null) {
  // No shared anonymous cart. Drafts are tied to the logged-in staff identity.
  return operatorId && /^[a-zA-Z0-9_-]{1,128}$/.test(operatorId)
    ? PREFIX + operatorId : null;
}

function validId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9-]{1,64}$/.test(value);
}
function validName(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 100;
}
function validPrices(value: unknown): value is Record<string, number | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length >= 1 && entries.length <= 30 && entries.every(([channel, price]) =>
    validId(channel) && (price === null ||
      (Number.isSafeInteger(price) && (price as number) >= 0 && (price as number) <= 10_000_000))
  );
}
function cleanLine(value: unknown): PosCartLine | null {
  if (!value || typeof value !== "object") return null;
  const line = value as Partial<PosCartLine>;
  const product = line.product;
  const variant = line.variant;
  if (!product || !variant || !validId(product.id) || !validId(variant.id)
    || !validName(product.name) || !validName(variant.label)
    || !validId(product.category) || !validPrices(variant.prices)
    || !Number.isSafeInteger(line.quantity) || !line.quantity
    || line.quantity < 1 || line.quantity > MAX_LINE_QUANTITY
    || !Array.isArray(line.addons) || line.addons.length > 10) return null;
  const addons: Addon[] = [];
  for (const addon of line.addons) {
    if (!addon || !validId(addon.id) || !validName(addon.name) || !validPrices(addon.prices)
      || (addon.quantity !== undefined && (!Number.isSafeInteger(addon.quantity)
        || addon.quantity < 1 || addon.quantity > 10))) return null;
    addons.push({ id: addon.id, name: addon.name, prices: addon.prices,
      ...(addon.quantity === undefined ? {} : { quantity: addon.quantity }) });
  }
  if (new Set(addons.map((item) => item.id)).size !== addons.length) return null;
  const selection: PosSelection = {
    product: {
      id: product.id, name: product.name, category: product.category,
      variants: [{ id: variant.id, label: variant.label, prices: variant.prices }],
      active: true,
      hasAddons: product.hasAddons === true,
      sellStandalone: product.sellStandalone === true,
      ...(Array.isArray(product.allowedAddonIds) && product.allowedAddonIds.every(validId)
        ? { allowedAddonIds: product.allowedAddonIds } : {}),
    },
    variant: { id: variant.id, label: variant.label, prices: variant.prices },
    addons,
  };
  if (typeof line.id !== "string" || cartLineId(selection) !== line.id) return null;
  return { ...selection, id: line.id, quantity: line.quantity };
}

function currentLine(line: PosCartLine, catalog: PublishedPosCatalog): PosCartLine | null {
  const product = catalog.products.find((item) => item.id === line.product.id && item.active !== false);
  const variant = product?.variants.find((item) => item.id === line.variant.id);
  if (!product || !variant
    || (product.category === "addons" && product.sellStandalone !== true)) return null;
  const addons = line.addons.map((old) => {
    const addon = catalog.products.find((item) => item.id === old.id && item.category === "addons" && item.active !== false);
    return addon && addon.variants.length === 1
      ? { id: addon.id, name: addon.name, prices: addon.variants[0].prices, quantity: old.quantity ?? 1 } : null;
  });
  if (addons.some((addon) => !addon)
    || (addons.length > 0 && !product.hasAddons)
    || addons.some((addon) => product.allowedAddonIds && !product.allowedAddonIds.includes(addon!.id))) {
    return null;
  }
  const selection: PosSelection = { product, variant, addons: addons as Addon[] };
  return { ...selection, id: cartLineId(selection), quantity: line.quantity };
}

/**
 * Session-only, operator-scoped draft. Values are UI hints, not server prices,
 * receipts, or customer data. Stale revisions require explicit review.
 */
export function readPosCartDraft(operatorId: string | null | undefined,
  catalog: PublishedPosCatalog): PosCartDraft | null {
  const key = keyFor(operatorId);
  if (!key || typeof window === "undefined") return null;
  try {
    const json = window.sessionStorage.getItem(key);
    if (!json || json.length > MAX_BYTES) return null;
    const parsed: unknown = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") return null;
    const raw = parsed as Record<string, unknown>;
    if (raw.version !== 1
      || !Number.isSafeInteger(raw.revision) || (raw.revision as number) < 1
      || !Number.isFinite(raw.savedAt) || typeof raw.savedAt !== "number"
      || raw.savedAt > Date.now() || Date.now() - raw.savedAt > MAX_AGE_MS
      || !validId(raw.channel)
      || !["restaurant", "dine-in", "takeaway", "delivery"].includes(String(raw.serviceMode))
      || !Array.isArray(raw.lines) || raw.lines.length < 1 || raw.lines.length > MAX_CART_LINES)
      return null;
    const lines = raw.lines.map(cleanLine);
    if (lines.some((line) => line === null)) return null;
    if (new Set(lines.map((line) => line!.id)).size !== lines.length) return null;
    const safeLines = lines as PosCartLine[];
    const revision = raw.revision as number;
    // Never trust cached client prices when the published version is identical.
    // A version difference intentionally keeps the old business snapshot so
    // the cashier can compare old/new before accepting the new revision.
    const current = revision === catalog.revision
      ? safeLines.map((line) => currentLine(line, catalog))
      : null;
    if (current && current.some((line) => line === null)) return null;
    return {
      revision,
      channel: raw.channel as string,
      serviceMode: raw.serviceMode as ServiceMode,
      lines: current ? current as PosCartLine[] : safeLines,
    };
  } catch {
    return null; // Corrupt or disabled sessionStorage must never break POS.
  }
}

export function writePosCartDraft(operatorId: string | null | undefined, draft: PosCartDraft) {
  const key = keyFor(operatorId);
  if (!key || typeof window === "undefined") return;
  try {
    if (!draft.lines.length) {
      window.sessionStorage.removeItem(key);
      return;
    }
    const payload = {
      version: 1, savedAt: Date.now(), revision: draft.revision,
      channel: draft.channel, serviceMode: draft.serviceMode,
      lines: draft.lines.map((line) => ({
        id: line.id, quantity: line.quantity,
        product: {
          id: line.product.id, name: line.product.name, category: line.product.category,
          hasAddons: line.product.hasAddons,
          sellStandalone: line.product.sellStandalone,
          allowedAddonIds: line.product.allowedAddonIds,
        },
        variant: {
          id: line.variant.id, label: line.variant.label, prices: line.variant.prices,
        },
        addons: line.addons.map(({ id, name, prices, quantity }) => ({ id, name, prices, quantity })),
      })),
    };
    const json = JSON.stringify(payload);
    if (json.length <= MAX_BYTES) window.sessionStorage.setItem(key, json);
  } catch {
    // Storage quota or browser privacy setting. In-memory cart still works.
  }
}
