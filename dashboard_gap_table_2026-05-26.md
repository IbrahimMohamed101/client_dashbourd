# Dashboard Gap Table 2026-05-26

Scope: endpoints and pages explicitly targeted by the implementation audit sprint.

| Area | Endpoint / Route | Status | Notes |
|---|---|---|---|
| RBAC | `/menu` kitchen access | done | Frontend route constants no longer grant kitchen access to `/menu`; backend admin-only rule confirmed in `dashboardMenu.js`. |
| Errors | centralized `401` + `403` handling | done | Axios interceptor now uses parsed auth status and keeps 403 separate from 401 token clearing. |
| Errors | parser: `error.code`, `error.details`, `success:false`, `status:false`, root `code`, `expectedField`, legacy menu identity strings | done | `src/lib/apiErrors.ts` now normalizes all confirmed backend shapes. |
| Settings | `PUT /api/dashboard/settings/cutoff` | done | Helper verified and kept aligned to `time` payload. |
| Settings | `PUT /api/dashboard/settings/delivery-windows` | done | Helper verified and kept aligned to `windows` payload. |
| Settings | `PUT /api/dashboard/settings/skip-allowance` | done | Helper verified and kept aligned to `days` payload. |
| Settings | `PUT /api/dashboard/settings/premium-price` | done | Helper verified and kept aligned to `price` payload. |
| Settings | `PUT /api/dashboard/settings/subscription-delivery-fee` | done | Helper verified and kept aligned to `deliveryFeeHalala`. |
| Settings | `PUT /api/dashboard/settings/vat-percentage` | done | Helper verified and kept aligned to `percentage`. |
| Settings | `PUT /api/dashboard/settings/custom-salad-base-price` | done | Helper verified and kept aligned to `price`. |
| Settings | `PUT /api/dashboard/settings/custom-meal-base-price` | done | Helper verified and kept aligned to `price`. |
| Dashboard users | `GET /api/dashboard/dashboard-users` | done | Typed helper + query hook + protected page added. |
| Dashboard users | `POST /api/dashboard/dashboard-users` | done | Typed helper verified against backend create payload. |
| Dashboard users | `GET /api/dashboard/dashboard-users/:id` | done | Typed helper verified. |
| Dashboard users | `PUT /api/dashboard/dashboard-users/:id` | done | Typed helper verified for `role` and/or `isActive`. |
| Dashboard users | `DELETE /api/dashboard/dashboard-users/:id` | done | Typed helper verified. |
| Dashboard users | `POST /api/dashboard/dashboard-users/:id/reset-password` | done | Typed helper verified. |
| Reporting | `GET /api/dashboard/notifications/summary` | done | Typed helper verified; backend optional `limit` support preserved. |
| Reporting | `GET /api/dashboard/reports/today` | done | Typed helper verified against today report payload. |
| Reporting | `GET /api/dashboard/accounting/daily-report` | done | Typed helper + protected page added. |
| Reporting | `GET /api/dashboard/accounting/daily-report/export` | done | Helper verified as CSV-only; page export action added. |
| Promo codes | `POST /api/dashboard/promo-codes/validate` | done | Helper already existed; backend response verified. |
| Promo codes | `PATCH /api/dashboard/promo-codes/:id/toggle` | done | Helper already existed; backend toggle contract verified. |
| Subscriptions | `GET /api/dashboard/subscriptions/:id/days` | done | Dedicated helper added. |
| Subscriptions | `GET /api/dashboard/subscriptions/:id/balances` | done | Typed helper aligned to confirmed response shape. |
| Subscriptions | `PATCH /api/dashboard/subscriptions/:id/balances` | done | Patch helper added; caller must supply backend-required `reason`. |
| Subscriptions | `GET/PATCH /api/dashboard/subscriptions/:id/addon-entitlements` | done | Helper now sends all accepted alias keys: `addonSubscriptions`, `entitlements`, `addonEntitlements`. |
| Subscriptions | `POST /api/dashboard/subscriptions/:id/cancel` | done | Optional `reason` supported in helper body. |
| Zones | `GET /api/dashboard/zones` | done | Helper no longer sends ignored `page`/`limit`; page now reads `meta.totalCount`. |
| Zones | `PATCH /api/dashboard/zones/:id/toggle` | done | Helper verified; UI already wired. |
| Zones | CRUD payload shape | done | UI payload changed to backend fields `name`, `deliveryFeeHalala`, `isActive`, `sortOrder`. |
| Uploads | `POST /api/dashboard/uploads/image` | done | Response type expanded to `url`, `secureUrl`, `publicId`, `resourceType`. |
| App users | `PUT /api/dashboard/users/:id` | done | Helper narrowed to `isActive` only. |
| Orders | `GET /api/dashboard/orders` | done | Existing one-time-orders list helper already avoids ignored `branchId`; verified. |
| Menu | option payload `displayCategoryKey` | done | Existing payload mapper already sends `displayCategoryKey`; verified. |
| Menu | `GET /api/dashboard/menu/versions` | done | Helper already existed and was verified. |
| Menu | `POST /api/dashboard/menu/rollback/:versionId` | done | Helper already existed and was verified with `confirm:true`. |
| Addon items | `PATCH /api/dashboard/addon-items/:id/toggle` | done | Existing helper path verified; no payload change needed. |
| Delivery | `GET /api/dashboard/delivery-schedule` | done | Helper added for QA coverage. |
| Content terms | `GET/PUT /api/dashboard/content/terms/subscription` | partial | Typed helpers now exist; no dedicated page added in this sprint. |
| Logs | `GET /api/dashboard/logs` | partial | Typed helper exists; no dedicated page added in this sprint. |
| Notification logs | `GET /api/dashboard/notification-logs` | partial | Typed helper exists; no dedicated page added in this sprint. |
| Health | `GET /api/dashboard/health/catalog` | partial | Typed helper exists; no dedicated page added in this sprint. |
| Health | `GET /api/dashboard/health/subscription-menu` | partial | Typed helper exists; no dedicated page added in this sprint. |
| Health | `GET /api/dashboard/health/meal-planner` | partial | Typed helper exists; no dedicated page added in this sprint. |
| Health | `GET /api/dashboard/health/indexes` | partial | Typed helper exists; no dedicated page added in this sprint. |
| Deferred | refund UI | deferred | Explicitly excluded by product/backend contract. |
| Deferred | banners UI | deferred | Explicitly excluded by product/backend contract. |
| Deferred | standalone branch management | deferred | Explicitly excluded by product/backend contract. |
