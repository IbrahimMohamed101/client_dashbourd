---
doc_version: 2.2
last_verified: 2026-05-25
backend_path: /home/hema/Projects/basicdiet145
backend_branch: main
backend_commit: c056b7db
backend_verified_by: codex-automated-verification
frontend_path: /home/hema/Projects/full app/client_dashbourd-main
verification_method: source-code-read
---

# Dashboard Frontend Implementation & Backend Contract Guide v2.2

## Verification Scope

This v2 report was rebuilt from source-code reads of the dashboard backend routes/controllers/middleware and dashboard frontend helpers/constants. No dashboard source code or backend source code was modified.

Commands intentionally not run in this pass: `npm install`, build, lint, typecheck, tests, formatters, migrations, seeds, graphify, deploy commands, or destructive commands.

Source files read before writing:
- Backend routes: `/home/hema/Projects/basicdiet145/src/routes/*`
- Backend dashboard controllers: `/home/hema/Projects/basicdiet145/src/controllers/dashboard/*`
- Backend dashboard auth: `/home/hema/Projects/basicdiet145/src/controllers/dashboardAuthController.js`
- Backend dashboard middleware: `/home/hema/Projects/basicdiet145/src/middleware/dashboardAuth.js`
- Backend app auth middleware: `/home/hema/Projects/basicdiet145/src/middleware/auth.js`
- Backend error helpers: `/home/hema/Projects/basicdiet145/src/utils/errorResponse.js`, `/home/hema/Projects/basicdiet145/src/utils/apiError.js`
- Frontend API/auth/helpers/constants: `src/lib/*`, `src/utils/*`, `src/hooks/*`, `src/constants/routes.ts`, `src/constants/NavLinksData.tsx`

⚠️ Partial verification note: route URL, method, middleware, controller, controller-level body/query reads, and controller success/error shapes were verified from source. Some controller methods delegate accepted payload validation to services; those service-level field lists are marked partial unless the read source directly exposed the fields.

## Executive Summary

Dashboard frontend status: Not ready.

Backend dashboard contract status: Ready with monitoring for confirmed endpoint families. Auth, menu, dashboard overview, users, subscriptions, payments, plans, addons, promo codes, zones, fulfillment queues, one-time orders, accounting, content terms, logs, and health routes were found in backend source.

Full dashboard/backend cycle status: Not ready. The frontend still has release blockers, missing pages, route/RBAC mismatch, incomplete field exposure, and product decisions.

Current readiness score: 52/100. This v2.2 enrichment makes the backend contract reference materially more complete for DTOs, plans, and settings bodies, but the dashboard remains blocked by release gate execution, RBAC mismatch, missing admin pages, incomplete menu/version coverage, and frontend error handling gaps.

Main release blockers:
- Dependency/build release gate is not established until install, lint, typecheck, and build pass.
- Frontend `KITCHEN_ROUTES` still includes `/menu`, while backend `/api/dashboard/menu/*` requires dashboard auth plus `admin` or `superadmin`.
- Frontend 401 handling exists, but centralized 403 handling is missing.
- Product `availableFor` and option subscription metadata remain required frontend checks.
- Menu versions/rollback UI/helper is not present as a complete frontend module.
- Error parsing must support the standard error shape and legacy controller shapes.

Do not implement refund, banners, or standalone branch management until a backend/product contract is approved.

## Quick Reference — All Endpoints

| Method | URL | Roles Allowed | Body/Query | Frontend Status |
|---|---|---|---|---|
| POST | `/api/dashboard/auth/login` | public | body `email`, `password` | ✅ helper exists |
| GET | `/api/dashboard/auth/me` | public optional token | none | ✅ helper exists |
| POST | `/api/dashboard/auth/logout` | superadmin, admin, cashier, kitchen, courier | none | ✅ helper exists |
| GET | `/api/dashboard/overview` | superadmin, admin, cashier | none | ✅ helper exists |
| GET | `/api/dashboard/search` | superadmin, admin, cashier | query `q` | ⚠️ missing dedicated helper |
| GET | `/api/dashboard/notifications/summary` | superadmin, admin | none | ⚠️ missing helper/API |
| GET | `/api/dashboard/reports/today` | superadmin, admin | none | ❌ missing reports helper |
| GET | `/api/dashboard/accounting/daily-report` | superadmin, admin | query `date`, `fulfillmentMethod`, `includeDetails` | ❌ missing helper |
| GET | `/api/dashboard/accounting/daily-report/export` | superadmin, admin | query `format=csv`, `date`, `fulfillmentMethod` | ❌ missing helper |
| GET/PATCH | `/api/dashboard/settings` | superadmin, admin | patch body settings keys listed in Settings section | ✅ helper exists |
| GET/PUT | `/api/dashboard/settings/restaurant-hours` | superadmin, admin | body `restaurant_open_time`, `restaurant_close_time`, optional related fields | ✅ helper exists; type risk |
| PUT | `/api/dashboard/settings/cutoff` | superadmin, admin | body `time` or `cutoffTime` | ❌ missing helper |
| PUT | `/api/dashboard/settings/delivery-windows` | superadmin, admin | body `windows` or `deliveryWindows` | ❌ missing helper |
| PUT | `/api/dashboard/settings/skip-allowance` | superadmin, admin | body `days` or `skipAllowance` | ❌ missing helper |
| PUT | `/api/dashboard/settings/premium-price` | superadmin, admin | body `price` or `premiumPriceHalala` | ❌ missing helper |
| PUT | `/api/dashboard/settings/subscription-delivery-fee` | superadmin, admin | body `deliveryFeeHalala` or aliases | ❌ missing helper |
| PUT | `/api/dashboard/settings/vat-percentage` | superadmin, admin | body `percentage` or aliases | ❌ missing helper |
| PUT | `/api/dashboard/settings/custom-salad-base-price` | superadmin, admin | body `price` or aliases | ❌ missing helper |
| PUT | `/api/dashboard/settings/custom-meal-base-price` | superadmin, admin | body `price` or aliases | ❌ missing helper |
| GET/POST | `/api/dashboard/dashboard-users` | superadmin, admin | pagination query; create body `email`, `role`, `password`, `isActive?` | ❌ missing page/helper |
| GET/PUT/DELETE | `/api/dashboard/dashboard-users/:id` | superadmin, admin | update body `role?`, `isActive?` | ❌ missing page/helper |
| POST | `/api/dashboard/dashboard-users/:id/reset-password` | superadmin, admin | body `password` | ❌ missing page/helper |
| GET/POST | `/api/dashboard/users` | GET superadmin, admin, cashier; POST superadmin, admin | query pagination; create body `phone`, `fullName?`, `email?`, `isActive?` | ✅ helper exists |
| GET/PUT | `/api/dashboard/users/:id` | GET superadmin, admin, cashier; PUT superadmin, admin | update currently requires `isActive` | ✅ helper exists; payload too broad |
| GET | `/api/dashboard/users/:id/subscriptions` | superadmin, admin, cashier | none | ⚠️ no dedicated helper |
| GET | `/api/dashboard/subscriptions/summary` | superadmin, admin, cashier | query filters | ✅ helper exists |
| GET/POST | `/api/dashboard/subscriptions` | GET superadmin, admin, cashier; POST superadmin, admin | query list filters; create body same as quote payload | ✅ helper exists |
| POST | `/api/dashboard/subscriptions/quote` | superadmin, admin | checkout quote body table in Subscriptions section | ✅ helper exists |
| GET | `/api/dashboard/subscriptions/search` | superadmin, admin, cashier | query `phone` | ✅ helper exists |
| GET | `/api/dashboard/subscriptions/:id` | superadmin, admin, cashier | none | ✅ helper exists |
| GET | `/api/dashboard/subscriptions/:id/days` | superadmin, admin, cashier | none | ⚠️ no dedicated helper |
| GET | `/api/dashboard/subscriptions/:id/audit-log` | superadmin, admin | query `limit` | ✅ helper exists |
| PUT | `/api/dashboard/subscriptions/:id/delivery` | superadmin, admin | delivery update body table in Subscriptions section | ✅ helper exists |
| GET/PATCH | `/api/dashboard/subscriptions/:id/addon-entitlements` | GET superadmin, admin, cashier; PATCH superadmin, admin | body `addonSubscriptions`/`entitlements`/`addonEntitlements`, `reason?` | ✅ helper exists |
| GET/PATCH | `/api/dashboard/subscriptions/:id/balances` | GET superadmin, admin, cashier; PATCH superadmin only | body `premiumBalance?`, `addonBalance?` | ❌ patch helper missing |
| POST | `/api/dashboard/subscriptions/:id/cancel` | superadmin, admin | body `reason?` | ✅ helper exists; reason omitted |
| PUT/POST | `/api/dashboard/subscriptions/:id/extend` | superadmin, admin | body `days`, `reason?` | ✅ helper uses PUT |
| POST | `/api/dashboard/subscriptions/:id/freeze` | superadmin, admin | body `startDate`, `days` | ✅ helper exists |
| POST | `/api/dashboard/subscriptions/:id/unfreeze` | superadmin, admin | body `startDate`, `days`, `reason?` | ✅ helper exists |
| POST | `/api/dashboard/subscriptions/:id/days/:date/skip` | superadmin, admin | path `date` YYYY-MM-DD, body `reason?` | ✅ helper exists |
| POST | `/api/dashboard/subscriptions/:id/days/:date/unskip` | superadmin, admin | path `date` YYYY-MM-DD, body `reason?` | ✅ helper exists |
| POST | `/api/dashboard/subscriptions/:subscriptionId/manual-deduction` | superadmin, admin | body `regularMeals`, `premiumMeals`, `reason?`, `notes?` | ✅ helper exists; kitchen route mismatch |
| GET | `/api/dashboard/payments` | superadmin, admin, cashier | query pagination/filters | ✅ helper exists |
| GET | `/api/dashboard/payments/:id` | superadmin, admin, cashier | none | ✅ helper exists |
| GET | `/api/dashboard/payments/:id/breakdown` | superadmin, admin, cashier | none | ✅ helper exists |
| POST | `/api/dashboard/payments/:id/verify` | superadmin, admin | no request body read by controller | ✅ helper exists |
| GET/POST | `/api/dashboard/plans` | superadmin, admin | plan body from admin controller | ✅ package helpers exist |
| GET/PUT/DELETE | `/api/dashboard/plans/:id` | superadmin, admin | plan update body | ✅ package helpers exist |
| PATCH/PATCH/POST | `/api/dashboard/plans/:id/toggle`, `/sort`, `/clone` | superadmin, admin | toggle none; sort body; clone body optional | ⚠️ QA needed |
| POST/DELETE/PATCH | `/api/dashboard/plans/:id/grams*` | superadmin, admin | grams row bodies | ⚠️ QA needed |
| POST/DELETE/PATCH | `/api/dashboard/plans/:id/grams/:grams/meals*` | superadmin, admin | meals option bodies | ⚠️ QA needed |
| GET/POST | `/api/dashboard/addon-items` | superadmin, admin | query `kind`, `category`, `billingMode`, `isActive`; item body table in Addons | ✅ helper exists |
| GET/PUT/PATCH/DELETE | `/api/dashboard/addon-items/:id`, `/toggle` | superadmin, admin | full item body for PUT; toggle none | ⚠️ toggle helper unclear |
| GET/POST | `/api/dashboard/promo-codes` | superadmin, admin | query `includeDeleted`; normalized promo body table | ✅ helper exists |
| POST | `/api/dashboard/promo-codes/validate` | superadmin, admin | body `code`, `userId`, quote/order fields | ❌ helper missing |
| GET/PUT/PATCH/DELETE | `/api/dashboard/promo-codes/:id`, `/toggle` | superadmin, admin | normalized promo body for PUT; toggle/delete none | ❌ toggle helper missing |
| GET/POST/PATCH/DELETE | `/api/dashboard/menu/categories*` | superadmin, admin | menu category body tables in Menu section | ✅ helpers mostly exist |
| GET/POST/PATCH/DELETE | `/api/dashboard/menu/products*` | superadmin, admin | menu product/body relation tables in Menu section | ⚠️ duplicate helper missing |
| GET/POST/PATCH/DELETE | `/api/dashboard/menu/option-groups*` | superadmin, admin | option group body tables in Menu section | ✅ helpers exist |
| GET/POST/PATCH/DELETE | `/api/dashboard/menu/options*` | superadmin, admin | option body tables in Menu section | ✅ helpers exist |
| POST/GET | `/api/dashboard/menu/validate`, `/publish`, `/audit-logs`, `/versions`, `/rollback/:versionId` | superadmin, admin | publish `notes?`; rollback `confirm:true` | ⚠️ versions/rollback helper missing |
| POST | `/api/dashboard/uploads/image` | superadmin, admin | multipart field `image`, optional `folder` | ✅ helper exists; response type incomplete |
| GET/POST | `/api/dashboard/menu-identities*`, `/menu-identity-*` | superadmin, admin | query/body as listed in Identity section | ✅ helpers exist; no route/page |
| GET | `/api/dashboard/orders` | superadmin, admin, kitchen, courier | query `status`, `paymentStatus`, `fulfillmentMethod`, `from`, `to`, `date`, `zoneId`, `q`, `page`, `limit`; `branchId` ignored | ✅ helper exists; sends ignored `branchId` |
| GET | `/api/dashboard/orders/:orderId` | superadmin, admin, kitchen, courier | none | ✅ helper exists |
| GET | `/api/dashboard/orders/:orderId/timeline` | superadmin, admin, kitchen, courier | none | ⚠️ no dedicated helper |
| POST | `/api/dashboard/orders/:orderId/actions/:action` | superadmin, admin, kitchen, courier | path action; body `reason?`, `notes?`, `pickupCode?` by action | ✅ action helpers exist |
| GET | `/api/dashboard/ops/list` | superadmin, admin, kitchen, courier | query required `date` | ✅ helper exists |
| GET | `/api/dashboard/ops/search` | superadmin, admin, kitchen, courier | query `q` | ✅ helper exists |
| POST | `/api/dashboard/ops/actions/:action` | superadmin, admin, kitchen, courier | body `entityId`, `entityType`, `source?`, `payload?`, `code?`, `pickupCode?` | ✅ helper exists |
| GET/POST | `/api/dashboard/kitchen/queue*`, `/pickup/queue*`, `/courier/queue*` | route allows superadmin, admin, kitchen, courier; controller narrows by screen | query/action body as Operations section | ✅ helpers partial |
| GET | `/api/dashboard/delivery-schedule` | superadmin, admin, courier | controller sets `method=delivery` | ⚠️ partial |
| GET/POST | `/api/dashboard/zones` | superadmin, admin | query `isActive`, `q`; body `name`, `deliveryFeeHalala`, `isActive?`, `sortOrder?` | ✅ helper exists; sends ignored page/limit |
| GET/PUT/PATCH/DELETE | `/api/dashboard/zones/:id`, `/toggle` | superadmin, admin | full zone body for PUT; toggle/delete none | ❌ toggle helper missing |
| GET/PUT | `/api/dashboard/content/terms/subscription` | superadmin, admin | query `locale`; body `title`, `locale`, `content` | ❌ missing helper/page |
| GET | `/api/dashboard/logs` | superadmin, admin | query `userId`, `entityType`, `entityId`, `action`, `from`, `to`, pagination | ❌ missing helper/page |
| GET | `/api/dashboard/notification-logs` | superadmin, admin | query `userId`, `entityId`, `from`, `to`, pagination | ❌ missing helper/page |
| GET | `/api/dashboard/health/catalog`, `/subscription-menu`, `/meal-planner`, `/indexes` | superadmin, admin | none | ❌ missing helper/page |

## Error Response Shapes

All backend errors fall into one of these shapes. The frontend error parser must handle all of them.

| Shape name | Condition | JSON structure |
|---|---|---|
| standard | Most errors returned through `errorResponse(res, status, code, message, details)` | `{ "ok": false, "error": { "code": "CODE", "message": "message", "details?": {} } }` |
| api-404 | Unknown `/api/*` route in `src/app.js` | `{ "ok": false, "error": { "code": "NOT_FOUND", "message": "Route not found" } }` |
| legacy-upload | `uploadController.uploadAdminImage` when `req.file` is missing | `{ "success": false, "message": "Image file is required under the image field", "expectedField": "image" }` |
| legacy-menu-identity-string | Some menu identity controller `404/400` branches | `{ "ok": false, "error": "NOT_FOUND" }` or `{ "ok": false, "error": "ALREADY_PROCESSED", "status": "approved" }` |
| legacy-status-message | Menu identity controller catch blocks | `{ "status": false, "message": "error message" }` |
| local-frontend-rejection | Frontend-only unsupported action guard in one-time/ops helpers | `{ "status": false, "code": "ACTION_NOT_ALLOWED", "message": "..." }` or `{ "ok": false, "code": "ACTION_NOT_ALLOWED", "message": "..." }` |

