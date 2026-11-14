import type { CSSProperties } from "react";
import type { PublishedPosCatalog } from "./catalogApi";
import { channels as fallbackChannels } from "./previewCatalog";

// Deep, white-text shades maintain WCAG AA contrast and remain stable by channel id.
export const CHANNEL_PALETTE = [
  "#1D4ED8", "#0F766E", "#6D28D9", "#9A3412", "#9F1239", "#334155",
] as const;
export const LAST_CHANNEL_KEY = "basicdiet:pos:last-sale-channel:v1";

export function channelAccentStyle(channelId: string): CSSProperties | undefined {
  if (channelId === "restaurant") return undefined; // Tailwind primary in the caller
  let hash = 2166136261;
  for (let i = 0; i < channelId.length; i++) {
    hash ^= channelId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const color = CHANNEL_PALETTE[(hash >>> 0) % CHANNEL_PALETTE.length];
  return { backgroundColor: color, color: "#FFFFFF", borderColor: color };
}

export function visibleSaleChannels(catalog: PublishedPosCatalog) {
  const configured = catalog.channels ?? fallbackChannels;
  const restaurant = configured.find((entry) => entry.id === "restaurant")
    ?? { id: "restaurant", label: "المطعم" };
  return [restaurant, ...configured.filter((entry) => entry.id !== "restaurant"
    && catalog.products.some((product) => product.active !== false
      && product.variants.some((variant) => variant.prices[entry.id] != null)))];
}

export function readLastPosChannel() {
  if (typeof window === "undefined") return "restaurant";
  try {
    return window.localStorage.getItem(LAST_CHANNEL_KEY) || "restaurant";
  } catch {
    return "restaurant";
  }
}

export function rememberPosChannel(channelId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_CHANNEL_KEY, channelId);
  } catch {
    // Storage can be blocked; channel selection still works for this sale.
  }
}

// Use the published catalog's label; fallbacks support archived invoices.
export const POS_CHANNEL_FALLBACK_LABELS: Record<string, string> = {
  restaurant: "المطعم", hungerstation: "هنجرستيشن", keeta: "كيتا", jahez: "جاهز",
};
export function posChannelLabel(channelId: string, channels?: readonly { id: string; label: string }[]): string {
  const published = channels?.find((entry) => entry.id === channelId)?.label?.trim();
  return published || POS_CHANNEL_FALLBACK_LABELS[channelId] || channelId;
}
