# Dashboard Operations Queue Integration

## Scope

Dashboard frontend integrates the clean Operations Queue v2 contract for:

- `GET /api/dashboard/kitchen/queue?date=YYYY-MM-DD`
- `GET /api/dashboard/pickup/queue?date=YYYY-MM-DD`
- `GET /api/dashboard/courier/queue?date=YYYY-MM-DD`

Backend and Flutter are not modified by this integration.

## Auth

Requests use the shared dashboard API client. The dashboard token is read from the `dashboardToken` cookie and sent as:

```txt
Authorization: Bearer <dashboardToken>
```

## Normal Queue Mode

The normal UI does not request:

- `includeRaw=true`
- `view=legacy`
- `includeLegacyAliases=true`

Those flags are debug-only. The UI consumes v2 sections only.

## V2 Fields Consumed

Cards and details consume:

- `ids`
- `customer`
- `source`
- `subscription.plan`
- `orderSummary`
- `kitchen.meals`
- `kitchen.addons`
- `fulfillment`
- `payment`
- `actions`
- `timestamps`
- `dataQuality`

Protein grams are read from `subscription.plan.proteinGrams` and meal protein grams from `kitchen.meals[].protein.grams`. The UI does not infer grams from plan names.

Meal counts are read from `orderSummary.mealCount` and Arabic count text when present. Add-ons are rendered separately from meals.

## Arabic Text Mapping

Frontend display uses an Arabic-first safe text guard:

```txt
displayName -> ar -> en -> name.ar -> name.en -> key -> id
```

The guard prevents empty text and `[object Object]` from rendering.

## Action Flow

Action buttons are rendered from `actions.allowed`.

When an action includes `endpoint` or `method`, the frontend uses those values. Otherwise it falls back to the existing dashboard action endpoint.

Payload includes:

```txt
entityType
entityId
reason
notes
pickupCode
```

After success or failure, the queue is refreshed. Backend remains the final authority for transitions, role checks, payment gates, locks, and credit validation.

## Payment Gates

The UI uses:

- `payment.canPrepare`
- `payment.canFulfill`
- `payment.pendingUnpaid`
- `payment.superseded`
- `payment.revisionMismatch`

Prepare-style actions are disabled when `canPrepare=false`. Fulfill/dispatch/ready actions are disabled when `canFulfill=false`.

## Data Quality

If `dataQuality.isComplete === false`, the UI shows:

```txt
بيانات غير مكتملة
```

Warnings are rendered from `dataQuality.warnings[].messageAr` with fallback to `messageEn` or `code`.

## Manual Deduction History

Manual deduction history is not expected inside queue responses.

The compact endpoint is available for subscription/manual deduction screens:

```txt
GET /api/dashboard/subscriptions/:subscriptionId/manual-deductions
```

It returns `dashboard_manual_deductions.v1` with count, before/after balances, actor, reason, notes, and timestamp.

## Smoke Test

Local route smoke checked:

```txt
GET http://localhost:5173/operations -> 200
```

Real authenticated API smoke requires a valid dashboard token in the browser session.