Frontend gap: `src/lib/apiErrors.ts` currently checks, in order: `response.data.message` string, `response.data.error` string, `response.data.error.message` string, `response.data.error.messageKey` string, then top-level JavaScript `error.message` string, then `"Unexpected error"`. It does not currently read `response.data.error.code`, `response.data.error.details`, `response.data.success === false`, `response.data.status === false`, root `response.data.code`, root `expectedField`, or local frontend rejections shaped like `{ status:false, code, message }` unless the caller passes that object as `error.message`.

## Shared Enums & Valid Values

### Ops Actions

Source: `src/services/dashboard/opsActionPolicy.js`.

| Action name | Allowed entityType values | Notes | Requires extra payload fields |
|---|---|---|---|
| `start_preparation` | `subscription_pickup_request` | Pickup request preparation action. Roles: superadmin, admin, kitchen. | no extra field required by policy |
| `lock` | `subscription_day`, `pickup_day`, `subscription`, `order` | Locks/holds a day or created one-time order depending on state. Roles: superadmin, admin, kitchen. | no extra field required by policy |
| `prepare` | `subscription_day`, `pickup_day`, `subscription`, `order` | Moves eligible items into preparation. Roles: superadmin, admin, kitchen. | no extra field required by policy |
| `dispatch` | `subscription_day`, `pickup_day`, `subscription`, `order` | Delivery-only mode. Roles: superadmin, admin, kitchen, courier. | delivery mode required |
| `ready_for_pickup` | `subscription_day`, `pickup_day`, `subscription`, `order`, `subscription_pickup_request` | Pickup-only mode. Roles: superadmin, admin, kitchen. Alias `ready-for-pickup` normalizes to this value. | no extra field required by policy |
| `notify_arrival` | `subscription_day`, `pickup_day`, `subscription`, `order` | Delivery-only mode. Roles: superadmin, admin, courier. | no extra field required by policy |
| `fulfill` | `subscription_day`, `pickup_day`, `subscription`, `order`, `subscription_pickup_request` | Courier can fulfill delivery; kitchen can fulfill pickup. | `pickupCode`/`code` may be required by pickup flows |
| `cancel` | `subscription_day`, `pickup_day`, `subscription`, `order`, `subscription_pickup_request` | Courier cancel is delivery-only; marked `requiresReason` in policy. | `reason` expected by UI/service |
| `no_show` | `subscription_day`, `pickup_day`, `subscription`, `subscription_pickup_request` | Pickup-only; marked `requiresReason`. | `reason` expected by UI/service |
| `reopen` | `subscription_day`, `pickup_day`, `subscription` | Admin-only recovery action for canceled/no-show subscription day states. | no extra field required by policy |

Allowed status transitions from the policy:
- Subscription-like entities: `open`, `locked`, `in_preparation`, `out_for_delivery`, `ready_for_pickup`, `fulfilled`, `delivery_canceled`, `canceled_at_branch`, `no_show`, `skipped`, `frozen`.
- One-time order policy states in `opsActionPolicy`: `created`, `confirmed`, `in_preparation`, `out_for_delivery`, `ready_for_pickup`, `fulfilled`, `cancelled`, `expired`, `pending_payment`.
- Subscription pickup request states: `locked`, `in_preparation`, `ready_for_pickup`, `fulfilled`, `no_show`, `canceled`.

### Subscription Status Values

From `src/models/Subscription.js`: `pending_payment`, `active`, `frozen`, `expired`, `canceled`, `completed`.

### Order Status Values

From `src/models/Order.js` and `src/utils/orderState.js`: `pending_payment`, `confirmed`, `in_preparation`, `ready_for_pickup`, `out_for_delivery`, `fulfilled`, `cancelled`, `expired`.

Legacy normalization maps: `created` -> `confirmed` if paid, otherwise `pending_payment`; `preparing` -> `in_preparation`; `canceled`/`cancelled` -> `cancelled`; `delivered` -> `fulfilled`.

### Payment Status Values

From `src/models/Payment.js`: `initiated`, `paid`, `failed`, `canceled`, `expired`, `refunded`.

### Fulfillment Method Values

From `src/models/Order.js` and `src/models/Subscription.js`: `delivery`, `pickup`.

### Dashboard Roles

From `src/constants/dashboardRoles` via `DashboardUser.role`, and frontend role constants: `superadmin`, `admin`, `kitchen`, `courier`, `cashier`.

### One-Time Order Supported vs Blocked Actions

Frontend `src/types/oneTimeOrderTypes.ts` allows `prepare`, `ready_for_pickup`, `fulfill`, and `cancel` for pickup-only one-time order helpers.

Frontend explicitly blocks: `dispatch`, `notify_arrival`, `courier_fulfill`, `delivery_assignment`, `delivery_zone_assignment`, `delivery_address_edit`, `delivery_window_edit`, `reopen`.

## Date & Format Standards

| Standard | Confirmed behavior |
|---|---|
| Query date format | `YYYY-MM-DD` is explicitly enforced by `GET /api/dashboard/ops/list`. One-time order list reads `from`, `to`, and `date`; subscription day paths use `:date`; services expect KSA date strings for day-level operations. |
| Request body date format | Subscription checkout `startDate`, freeze `startDate`, skip/unskip day `:date`, and delivery update date helpers use valid date parsing, with day operations expecting `YYYY-MM-DD` KSA date strings. |
| Response timestamp format | Mongoose `Date` fields serialize as ISO 8601 JSON strings, e.g. `createdAt`, `updatedAt`, `paidAt`, `lastLoginAt`, `passwordChangedAt`. |
| Required date endpoints | `GET /api/dashboard/ops/list` requires `date`; `POST /api/dashboard/subscriptions/:id/freeze` and `/unfreeze` require `startDate` and `days`; `POST /api/dashboard/subscriptions/:id/days/:date/skip|unskip` requires path `date`; queue endpoints accept optional `date`. |
| Optional date endpoints | Accounting daily report/export `date`; one-time order `from`, `to`, `date`; logs `from`, `to`; promo `startsAt`, `expiresAt`; subscription checkout `startDate`. |
| Currency format | Money fields named `*Halala` are integers in minor units. `Payment.amount` is explicitly minor units. Do not send floats for Halala fields. Some legacy/custom price fields use SAR numbers, but dashboard contract fields should prefer Halala integer fields when present. |

## Pagination Standards

Source: `src/utils/optionalPagination.js`.

| Item | Value |
|---|---|
| Default page | `1` when pagination is requested and `page` is omitted |
| Default limit | `50` when pagination is requested and `limit` is omitted |
| Max limit | Supplied by each caller as `maxLimit`; `optionalPagination.js` clamps to that caller-provided max and does not define a global max |
| No pagination requested | If neither `page` nor `limit` is present, helper returns `null` |
| Invalid pagination code | `INVALID_PAGINATION` from helper; some controllers convert invalid pagination to `400 INVALID` |

Standard meta shape from `buildPaginationMeta(page, limit, total)`:
```typescript
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

Known non-standard list shapes:
- Zones: `{ status:true, data: Zone[], meta:{ filters, totalCount } }`; backend reads `isActive` and `q`, and silently ignores frontend `page`/`limit`.
- Addon items: `{ status:true, data: Addon[], meta:{ filters, totalCount } }`.
- Promo codes: `{ status:true, data: PromoCode[] }`; no pagination meta from verified service/controller path.
- Menu catalog lists often return `data.items` plus `pagination` rather than root `meta`.
- One-time dashboard orders return `{ data:{ items, pagination:{ page, limit, total, pages } } }`, using `pages` rather than `totalPages`.

## Common Validations

- ObjectId validation is performed by `src/utils/validateObjectId.js` where controllers call it. Invalid ObjectId format returns standard error shape with HTTP `400` and code `INVALID_ID`, not `INVALID`.
- Middleware involved: route role/auth middleware handles authentication and authorization; ObjectId checks are controller/service-level validation calls, not a universal Express param middleware.
- Endpoints with non-ObjectId path params include `:date`, `:action`, `:screen`, `:grams`, `:mealsPerDay`, `:versionId` if the backing menu version id is not validated at route layer, and subscription/order operational aliases such as `:orderId` where validation happens in service/controller.
- Frontend should not assume every `:id` failure is `INVALID`; it must also parse `INVALID_ID`, `NOT_FOUND`, and service-specific state errors.

## Dashboard DTO Reference

**Verification status:** ✅ Confirmed from models, admin serializers, and `src/services/dashboard/dashboardDtoService.js`

This section contains DTO shapes the frontend can use as implementation anchors. Mongoose ids may arrive as `_id`, `id`, or populated object references depending on the controller path; response timestamps serialize as ISO strings.

```typescript
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

interface JsonObject {
  [property: string]: JsonValue;
}

interface LocalizedText {
  ar?: string;
  en?: string;
}

interface MoneySummary {
  amountHalala?: number;
  amountSar?: number;
  currency?: string;
  subtotalHalala?: number;
  discountHalala?: number;
  vatHalala?: number;
  totalHalala?: number;
}

