# Dashboard Add-ons System — Changes Needed

> **Audit Date:** 2026-07-12
> **Backend API Base:** `https://basicdiet145-production-51e9.up.railway.app`

---

## Summary

The dashboard already has a **fully-implemented Addon Plans management page** (`/addons`). However, the
**Create Subscription form's Addons section is wired to the wrong data source and wrong concept**,
causing it to show nothing useful to the admin.

---

## Issue 1 — `AddonsSection.tsx` reads wrong query data (CRITICAL)

**File:** `src/components/pages/subscriptions/create/AddonsSection.tsx`

### Problem

The `AddonsSection` component calls `useAddonsQuery()` which fetches:
```
GET /api/dashboard/addons
```
This endpoint returns **addon plans** (the category-level subscription plans like "Juice Plan",
"Snack Plan"). These are objects with `kind: "plan"`. They do **not** have a meaningful `type`
field in the response shape returned by the dashboard API — the DTO (`toDashboardAddonPlanLeanDTO`)
strips billing-mode fields. So the filters on lines 23-26:

```ts
allAddons.filter((a: Addon) => a.type === "subscription");   // Always empty
allAddons.filter((a: Addon) => a.type === "one_time");       // Always empty
```

…will always return **empty arrays** because the `type` field is not included in the
`toDashboardAddonPlanLeanDTO` shape.

### What the backend `POST /api/subscriptions/checkout` actually expects

The checkout flow takes `addonSubscriptions` (an array of plan IDs that the user purchases at
subscription creation time), NOT raw legacy `addons[]`. See the subscription controller for the
correct checkout contract.

### Required Fix

**Option A (Recommended) — Replace the section with Addon Plan pickers**

The `AddonsSection` should show the admin a list of **addon plans** (fetched from
`/api/dashboard/addons`) so they can include them in the subscription at creation time. 

Replace the content of `AddonsSection.tsx` so it:

1. Fetches from `addonsQueryOptions()` (already correct).
2. Renders each plan (uses `plan.name.ar`, `plan.category`, `plan.planPrices[0].priceSar`, etc.).
3. On selection, stores the plan `id` in the form field (not `addon._id` which is the same, but
   be explicit).
4. **Remove** the `a.type === "subscription"` / `a.type === "one_time"` filter — all plans from
   `/api/dashboard/addons` are subscription-type plans.

**Updated filter logic:**
```ts
// Correct: all plans returned from this endpoint are subscription plans
const getSubscriptionAddons = () => allAddons.filter((a: Addon) => a.isActive);
const getOneTimeAddons = () => []; // one-time items are not supported for admin-created subscriptions
```

**Updated price display (line 187):**
```tsx
// Before (broken — always 0 for plan-type addons):
{addon.price} ريال

// After (correct — use first available plan price):
{addon.planPrices?.[0]?.priceSar ?? 0} ريال
```

---

## Issue 2 — `AddonsSection` form payload key mismatch (CRITICAL)

**File:** `src/components/pages/subscriptions/create/CreateSubscriptionFormContent.tsx`

### Problem

Lines 64–67 construct the payload as:
```ts
addons: data.addons.map((addon) => ({
  addonId: addon.value,
  qty: 1,
})),
```

The backend checkout endpoint (`POST /api/subscriptions`) expects `addonSubscriptions` (array of
plan IDs), **not** `addons`. The legacy `addons` key is not processed by the checkout controller.

### Required Fix

Change the payload builder to match the backend contract:

```ts
// Before:
addons: data.addons.map((addon) => ({
  addonId: addon.value,
  qty: 1,
})),

// After:
addonSubscriptions: data.addons.map((addon) => ({
  addonPlanId: addon.value,
})),
```

**Also update the form schema** in `src/lib/validations/createSubscriptionSchema.ts` to rename the
field if needed (or keep `addons` internally and map to `addonSubscriptions` in the payload
builder — both are fine).

---

## Issue 3 — Edit Subscription page: no add-ons management UI (MODERATE)

**File:** `src/routes/_protected/subscriptions/$subscriptionId/index.tsx`

### Problem

The subscription detail / edit view does not show the currently-subscribed addon plans, nor
provide a way to modify them. The backend supports:
```
GET  /api/dashboard/subscriptions/:id/addon-entitlements  → lists current entitlements
PATCH /api/dashboard/subscriptions/:id/addon-entitlements → updates entitlements
```

### Required Fix

Add an "Addon Entitlements" section to the subscription detail page that:

1. Calls `GET /api/dashboard/subscriptions/:id/addon-entitlements` to load current entitlements.
2. Displays each entitlement: category name, included daily qty, total qty, price.
3. (Optional) Provides an edit modal to add/remove entitlements using
   `PATCH /api/dashboard/subscriptions/:id/addon-entitlements`.

**Example API response shape from `getSubscriptionAddonEntitlementsAdmin`:**
```json
{
  "status": true,
  "data": {
    "addonSubscriptions": [
      {
        "addonId": "<plan_id>",
        "category": "juice",
        "name": "Juice Plan",
        "purchasedDailyQty": 1,
        "includedTotalQty": 30,
        "totalHalala": 15000
      }
    ]
  }
}
```

---

## Verified Working ✓

The following dashboard features for add-ons are **already fully implemented and working**:

| Feature | Location | Status |
|---------|----------|--------|
| List addon plans | `/addons` | ✓ Working |
| Create addon plan | `/addons` → dialog | ✓ Working (`POST /api/dashboard/addons`) |
| Edit addon plan | `/addons` → edit dialog | ✓ Working (`PUT /api/dashboard/addons/:id`) |
| Archive/delete addon plan | `/addons` → archive button | ✓ Working (`DELETE /api/dashboard/addons/:id`) |
| Toggle active/inactive | `/addons` → toggle | ✓ Working |
| Addon plan price matrix | `/addons/$addonId` | ✓ Working |
| View addon entitlements | `/subscriptions` | ✓ Route exists via `GET /:id/addon-entitlements` |

---

## API Contract Reference

### POST /api/subscriptions — Checkout with Addons

```json
{
  "userId": "...",
  "planId": "...",
  "addonSubscriptions": [
    { "addonPlanId": "<addon_plan_id>" }
  ],
  "deliveryMode": "delivery",
  "delivery": { ... }
}
```

### GET /api/dashboard/addons — Returns Plans

```json
{
  "status": true,
  "data": {
    "plans": [
      {
        "id": "<plan_id>",
        "name": { "ar": "اشتراك عصير", "en": "Juice Plan" },
        "category": "juice",
        "kind": "plan",
        "maxPerDay": 1,
        "isActive": true,
        "menuProductIds": ["..."],
        "menuProducts": [...],
        "planPrices": [
          {
            "basePlanId": "...",
            "basePlanName": { "ar": "...", "en": "..." },
            "daysCount": 30,
            "priceHalala": 15000,
            "priceSar": 150,
            "isActive": true
          }
        ]
      }
    ],
    "meta": {
      "addonPlanCategories": [
        { "key": "juice", "label": { "ar": "اشتراك العصير", "en": "Juice Subscription" } },
        { "key": "small_salad", "label": {...} },
        { "key": "snack", "label": {...} }
      ]
    },
    "summary": { "plansCount": 3, "matrixRowsCount": 9, "currency": "SAR" }
  }
}
```
