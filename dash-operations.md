Below is a **Dashboard Operations Report** in English that you can send to the dashboard/frontend team.

---

# Dashboard Operations Report

## Subscription Fulfillment + One-Time Order Operations

## 1. Purpose

This report explains the current backend operational rules that the dashboard frontend must follow after the recent fulfillment fixes.

The dashboard must correctly handle two different business flows:

1. **Subscription Days**
2. **One-Time Orders**

These flows are not the same and must not be mixed.

---

# 2. Core Business Rules

## 2.1 Subscriptions

Subscriptions support both:

- **Pickup from branch**
- **Delivery**

Subscription delivery must continue to work normally.

Subscription fulfillment is based on the policy:

```txt
TOTAL_BALANCE_WITHIN_VALIDITY
```

Meaning:

- `remainingMeals` is the source of truth.
- A calendar day passing does not consume meals.
- `no_show` does not deduct meals.
- `skipped` and `frozen` do not deduct meals.
- `ready_for_pickup` does not deduct meals.
- `out_for_delivery` does not deduct meals.
- `delivery_canceled` does not deduct meals.
- Meals are deducted only on actual fulfillment or explicit cashier/manual consumption.

The fulfillment audit confirms that subscription pickup and delivery flows exist, and that `remainingMeals` should only be deducted on `fulfilled` or cashier/manual consumption.

---

## 2.2 One-Time Orders

One-Time Orders are **pickup-only for launch**.

This means:

- No home delivery.
- No courier flow.
- No dispatch.
- No notify arrival.
- No delivery fulfillment.
- No one-time delivery orders in courier queue.
- No one-time delivery orders in delivery schedule.
- One-Time Orders must never consume subscription `remainingMeals`.

The audit found that backend creation is delivery-gated, but some legacy/dashboard delivery paths still existed for one-time orders, so these were fixed or gated.

---

# 3. Dashboard Must Distinguish Row Type

Every operational row should be handled based on:

```json
{
  "source": "subscription",
  "entityType": "subscription_day"
}
```

or:

```json
{
  "source": "one_time_order",
  "entityType": "order"
}
```

The dashboard must not infer the entity type from status alone.

## Required frontend rule

```txt
If source = subscription:
  treat row as a subscription day.

If source = one_time_order:
  treat row as a one-time pickup order.
```

---

# 4. Subscription Dashboard Flow

## 4.1 Subscription Pickup Flow

Expected lifecycle:

```txt
open / locked
→ in_preparation
→ ready_for_pickup
→ fulfilled
```

Possible non-consuming final states:

```txt
no_show
canceled_at_branch
skipped
frozen
```

## Dashboard behavior

For subscription pickup rows:

- Show kitchen preparation actions only when backend returns them in `allowedActions`.
- Show pickup actions only when backend returns them.
- Do not deduct meals locally.
- Do not assume `no_show` consumes meals.
- Do not show operational actions for `skipped` or `frozen`.

## Important statuses

| Status               | Meaning                                        | Dashboard behavior                     |
| -------------------- | ---------------------------------------------- | -------------------------------------- |
| `locked`             | Customer requested pickup; waiting for kitchen | Show prepare if allowed                |
| `in_preparation`     | Kitchen is preparing                           | Show ready for pickup if allowed       |
| `ready_for_pickup`   | Order ready at branch                          | Show fulfill/no-show/cancel if allowed |
| `fulfilled`          | Customer received the meals                    | Final                                  |
| `no_show`            | Customer did not collect                       | Final/non-consuming                    |
| `canceled_at_branch` | Cancelled at branch                            | Final/non-consuming                    |
| `skipped`            | Skipped subscription day                       | No operational actions                 |
| `frozen`             | Frozen subscription day                        | No operational actions                 |

---

## 4.2 Subscription Delivery Flow

Expected lifecycle:

```txt
open / locked
→ in_preparation
→ out_for_delivery
→ fulfilled
```

Possible non-consuming final state:

```txt
delivery_canceled
```

## Dashboard behavior

For subscription delivery rows:

- Delivery is allowed.
- Courier flow is allowed.
- Dispatch is allowed if backend returns it.
- Notify arrival is allowed if backend returns it.
- Fulfill delivery is allowed if backend returns it.
- Do not block subscription delivery because one-time orders are pickup-only.

## Important statuses

| Status              | Meaning                      | Dashboard behavior                                |
| ------------------- | ---------------------------- | ------------------------------------------------- |
| `locked`            | Day is locked for operations | Show prepare if allowed                           |
| `in_preparation`    | Kitchen preparing delivery   | Show dispatch if allowed                          |
| `out_for_delivery`  | Courier has order            | Show notify arrival / fulfill / cancel if allowed |
| `fulfilled`         | Delivery completed           | Final                                             |
| `delivery_canceled` | Delivery cancelled/failed    | Final/non-consuming                               |