interface DashboardUserDTO {
  _id?: string;
  id?: string;
  email: string;
  role: "superadmin" | "admin" | "cashier" | "kitchen" | "courier";
  isActive: boolean;
  lastLoginAt?: string | null;
  failedAttempts?: number;
  lockUntil?: string | null;
  passwordChangedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ZoneDTO {
  _id?: string;
  id?: string;
  name: string | LocalizedText;
  deliveryFeeHalala: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PlanMealsOptionDTO {
  mealsPerDay: number;
  priceHalala: number;
  compareAtHalala: number;
  priceSar?: number;
  price?: number;
  compareAtSar?: number;
  compareAt?: number;
  isActive: boolean;
  sortOrder: number;
}

interface PlanGramsOptionDTO {
  grams: number;
  mealsOptions: PlanMealsOptionDTO[];
  isActive: boolean;
  sortOrder: number;
}

interface PlanPricingDTO {
  startsFromHalala: number;
  startsFromSar: number;
  compareAtStartsFromHalala: number;
  compareAtStartsFromSar: number;
}

interface PlanDTO {
  _id?: string;
  id?: string;
  name: string | LocalizedText;
  description?: string | LocalizedText;
  daysCount: number;
  currency: string;
  gramsOptions: PlanGramsOptionDTO[];
  skipPolicy: { enabled: boolean; maxDays: number };
  freezePolicy: { enabled: boolean; maxDays: number; maxTimes: number };
  pricing?: PlanPricingDTO;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AddonDTO {
  _id?: string;
  id?: string;
  name: string | LocalizedText;
  description?: string | LocalizedText;
  imageUrl?: string;
  priceHalala: number;
  priceSar?: number;
  priceLabel?: string;
  price?: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  billingMode: "flat_once" | "per_day" | "per_meal";
  kind: "plan" | "item";
  type?: "subscription" | "one_time";
  pricingModel?: "one_time" | "subscription";
  billingUnit?: "item" | "day" | "meal";
  category?: "juice" | "snack" | "small_salad";
  menuProductId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PromoCodeAdminDTO {
  _id?: string;
  id?: string;
  code: string;
  codeNormalized?: string;
  title?: string;
  name?: LocalizedText;
  description?: string | LocalizedText;
  discountType: "percentage" | "fixed";
  discountValue: number;
  currency: string;
  isActive: boolean;
  appliesTo?: string | string[];
  appliesToList?: string[];
  usageLimitTotal?: number | null;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  usedCount?: number;
  maxDiscountAmountHalala?: number | null;
  minimumSubscriptionAmountHalala?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  eligiblePlanIds?: string[];
  planIds?: string[];
  eligiblePlanDaysCounts?: number[];
  firstPurchaseOnly?: boolean;
  allowedUserIds?: string[];
  addonPlanIds?: string[];
  sortOrder?: number;
  state?: { isStarted?: boolean; isExpired?: boolean; isUsable?: boolean; reason?: string };
  metadata?: JsonObject;
  createdAt?: string;
  updatedAt?: string;
}

interface SubscriptionPremiumBalanceDTO {
  key?: string;
  premiumKey?: string;
  name?: string | LocalizedText;
  total?: number;
  used?: number;
  remaining?: number;
  qty?: number;
}

interface SubscriptionAddonBalanceDTO {
  addonId?: string;
  name?: string | LocalizedText;
  category?: string;
  total?: number;
  used?: number;
  remaining?: number;
  maxPerDay?: number;
}

interface SubscriptionDeliveryDTO {
  mode?: "delivery" | "pickup";
  deliveryMode?: "delivery" | "pickup";
  address?: JsonObject | null;
  deliveryAddress?: JsonObject | null;
  zoneId?: string | null;
  deliveryZoneId?: string | null;
  zoneName?: string | null;
  deliveryZoneName?: string | null;
  deliveryFeeHalala?: number;
  pickupLocationId?: string | null;
  deliveryWindow?: string | null;
  deliverySlot?: { type?: string; window?: string; slotId?: string; label?: string };
}

interface SubscriptionDTO {
  _id?: string;
  id?: string;
  userId?: string;
  user?: JsonObject | null;
  userName?: string;
  planId?: string;
  plan?: PlanDTO | JsonObject | null;
  status: "pending_payment" | "active" | "frozen" | "expired" | "canceled" | "completed";
  startDate?: string;
  endDate?: string;
  validityEndDate?: string;
  canceledAt?: string | null;
  selectedGrams?: number;
  selectedMealsPerDay?: number;
  totalMeals?: number;
  remainingMeals?: number;
  skippedCount?: number;
  skipDaysUsed?: number;
  premiumSelections?: JsonObject[];
  premiumBalance?: SubscriptionPremiumBalanceDTO[];
  addonSubscriptions?: JsonObject[];
  addonSelections?: JsonObject[];
  addonBalance?: SubscriptionAddonBalanceDTO[];
  pricingSummary?: MoneySummary;
  basePlanPriceHalala?: number;
  basePlanGrossHalala?: number;
  basePlanNetHalala?: number;
  discountHalala?: number;
  subtotalHalala?: number;
  subtotalBeforeVatHalala?: number;
  vatPercentage?: number;
  vatHalala?: number;
  totalPriceHalala?: number;
  checkoutCurrency?: string;
  appliedPromo?: JsonObject | null;
  delivery?: SubscriptionDeliveryDTO;
  deliveryMode?: "delivery" | "pickup";
  contractMeta?: JsonObject;
  contractVersion?: string;
  contractMode?: string;
  contractCompleteness?: string;
  contractSource?: string;
  contractHash?: string;
  renewedFromSubscriptionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface PaymentDTO {
  _id?: string;
  id?: string;
  provider: "moyasar";
  type?: string;
  status: "initiated" | "paid" | "failed" | "canceled" | "expired" | "refunded";
  amount: number;
  currency: string;
  userId?: string;
  user?: JsonObject | null;
  subscriptionId?: string | null;
  orderId?: string | null;
  providerInvoiceId?: string | null;
  providerPaymentId?: string | null;
  providerReference?: string | null;
  paymentMethod?: string | null;
  paymentProvider?: string;
  subtotalHalala?: number;
  discountHalala?: number;
  vatHalala?: number;
  totalHalala?: number;
  paidHalala?: number;
  pricingSummary?: MoneySummary;
  lineItems?: JsonObject[];
  breakdown?: JsonObject;
  metadata?: JsonObject;
  applied?: boolean;
  paidAt?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  operationScope?: string | null;
  operationIdempotencyKey?: string | null;
  operationRequestHash?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface OpsActionDTO {
  id: string;
  label: string;
  color?: string;
  icon?: string;
  endpoint?: string;
  method?: string;
  requiresReason?: boolean;
}

interface OpsCustomerDTO {
  id?: string | null;
  name?: string;
  phone?: string;
}

interface OpsContextDTO {
  date?: string;
  window?: string | null;
  address?: JsonObject | string | null;
  branch?: JsonObject | string | null;
  pickupCode?: string | null;
  requiredMealCount?: number;
  specifiedMealCount?: number;
  unspecifiedMealCount?: number;
  fulfillmentMode?: "delivery" | "pickup";
  consumptionState?: string;
  pickupRequested?: boolean;
  pickupPrepared?: boolean;
  pickupPreparationFlowStatus?: string | null;
  dayEndConsumptionReason?: string | null;
  mealTypesSpecified?: boolean;
}

interface OpsTimestampsDTO {
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface UnifiedOperationalDTO {
  source: "subscription" | "one_time_order" | "subscription_pickup_request";
  entityType: "subscription_day" | "pickup_day" | "order" | "subscription_pickup_request";
  entityId: string;
  id: string;
  type?: string;
  mode?: "delivery" | "pickup";
  reference?: string;
  orderId?: string;
  orderNumber?: string;
  requestId?: string;
  subscriptionId?: string;
  subscriptionDayId?: string;
  userId?: string;
  date?: string;
  mealCount?: number;
  status: string;
  statusLabel?: string;
  currentStep?: string;
  isReady?: boolean;
  isCompleted?: boolean;
  paymentStatus?: string;
  fulfillmentMethod?: "delivery" | "pickup";
  ui?: JsonObject;
  customer?: OpsCustomerDTO;
  items?: JsonObject[];
  pricing?: MoneySummary | JsonObject;
  delivery?: JsonObject;
  pickup?: JsonObject;
  context?: OpsContextDTO;
  snapshot?: JsonObject;
  allowedActions: OpsActionDTO[];
  createdAt?: string;
  timestamps?: OpsTimestampsDTO;
}
```

Dynamic/admin diagnostic payload note: accounting reports, health checks, logs, notification logs, dashboard overview/search, and some menu audit endpoints intentionally remain `JsonObject` or `JsonValue` because the verified source exposes administrative aggregate payloads rather than stable public DTO classes.

## Dashboard Roles

Backend role behavior from `src/middleware/dashboardAuth.js`:
- `dashboardAuthMiddleware` requires `Authorization: Bearer <token>`, verifies a dashboard JWT, reloads `DashboardUser` from DB, rejects inactive users, and writes `req.dashboardUserRole`.
- `dashboardRoleMiddleware(allowedRoles)` always allows `superadmin`, otherwise only allows roles included in `allowedRoles`.
- Roles observed in frontend constants: `superadmin`, `admin`, `kitchen`, `courier`, `cashier`.

| Role | Allowed routes from backend middleware | Frontend route access from `routes.ts` | Match? |
|---|---|---|---|
| superadmin | All dashboard route families where a role guard is used because middleware bypasses allowed-role checks for `superadmin`. | `/dashboard`, `/orders`, `/one-time-orders`, `/operations`, `/subscriptions`, `/packages`, `/users`, `/addons`, `/delivery`, `/payments`, `/promo-codes`, `/zones`, `/manual-deduction`, `/menu` | ✅ Mostly matches |
| admin | Admin dashboard routes, menu routes, overview/search/read routes, subscriptions, payments verify, settings, content, logs, zones, plans, addons, promo, queues/actions. | Same as superadmin except role is `admin`. | ✅ Mostly matches |
| cashier | Backend allows selected read routes: dashboard overview/search, subscription/user/order/payment read routes, `/api/dashboard/subscriptions/search`, addon entitlements/balances read, cashier ops lookup/consumption. | `/dashboard`, `/orders`, `/one-time-orders`, `/subscriptions`, `/payments`, `/users` | ✅ Partial match; no dedicated cashier ops route in frontend |
| kitchen | Backend allows ops list/search/actions, dashboard order routes, queue routes, kitchen/pickup queues, cashier lookup/consumption. Backend menu routes do not allow kitchen. | `/operations`, `/one-time-orders`, `/menu`, `/manual-deduction` | ❌ Mismatch: `/menu` and manual deduction submit are not allowed for kitchen |
| courier | Backend allows ops list/search/actions, dashboard order routes, courier queues, delivery schedule. | `/operations`, `/delivery` | ✅ Partial match |

Frontend nav source note from `src/constants/NavLinksData.tsx`: nav entries are a flat list, not role-scoped in that file. The role filtering comes from route permissions/navigation permission code. Flat nav URLs currently present: `/dashboard`, `/payments`, `/promo-codes`, `/addons`, `/packages`, `/subscriptions`, `/operations`, `/one-time-orders`, `/manual-deduction`, `/menu`, `/delivery`, `/zones`, `/users`; secondary entries are `#` for settings/help.

## Dashboard Module Inventory

| Module | Backend status | Frontend status | Primary frontend helper/file | Action |
|---|---|---|---|---|
| Release gate/build | Frontend-only | Not verified | `package.json` | Run install/lint/typecheck/build during release gate. |
| Auth/session/RBAC | ✅ Confirmed | ⚠️ Needs update | `src/lib/authApi.ts`, `src/hooks/useAuth.ts`, `src/constants/routes.ts` | Remove kitchen `/menu`; add 403 handling. |
| Dashboard home/statistics | ✅ Confirmed | ⚠️ Partially implemented | `src/utils/fetchGetDashboardData.ts` | QA overview/search/notification responses. |
| Settings/configuration | ✅ Confirmed | ⚠️ Helpers only, missing page | `src/utils/fetchSettings.ts` | Add full settings page if required. |
| Reports/analytics/accounting | ✅ Confirmed | ❌ Missing page/helper | Missing dedicated helper | Add reports/accounting UI. |
| Admin users/staff/roles | ✅ Confirmed | ❌ Missing page/helper | Missing | Add dashboard staff module. |
| Customers/clients | ✅ Confirmed | ✅ Implemented | `src/utils/fetchUsersData.ts` | Normal QA; keep customer/staff naming clear. |
| Subscriptions management | ✅ Confirmed | ⚠️ Partially implemented | `src/utils/fetchSubscriptionsData.ts` | QA lifecycle, balances, entitlements, manual deduction. |
| Payments/finance | ✅ Confirmed | ⚠️ Partially implemented | `src/utils/fetchPaymentsData.ts` | Add detail/reporting completeness; keep refund blocked. |
| Plans/packages | ✅ Confirmed | ⚠️ Partially implemented | package helpers | QA nested grams/meals operations. |
| Addons | ✅ Confirmed | ✅ Implemented for `addon-items` | addon helpers | Continue using `/addon-items`. |
| Promo codes/coupons | ✅ Confirmed | ⚠️ Partial; no validate/toggle helper | `src/utils/fetchPromoCodesData.ts` | Add/defer validate and toggle. |
| Menu catalog | ✅ Confirmed | ⚠️ Needs update | menu helpers/hooks | Complete fields/actions/version UI. |
| Menu identity mapping | ✅ Confirmed | ⚠️ Helpers only | menu identity helpers | Decide dedicated route/tab. |
| One-time orders | ✅ Confirmed | ⚠️ Partially implemented | `src/utils/fetchOneTimeOrders.ts` | QA action set and hidden refund. |
| Operations/kitchen/pickup/courier | ✅ Confirmed | ⚠️ Partially implemented | `src/utils/fetchDashboardOpsData.ts` | QA queues/actions/roles. |
| Manual deduction | ✅ Confirmed | ⚠️ Partially implemented | subscription/ops helpers | Fix kitchen access and QA admin-only submit. |
| Delivery zones | ✅ Confirmed | ⚠️ Partially implemented | `src/utils/fetchDeliveryZonesData.ts` | Add toggle helper or expose via UI if needed. |
| Content/terms | ✅ Confirmed | ❌ Missing page/helper | Missing | Add only if product requires dashboard terms editing. |
| Notifications/logs/health | ✅ Confirmed | ❌ Missing diagnostics page | Missing | Add diagnostics page if required. |
| Branches | Product decision needed | ❌ Missing | No standalone helper | Do not invent standalone branch management. |
| Banners | ❌ Backend missing | ❌ Missing | Missing | Product/backend contract required. |
| Refund operations | ❌ Backend missing | ❌ Missing | Missing | Product/backend contract required. |

## Completed vs Pending Dashboard Sections

| Module / Section | Backend Contract Status | Frontend Status | Current State | Next Action | Priority |
|---|---|---|---|---|---|
| Release Gate / Build | Frontend-only | Not verified | Release blocker | Run dependency install, lint, typecheck, and build during release verification. | Critical |
| Auth / Session / RBAC | Verified | Needs update | Release blocker | Fix kitchen `/menu` access mismatch and centralize 401/403 handling. | Critical |
| Dashboard Home / Statistics | Verified | Partially implemented | Partially completed | QA overview/search/notification summary with real backend responses. | High |
| Settings / Configuration | Verified | Missing page | Pending frontend implementation | Add a dedicated settings route/page if operators should edit configuration. | High |
| Reports / Analytics / Accounting | Verified | Missing page | Pending frontend implementation | Add reports/accounting UI and verify supported date/export filters. | High |
| Admin Users / Staff / Roles | Verified | Missing page | Pending frontend implementation | Add dashboard staff list/create/update/delete/reset-password workflow. | High |
| Customers / Clients | Verified | Implemented | Completed | Keep app customer wording clear and complete normal QA. | High |
| Subscriptions Management | Verified | Partially implemented | Partially completed | QA lifecycle actions, audit, balances, addon entitlements, search, and mutation invalidation. | High |
| Payments / Finance | Verified | Partially implemented | Partially completed | Complete detail/breakdown/verify/accounting UI; keep refund deferred. | High |
| Plans / Packages | Verified | Partially implemented | Partially completed | QA nested grams/meals, clone, toggle, sort, and validation flows. | High |
| Addons | Verified | Implemented | Completed | Continue using `/api/dashboard/addon-items/*` and complete normal QA. | Medium |
| Promo Codes / Coupons | Verified | Partially implemented | Partially completed | Add or explicitly defer validate/toggle frontend coverage. | Medium |
| Menu Catalog | Verified | Needs update | Partially completed | Expose `availableFor`, complete option subscription metadata, and verify list/mutation shapes. | High |
| Menu Identity Mapping | Verified | Partially implemented | Partially completed | Decide whether helpers remain background-only or need a visible route/tab. | Medium |
| Product Relations / Product-Specific Pricing | Verified | Needs update | Partially completed | Add confirmations for replace/unlink/destructive actions and verify triple-identity updates. | High |
| Publish / Validate / Audit | Verified | Needs update | Partially completed | Enforce validate-before-publish and verify audit/publish response handling. | High |
| Menu Versions / Rollback | Verified | Missing page | Pending frontend implementation | Add versions/rollback UI or explicitly defer it from release scope. | High |
| Image Upload | Verified | Needs update | Partially completed | Align all upload callers to `/api/dashboard/uploads/image`, field `image`, and tolerant error parsing. | Medium |
| One-Time Orders | Verified | Partially implemented | Partially completed | QA list/detail/timeline/actions and keep refund hidden. | High |
| Operations / Kitchen / Pickup / Courier | Verified | Partially implemented | Partially completed | QA unified ops actions, screen queues, day detail, delivery schedule, and role access. | High |
| Manual Deduction | Verified | Partially implemented | Partially completed | Verify helper coverage, role boundaries, balances refresh, and over-deduction errors. | High |
| Delivery Zones | Verified | Partially implemented | Partially completed | QA list/create/update/toggle/delete and delivery settings overlap. | Medium |
| Content / Terms | Verified | Missing page | Pending frontend implementation | Add terms editor only if admins should manage subscription terms. | Medium |
| Notifications / Logs / Health | Verified | Missing page | Pending frontend implementation | Add diagnostics/logs/health page if required by support or release scope. | Medium |
| Branches | Product decision needed | Missing page | Blocked by backend/product decision | Do not implement standalone branch management until contract and scope are approved. | Product decision |
| Banners | Backend missing | Missing page | Blocked by backend/product decision | Do not implement banners until backend/product contract exists. | Product decision |
| Refund Operations | Backend missing | Missing page | Blocked by backend/product decision | Do not implement refund UI until a verified dashboard refund route exists. | Product decision |
| Error Handling & Toasts | Partially verified | Needs update | Pending frontend implementation | Normalize mixed success/error shapes across mutation toasts and API helpers. | High |
| Environment / Security | Verified | Needs update | Release blocker | Verify `VITE_BACKEND_URL`, Bearer token handling, session clearing, and production logging. | High |
| Performance / Pagination | Partially verified | Needs update | Partially completed | Use endpoint-aware pagination/list normalization and preserve filters after mutations. | Medium |

## Auth / Session

**Verification status:** ✅ Confirmed

---

### Token Details

Source files: `src/services/dashboardTokenService.js`, `src/middleware/dashboardAuth.js`, and dashboard auth routes.

| Detail | Confirmed value |
|---|---|
| Header format | `Authorization: Bearer <token>` |
| JWT secret | `DASHBOARD_JWT_SECRET` from environment |
| Expiry config | `DASHBOARD_JWT_EXPIRES_IN` from environment, default `"7d"` |
| JWT payload fields issued by service | `userId`, `role`, `tokenType` |
| Required token type | `tokenType === "dashboard_access"` |
| Standard JWT fields from signer | `iat`, `exp` are present when `jsonwebtoken.sign` adds them |
| DB reload | Protected middleware reloads `DashboardUser` by `userId` on every request and selects `_id role isActive passwordChangedAt` |
| Role source of truth | Current DB `user.role`, not stale token role |
| Token revocation behavior | If `passwordChangedAt` is later than token `iat`, protected routes return `401 TOKEN_REVOKED` |
| Refresh endpoint | No dashboard refresh endpoint was found in verified dashboard auth routes |

Auth failure codes confirmed from middleware: `UNAUTHORIZED`, `FORBIDDEN`, `TOKEN_REVOKED`, `INTERNAL`.

### `POST /api/dashboard/auth/login`

**Auth required:** none; `dashboardLoginLimiter`

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Query params:** none.

**Success response `200`:**
```json
{
  "status": true,
  "token": "<JWT>",
  "user": {}
}
```

**Error responses:**
| HTTP | Code | When | Shape |
|---|---|---|---|
| 400 | INVALID | Missing email/password or invalid email format | standard |
| 401 | UNAUTHORIZED | User not found or password mismatch | standard |
| 403 | FORBIDDEN | Dashboard user inactive | standard |
| 423 | LOCKED | Too many failed attempts | standard |
| 429 | RATE_LIMIT | Login limiter exceeded | standard |

**TypeScript interface:**
```typescript
interface DashboardLoginResponse {
  status: true;
  token: string;
  user: DashboardUser;
}
```

**Frontend file:** `src/lib/authApi.ts`
**Frontend status:** ✅ Correct URL; normalizes `{ status, token, user }`.

---

### `GET /api/dashboard/auth/me`

**Auth required:** optional dashboard auth via `dashboardOptionalAuthMiddleware`

**Request body:** none.

**Query params:** none.

**Success response `200`:**
```json
{
  "status": true,
  "data": { "user": {} },
  "user": {}
}
```

**Unauthenticated response `200`:**
```json
{
  "status": false,
  "data": { "user": null },
  "user": null
}
```

**TypeScript interface:**
```typescript
interface DashboardMeResponse {
  status: boolean;
  data: { user: DashboardUser | null };
  user: DashboardUser | null;
}
```

**Frontend file:** `src/lib/authApi.ts`
**Frontend status:** ✅ Correct URL; frontend correctly treats `status:false` as no user through normalization.

---

### `POST /api/dashboard/auth/logout`

**Auth required:** `dashboardAuthMiddleware`

**Request body:** none.

**Query params:** none.

**Success response `200`:**
```json
{ "status": true }
```

**Frontend file:** `src/lib/authApi.ts`
**Frontend status:** ✅ Correct URL.

## Dashboard Home / Overview / Reports

**Verification status:** ✅ Confirmed

---

### `GET /api/dashboard/overview`

**Auth required:** first declaration allows `admin`, `cashier`; later admin route declaration after `router.use(dashboardRoleMiddleware(["admin"]))` also exists. Because `/overview` appears before and after the admin-only guard in `src/routes/admin.js`, Express will hit the first matching read route for admin/cashier.

**Request body:** none.

**Query params:** controller reads dashboard data internally; no required query params confirmed.

**Success response `200`:**
```json
{
  "status": true,
  "data": {}
}
```

**TypeScript interface:**
```typescript
interface DashboardOverviewResponse {
  status: true;
  data: JsonObject;
}
```

**Frontend file:** `src/utils/fetchGetDashboardData.ts`
**Frontend status:** ✅ Correct URL; ⚠️ logs raw errors to console.

---

### `GET /api/dashboard/search`

**Auth required:** `dashboardAuthMiddleware`, read guard `["admin","cashier"]` before admin-only duplicate.

**Request body:** none.

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| q | string | No | Search text read by `searchDashboard`. |

**Success response `200`:**
```json
{
  "status": true,
  "data": {}
}
```

**TypeScript interface:**
```typescript
interface DashboardSearchResponse {
  status: true;
  data: JsonObject;
}
```

**Frontend file:** no dedicated helper found.
**Frontend status:** ⚠️ Missing helper/API.

---

### `GET /api/dashboard/notifications/summary`

**Auth required:** admin-only after `router.use(dashboardRoleMiddleware(["admin"]))`; `superadmin` allowed by middleware.

**Request body:** none.

**Query params:** none exposed by the verified controller path.

**Success response `200`:**
```json
{
  "status": true,
  "data": {}
}
```

**TypeScript interface:**
```typescript
interface DashboardNotificationSummaryResponse {
  status: true;
  data: JsonObject;
}
```

**Frontend file:** no dedicated helper found.
**Frontend status:** ⚠️ Missing helper/API or embedded in dashboard data only.

---

### `GET /api/dashboard/reports/today`

**Auth required:** admin-only; `superadmin` allowed.

**Request body:** none.

**Query params:** none exposed by the verified controller path.

**Success response `200`:**
```json
{
  "status": true,
  "data": {}
}
```

**TypeScript interface:**
```typescript
interface DashboardTodayReportResponse {
  status: true;
  data: JsonObject;
}
```

**Frontend file:** no dedicated reports helper found.
**Frontend status:** ❌ Missing page/helper.

## Accounting

**Verification status:** ✅ Confirmed

---

### `GET /api/dashboard/accounting/daily-report`

**Auth required:** `dashboardAuthMiddleware`, `dashboardRoleMiddleware(["admin"])`; `superadmin` allowed.

**Request body:** none.

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| date | string | No | Report date forwarded to accounting service. |
| fulfillmentMethod | string | No | Filter forwarded to accounting service. |
| includeDetails | string | No | Forwarded to accounting service. |

**Success response `200`:**
```json
{
  "status": true,
  "data": {}
}
```

**Error responses:**
| HTTP | Code | When | Shape |
|---|---|---|---|
| service-defined | service-defined | `accountingDailyReportService` throws controlled error | standard |

**TypeScript interface:**
```typescript
interface AccountingDailyReportResponse {
  status: true;
  data: JsonObject;
}
```

**Frontend file:** missing dedicated helper.
**Frontend status:** ❌ Missing page/helper.

---

### `GET /api/dashboard/accounting/daily-report/export`

**Auth required:** `dashboardAuthMiddleware`, `dashboardRoleMiddleware(["admin"])`; `superadmin` allowed.

**Request body:** none.

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| format | string | No | Only `csv` is supported. Default `csv`. |
| date | string | No | Report date. |
| fulfillmentMethod | string | No | Filter. |

**Success response `200`:** raw CSV body with `Content-Type: text/csv`.

**Error responses:**
| HTTP | Code | When | Shape |
|---|---|---|---|
| 400 | UNSUPPORTED_EXPORT_FORMAT | `format` is not `csv` | standard |

**Frontend file:** missing dedicated helper.
**Frontend status:** ❌ Missing page/helper.

## Settings / Configuration

**Verification status:** ✅ Confirmed from `src/controllers/adminController.js`

Source split: `src/controllers/settingsController.js` exposes public/general read endpoints (`getSettings`, `getAppConfig`) and does not implement dashboard settings mutations. Dashboard settings mutation routes are implemented in `src/controllers/adminController.js`.

All dashboard routes below are mounted under `/api/dashboard` through `src/routes/index.js` and `src/routes/admin.js`. Auth is admin-only; `superadmin` is allowed by role middleware.

| Endpoint | Body/query confirmed from controller | Success shape | Frontend status |
|---|---|---|---|
| `GET /api/dashboard/settings` | none | `{ status:true, data:persisted }` | ✅ `fetchSettings` correct URL |
| `PATCH /api/dashboard/settings` | allowed settings keys table below; `reason` allowed and ignored for validation | `{ status:true, data:persisted }` | ✅ `fetchUpdateSettings` correct URL |
| `GET /api/dashboard/settings/restaurant-hours` | none | `{ status:true, data:{ timezone, restaurant_open_time, restaurant_close_time, is_open } }` | ✅ helper exists |
| `PUT /api/dashboard/settings/restaurant-hours` | restaurant-hours body table below | `{ status:true, data:persisted }` | ✅ helper exists, but frontend type expects `schedule` shape |
| `PATCH /api/dashboard/restaurant-hours/toggle-open` | optional `isOpen` or `restaurant_is_open`; defaults true | `{ status:true, data:persisted }` | ❌ no helper found |
| `PUT /api/dashboard/settings/cutoff` | `time` or `cutoffTime` | `{ status:true, data:persisted }` | ❌ no helper found |
| `PUT /api/dashboard/settings/delivery-windows` | `windows` or `deliveryWindows`; each entry `HH:mm-HH:mm`, end after start | `{ status:true, data:persisted }` | ❌ no helper found |
| `PUT /api/dashboard/settings/skip-allowance` | `skipAllowance` or `days`; integer >= 0 | `{ status:true, data:persisted }` | ❌ no helper found |
| `PUT /api/dashboard/settings/premium-price` | `price` or `premiumPriceHalala`; finite number > 0 and <= 10000 | `{ status:true, data:persisted }` | ❌ no helper found |
| `PUT /api/dashboard/settings/subscription-delivery-fee` | `deliveryFeeHalala` or `subscriptionDeliveryFeeHalala` or `subscription_delivery_fee_halala`; safe integer >= 0 | `{ status:true, data:persisted }` | ❌ no helper found |
| `PUT /api/dashboard/settings/vat-percentage` | `percentage` or `vatPercentage` or `vat_percentage`; finite number 0..100 | `{ status:true, data:persisted }` | ❌ no helper found |
| `PUT /api/dashboard/settings/custom-salad-base-price` | `price` or `customSaladBasePriceHalala` or `custom_salad_base_price`; finite number >= 0 and <= 10000 | `{ status:true, data:persisted }` | ❌ no helper found |
| `PUT /api/dashboard/settings/custom-meal-base-price` | `price` or `customMealBasePriceHalala` or `custom_meal_base_price`; finite number >= 0 and <= 10000 | `{ status:true, data:persisted }` | ❌ no helper found |

### Settings patch payload fields

`PATCH /api/dashboard/settings` accepts an object containing one or more of these keys. Unsupported keys return `400 INVALID`; `reason` is accepted by the controller but ignored by the normalizer.

| Key | Type | Notes |
|---|---|---|
| `cutoff_time` | `HH:mm` string | Dashboard cutoff time. |
| `restaurant_open_time` | `HH:mm` string | Restaurant opening time. |
| `restaurant_close_time` | `HH:mm` string | Restaurant closing time. |
| `restaurant_is_open` | boolean | Restaurant open/closed flag. |
| `restaurant_hours` | object | Weekly/opening-hours structure; persisted as supplied after controller normalization. |
| `temporary_closure` | object/null | Temporary closure configuration. |
| `delivery_windows` | string[] | Entries must be `HH:mm-HH:mm` and end after start. |
| `skip_allowance` | integer >= 0 | Allowed skip days. |
| `premium_price` | finite number > 0 and <= 10000 | Premium price setting. |
| `subscription_delivery_fee_halala` | safe integer >= 0 | Subscription delivery fee in Halala. |
| `vat_percentage` | finite number 0..100 | VAT percentage. |
| `custom_salad_base_price` | finite number >= 0 and <= 10000 | Custom salad base price. |
| `custom_meal_base_price` | finite number >= 0 and <= 10000 | Custom meal base price. |
| `reason` | string | Allowed but ignored for validation/persistence normalization. |

### Settings sub-route payload fields

| Endpoint | Required fields | Optional fields | Notes |
|---|---|---|---|
| `PUT /settings/restaurant-hours` | `restaurant_open_time` or `openTime`; `restaurant_close_time` or `closeTime` | `deliveryWindows` or `delivery_windows`; `cutoffTime` or `cutoff_time`; `isOpen` or `restaurant_is_open`; `weeklySchedule` or `weekly_schedule`; `temporaryClosure` or `temporary_closure` | Time values use `HH:mm`. |
| `PATCH /restaurant-hours/toggle-open` | none | `isOpen` or `restaurant_is_open` | Defaults to `true` when omitted. |
| `PUT /settings/cutoff` | `time` or `cutoffTime` | none | Time value must be `HH:mm`. |
| `PUT /settings/delivery-windows` | `windows` or `deliveryWindows` | none | Each entry must be `HH:mm-HH:mm`; end must be after start. |
| `PUT /settings/skip-allowance` | `skipAllowance` or `days` | none | Integer >= 0. |
| `PUT /settings/premium-price` | `price` or `premiumPriceHalala` | none | Finite number > 0 and <= 10000. |
| `PUT /settings/subscription-delivery-fee` | `deliveryFeeHalala` or `subscriptionDeliveryFeeHalala` or `subscription_delivery_fee_halala` | none | Safe integer >= 0. |
| `PUT /settings/vat-percentage` | `percentage` or `vatPercentage` or `vat_percentage` | none | Finite number 0..100. |
| `PUT /settings/custom-salad-base-price` | `price` or `customSaladBasePriceHalala` or `custom_salad_base_price` | none | Finite number >= 0 and <= 10000. |
| `PUT /settings/custom-meal-base-price` | `price` or `customMealBasePriceHalala` or `custom_meal_base_price` | none | Finite number >= 0 and <= 10000. |

**TypeScript interface:**
```typescript
interface DashboardSettingsDTO extends JsonObject {
  cutoff_time?: string;
  restaurant_open_time?: string;
  restaurant_close_time?: string;
  restaurant_is_open?: boolean;
  restaurant_hours?: JsonObject;
  temporary_closure?: JsonObject | null;
  delivery_windows?: string[];
  skip_allowance?: number;
  premium_price?: number;
  subscription_delivery_fee_halala?: number;
  vat_percentage?: number;
  custom_salad_base_price?: number;
  custom_meal_base_price?: number;
}

interface DashboardSettingsResponse {
  status: true;
  data: DashboardSettingsDTO;
}
```

**Verification note:** v2.2 confirms all dashboard settings sub-route body aliases from `adminController.js`. The restaurant-hours frontend type still needs attention because frontend `RestaurantHours` expects a `schedule` shape while the backend route returns open/close fields.

## Dashboard Users / Staff / Roles

**Verification status:** ✅ Confirmed

Routes are admin-only after `router.use(dashboardRoleMiddleware(["admin"]))`; `superadmin` is allowed.

| Endpoint | Request body | Query params | Success response | Errors |
|---|---|---|---|---|
| `GET /api/dashboard/dashboard-users` | none | pagination query through `resolvePaginationOrRespond` | `{ status:true, data:[...], meta:{ page, limit, total, totalPages } }` | `400 INVALID` for invalid pagination |
| `POST /api/dashboard/dashboard-users` | `{ "email": "string", "role": "admin|cashier|kitchen|courier|superadmin", "password": "string", "isActive?": true }` | none | `201 { status:true, data:{ id } }` | `400 INVALID`, `409 CONFLICT` |
| `GET /api/dashboard/dashboard-users/:id` | none | none | `{ status:true, data:user }` | `404 NOT_FOUND` |
| `PUT /api/dashboard/dashboard-users/:id` | `{ "role?": "string", "isActive?": true }` | none | `{ status:true, data:user }` | `400 INVALID`, `404 NOT_FOUND` |
| `DELETE /api/dashboard/dashboard-users/:id` | none | none | `{ status:true }` | `400 INVALID`, `404 NOT_FOUND` |
| `POST /api/dashboard/dashboard-users/:id/reset-password` | `{ "password": "string" }` | none | `{ status:true, data:{ id, passwordChangedAt } }` | `400 INVALID`, `404 NOT_FOUND` |

**TypeScript interface:**
```typescript
interface DashboardUsersListResponse {
  status: true;
  data: DashboardUserDTO[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
```

**Frontend file:** no frontend helper/page found.
**Frontend status:** ❌ Missing page/helper.

## Customers / Clients

**Verification status:** ✅ Confirmed

| Endpoint | Auth required | Body/query | Success response | Frontend file/status |
|---|---|---|---|---|
| `GET /api/dashboard/users` | admin/cashier read route exists before admin-only duplicate | query pagination through `resolvePaginationOrRespond` | `{ status:true, data:[...], meta:{ page, limit, total, totalPages } }` | ✅ `src/utils/fetchUsersData.ts` correct URL |
| `POST /api/dashboard/users` | admin-only; superadmin allowed | `{ "phone": "string", "fullName?": "string", "email?": "string", "isActive?": true }` | `{ status:true, data:user }` | ✅ `createUser` correct URL |
| `GET /api/dashboard/users/:id` | admin/cashier read route exists | none | `{ status:true, data:user }` | ✅ correct URL |
| `PUT /api/dashboard/users/:id` | admin-only; superadmin allowed | controller currently requires `isActive` in body | `{ status:true, data:user }` | ✅ correct URL; ⚠️ frontend generic update may send unsupported fields |
| `GET /api/dashboard/users/:id/subscriptions` | admin/cashier read route exists | none | `{ status:true, data }` | ⚠️ no dedicated helper found in `fetchUsersData.ts` |

**TypeScript interface:**
```typescript
interface PaginatedUsersResponse {
  status: true;
  data: User[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
```

**Verification note:** update user controller requires `isActive`; it is not a general profile update endpoint.

## Subscriptions / Manual Deduction

**Verification status:** ✅ Confirmed with service-level payloads resolved in v2.2

| Endpoint | Auth required | Body/query confirmed | Success response | Frontend status |
|---|---|---|---|---|
| `GET /api/dashboard/subscriptions/summary` | admin/cashier read route exists | query filters | `{ status:true, data:{ filters, summary } }` | ✅ helper exists |
| `GET /api/dashboard/subscriptions` | admin/cashier read route exists | query `status`, `page`, `limit`, `q`, date filters via service | `{ status:true, data:[...], meta, filters }` | ✅ helper exists |
| `POST /api/dashboard/subscriptions/quote` | admin-only | checkout quote payload table below | `{ status:true, data }` | ✅ helper exists |
| `POST /api/dashboard/subscriptions` | admin-only | checkout/create payload table below | `{ status:true, data }` | ✅ helper exists |
| `GET /api/dashboard/subscriptions/:id` | admin/cashier read route exists | none | `{ status:true, data }` | ✅ helper exists |
| `GET /api/dashboard/subscriptions/:id/days` | admin/cashier read route exists | none | `{ status:true, data:days }` | ⚠️ no dedicated frontend helper found |
| `GET /api/dashboard/subscriptions/:id/audit-log` | admin-only | query `limit` optional, max 20 | `{ status:true, data }` | ✅ helper exists |
| `PUT /api/dashboard/subscriptions/:id/delivery` | admin-only | delivery update payload table below; `reason` read for audit note | `{ status:true, data }` | ✅ helper exists |
| `GET /api/dashboard/subscriptions/:id/addon-entitlements` | admin/cashier route in `dashboardSubscriptions.js`; admin route also exists | none | `{ status:true, data }` | ✅ helper exists |
| `PATCH /api/dashboard/subscriptions/:id/addon-entitlements` | admin-only | `addonSubscriptions` or `entitlements` or `addonEntitlements`; `reason` used by frontend | `{ status:true, data:{ addonSubscriptions } }` | ✅ helper exists |
| `GET /api/dashboard/subscriptions/:id/balances` | admin/cashier in `dashboardSubscriptions.js`; admin route has `superadmin`/cashier guard | none | `{ status:true, data }` | ✅ helper exists |
| `PATCH /api/dashboard/subscriptions/:id/balances` | superadmin-only because nested guard after admin route | `premiumBalance` and/or `addonBalance` | `{ status:true, data }` | ❌ no frontend helper found |
| `POST /api/dashboard/subscriptions/:id/cancel` | admin-only | `reason?` read for audit note | `{ status:true, data }` | ✅ helper exists but sends no reason |
| `PUT/POST /api/dashboard/subscriptions/:id/extend` | admin-only | `{ "days": number, "reason?": "string" }` | `{ status:true, data }` | ✅ helper uses PUT |
| `POST /api/dashboard/subscriptions/:id/freeze` | admin-only | freeze payload table below | proxied success | ✅ helper sends `{ startDate, days }` |
| `POST /api/dashboard/subscriptions/:id/unfreeze` | admin-only | `reason?` read for audit note | proxied success | ✅ helper exists |
| `POST /api/dashboard/subscriptions/:id/days/:date/skip` | admin-only | `reason?` read for audit note | proxied success | ✅ helper exists |
| `POST /api/dashboard/subscriptions/:id/days/:date/unskip` | admin-only | `reason?` read for audit note | proxied success | ✅ helper exists |
| `GET /api/dashboard/subscriptions/search` | `admin`, `cashier` | query `phone` | `{ status:true, data }` | ✅ helper exists |
| `POST /api/dashboard/subscriptions/:subscriptionId/manual-deduction` | `admin` only | manual deduction payload table below | `{ status:true, data }` | ✅ helper exists; ⚠️ kitchen route access mismatch |

### Subscription quote/create payload fields

Source: `src/services/subscription/subscriptionQuoteService.js` and `src/services/subscription/subscriptionCheckoutService.js`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `planId` | ObjectId string | Yes | Validated as ObjectId; active plan required for normal quote. |
| `grams` | positive integer | Yes | Must match an active grams option on the plan. |
| `mealsPerDay` | positive integer | Yes | Must match an active meals option under selected grams. |
| `startDate` | date / `YYYY-MM-DD` | No | Must be today or future business date when supplied. |
| `delivery` | object | Yes | Preferred nested delivery object. |
| `delivery.type` | `"delivery" \| "pickup"` | No | Defaults to `delivery`; aliases from `deliveryMode`/slot type. |
| `delivery.address` | object | Required for delivery unless admin runtime allows missing | Alias `deliveryAddress`. |
| `delivery.zoneId` | ObjectId string | Required for delivery | Must reference an active zone unless renewal override applies. |
| `delivery.zoneName` | string | No | Server resolves from zone for delivery. |
| `delivery.slot` | object | Required for delivery | Contains `type`, `window`, `slotId`; must match configured delivery windows. |
| `delivery.window` | string | No | Alias for slot window. |
| `delivery.slotId` | string | No | Alias for slot id. |
| `delivery.pickupLocationId` | string | Required for pickup unless default active pickup location exists | Aliases: `delivery.locationId`, root `pickupLocationId`, root `locationId`. |
| `deliveryMode` | `"delivery" \| "pickup"` | No | Root alias for `delivery.type`. |
| `deliveryAddress` | object | No | Root alias for `delivery.address`. |
| `deliveryWindow` | string | No | Root alias for `delivery.slot.window`. |
| `deliverySlotId` / `slotId` | string | No | Root aliases for `delivery.slot.slotId`. |
| `premiumItems` | array | No | Items by `proteinId`/`id` or by `premiumKey`; each item requires positive `qty`. |
| `premiumSelections` | array | No | Admin controller aliases this to `premiumItems` when `premiumItems` is absent. |
| `premiumCount` | non-negative integer | No | If supplied, must equal sum of premium item quantities. |
| `addons` | array | No | Array of addon ids or objects with `id`/`addonId`; each must be active subscription addon plan with per-day billing. |
| `promoCode` | string | No | Validated through promo service against subscription quote. |
| `renewedFromSubscriptionId` | ObjectId string | No | Allows inactive zone exception in renewal path. |

Error codes from quote/create path: `VALIDATION_ERROR`, `NOT_FOUND`, `INVALID_SELECTION`, `INVALID_PREMIUM_ITEM`, `DELIVERY_WINDOW_MISSING`, `INVALID_DELIVERY_SLOT`, `PROMO_NOT_FOUND`, `PROMO_INACTIVE`, `PROMO_EXPIRED`, `PROMO_NOT_STARTED`, `PROMO_NOT_ELIGIBLE`, `PROMO_USAGE_LIMIT_REACHED`, `PROMO_USER_LIMIT_REACHED`, `PROMO_MINIMUM_NOT_MET`, `PROMO_NOT_APPLICABLE_TO_ORDER_TYPE`, `PROMO_INVALID_CONFIGURATION`, `IDEMPOTENCY_CONFLICT`.

### Subscription delivery update payload fields

Source: `src/services/subscription/subscriptionDeliveryUpdateService.js`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `delivery` | object | No | Preferred nested object. |
| `delivery.type` | `"delivery" \| "pickup"` | No | Alias root `deliveryMode`; active subscriptions cannot change mode unless service caller sets `allowModeChange`. |
| `delivery.slot.window` | string | No | Alias root `deliveryWindow`. Must be configured window if supplied. |
| `delivery.address` | object/null | No | Alias root `deliveryAddress`. |
| `delivery.zoneId` | ObjectId string/null | No | Alias root `deliveryZoneId`; required if changing delivery zone for delivery mode. |
| `delivery.pickupLocationId` | string/null | Required for pickup updates | Alias root `pickupLocationId`; must match active pickup location. |
| `reason` | string | No | Used by dashboard audit log, not by normalization. |

Error codes: `INVALID`, `DELIVERY_MODE_CHANGE_UNSUPPORTED`, `NOT_FOUND`, `FORBIDDEN`, `SUB_INACTIVE`, `SUB_EXPIRED`, `INVALID_DATE`, `LOCKED`.

### Freeze / unfreeze payload fields

Source: `src/services/subscription/subscriptionFreezeClientService.js`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `startDate` | `YYYY-MM-DD` KSA date string | Yes | Must be valid and future/tomorrow according to restaurant business date policy. |
| `days` | positive integer | Yes | Service builds an inclusive date range from `startDate`. |
| `reason` | string | No | Dashboard audit note only where controller reads it. |

Freeze/unfreeze error codes: `NOT_FOUND`, `FORBIDDEN`, `FREEZE_DISABLED`, `INVALID_DATE`, `INVALID`, `LOCKED`, `SUB_INACTIVE`, `SUB_EXPIRED`, `FREEZE_LIMIT_REACHED`, `FREEZE_CONFLICT`, `INTERNAL`.

### Skip / unskip payload and path fields

Source: `src/services/subscription/subscriptionSkipService.js`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `:date` | `YYYY-MM-DD` KSA date string | Yes | Path param for day skip/unskip. |
| `reason` | string | No | Dashboard audit note only where controller reads it. |

Skip/unskip error codes: `INVALID_DATE`, `NOT_FOUND`, `FORBIDDEN`, `SUB_INACTIVE`, `SUB_EXPIRED`, `SKIP_DISABLED`, `INVALID_TRANSITION`, `DATA_INTEGRITY_ERROR`.

### Manual deduction payload fields

Source: `src/services/dashboard/manualSubscriptionDeductionService.js`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `regularMeals` | non-negative integer | Yes, unless `premiumMeals` > 0 | Combined regular + premium total must be > 0. |
| `premiumMeals` | non-negative integer | Yes, unless `regularMeals` > 0 | Cannot exceed premium meal balance. |
| `reason` | string | No | Written into activity log metadata. |
| `notes` | string | No | Written into activity log metadata. |

Manual deduction error codes: `FORBIDDEN`, `CUSTOMER_NOT_FOUND`, `SUBSCRIPTION_NOT_FOUND`, `INVALID_MEAL_COUNT`, `SUBSCRIPTION_NOT_ACTIVE`, `INSUFFICIENT_REMAINING_MEALS`, `INSUFFICIENT_REGULAR_MEALS`, `INSUFFICIENT_PREMIUM_MEALS`, `DELIVERY_ALREADY_DEDUCTED_TODAY`.

**TypeScript interface:**
```typescript
interface SubscriptionsListResponse {
  status: true;
  data: SubscriptionDTO[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  filters: JsonObject;
}
```

## Payments / Finance

**Verification status:** ✅ Confirmed

| Endpoint | Auth required | Body/query confirmed | Success response | Errors | Frontend status |
|---|---|---|---|---|---|
| `GET /api/dashboard/payments` | admin/cashier read route exists | pagination query via `resolvePaginationOrRespond`; filters read in controller | `{ status:true, data:[...], meta }` | `400 INVALID` pagination | ✅ helper exists |
| `GET /api/dashboard/payments/:id` | admin/cashier read route exists | none | `{ status:true, data }` | `404 NOT_FOUND` | ✅ helper exists |
| `GET /api/dashboard/payments/:id/breakdown` | admin/cashier read route exists | none | same controller as detail | `404 NOT_FOUND` | ✅ helper exists |
| `POST /api/dashboard/payments/:id/verify` | first route admin-only; later admin-only route too | no request body read by controller | `{ status:true, data }` | `404 NOT_FOUND`, `409 INVALID`, `500 CONFIG`, `502 PAYMENT_PROVIDER_ERROR`, `409 MISMATCH` | ✅ helper exists |

**TypeScript interface:**
```typescript
interface PaymentsListResponse {
  status: true;
  data: PaymentDTO[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
```

Refund status: ❌ Backend missing. Searched all route files in `/src/routes/` on 2026-05-25 with `rg -n "refund|Refund" src/routes`; no dashboard refund route found.

## Plans / Packages

**Verification status:** ✅ Confirmed routes and payloads from `src/controllers/adminController.js`

Dashboard plan CRUD and nested plan mutations are sourced from `adminController.js`. `src/controllers/planController.js` is public catalog read-only behavior (`listPlans`, `getPlan`) and does not define dashboard create/update payloads.

Routes are admin-only; `superadmin` allowed.

| Endpoint group | URLs | Body confirmed | Success shape | Frontend status |
|---|---|---|---|---|
| Plan CRUD | `GET /plans`, `GET /plans/:id`, `POST /plans`, `PUT /plans/:id`, `DELETE /plans/:id` under `/api/dashboard` | create/update payload table below; delete no body | `{ status:true, data:PlanDTO }` or `{ status:true }` | ✅ package helpers exist |
| Plan state/sort/clone | `PATCH /plans/:id/toggle`, `PATCH /plans/:id/sort`, `POST /plans/:id/clone` | toggle and clone no body; sort body `sortOrder` | `{ status:true, data:PlanDTO }` | ✅ toggle helper exists; clone/sort coverage needs QA |
| Grams rows | `POST /plans/:id/grams`, `POST /plans/:id/grams/clone`, `DELETE /plans/:id/grams/:grams`, `PATCH /plans/:id/grams/:grams/toggle`, `PATCH /plans/:id/grams/:grams/sort` | grams, clone, sort tables below; toggle/delete no body | `{ status:true, data:PlanDTO }` | ⚠️ form coverage needs QA |
| Meals rows | `POST /plans/:id/grams/:grams/meals`, `POST /plans/:id/grams/:grams/meals/clone`, `DELETE /plans/:id/grams/:grams/meals/:mealsPerDay`, toggle/sort patches | meals, clone, sort tables below; toggle/delete no body | `{ status:true, data:PlanDTO }` | ⚠️ form coverage needs QA |

### Plan create/update payload fields

`POST /api/dashboard/plans` and `PUT /api/dashboard/plans/:id` both validate the full plan structure. Active plans must have at least one active grams row with at least one active meals row and a sellable `priceHalala > 0`, otherwise `400 INVALID_PLAN_STRUCTURE`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string or `{ ar, en }` | Yes | At least one non-empty localized/name value is required. |
| `daysCount` | positive integer | Yes | Subscription duration in days. |
| `currency` | non-empty string | No | Defaults to `SAR`. |
| `skipPolicy.enabled` | boolean | No | Defaults to `true`. |
| `skipPolicy.maxDays` | integer >= 0 | No | Defaults to `0`. |
| `freezePolicy.enabled` | boolean | No | Defaults to `true`. |
| `freezePolicy.maxDays` | integer >= 1 | No | Defaults to `31`. |
| `freezePolicy.maxTimes` | integer >= 0 | No | Defaults to `1`. |
| `isActive` | boolean | No | Defaults to `true`. |
| `sortOrder` | integer >= 0 | No | Defaults to `0`. |
| `gramsOptions` | array | Yes | Required for create/update and must contain at least one row. |
| `gramsOptions[].grams` | positive integer | Yes | Must be unique across grams rows. |
| `gramsOptions[].isActive` | boolean | No | Defaults to `true`. |
| `gramsOptions[].sortOrder` | integer >= 0 | No | Defaults from row order when omitted. |
| `gramsOptions[].mealsOptions` | array | Yes | Required and must be non-empty. |
| `mealsOptions[].mealsPerDay` | positive integer | Yes | Must be unique within the parent grams row. |
| `mealsOptions[].priceHalala` | integer >= 0 | Required unless price alias supplied | Preferred minor-unit price. |
| `mealsOptions[].priceSar` | number >= 0 | Alias | Converted to Halala when `priceHalala` is absent. |
| `mealsOptions[].price` | number >= 0 | Legacy alias | Treated like SAR when Halala/SAR fields are absent. |
| `mealsOptions[].compareAtHalala` | integer >= 0 | No | Preferred minor-unit compare-at price; defaults `0`. |
| `mealsOptions[].compareAtSar` | number >= 0 | Alias | Converted to Halala when `compareAtHalala` is absent. |
| `mealsOptions[].compareAt` | number >= 0 | Legacy alias | Treated like SAR when compare-at fields are absent. |
| `mealsOptions[].isActive` | boolean | No | Defaults to `true`. |
| `mealsOptions[].sortOrder` | integer >= 0 | No | Defaults from row order when omitted. |

### Plan nested route payload fields

| Endpoint | Required body | Optional body | Notes |
|---|---|---|---|
| `PATCH /plans/:id/sort` | `sortOrder` integer >= 0 | none | Updates plan ordering only. |
| `POST /plans/:id/clone` | none | none | Clones the existing plan body with server-generated name/sort handling. |
| `POST /plans/:id/grams` | `grams`, `mealsOptions[]` | `isActive`, `sortOrder` | Same grams option payload as plan create/update; `grams` must be unique. |
| `POST /plans/:id/grams/clone` | `grams`, `newGrams` | none | Both values must be positive integers; source grams must exist and target must not exist. |
| `DELETE /plans/:id/grams/:grams` | none | none | Cannot delete the final grams option. |
| `PATCH /plans/:id/grams/:grams/toggle` | none | none | Toggles grams row active state. |
| `PATCH /plans/:id/grams/:grams/sort` | `sortOrder` integer >= 0 | none | Updates grams row ordering only. |
| `POST /plans/:id/grams/:grams/meals` | `mealsPerDay`, one price alias | `compareAtHalala` or aliases, `isActive`, `sortOrder` | Same meals option payload as plan create/update; `mealsPerDay` must be unique within grams. |
| `POST /plans/:id/grams/:grams/meals/clone` | `mealsPerDay`, `newMealsPerDay` | none | Both values must be positive integers; source meals option must exist and target must not exist. |
| `DELETE /plans/:id/grams/:grams/meals/:mealsPerDay` | none | none | Cannot delete the final meals option for that grams row. |
| `PATCH /plans/:id/grams/:grams/meals/:mealsPerDay/toggle` | none | none | Toggles meals option active state. |
| `PATCH /plans/:id/grams/:grams/meals/:mealsPerDay/sort` | `sortOrder` integer >= 0 | none | Updates meals option ordering only. |

### Plan mutation errors

| HTTP | Code | Condition |
|---|---|---|
| 400 | `INVALID` | Invalid payload shape, number, duplicate grams/meals, or unsupported plan operation. |
| 400 | `INVALID_PLAN_STRUCTURE` | Active plan has no viable active grams/meals path or no positive active price. |
| 400 | `INVALID_ID` | Invalid ObjectId. |
| 404 | `NOT_FOUND` | Plan, grams row, or meals option not found. |
| 409 | `CONFLICT` | Duplicate/conflicting plan structure or mutation conflict. |

**TypeScript interface:**
```typescript
interface PlanResponse {
  status: true;
  data: PlanDTO;
}

interface PlansListResponse {
  status: true;
  data: PlanDTO[];
}
```

**Frontend file:** package helper files exist.
**Frontend status:** ⚠️ `fetchGetPackagesData.ts` catches and logs errors without rethrowing, which can hide failures.

## Addons

**Verification status:** ✅ Confirmed

Frontend uses addon items. Backend also exposes addon plans and generic addons.

### `GET /api/dashboard/addon-items`

**Auth required:** admin-only; `superadmin` allowed.

**Request body:** none.

**Query params:**
| Param | Type | Required | Description |
|---|---|---|---|
| kind | string | No | Forced to `item` by controller option for addon-items. |
| category | string | No | `juice`, `snack`, `small_salad`. |
| billingMode | string | No | `flat_once`, `per_day`, `per_meal`; item supports `flat_once`. |
| isActive | boolean | No | Active filter. |

**Success response `200`:**
```json
{
  "status": true,
  "data": [],
  "meta": { "filters": {}, "totalCount": 0 }
}
```

**TypeScript interface:**
```typescript
interface AddonsResponse {
  status: true;
  data: AddonDTO[];
  meta?: { filters: AddonListFilters; totalCount: number };
}

interface AddonListFilters {
  kind?: "plan" | "item";
  category?: "juice" | "snack" | "small_salad";
  billingMode?: "flat_once" | "per_day" | "per_meal";
  isActive?: boolean;
}
```

**Frontend file:** `src/utils/fetchAddons.ts`
**Frontend status:** ✅ Correct URL.

### Addon item mutations

| Endpoint | Body fields confirmed | Success response | Frontend status |
|---|---|---|---|
| `POST /api/dashboard/addon-items` | `kind`, `name`, `description`, `category`, `currency`, `priceHalala`, `isActive?`, `sortOrder?`, `billingMode?`, `menuProductId?` | `201 { status:true, data:{ id } }` | ✅ helper exists |
| `GET /api/dashboard/addon-items/:id` | none | `{ status:true, data:addon }` | ✅ helper exists |
| `PUT /api/dashboard/addon-items/:id` | same full payload | `{ status:true, data:{ id } }` | ✅ helper exists |
| `PATCH /api/dashboard/addon-items/:id/toggle` | none | `{ status:true, data:{ id, isActive } }` | ⚠️ helper coverage not confirmed |
| `DELETE /api/dashboard/addon-items/:id` | none | `{ status:true, data:{ id, isActive:false } }` | ✅ helper exists |

## Promo Codes / Coupons

**Verification status:** ✅ Confirmed

Routes are admin-only; `superadmin` allowed.

| Endpoint | Body/query confirmed | Success response | Errors | Frontend status |
|---|---|---|---|---|
| `GET /api/dashboard/promo-codes` | query `includeDeleted`; controller/service may also tolerate list params but no pagination response | `{ status:true, data:[...] }` | standard | ✅ helper exists; normalizer tolerates pagination |
| `GET /api/dashboard/promo-codes/:id` | none | `{ status:true, data:promo }` | `404 NOT_FOUND` | ✅ helper exists |
| `POST /api/dashboard/promo-codes` | normalized payload: `code`, `discountType`, `discountValue`, `appliesTo?`, `usageLimitTotal?`, `usageLimit?`, `usageLimitPerUser?`, date fields, eligibility fields | `201 { status:true, data:promo }` | `409 CONFLICT`, `422 PROMO_*` | ✅ helper exists |
| `PUT /api/dashboard/promo-codes/:id` | same normalized payload, with existing code fallback | `{ status:true, data:promo }` | `404 NOT_FOUND`, `409 CONFLICT`, `422 PROMO_*` | ✅ helper exists |
| `PATCH /api/dashboard/promo-codes/:id/toggle` | none | `{ status:true, data:promo }` | `404 NOT_FOUND` | ❌ helper missing |
| `DELETE /api/dashboard/promo-codes/:id` | none | `{ status:true, data:promo }` | `404 NOT_FOUND`, `409 PROMO_IN_USE` | ✅ helper exists |
| `POST /api/dashboard/promo-codes/validate` | body reads `code`, `userId`, `planId`, `subtotalHalala`, `appliesTo`/order type fields through service | `{ status:true, data }` | `PROMO_*` | ❌ helper missing |

### Promo normalized payload fields

Source: `src/services/promoCodeService.js`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | string | Yes | Trimmed and uppercased into `code`/`codeNormalized`. |
| `discountType` | `"percentage" \| "fixed" \| "fixed_amount"` | Yes | `fixed_amount` normalizes to `fixed`. |
| `discountValue` | number >= 0 | Yes | Percentage values over 100 later fail as invalid configuration. |
| `name` | localized object | No | Used to derive title and stored under metadata. |
| `title` | string | No | Falls back to `name.en`/`name.ar`. |
| `description` | string or localized object | No | Localized object stored under metadata. |
| `isActive` | boolean | No | Defaults to true. |
| `appliesTo` | string or array | No | Normalizes to `subscription`, `addon_plans`, or `all`; default `subscriptions` -> `subscription`. |
| `maxDiscountAmountHalala` / `maxDiscountHalala` | integer >= 0 | No | Preferred Halala input. |
| `maxDiscountAmountSar` | number >= 0 | No | Converted to Halala when Halala input absent. |
| `minimumSubscriptionAmountHalala` / `minOrderHalala` | integer >= 0 | No | Preferred Halala input. |
| `minimumSubscriptionAmountSar` | number >= 0 | No | Converted to Halala when Halala input absent. |
| `startsAt` | date string/date | No | Must parse as valid date. |
| `expiresAt` / `endsAt` | date string/date | No | Must parse as valid date. |
| `usageLimitTotal` / `usageLimit` | integer >= 0 | No | Total usage cap. |
| `usageLimitPerUser` | integer >= 0 | No | Per-user cap. |
| `eligiblePlanIds` / `planIds` | ObjectId string[] | No | Invalid ids are filtered out. |
| `eligiblePlanDaysCounts` | positive integer[] | No | Non-positive/non-integers filtered out. |
| `firstPurchaseOnly` | boolean | No | Requires user to have no prior active/expired/canceled subscriptions. |
| `allowedUserIds` | ObjectId string[] | No | Invalid ids are filtered out. |
| `currency` | string | No | Defaults to `SAR`. |
| `metadata` | object | No | Merged with normalized localized fields and `sortOrder`. |
| `addonPlanIds` | array | No | Stored in `metadata.addonPlanIds` only. |
| `sortOrder` | number | No | Stored in `metadata.sortOrder`. |

Confirmed `PROMO_*` codes: `PROMO_NOT_FOUND`, `PROMO_INACTIVE`, `PROMO_EXPIRED`, `PROMO_NOT_STARTED`, `PROMO_NOT_ELIGIBLE`, `PROMO_USAGE_LIMIT_REACHED`, `PROMO_USER_LIMIT_REACHED`, `PROMO_MINIMUM_NOT_MET`, `PROMO_NOT_APPLICABLE_TO_ORDER_TYPE`, `PROMO_INVALID_CONFIGURATION`.

**TypeScript interface:**
```typescript
interface PromoCodesListResponse {
  status?: true;
  data: PromoCodeAdminDTO[];
  meta?: { total: number; currentPage: number; totalPages: number; lastPage: number };
}
```

## Menu Catalog

**Verification status:** ✅ Confirmed routes; ⚠️ field acceptance resolved where `CatalogService` exposed fields; remaining create/update acceptance is controller/model-specific and should be validated before widening UI forms

All menu routes use `dashboardAuthMiddleware` and `dashboardRoleMiddleware(["admin","superadmin"])`. Because `superadmin` is always allowed, effective roles are admin and superadmin only.

### Menu categories

| Endpoint | Body/query confirmed | Success response | Frontend status |
|---|---|---|---|
| `GET /api/dashboard/menu/categories` | query `includeInactive`, `isActive`, `isVisible`, `isAvailable`, `q`, `published`, `groupId`, `page`, `limit` | `{ status:true, data }` | ✅ helper correct |
| `POST /api/dashboard/menu/categories` | category payload table below | `201 { status:true, data }` | ✅ helper correct |
| `GET /api/dashboard/menu/categories/:id` | none | `{ status:true, data }` | ✅ helper correct |
| `PATCH /api/dashboard/menu/categories/:id` | category payload table below | `{ status:true, data }` | ✅ helper correct |
| `PATCH /api/dashboard/menu/categories/:id/visibility` | `isVisible` visibility patch | `{ status:true, data }` | ⚠️ no dedicated helper found |
| `PATCH /api/dashboard/menu/categories/:id/availability` | `isAvailable` availability patch | `{ status:true, data }` | ⚠️ no dedicated helper found |
| `DELETE /api/dashboard/menu/categories/:id` | none | `{ status:true, data }` | ✅ helper correct |
| `PATCH /api/dashboard/menu/categories/reorder` | `{ "items": [{ "id": "string", "sortOrder": 1 }] }` or raw array | `{ status:true, data }` | ✅ helper correct |

**TypeScript interface:**
```typescript
interface MenuCategoriesResponse {
  status: true;
  data: { items: MenuCategory[]; pagination?: PaginationMeta } | MenuCategory[];
}
```

### Menu products

| Endpoint | Body/query confirmed | Success response | Frontend status |
|---|---|---|---|
| `GET /api/dashboard/menu/products` | same list query fields as menu categories | `{ status:true, data }` | ✅ helper correct |
| `POST /api/dashboard/menu/products` | product payload table below; service/catalog confirms `availableFor` and `priceHalala` are real fields | `201 { status:true, data }` | ⚠️ helper exists; UI must expose `availableFor` |
| `PATCH /api/dashboard/menu/products/:id` | product payload table below | `{ status:true, data }` | ✅ helper exists |
| `PATCH /api/dashboard/menu/products/:productId/availability` | if `branchAvailability` or `branchIds`, controller maps to `{ branchAvailability }`; otherwise delegates body | `{ status:true, data }` | ✅ helper sends `{ isAvailable }` |
| `POST /api/dashboard/menu/products/:id/duplicate` | no body | `{ status:true, data }` | ❌ helper missing |
| `DELETE /api/dashboard/menu/products/:id` | none | `{ status:true, data }` | ✅ helper exists |
| `PATCH /api/dashboard/menu/products/reorder` | `{ items }` or raw array | `{ status:true, data }` | ✅ helper exists |

**TypeScript interface:**
```typescript
interface MenuProductResponse {
  status: true;
  data: MenuProduct;
}
```

### Option groups and options

Option field facts confirmed by source reads:
- `displayCategoryKey` is used by catalog service.
- `extraFeeHalala` and `extraPriceHalala` are both recognized in catalog reads.
- `availableFor` is a real product/option channel field.
- `ruleTags` is expected as an array where used.
- `selectionType` is used by catalog mapping.

### Menu category payload fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | localized object/string | Yes for create | Display name. Exact controller normalization lives in `menuController`; field confirmed by frontend/model usage. |
| `description` | localized object/string | No | Optional description. |
| `key` | string | No | Catalog key when used by menu/category contracts. |
| `sortOrder` | integer | No | Used for ordering and reorder routes. |
| `isActive` | boolean | No | Active state. |
| `isVisible` | boolean | No | Visibility state; visibility route patches this concept. |
| `isAvailable` | boolean | No | Availability state; availability route patches this concept. |
| `availableFor` | string[] | No | Channel list; catalog query treats missing/empty as available for subscription. |
| `groupId` | ObjectId string | No | Optional category grouping filter/field. |

### Menu product payload fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | localized object/string | Yes for create | Product display name. |
| `description` | localized object/string | No | Optional description. |
| `categoryId` | ObjectId string | No | Category assignment; `/products/:id/category` also maps through update. |
| `imageUrl` | string | No | Managed image URL should normally come from upload flow. |
| `itemType` | string | No | Catalog service recognizes sandwich types `cold_sandwich`, `sourdough`; order model has broader item types. |
| `availableFor` | string[] | No | Must include `subscription` for subscription builder visibility, or be missing/empty. |
| `availableForSubscription` | boolean | No | Options use this in subscription catalog query; keep aligned with `availableFor`. |
| `priceHalala` | integer | No | Minor units. |
| `pricingModel` | string | No | Used by subscription builder sandwich payload. |
| `proteinFamilyKey` | string | No | Used for sandwich/catalog classification. |
| `calories` | number | No | Nutrition display. |
| `sortOrder` | integer | No | Ordering. |
| `isActive` | boolean | No | Active state. |
| `isVisible` | boolean | No | Visibility state. |
| `isAvailable` | boolean | No | Availability state. |
| `branchAvailability` | object/array | No | Availability route maps `branchIds`/`branchAvailability` to this field. |
| `branchIds` | string[] | No | Availability route alias for branch availability. |

### Menu option/group payload fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `groupId` | ObjectId string | Required for options under a group | Used by `MenuOption` query and nested group routes. |
| `name` | localized object/string | Yes for create | Option/group display name. |
| `description` | localized object/string | No | Optional description. |
| `key` | string | No | Used as fallback for premium key/family inference. |
| `displayCategoryKey` | string | No | Source-backed field for protein/carb grouping; frontend should not send `displayCategory`. |
| `proteinFamilyKey` | string | No | Inferred from `displayCategoryKey`/`key` if absent. |
| `ruleTags` | string[] | No | Catalog service expects an array where used. |
| `selectionType` | string | No | Catalog mapping emits meal selection types such as standard/premium meal and premium large salad. |
| `premiumKey` | string | No | Used for premium identity and premium checkout. |
| `extraFeeHalala` | integer | No | Preferred extra fee field in Halala. |
| `extraPriceHalala` | integer | No | Legacy/fallback extra fee field. |
| `priceHalala` | integer | No | Product/large salad price in Halala. |
| `currency` | string | No | Defaults to system currency `SAR` in catalog paths. |
| `nutrition.calories` | number | No | Catalog maps to `calories`. |
| `availableFor` | string[] | No | Channel list; must permit `subscription` for builder visibility. |
| `availableForSubscription` | boolean | No | Must not be `false` for subscription builder visibility. |
| `isActive` / `isVisible` / `isAvailable` | boolean | No | Catalog active/visible/available gates. |
| `sortOrder` | integer | No | Ordering and reorder routes. |

### Product relation payload fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `groupId` | ObjectId string | Yes for single relation create/update | Also appears in path for relation-specific routes. |
| `optionId` | ObjectId string | Yes for option relation create/update | Also appears in path for triple-identity update. |
| `groups` | array | Yes for `PUT /products/:productId/groups` | Full replacement list. |
| `options` | array | Yes for `PUT /products/:productId/groups/:groupId/options` | Full replacement list. |
| `selectionRules` | object | No | Used by selection-rules route; exact nested rule schema remains controller/model-specific. |
| `minSelect` / `maxSelect` | integer | No | Expected selection constraints where group rules are exposed. |
| `isRequired` | boolean | No | Expected relation/group rule field. |
| `sortOrder` | integer | No | Relation ordering. |
| `isActive` / `isVisible` / `isAvailable` | boolean | No | Relation gates. |

| Endpoint group | URLs | Frontend status |
|---|---|---|
| Option groups | `GET/POST/PATCH/DELETE /api/dashboard/menu/option-groups*`, visibility, availability, reorder, nested group options | ✅ helpers exist; visibility/availability helpers exist |
| Options | `GET/POST/PATCH/DELETE /api/dashboard/menu/options*`, visibility, availability, toggle, reorder | ✅ helpers exist; ensure UI sends `displayCategoryKey`, not `displayCategory` |

**TypeScript interface:**
```typescript
interface MenuOptionResponse {
  status: true;
  data: MenuOption;
}
```

### Product relations / product-specific pricing

| Endpoint | Body confirmed | Frontend status |
|---|---|---|
| `GET /api/dashboard/menu/products/:productId/option-groups` | none | ⚠️ no explicit list helper found; relation tab may depend on other helpers |
| `POST /api/dashboard/menu/products/:productId/option-groups` | relation payload table below | ⚠️ helper coverage partial |
| `PATCH /api/dashboard/menu/products/:productId/option-groups/:groupId/selection-rules` | selection rules payload table below | ✅ helper exists |
| `PUT /api/dashboard/menu/products/:productId/groups` | `req.body.groups` or raw body | ✅ helper exists; replaces full list |
| `PUT /api/dashboard/menu/products/:productId/groups/:groupId/options` | `req.body.options` or raw body | ✅ helper exists; replaces full list |
| `PATCH /api/dashboard/menu/products/:productId/option-groups/:groupId/options/:optionId` | requires all three route IDs; rejects if body includes conflicting id fields | ✅ helper uses triple URL |

**TypeScript interface:**
```typescript
interface MenuRelationMutationResponse {
  status: true;
  data: JsonObject;
}
```

### Publish / validate / audit / versions / rollback

| Endpoint | Body/query confirmed | Success response | Frontend status |
|---|---|---|---|
| `POST /api/dashboard/menu/validate` | no body needed | `{ status:true, data:{ ok, errors, warnings, summary } }` | ✅ helper exists |
| `POST /api/dashboard/menu/publish` | `{ "notes?": "string" }` | `{ status:true, data:MenuVersion }` | ✅ helper exists |
| `GET /api/dashboard/menu/audit-logs` | query pagination/filter fields are passed to controller | `{ status:true, data }` | ✅ helper exists |
| `GET /api/dashboard/menu/versions` | query pagination/filter fields are passed to controller | `{ status:true, data }` | ❌ no frontend helper found |
| `POST /api/dashboard/menu/rollback/:versionId` | `{ "confirm": true }` required | custom `200` response with `restoredVersion`, `backupVersion`, and `data.rollback` | ❌ no frontend helper found |

**Error responses:**
| HTTP | Code | When | Shape |
|---|---|---|---|
| 400 | ROLLBACK_CONFIRMATION_REQUIRED | rollback body does not contain `confirm: true` | standard |
| 400 | MENU_VALIDATION_ERROR | Mongoose validation error | standard |
| 409 | MENU_CONFLICT | duplicate key | standard |
| 500 | MENU_INTERNAL_ERROR | unhandled menu error | standard |

**TypeScript interface:**
```typescript
interface MenuRollbackResponse {
  status: true;
  success: true;
  restoredVersion: string;
  backupVersion: string;
  data: { success: true; restoredVersion: string; backupVersion: string; rollback: JsonObject };
}
```

## Image Upload

**Verification status:** ✅ Confirmed

### `POST /api/dashboard/uploads/image`

**Auth required:** admin-only via admin router; `superadmin` allowed.

**Request body:** multipart form data.
```json
{
  "image": "File — required multipart field",
  "folder?": "string"
}
```

**Query params:** none.

**Success response `201`:**
```json
{
  "status": true,
  "data": {}
}
```

**Error responses:**
| HTTP | Code | When | Shape |
|---|---|---|---|
| 400 | INVALID | file too large, unexpected file, invalid MIME | standard |
| 400 | n/a | missing `req.file` | legacy-upload |

**TypeScript interface:**
```typescript
interface UploadImageResponse {
  status: true;
  data: UploadImageDTO;
}

interface UploadImageDTO {
  url?: string;
  secureUrl?: string;
  publicId?: string;
  resourceType?: string;
}
```

**Frontend file:** `src/utils/fetchUploadImage.ts`
**Frontend status:** ✅ Correct URL and field `image`; ⚠️ response type only models `data.url`.

### Upload Constraints

Source files: `src/middleware/imageUpload.js`, `src/controllers/uploadController.js`, `src/services/adminImageService.js`.

| Constraint | Confirmed value |
|---|---|
| Max file size | Default `5 * 1024 * 1024` bytes = `5,242,880` bytes = 5 MiB. Runtime override: `IMAGE_UPLOAD_MAX_BYTES` if finite and > 0. |
| File count | Exactly one file accepted by `.single("image")`; unexpected extra/different file field returns `400 INVALID`. |
| Accepted MIME types | Any MIME type whose `file.mimetype` starts with `image/`. This is prefix-based, not a closed list. |
| Multipart field name | `image` confirmed by middleware default and missing-file legacy error. |
| Optional body fields | `folder` forwarded to upload service. |
| Success response | `201 { status:true, data:{ url, secureUrl, publicId, resourceType } }`. |
| Missing file response | `400 { success:false, message:"Image file is required under the image field", expectedField:"image" }`. |
| Upload provider failure | `502 UPLOAD_FAILED` if Cloudinary response has no secure URL. |

Frontend mismatch: `src/utils/fetchUploadImage.ts` models only `data.url`; it should also tolerate `secureUrl`, `publicId`, and `resourceType`.

## Menu Identity Mapping

**Verification status:** ✅ Confirmed

Routes are mounted twice: `/api/dashboard/menu-identities-audit/*` and `/api/dashboard/*`; frontend uses `/api/dashboard/*`. Auth is `dashboardAuthMiddleware` plus `dashboardRoleMiddleware(["admin"])`; `superadmin` allowed.

| Endpoint | Query/body confirmed | Success response | Frontend status |
|---|---|---|---|
| `GET /api/dashboard/menu-identities` | query `page`, `limit`, `key`, `type`, `isActive` | `{ status:true, data:{ items, pagination } }` | ✅ helper exists |
| `GET /api/dashboard/menu-identities/:id` | none | `{ status:true, data:item }` | ✅ helper exists |
| `GET /api/dashboard/menu-identities/:id/links` | none | `{ status:true, data:links }` | ✅ helper exists |
| `GET /api/dashboard/menu-identity-links` | query `page`, `limit`, `channel`, `sourceModel`, `confidence`, `status`, `isActive`, `identityId` | `{ status:true, data:{ items, pagination } }` | ✅ helper exists |
| `GET /api/dashboard/menu-identity-suggestions` | query `page`, `limit`, `status`, `type`, `confidence` | `{ status:true, data:{ items, pagination } }` | ✅ helper exists |
| `GET /api/dashboard/menu-identity-suggestions/:id` | none | `{ status:true, data }` | ✅ helper exists |
| `POST /api/dashboard/menu-identity-suggestions/:id/approve` | `{ "notes?": "string" }` | `{ status:true, data }` | ✅ helper exists |
| `POST /api/dashboard/menu-identity-suggestions/:id/reject` | `{ "notes?": "string" }` | `{ status:true, message:"Suggestion rejected" }` | ✅ helper exists |

**TypeScript interface:**
```typescript
interface MenuIdentityListResponse {
  status: true;
  data: { items: MenuIdentity[]; pagination: PaginationMeta };
}
```

**Frontend status:** helpers exist, no dedicated route/page found.

## One-Time Orders

**Verification status:** ⚠️ Partially corrected

Routes use `dashboardAuthMiddleware` plus `dashboardRoleMiddleware(["admin","kitchen","courier"])`; `superadmin` allowed by middleware.

| Endpoint | Body/query confirmed | Success response | Frontend status |
|---|---|---|---|
| `GET /api/dashboard/orders` | query `status`, `paymentStatus`, `fulfillmentMethod`, `from`, `to`, `date`, `zoneId`, `q`, `page`, `limit` | `{ status:true, data:{ items, pagination } }` | ✅ helper exists; ⚠️ frontend sends `branchId`, backend order controller does not read `branchId` |
| `GET /api/dashboard/orders/:orderId` | none | `{ status:true, data }` | ✅ helper exists |
| `GET /api/dashboard/orders/:orderId/timeline` | none | `{ status:true, data }` | ⚠️ no dedicated frontend helper found |
| `POST /api/dashboard/orders/:orderId/actions/:action` | entire `req.body` passed as action payload | `{ status:true, data }` | ✅ action helpers exist |

**TypeScript interface:**
```typescript
interface OneTimeOrderListResponse {
  status: true;
  data: { items: OneTimeOrderListItem[]; pagination: { page: number; limit: number; total: number; pages: number } };
}
```

**Confirmed finding:** `src/utils/fetchOneTimeOrders.ts` sends `branchId` to `GET /api/dashboard/orders`, but `src/controllers/dashboard/orderDashboardController.js` only forwards `status`, `paymentStatus`, `fulfillmentMethod`, `from`, `to`, `date`, `zoneId`, and `q` into service filters. `branchId` is silently ignored by this backend route unless backend service/controller support is added later.

**Verification note:** the original report listed `dispatch` and `notify_arrival` as supported one-time order actions. Frontend source marks these as unsupported for one-time orders. Backend route is generic, but exact allowed one-time transitions are enforced by service, so v2.2 documents only generic route plus frontend-supported actions and marks dispatch/notify_arrival for one-time orders as blocked in the current frontend.

## Operations / Kitchen / Pickup / Courier

**Verification status:** ✅ Confirmed

| Endpoint | Auth required | Body/query confirmed | Success response | Frontend status |
|---|---|---|---|---|
| `GET /api/dashboard/ops/list` | admin, kitchen, courier | query `date` required; must be `YYYY-MM-DD` | `{ status:true, data }` | ✅ helper exists |
| `GET /api/dashboard/ops/search` | admin, kitchen, courier | query `q`; empty q returns empty array | `{ status:true, data }` | ✅ helper exists |
| `POST /api/dashboard/ops/actions/:action` | admin, kitchen, courier | `{ "entityId": "string", "entityType": "subscription_day|pickup_day|subscription|order", "source?": "one_time_order", "payload?": {}, "code?": "string", "pickupCode?": "string" }` | `{ status:true, data }` | ✅ helper exists |
| `GET /api/dashboard/kitchen/queue` | route allows admin/kitchen/courier, controller enforces kitchen/admin for kitchen screen | query `date`, `method`, `q/search`, `status`, `zoneId`, `branchId` | `{ status:true, data:{ date, items, filters } }` | ✅ helper exists |
| `GET /api/dashboard/pickup/queue` | route allows admin/kitchen/courier, controller enforces kitchen/admin for pickup screen | same board query | `{ status:true, data:{ date, items, filters } }` | ✅ helper exists |
| `GET /api/dashboard/courier/queue` | route allows admin/kitchen/courier, controller enforces courier/admin for courier screen | same board query | `{ status:true, data:{ date, items, filters } }` | ✅ helper exists |
| `GET /api/dashboard/{screen}/queue/:dayId` | admin/kitchen/courier route; controller screen-specific rules | none | `{ status:true, data }` | ⚠️ no dedicated helper found |
| `POST /api/dashboard/{screen}/actions/:action` | admin/kitchen/courier route; controller screen-specific rules | same action body as ops action | `{ status:true, data }` | ✅ pickup/courier helpers exist |
| `GET /api/dashboard/delivery-schedule` | admin, courier | controller sets `method=delivery` | `{ status:true, data:{ items, filters } }` | ⚠️ delivery page/helper coverage partial |

**Error responses:** `400 INVALID`, `400 INVALID_REQUEST`, `400 INVALID_ENTITY_TYPE`, `400 INVALID_ENTITY_ID`, `400 INVALID_PICKUP_CODE`, `403 FORBIDDEN`, `404 NOT_FOUND`, `409 INVALID_TRANSITION`, `409 INVALID_STATE_TRANSITION`, `409 ORDER_PAYMENT_REQUIRED`, `409 PICKUP_PREPARE_REQUIRED`.

**TypeScript interface:**
```typescript
interface DashboardOpsActionResponse {
  status: true;
  data: UnifiedOperationalDTO | UnifiedOperationalDTO[] | OpsQueueResponseDTO;
}

interface OpsQueueResponseDTO {
  date?: string;
  items?: UnifiedOperationalDTO[];
  filters?: JsonObject;
}
```

## Delivery Zones

**Verification status:** ✅ Confirmed

Routes are admin-only; `superadmin` allowed.

| Endpoint | Body/query confirmed | Success response | Frontend status |
|---|---|---|---|
| `GET /api/dashboard/zones` | query `isActive`, `q` | `{ status:true, data:rows, meta:{ filters, totalCount } }` | ✅ helper exists but sends unused `page`, `limit`; `q` is supported |
| `POST /api/dashboard/zones` | `{ "name": "string|{ar,en}", "deliveryFeeHalala": 0, "isActive?": true, "sortOrder?": 0 }` | `201 { status:true, data:zone }` | ✅ helper exists |
| `GET /api/dashboard/zones/:id` | none | `{ status:true, data:zone }` | ⚠️ no helper found |
| `PUT /api/dashboard/zones/:id` | same full zone payload | `{ status:true, data:zone }` | ✅ helper exists |
| `PATCH /api/dashboard/zones/:id/toggle` | none | `{ status:true, data:{ id, isActive } }` | ❌ helper missing |
| `DELETE /api/dashboard/zones/:id` | none | `{ status:true, data:{ id, isActive } }` | ✅ helper exists |

**TypeScript interface:**
```typescript
interface ZonesListResponse {
  status: true;
  data: ZoneDTO[];
  meta: { filters: ZoneListFilters; totalCount: number };
}

interface ZoneListFilters {
  isActive?: boolean;
  q?: string;
  search?: JsonValue[];
}
```

**Confirmed finding:** `src/utils/fetchDeliveryZonesData.ts` sends `page`, `limit`, and `q`. Backend `src/controllers/zoneController.js` reads `isActive` and `q`; `page` and `limit` are silently ignored, and the response uses `meta.totalCount` rather than paginated `meta.total/totalPages`.

## Content / Terms

**Verification status:** ✅ Confirmed

Routes are admin-only under `/api/dashboard` through `src/routes/admin.js`; public read route also exists under `/api/content/terms/subscription`.

| Endpoint | Body/query confirmed | Success response | Frontend status |
|---|---|---|---|
| `GET /api/dashboard/content/terms/subscription` | query `locale?` | `{ status:true, data }` | ❌ missing helper/page |
| `PUT /api/dashboard/content/terms/subscription` | content write payload table below | `{ status:true, data }` | ❌ missing helper/page |

### Content write payload fields

Source: `src/services/appContentService.js`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | non-empty string | Yes | Trimmed; empty title returns `422 VALIDATION_ERROR`. |
| `locale` | string | Yes | Normalized lower-case; defaults internally to `ar` if omitted, but OpenAPI requires it. |
| `content` | non-empty string or object | Yes | String is trimmed. Object must not be empty. |
| `content.sections` | array | No | If present as an empty array, returns `422 VALIDATION_ERROR`. |

**Error responses:** `404 NOT_FOUND`; service validation errors returned through standard shape.

**TypeScript interface:**
```typescript
interface SubscriptionTermsResponse {
  status: true;
  data: JsonObject;
}
```

## Logs / Notifications / Health

**Verification status:** ✅ Confirmed

Routes are admin-only under `/api/dashboard`; `superadmin` allowed.

| Endpoint | Query confirmed | Success response | Frontend status |
|---|---|---|---|
| `GET /api/dashboard/logs` | query `userId`, `entityType`, `entityId`, `action`, `from`, `to`, pagination | `{ status:true, data:[...], meta }` | ❌ missing helper/page |
| `GET /api/dashboard/notification-logs` | query `userId`, `entityId`, `from`, `to`, pagination | `{ status:true, data:[...], meta }` | ❌ missing helper/page |
| `GET /api/dashboard/health/catalog` | none | `{ status:true, data }` | ❌ missing helper/page |
| `GET /api/dashboard/health/subscription-menu` | none | `{ status:true, data }` | ❌ missing helper/page |
| `GET /api/dashboard/health/meal-planner` | none | `{ status:true, data }` | ❌ missing helper/page |
| `GET /api/dashboard/health/indexes` | none | `{ status:true, data }` | ❌ missing helper/page |

**TypeScript interface:**
```typescript
interface DashboardHealthResponse {
  status: true;
  data: JsonObject;
}
```

## Unsupported / Product Decision Modules

| Module | Backend status | Frontend status | Required decision |
|---|---|---|---|
| Refund operations | ❌ Backend missing | Missing | Searched all route files in `/src/routes/`. No dashboard refund route found as of 2026-05-25. |
| Banners | ❌ Backend missing | Missing | No dashboard banner route or frontend module found in verified source reads. |
| Standalone branches management | Product decision needed | Missing | Branch fields appear in ops/order filters, but no standalone branch management dashboard route/API helper was verified. |

## Mutation Error Code Addendum

This v2.2 pass confirmed service-level mutation errors for the route families below. Use this as the mutation error supplement for every POST/PUT/PATCH/DELETE endpoint in the corresponding family; route-specific tables above remain the primary endpoint contract.

| Endpoint family | HTTP status | Code string | Condition |
|---|---:|---|---|
| Auth login/logout | 400 | `INVALID` | Missing/invalid login fields |
| Auth login/logout | 401 | `UNAUTHORIZED` | Bad credentials, missing/invalid token, invalid token type/payload |
| Auth login/logout | 401 | `TOKEN_REVOKED` | Password changed after token `iat` |
| Auth login/logout | 403 | `FORBIDDEN` | Inactive user or insufficient dashboard role |
| Auth login | 423 | `LOCKED` | Too many failed login attempts |
| Auth login | 429 | `RATE_LIMIT` | Login rate limiter exceeded |
| Settings mutations | 400 | `INVALID` | Invalid setting key/body/time/window/number format |
| Dashboard users mutations | 400 | `INVALID` / `INVALID_ID` | Invalid payload, pagination, or ObjectId |
| Dashboard users mutations | 404 | `NOT_FOUND` | User not found |
| Dashboard users mutations | 409 | `CONFLICT` | Duplicate email or protected self/role conflict |
| App customer mutations | 400 | `INVALID` / `INVALID_ID` | Invalid payload or ObjectId |
| App customer mutations | 404 | `NOT_FOUND` | Customer not found |
| Subscription quote/create | 400 | `VALIDATION_ERROR` | Invalid plan/date/delivery/premium/addon/promo input |
| Subscription quote/create | 404 | `NOT_FOUND` | Plan, addon, or zone not found |
| Subscription quote/create | 400 | `INVALID_SELECTION` | Selected plan grams/meals/addon/zone unavailable |
| Subscription quote/create | 400 | `INVALID_PREMIUM_ITEM` | Premium item cannot be resolved |
| Subscription quote/create | 400 | `DELIVERY_WINDOW_MISSING` / `INVALID_DELIVERY_SLOT` | Missing or invalid delivery slot/window |
| Subscription quote/create | 400 | `PROMO_*` | Promo validation failures listed in Promo section |
| Subscription quote/create | 409 | `IDEMPOTENCY_CONFLICT` | Idempotency key reused with different checkout payload |
| Subscription delivery mutation | 400 | `INVALID` / `INVALID_DATE` | Invalid delivery payload/date/window |
| Subscription delivery mutation | 403 | `FORBIDDEN` | User/subscription ownership failure |
| Subscription delivery mutation | 404 | `NOT_FOUND` | Subscription or zone not found |
| Subscription delivery mutation | 409 | `LOCKED` | Day is locked |
| Subscription delivery mutation | 422 | `DELIVERY_MODE_CHANGE_UNSUPPORTED` / `SUB_INACTIVE` / `SUB_EXPIRED` | Unsupported mode change or inactive/expired subscription |
| Freeze/unfreeze mutations | 400 | `INVALID_DATE` / `INVALID` / `LOCKED` | Invalid date, days, or cutoff/locked day |
| Freeze/unfreeze mutations | 403 | `FORBIDDEN` / `FREEZE_LIMIT_REACHED` | Ownership or plan freeze limits |
| Freeze/unfreeze mutations | 404 | `NOT_FOUND` | Subscription not found |
| Freeze/unfreeze mutations | 409 | `FREEZE_CONFLICT` | Concurrent/state conflict |
| Freeze/unfreeze mutations | 422 | `FREEZE_DISABLED` / `SUB_INACTIVE` / `SUB_EXPIRED` | Plan/status disallows freeze |
| Skip/unskip mutations | 400 | `INVALID_DATE` | Date before tomorrow or invalid |
| Skip/unskip mutations | 403 | `FORBIDDEN` | Ownership failure |
| Skip/unskip mutations | 404 | `NOT_FOUND` | Subscription/day not found |
| Skip/unskip mutations | 409 | `INVALID_TRANSITION` / `DATA_INTEGRITY_ERROR` | Day cannot be unskipped/restored |
| Skip/unskip mutations | 422 | `SKIP_DISABLED` / `SUB_INACTIVE` / `SUB_EXPIRED` | Plan/status disallows skip |
| Manual deduction mutation | 400 | `INVALID_MEAL_COUNT` | Meal counts invalid or total <= 0 |
| Manual deduction mutation | 403 | `FORBIDDEN` | Not admin/superadmin |
| Manual deduction mutation | 404 | `CUSTOMER_NOT_FOUND` / `SUBSCRIPTION_NOT_FOUND` | Customer/subscription missing |
| Manual deduction mutation | 409 | `SUBSCRIPTION_NOT_ACTIVE` / `INSUFFICIENT_*` / `DELIVERY_ALREADY_DEDUCTED_TODAY` | State or balance failure |
| Payment verify | 404 | `NOT_FOUND` | Payment missing |
| Payment verify | 409 | `INVALID` / `MISMATCH` | Invalid state or provider amount/status mismatch |
| Payment verify | 500 | `CONFIG` | Provider configuration failure |
| Payment verify | 502 | `PAYMENT_PROVIDER_ERROR` | Moyasar/provider failure |
| Promo code mutations | 400/422 | `PROMO_INVALID_CONFIGURATION` | Invalid normalized promo body |
| Promo code mutations | 400 | `PROMO_NOT_FOUND`, `PROMO_INACTIVE`, `PROMO_EXPIRED`, `PROMO_NOT_STARTED`, `PROMO_NOT_ELIGIBLE`, `PROMO_USAGE_LIMIT_REACHED`, `PROMO_USER_LIMIT_REACHED`, `PROMO_MINIMUM_NOT_MET`, `PROMO_NOT_APPLICABLE_TO_ORDER_TYPE` | Promo validation/apply failure |
| Promo code mutations | 404 | `NOT_FOUND` | Promo id not found |
| Promo code mutations | 409 | `CONFLICT` / `PROMO_IN_USE` | Duplicate code or delete blocked by usage |
| Zones mutations | 400 | `INVALID` / `INVALID_ID` | Invalid body, boolean, Halala, or id |
| Zones mutations | 404 | `NOT_FOUND` | Zone not found |
| Upload mutation | 400 | `INVALID` | File too large, invalid MIME, unexpected field, missing managed image rules |
| Upload mutation | 502 | `UPLOAD_FAILED` | Upload provider did not return secure URL |
| Content terms mutation | 400 | `INVALID` | Body is not an object |
| Content terms mutation | 422 | `VALIDATION_ERROR` | Missing title/locale/content or empty structured content |
| Menu mutations | 400 | `ROLLBACK_CONFIRMATION_REQUIRED` / `MENU_VALIDATION_ERROR` | Missing rollback confirmation or Mongoose validation |
| Menu mutations | 409 | `MENU_CONFLICT` | Duplicate key/conflict |
| Menu mutations | 500 | `MENU_INTERNAL_ERROR` | Unhandled menu mutation error |
| Ops/order action mutations | 400 | `INVALID`, `INVALID_REQUEST`, `INVALID_ENTITY_TYPE`, `INVALID_ENTITY_ID`, `INVALID_PICKUP_CODE` | Invalid action payload |
| Ops/order action mutations | 403 | `FORBIDDEN` | Screen/action role rejected |
| Ops/order action mutations | 404 | `NOT_FOUND` | Entity not found |
| Ops/order action mutations | 409 | `INVALID_TRANSITION`, `INVALID_STATE_TRANSITION`, `ORDER_PAYMENT_REQUIRED`, `PICKUP_PREPARE_REQUIRED` | State/action precondition failure |

## Release Gate Checklist

| Gate | Current status | Required action | Verification command for release gate |
|---|---|---|---|
| Dependencies | Not run in this pass | Install from lockfile | `npm install` |
| Lint | Not run in this pass | Run and fix errors | `npm run lint` |
| Typecheck | Not run in this pass | Run and fix errors | `npm run typecheck` |
| Build | Not run in this pass | Run and fix errors | `npm run build` |
| Tests | Script not verified | Add/document test command | `npm test` or approved alternative |
| RBAC | Failing frontend/backend alignment | Remove kitchen `/menu`; fix manual-deduction role visibility | Manual role QA |
| Environment/security | Needs QA | Verify `VITE_BACKEND_URL`, Bearer token, 401/403 behavior | Runtime QA |

## Final Prioritized Implementation Roadmap

### Phase 1 - Release Gate, Auth, and RBAC

Goal: establish the release gate and fix security mismatches.

Frontend modules likely affected:
- `package.json`
- `.env`
- `src/lib/apis.ts`
- `src/lib/apiErrors.ts`
- `src/constants/routes.ts`
- `src/constants/NavLinksData.tsx`
- `src/lib/navPermissions.ts`

Backend endpoints involved:
- `POST /api/dashboard/auth/login`
- `GET /api/dashboard/auth/me`
- `POST /api/dashboard/auth/logout`
- all role-guarded dashboard endpoints

Verification steps:
- [ ] Run install/lint/typecheck/build in release gate.
- [ ] Remove `/menu` from kitchen frontend routes.
- [ ] Hide manual deduction submit from kitchen.
- [ ] Add centralized 403 handling.
- [ ] Verify 401 clears token and 403 keeps token.

### Phase 2 - Core Admin Operations

Goal: stabilize dashboard home, customers, subscriptions, and payments.

Verification steps:
- [ ] Overview/search/notification summary QA.
- [ ] Customer list/create/detail/update/subscriptions QA.
- [ ] Subscription lifecycle/balances/entitlements/manual deduction QA.
- [ ] Payment list/detail/breakdown/verify QA.
- [ ] Confirm refund controls remain absent.

### Phase 3 - Settings, Reports, and Admin Users

Goal: implement missing management pages for confirmed backend contracts.

Verification steps:
- [ ] Add full settings UI for confirmed settings endpoints.
- [ ] Correct restaurant-hours frontend type if necessary.
- [ ] Add reports/accounting daily report/export UI.
- [ ] Add dashboard users/staff/roles UI.

### Phase 4 - Catalog and Commercial Configuration

Goal: finish menu, plans, addons, promo, identity mapping.

Verification steps:
- [ ] Menu products expose `availableFor`.
- [ ] Options send `displayCategoryKey` and subscription metadata.
- [ ] Add product duplicate helper/UI.
- [ ] Add menu versions/rollback helper/UI.
- [ ] Add promo validate/toggle helper or explicitly defer.
- [ ] Keep addons on `/api/dashboard/addon-items/*`.

### Phase 5 - Operations and Fulfillment

Goal: verify queues, actions, delivery zones, and one-time orders.

Verification steps:
- [ ] Remove unsupported one-time action buttons.
- [ ] Stop sending unsupported `branchId` to `GET /api/dashboard/orders` unless backend adds it.
- [ ] QA ops action payloads and screen-specific route permissions.
- [ ] Add zone toggle helper if exposed.

### Phase 6 - Content, Diagnostics, and Product Decisions

Goal: add optional support tools and resolve blocked product decisions.

Verification steps:
- [ ] Add content/terms page if product requires it.
- [ ] Add logs/notification logs/health page if support requires it.
- [ ] Keep refund, banners, and standalone branch management blocked until contract exists.

## Final QA Checklist

### Build/Release
- [ ] `npm install` completes.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Test command exists and passes or manual QA plan is approved.

### Auth/RBAC
- [ ] Login handles `400`, `401`, `403`, `423`, `429`.
- [ ] `/me` handles `status:false` as logged out.
- [ ] Logout clears frontend state.
- [ ] Kitchen cannot see or open `/menu`.
- [ ] Kitchen cannot submit manual deduction.
- [ ] 401 clears token.
- [ ] 403 keeps token and shows access denied.

### Error Handling
- [ ] Parser handles standard `ok:false/error`.
- [ ] Parser handles legacy upload `success:false/message`.
- [ ] Parser handles menu identity string `error`.
- [ ] Parser handles `status:false/message`.
- [ ] Parser exposes `error.details` for field-level messages.

### Dashboard Home
- [ ] `GET /api/dashboard/overview` renders live data.
- [ ] Search uses verified query params only.
- [ ] Notification summary is either displayed or intentionally deferred.

### Settings
- [ ] Settings page exists or is explicitly out of scope.
- [ ] Restaurant hours request/response type matches backend open/close shape.
- [ ] All confirmed setting update endpoints have UI or are intentionally deferred.

### Reports/Accounting
- [ ] Daily report loads.
- [ ] Export handles CSV response.
- [ ] Unsupported export format error is handled.

### Admin Users/Roles
- [ ] Dashboard users list/create/update/delete/reset password works.
- [ ] Self-role-change and self-deactivate errors are clear.

### Customers/Clients
- [ ] List/detail/create works.
- [ ] Update sends supported `isActive` field unless backend expands profile update.
- [ ] User subscriptions load.

### Subscriptions
- [ ] List/detail/create/quote works.
- [ ] Days endpoint is either exposed or intentionally deferred.
- [ ] Freeze/unfreeze/extend/cancel/skip/unskip works.
- [ ] Addon entitlements and balances work.
- [ ] Manual deduction updates balances.

### Payments/Finance
- [ ] List/detail/breakdown/verify works.
- [ ] Provider mismatch and amount mismatch errors are clear.
- [ ] Refund UI is absent.

### Menu
- [ ] Categories/products/options/groups CRUD works.
- [ ] Product duplicate works or is deferred.
- [ ] `availableFor` is exposed.
- [ ] `displayCategoryKey` is sent.
- [ ] Product relation destructive actions confirm.
- [ ] Validate-before-publish workflow is enforced.
- [ ] Versions/rollback UI exists or is explicitly deferred.

### Operations
- [ ] Ops list requires valid date.
- [ ] Empty search query returns empty list.
- [ ] Queue role restrictions match backend controller rules.
- [ ] Action payload includes `entityId` and valid `entityType`.
- [ ] Pickup code errors are clear.

### Zones/Addons/Promo
- [ ] Zones use `meta.totalCount`, not fake pagination.
- [ ] Zone toggle helper exists if UI exposes toggle.
- [ ] Addons use `/addon-items`.
- [ ] Promo validate/toggle helpers exist if UI exposes them.

### Content/Diagnostics/Product Decisions
- [ ] Terms page is absent unless approved.
- [ ] Logs/health page is absent unless approved.
- [ ] Refund, banners, branch management are tracked as product/backend decisions.

## Assumptions

- “Users” in the current frontend means app customers/clients, not dashboard staff.
- “Roles/permissions” are role-gated dashboard users, not a separate permissions matrix.
- “Finance” includes payments and accounting daily report/export.
- “Banners” and standalone “branches” are not implemented dashboard modules unless later code is provided.

## Verification Corrections Log

| # | Section | Original claim | Corrected value | Source file |
|---|---|---|---|---|
| 1 | RBAC | Kitchen can access `/menu` in frontend route config | Backend menu routes require `admin`/`superadmin`; kitchen frontend `/menu` access is a mismatch | `src/routes/dashboardMenu.js`, `src/middleware/dashboardAuth.js`, frontend `src/constants/routes.ts` |
| 2 | Error handling | Standard + upload error shapes were enough | Added legacy menu identity string and `status:false/message` shapes | `src/controllers/dashboard/menuIdentityController.js` |
| 3 | Settings | Restaurant hours frontend type treated as schedule object and settings sub-route bodies were partially inferred | Backend open/close fields and every dashboard settings sub-route alias are confirmed from `adminController.js`; `settingsController.js` is public/general read-only | backend `src/controllers/adminController.js`, backend `src/controllers/settingsController.js`, frontend `src/types/settingsTypes.ts` |
| 4 | Customers | User update implied general profile update | Controller requires `isActive`; generic frontend update payload may be too broad | `src/controllers/adminController.js`, `src/utils/fetchUsersData.ts` |
| 5 | Promo codes | Promo validate/toggle treated as covered frontend behavior | Backend routes exist, but frontend helper lacks validate/toggle functions | `src/routes/admin.js`, `src/utils/fetchPromoCodesData.ts` |
| 6 | Menu Products | Product duplicate listed as needed | Backend route exists; frontend helper is missing | `src/routes/dashboardMenu.js`, `src/utils/fetchMenuProducts.ts` |
| 7 | Menu Options | Field name risk | `displayCategoryKey` is the source-backed field; do not send `displayCategory` | `src/services/catalog/CatalogService.js` |
| 8 | Menu Versions/Rollback | Version/rollback backend verified but frontend unclear | Backend routes exist; no dedicated frontend helper/page found | `src/routes/dashboardMenu.js`, frontend `src/utils/fetchMenuActions.ts` |
| 9 | One-time orders | Dispatch/notify-arrival listed as supported actions | Backend route is generic, but frontend explicitly blocks `dispatch` and `notify_arrival` for one-time orders in current pickup-only helpers | frontend `src/types/oneTimeOrderTypes.ts`, backend `src/routes/dashboardOrders.js` |
| 10 | One-time orders | Frontend sends `branchId` as order list filter | Backend order dashboard controller does not read `branchId`; the parameter is silently ignored | `src/controllers/dashboard/orderDashboardController.js`, frontend `src/utils/fetchOneTimeOrders.ts` |
| 11 | Zones | Zones helper sends page/limit/q and backend reads only `isActive` | Backend zone list reads `isActive` and `q`; only `page` and `limit` are silently ignored; response uses `meta.totalCount` | `src/controllers/zoneController.js`, frontend `src/utils/fetchDeliveryZonesData.ts` |
| 12 | Upload | Upload response modeled only as `{ url }` | Backend returns `{ url, secureUrl, publicId, resourceType }`; frontend type only models `url` | `src/controllers/uploadController.js`, `src/services/adminImageService.js`, frontend `src/utils/fetchUploadImage.ts` |
| 13 | Refund | Refund route status | Searched all route files in `/src/routes/`; no dashboard refund route found as of 2026-05-25 | `/home/hema/Projects/basicdiet145/src/routes/*` |
| 14 | Frontend error parser | Error parser considered complete | Parser does not read `success:false`, root `code`, or `error.details` directly | frontend `src/lib/apiErrors.ts`, backend error helpers/controllers |
| 15 | Token details | Token payload and expiry were not documented | Dashboard JWT payload uses `userId`, `role`, `tokenType:"dashboard_access"`; expiry defaults to `7d`; no refresh endpoint found | `src/services/dashboardTokenService.js`, `src/middleware/dashboardAuth.js` |
| 16 | Pagination | Pagination defaults/max were not centralized | Optional pagination defaults to page `1`, default limit `50`, and clamps to caller-provided max; no global max in helper | `src/utils/optionalPagination.js` |
| 17 | ObjectId validation | Invalid id errors assumed `INVALID` | `validateObjectId.js` throws code `INVALID_ID` in standard error shape where controllers use it | `src/utils/validateObjectId.js` |
| 18 | Subscription payloads | Quote/create/delivery/freeze/manual deduction bodies were described as service-backed | Added field tables and service error codes for checkout quote/create, delivery update, freeze/unfreeze, skip/unskip, and manual deduction | `src/services/subscription/subscriptionQuoteService.js`, `src/services/subscription/subscriptionDeliveryUpdateService.js`, `src/services/subscription/subscriptionFreezeClientService.js`, `src/services/subscription/subscriptionSkipService.js`, `src/services/dashboard/manualSubscriptionDeductionService.js` |
| 19 | Promo payloads | Promo payload was summarized only at route level | Added normalized promo fields and full `PROMO_*` validation codes | `src/services/promoCodeService.js` |
| 20 | Content terms | Terms payload was referenced only as service validation | Added `title`, `locale`, and `content` write payload table with validation errors | `src/services/appContentService.js` |
| 21 | DTO interfaces | Many response interfaces used generic unknown maps | Added concrete DTO interfaces for dashboard users, zones, plans, addons, promo codes, subscriptions, payments, uploads, and unified operational rows | backend models, admin serializers, `src/services/dashboard/dashboardDtoService.js` |
| 22 | Plans | Plan payload validation was marked unresolved | Resolved dashboard plan create/update, grams, meals, clone, sort, toggle, delete payload contracts from `adminController.js`; `planController.js` is public read-only | `src/controllers/adminController.js`, `src/controllers/planController.js`, `src/models/Plan.js` |
| 23 | Settings | Settings sub-routes used vague body descriptions | Replaced vague body descriptions with exact accepted aliases and numeric/time constraints | `src/controllers/adminController.js` |
| 24 | Readiness score | Score stayed at 47 despite DTO/settings/plan enrichment | Recalibrated readiness to 52/100 while keeping frontend not ready due to release gate, RBAC, missing pages, and implementation gaps | this report |

## Final Recommendation

Dashboard frontend ready? No.

Backend dashboard contract ready? Yes for confirmed routes, with monitoring and integration QA.

Full dashboard/backend cycle ready? No. Frontend implementation gaps, RBAC mismatches, missing pages, and product decisions remain.

Report safe as implementation reference? Yes, for source-confirmed contracts in this v2.2 report. Any service-level payload not explicitly confirmed in this report must be checked before implementation.
