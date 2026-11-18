import assert from "node:assert/strict";
import { test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OperationsDeliveryAddonBadges, OperationsDeliveryPreparationDetails } from "../src/components/pages/operations-board/OperationsDeliveryPreparation";
import { buildKitchenV2Presentation } from "../src/lib/operationsKitchenV2Presentation";
import type { UnifiedQueueItem } from "../src/types/dashboardOpsTypes";

function operation(withDailyAddon = true): UnifiedQueueItem {
  return {
    id: "delivery-1", entityId: "day-1", entityType: "subscription_day",
    source: "subscription", type: "subscription", mode: "delivery",
    reference: "SUB-001", status: "in_preparation", statusLabel: "قيد التحضير",
    ui: {}, customer: { name: "عميل" }, fulfillment: { mode: "delivery" },
    addonPlans: [{ addonPlanId: "plan-1", labelI18n: { ar: "عصائر", en: "Juices" }, quantityPerDay: 1 }],
    kitchen: {
      version: "v2", mealCount: 1, warnings: [],
      cards: [{
        type: "standard_meal", titleI18n: { ar: "وجبة دجاج مشروم" },
        components: {
          protein: { nameI18n: { ar: "دجاج مشروم" }, grams: 150 },
          carbs: [{ nameI18n: { ar: "رز صيني" }, grams: 200 }],
        },
      }],
      addonGroups: withDailyAddon ? [{
        labelI18n: { ar: "عصائر" },
        items: [{ nameI18n: { ar: "عصير برتقال" }, quantity: 2 }],
      }] : [],
    },
    allowedActions: [], timestamps: { createdAt: null, updatedAt: null },
    context: { date: "2026-11-18" },
  };
}

test("delivery card shows purchased plan separately from actual daily addons", () => {
  const item = operation();
  const kitchen = buildKitchenV2Presentation(item);
  const header = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <OperationsDeliveryAddonBadges item={item} presentation={kitchen} />
    </QueryClientProvider>
  );
  const details = renderToStaticMarkup(<OperationsDeliveryPreparationDetails presentation={kitchen} />);

  assert.match(header, /مشترك في عصائر/);
  assert.match(header, /إضافات مطلوب تجهيزها اليوم/);
  assert.match(details, /وجبة دجاج مشروم/);
  assert.match(details, /رز صيني/);
  assert.match(details, /150 جم/);
  assert.match(details, /عصير برتقال ×2/);
});

test("paid plan without a daily selection never becomes a preparation item", () => {
  const item = operation(false);
  const kitchen = buildKitchenV2Presentation(item);
  const header = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <OperationsDeliveryAddonBadges item={item} presentation={kitchen} />
    </QueryClientProvider>
  );
  const details = renderToStaticMarkup(<OperationsDeliveryPreparationDetails presentation={kitchen} />);

  assert.match(header, /مشترك في عصائر/);
  assert.match(header, /الاشتراك وحده ليس طلب تجهيز/);
  assert.doesNotMatch(details, /عصير برتقال/);
});

test("without a valid kitchen contract do not invent meals from entitlement", () => {
  const item = { ...operation(false), kitchen: null };
  const p = buildKitchenV2Presentation(item);
  const details = renderToStaticMarkup(<OperationsDeliveryPreparationDetails presentation={p} />);
  assert.match(details, /إصدار بيانات المطبخ غير مدعوم/);
  assert.doesNotMatch(details, /وجبة دجاج مشروم/);
});

test("available addon with a single valid product shows a staff preparation button", () => {
  const item = operation(false);
  item.addonPlans = [{
    addonPlanId: "plan-1", balanceBucketId: "bucket-1",
    labelI18n: { ar: "سناك" }, selectedTodayQty: 0,
    remainingQty: 7, reservedQty: 0, consumedQty: 0,
    canPrepare: true, products: [{ productId: "product-1", name: "بار سناك" }],
  }];
  const html = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <OperationsDeliveryAddonBadges item={item} presentation={buildKitchenV2Presentation(item)} />
    </QueryClientProvider>
  );
  assert.match(html, /تجهيز حصة من سناك/);
  assert.match(html, /7 متاح/);
  assert.match(html, /حجز فقط/);
});

test("customer selected the addon already: no staff preparation button", () => {
  const item = operation();
  item.addonPlans = [{
    addonPlanId: "plan-1", balanceBucketId: "bucket-1",
    labelI18n: { ar: "سناك" }, selectedTodayQty: 1,
    remainingQty: 6, reservedQty: 1, consumedQty: 0,
    canPrepare: false, blockReason: "ALREADY_SELECTED_FOR_TODAY",
  }];
  const html = renderToStaticMarkup(
    <QueryClientProvider client={new QueryClient()}>
      <OperationsDeliveryAddonBadges item={item} presentation={buildKitchenV2Presentation(item)} />
    </QueryClientProvider>
  );
  assert.doesNotMatch(html, /تجهيز حصة من سناك/);
  assert.match(html, /تم اختيار 1 لليوم/);
});