---

# 5. One-Time Order Dashboard Flow

## 5.1 One-Time Order Pickup Lifecycle

One-Time Orders follow this launch lifecycle:

```txt
pending_payment
→ confirmed
→ in_preparation
→ ready_for_pickup
→ fulfilled
```

Other final states:

```txt
cancelled
expired
```

## Dashboard behavior

For one-time orders:

- Show only pickup-related actions.
- Do not show delivery actions.
- Do not show courier actions.
- Do not show dispatch.
- Do not show notify arrival.
- Do not show delivery fulfill.
- Do not deduct subscription meals.
- Use backend `allowedActions`.

## Important statuses

| Status             | Meaning                                          | Dashboard behavior               |
| ------------------ | ------------------------------------------------ | -------------------------------- |
| `pending_payment`  | Customer created order but payment not confirmed | Not operational                  |
| `confirmed`        | Paid and waiting for kitchen                     | Show prepare if allowed          |
| `in_preparation`   | Kitchen preparing                                | Show ready for pickup if allowed |
| `ready_for_pickup` | Ready at branch                                  | Show fulfill/cancel if allowed   |
| `fulfilled`        | Customer picked up                               | Final                            |
| `cancelled`        | Cancelled                                        | Final                            |
| `expired`          | Payment expired                                  | Final                            |

---

# 6. Actions Matrix

## 6.1 Subscription Actions

| Action              | Pickup subscription | Delivery subscription | Deducts meals? |
| ------------------- | ------------------: | --------------------: | -------------: |
| `prepare`           |                 Yes |                   Yes |             No |
| `ready_for_pickup`  |                 Yes |                    No |             No |
| `dispatch`          |                  No |                   Yes |             No |
| `notify_arrival`    |                  No |                   Yes |             No |
| `fulfill`           |                 Yes |                   Yes |            Yes |
| `cancel`            |                 Yes |                   Yes |             No |
| `no_show`           |                 Yes |                    No |             No |
| `delivery_canceled` |                  No |                   Yes |             No |

## 6.2 One-Time Order Actions

| Action             |             One-time pickup order | One-time delivery order |
| ------------------ | --------------------------------: | ----------------------: |
| `prepare`          |                               Yes |     Disabled by default |
| `ready_for_pickup` |                               Yes |                Disabled |
| `dispatch`         |                                No |                Disabled |
| `notify_arrival`   |                                No |                Disabled |
| `fulfill`          | Yes, only from `ready_for_pickup` |                Disabled |
| `cancel`           |                               Yes |     Disabled by default |
| `reopen`           |                     Not supported |           Not supported |

If the dashboard attempts a delivery action on a one-time order, the backend may return:

```json
{
  "ok": false,
  "error": {
    "code": "ONE_TIME_ORDER_DELIVERY_DISABLED",
    "message": "One-time order delivery is disabled"
  }
}
```

Frontend should show:

```txt
One-time orders are available for branch pickup only.
```

---

# 7. Dashboard Queues

## 7.1 Kitchen Queue

Endpoint usually used:

```http
GET /api/dashboard/kitchen/queue
```

Expected behavior:

### Includes

- Subscription pickup rows
- Subscription delivery rows
- Paid one-time pickup orders

### Excludes

- Unpaid one-time orders
- `pending_payment` one-time orders
- `expired` one-time orders
- One-time delivery orders when delivery feature is off

---

## 7.2 Pickup Queue

Endpoint usually used:

```http
GET /api/dashboard/pickup/queue
```

Expected behavior:

### Includes

- Subscription pickup rows
- Paid one-time pickup orders

### Excludes

- Subscription delivery rows
- One-time delivery rows
- Unpaid orders

---

## 7.3 Courier Queue

Endpoint usually used:

```http
GET /api/dashboard/courier/queue
```

Expected behavior:

### Includes

- Subscription delivery rows

### Excludes

- One-time orders by default
- One-time delivery orders when launch delivery flag is off

---

## 7.4 Delivery Schedule

Endpoint usually used:

```http
GET /api/dashboard/delivery-schedule
```

Expected behavior:

### Includes

- Subscription delivery rows

### Excludes

- One-time orders by default

---

# 8. Allowed Actions Contract

The dashboard should prefer backend-provided:

```json
"allowedActions": [...]
```

Do not infer actions locally from status only.

## Important rule

```txt
If backend does not return the action, do not show the button.
```

Examples:

- If a skipped day has no `cancel`, do not show cancel.
- If a frozen day has no operational actions, show none.
- If a one-time order has no `dispatch`, do not show dispatch.
- If a subscription delivery row has `dispatch`, show it.

---

# 9. Status Naming Rules

## One-Time Orders

Use current order statuses:

```txt
confirmed
in_preparation
ready_for_pickup
out_for_delivery
fulfilled
cancelled
expired
```

For launch UI, one-time order delivery statuses like `out_for_delivery` should not normally appear because one-time orders are pickup-only.

Do not use old order status names:

```txt
preparing
canceled
```

Exception:

```txt
Payment.status may still use "canceled".
Order.status should use "cancelled".
```

---

# 10. Payment Rules for Dashboard

## Subscription rows

Subscription operations are separate from payment verification.

The dashboard should not manually deduct subscription balance.

## One-Time Orders

One-time orders should appear in operational boards only when:

```txt
paymentStatus = paid
```

The audit identified that unpaid orders could previously leak into kitchen operations; backend fixes now filter operational order rows to paid orders.

Dashboard should still treat unpaid orders as non-operational.

---

# 11. Pickup Prepare Behavior

For subscription client pickup prepare:

```http
POST /api/subscriptions/:id/days/:date/pickup/prepare
```

If the backend returns:

```json
{
  "ok": false,
  "error": {
    "code": "PICKUP_ALREADY_REQUESTED"
  }
}
```

It means the pickup request was already created.

Dashboard meaning:

```txt
The day is already locked and waiting for kitchen.
```

The correct next dashboard step is usually:

```txt
prepare
```

not another pickup prepare request.

---

# 12. Frontend Requirements

## Dashboard frontend must

- Use `source` and `entityType`.
- Use backend `allowedActions`.
- Treat subscriptions and one-time orders differently.
- Keep subscription delivery enabled.
- Keep subscription pickup enabled.
- Treat one-time orders as pickup-only.
- Hide one-time delivery/courier actions.
- Hide operational actions for final statuses.
- Hide operational actions for skipped/frozen days.
- Avoid local balance deduction.
- Avoid local status transition assumptions.

## Dashboard frontend must not

- Assume every row is a subscription day.
- Assume every `in_preparation` row has the same next action.
- Show dispatch for one-time orders.
- Show notify arrival for one-time orders.
- Show courier fulfill for one-time orders.
- Show unpaid one-time orders in kitchen ops.
- Use old order statuses like `preparing` or `canceled` as primary UI states.
- Deduct `remainingMeals` locally.

---

# 13. Error Handling

| Error code                         | Meaning                                    | UI behavior                         |
| ---------------------------------- | ------------------------------------------ | ----------------------------------- |
| `ONE_TIME_ORDER_DELIVERY_DISABLED` | Tried delivery action on one-time order    | Show pickup-only message            |
| `INVALID_TRANSITION`               | Action not allowed from current status     | Refresh row and hide invalid action |
| `PAYMENT_NOT_PAID`                 | One-time order is not paid                 | Do not show operational actions     |
| `FINAL_STATUS`                     | Order/day already final                    | Refresh and disable actions         |
| `FORBIDDEN`                        | Role cannot perform action                 | Hide action for that role           |
| `PICKUP_ALREADY_REQUESTED`         | Subscription pickup request already exists | Treat as waiting for kitchen        |
| `INSUFFICIENT_CREDITS`             | Subscription balance not enough            | Show balance issue                  |
| `INVALID_OBJECT_ID`                | Bad ID                                     | Show generic error or report bug    |

---

# 14. Recommended Dashboard UI Mapping

## Subscription Pickup Row

```json
{
  "source": "subscription",
  "entityType": "subscription_day",
  "status": "ready_for_pickup",
  "allowedActions": ["fulfill", "cancel", "no_show"]
}
```

Show:

- Fulfill
- Cancel
- No-show

Do not deduct meals locally.

---

## Subscription Delivery Row

```json
{
  "source": "subscription",
  "entityType": "subscription_day",
  "status": "out_for_delivery",
  "allowedActions": ["notify_arrival", "fulfill", "cancel"]
}
```

Show:

- Notify arrival
- Fulfill
- Cancel

---

## One-Time Pickup Order Row

```json
{
  "source": "one_time_order",
  "entityType": "order",
  "status": "ready_for_pickup",
  "allowedActions": ["fulfill", "cancel"]
}
```

Show:

- Fulfill
- Cancel

Do not show:

- Dispatch
- Notify arrival
- Courier controls

---

# 15. Operational Summary

## Subscriptions

```txt
Pickup: supported
Delivery: supported
RemainingMeals deduction: only on fulfilled/manual cashier consumption
```

## One-Time Orders

```txt
Pickup: supported
Delivery: disabled by default
RemainingMeals deduction: never
Operational visibility: paid orders only
```

## Dashboard

```txt
Use source/entityType + allowedActions.
Do not infer operations locally.
```

---

# 16. Final Notes for Frontend Team

The most important distinction is:

```txt
Subscriptions = pickup + delivery
One-Time Orders = pickup only
```

The most important implementation rule is:

```txt
Render actions from backend allowedActions, not local status assumptions.
```

The most important safety rule is:

```txt
Frontend must never deduct remainingMeals or settle days locally.
```
