# Dashboard Operations — Frontend Technical Specification

> **Version:** 1.0  
> **Scope:** Kitchen Board, Pickup Board, Courier Board, Manual Subscription Deduction  
> **Audience:** Frontend engineers implementing dashboard operational flows  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Core Concepts](#3-core-concepts)
4. [Type System](#4-type-system)
5. [Board APIs](#5-board-apis)
6. [Action Patterns](#6-action-patterns)
7. [One-Time Order Restrictions](#7-one-time-order-restrictions)
8. [Error Handling](#8-error-handling)
9. [UI Implementation Rules](#9-ui-implementation-rules)
10. [API Quick Reference](#10-api-quick-reference)

---

## 1. Overview

This document specifies the frontend implementation for three operational dashboard boards:

| Board | Route | Purpose |
|-------|-------|---------|
| **Kitchen Board** | `/_protected/kitchen-board` | Prepare meals, manage queue status transitions |
| **Pickup Board** | `/_protected/pickup-board` | Verify and fulfill branch pickup orders |
| **Courier Board** | `/_protected/courier-board` | Track and update delivery tasks |

**Key Principle:** The dashboard handles both **subscription days** and **one-time orders** in unified queues. Each board must discriminate between the two using `source` and `entityType` fields, and route actions to the correct endpoints.

---

## 2. Architecture

### 2.1 Board Components

```
src/components/pages/
├── kitchen-board/
│   └── KitchenBoard.tsx          # Main kitchen queue (3-column Kanban)
├── pickup-board/
│   └── PickupBoard.tsx           # Pickup queue (card grid)
└── courier-board/
    └── CourierBoard.tsx          # Delivery task list
```

### 2.2 Route Definitions

```typescript
// kitchen-board/index.lazy.tsx
export const Route = createLazyFileRoute("/_protected/kitchen-board/")({
  component: KitchenBoard,
});

// pickup-board/index.lazy.tsx
export const Route = createLazyFileRoute("/_protected/pickup-board/")({
  component: PickupBoard,
});

// courier-board/index.lazy.tsx
export const Route = createLazyFileRoute("/_protected/courier-board/")({
  component: CourierBoard,
});
```

### 2.3 Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Kitchen Board  │────▶│  GET /api/dashboard│     │  Action Router  │
│  (Kanban cols)  │     │  /kitchen/queue    │────▶│  (entityType    │
└─────────────────┘     └──────────────────┘     │   discriminates)│
                                                   └─────────────────┘
                                                            │
                                    ┌───────────────────────┼───────────────────────┐
                                    ▼                       ▼                       ▼
                           ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
                           │ Subscription │          │ One-Time     │          │ Subscription │
                           │ Day Actions  │          │ Order Actions│          │ Pickup Actions│
                           │ /kitchen/*   │          │ /orders/*    │          │ /pickup/*    │
                           └──────────────┘          └──────────────┘          └──────────────┘
```

---

## 3. Core Concepts

### 3.1 Entity Discrimination

Every queue item **must** be checked before rendering or acting:

```typescript
// Kitchen board discrimination
const isOneTimeOrder = (item: KitchenQueueItem): boolean => {
  return item.source === "one_time_order" || item.entityType === "order";
};

// Pickup board discrimination  
const isOneTimeOrder = (item: PickupQueueItem): boolean => {
  return item.source === "one_time_order" || item.entityType === "order";
};
```

**Critical Rules:**
- Never assume a row is a subscription day
- Never send subscription day identifiers for one-time orders
- Never send one-time order IDs to subscription endpoints
- Check `source` and `entityType` before every action

### 3.2 One-Time Orders

- **Identifiers:** `source: "one_time_order"`, `entityType: "order"`
- **Scope:** Pickup-only for launch (`fulfillmentMethod: "pickup"`)
- **Status Lifecycle:** `confirmed` → `in_preparation` → `ready_for_pickup` → `fulfilled`
- **Payment Gate:** Must have `paymentStatus === "paid"` for operational transitions
- **No Refunds:** Cancel action does not trigger refunds unless a dedicated refund API exists

### 3.3 Subscription Days

- **Identifiers:** `source: "subscription"` (or absent), `entityType: "subscription_day"`
- **Modes:** `pickup` or `delivery`
- **Kitchen Queue:** Uses `mealSlots[]` for item display
- **Pickup Queue:** May require verification code for app-enabled pickups
- **Manual Deduction:** Allowed only for admin/superadmin; no product selection required

---

## 4. Type System

### 4.1 Shared Discriminator Pattern

```typescript
interface UnifiedQueueItem {
  // ── Shared fields ──
  id: string;
  status: string;
  method: "delivery" | "pickup";
  allowedActions: string[];
  notes?: string;
  userName?: string;
  userPhone?: string;

  // ── Discriminator fields ──
  source?: "subscription" | "one_time_order";
  entityType?: "subscription_day" | "order";

  // ── Subscription-specific ──
  subscriptionDayId?: string;
  mealSlots?: {
    slot: string;
    items: { name: string; quantity: number; notes?: string }[];
  }[];

  // ── One-time order-specific ──
  entityId?: string;
  orderNumber?: string;
  items?: { id: string; name: string; quantity: number; notes?: string }[];
  paymentStatus?: string;
  pickup?: {
    branchId: string;
    branchName?: string;
    window?: string;
    pickupCode?: string;
  };
}
```

### 4.2 Kitchen Types

```typescript
// src/types/kitchenTypes.ts

export type KitchenUiStatus =
  | "open" | "locked" | "confirmed" | "in_preparation"
  | "ready_for_pickup" | "out_for_delivery" | "fulfilled"
  | "not_prepared" | "no_show" | "pending_payment"
  | "cancelled" | "expired";

export interface KitchenOperationsRow {
  id: string;
  entityType: string;          // "subscription_day" | "order" | "pickup"
  source?: "subscription" | "one_time_order";
  reference: string;
  customer: { id: string | null; name: string; avatar: string | null };
  date: string;
  mode: "pickup" | "delivery";
  modeLabel: string;
  timeWindow: { from: string | null; to: string | null; label: string };
  items: { id: string; name: string; kind: string }[];
  status: KitchenUiStatus;
  statusLabel: string;
  progress: {
    step: number;
    totalSteps: number;
    steps: { key: string; done: boolean }[];
  };
  actions: {
    key: string;
    label: string;
    method: string;
    endpoint: string;
    enabled: boolean;
    variant: string;             // "primary" | "secondary" | "danger"
    confirm: boolean;
    requiresConfirmation: boolean;
    confirmationMessage: string | null;
  }[];
  badges: {
    locked: boolean;
    assignedByKitchen: boolean;
    pickupRequested: boolean;
  };
  meta: {
    subscriptionId: string | null;
    orderId: string | null;
    dayId: string | null;
  };
  paymentStatus?: string;
  fulfillmentMethod?: "pickup" | "delivery";
}
```

### 4.3 One-Time Order Types

```typescript
// src/types/oneTimeOrderTypes.ts

export type OneTimeOrderStatus =
  | "pending_payment" | "confirmed" | "in_preparation"
  | "ready_for_pickup" | "fulfilled" | "cancelled" | "expired";

export type OneTimeOrderAction =
  | "prepare" | "ready_for_pickup" | "fulfill" | "cancel";

export const UNSUPPORTED_ONE_TIME_ACTIONS = [
  "dispatch",
  "notify_arrival",
  "courier_fulfill",
  "delivery_assignment",
  "delivery_zone_assignment",
  "delivery_address_edit",
  "delivery_window_edit",
  "reopen",
] as const;

/** Returns true if action is blocked for pickup-only one-time orders */
export function isUnsupportedOneTimeOrderAction(action: string): boolean {
  return (UNSUPPORTED_ONE_TIME_ACTIONS as readonly string[]).includes(action);
}

/** Returns true if action is allowed for one-time pickup orders */
export function isOneTimeOrderActionAllowed(action: string): boolean {
  return !isUnsupportedOneTimeOrderAction(action);
}
```

### 4.4 Dashboard Ops Types

```typescript
// src/types/dashboardOpsTypes.ts

export interface UnifiedOperationalDTO {
  id: string;
  type: "subscription" | "order";
  source?: "subscription" | "one_time_order";
  mode: "delivery" | "pickup";
  reference: string;
  status: string;
  ui: {
    label: string;
    color: string;
    icon: string;
    badgeText?: string;
  };
  customer: { name: string; phone: string };
  context: {
    date: string;
    window?: string;
    addressSummary?: string;
    pickupCode?: string;
    notes?: string;
    cancelInfo?: { reason: string; note?: string };
    orderDetails?: string;
  };
  allowedActions: string[];
  timestamps: { createdAt: string; updatedAt: string };
}
```

---

## 5. Board APIs

### 5.1 Kitchen Board

#### Queue Endpoint

```http
GET /api/dashboard/kitchen/queue?date=YYYY-MM-DD&status=<comma-separated>&method=all|pickup|delivery&q=<search>&zoneId=<id>&branchId=<id>
Authorization: Bearer <dashboard_access_token>
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `string` | Yes | `YYYY-MM-DD` |
| `status` | `string` | No | Comma-separated status list (e.g., `open,locked,confirmed,in_preparation,ready_for_pickup`) |
| `method` | `string` | No | `all`, `pickup`, `delivery`; default `all` |
| `q` | `string` | No | Full-text search |
| `zoneId` | `string` | No | Delivery zone filter |
| `branchId` | `string` | No | Branch filter |

**Response:** `KitchenQueueResponse` containing mixed subscription days and one-time orders.

#### Action Endpoints

**Subscription Days:**
```http
POST /api/dashboard/kitchen/actions/:action
Content-Type: application/json

{
  "entityId": "<subscriptionDayId>",
  "entityType": "subscription_day",
  "payload": {
    "reason": "Kitchen action: prepare",
    "notes": "Optional notes"
  }
}
```

**One-Time Orders:**
```http
POST /api/dashboard/orders/:orderId/actions/:action
Content-Type: application/json

{
  "reason": "Kitchen action: prepare",
  "notes": "Optional notes"
}
```

### 5.2 Pickup Board

#### Queue Endpoint

```http
GET /api/dashboard/pickup/queue?date=YYYY-MM-DD
Authorization: Bearer <dashboard_access_token>
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `string` | Yes | `YYYY-MM-DD` |

**Response:** `PickupQueueResponse` containing items ready for pickup.

#### Action Endpoints

**Subscription Days:**
```http
POST /api/dashboard/pickup/actions/:action
Content-Type: application/json

{
  "entityId": "<subscriptionDayId>",
  "entityType": "subscription_day",
  "payload": {
    "reason": "Customer picked up order",
    "notes": "Optional notes",
    "pickupCode": "123456"     // Optional: for verification
  }
}
```

**One-Time Orders:**
```http
POST /api/dashboard/orders/:orderId/actions/:action
Content-Type: application/json

{
  "reason": "Customer picked up order",
  "notes": "Optional notes",
  "pickupCode": "123456"     // Optional
}
```

### 5.3 Courier Board

#### Queue Endpoint

```http
GET /api/dashboard/courier/queue?date=YYYY-MM-DD&status=<comma-separated>&method=delivery
Authorization: Bearer <dashboard_access_token>
```

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | `string` | Yes | `YYYY-MM-DD` |
| `status` | `string` | No | Comma-separated (e.g., `in_preparation,out_for_delivery,fulfilled,delivery_canceled`) |
| `method` | `string` | Yes | Must be `delivery` |

**Response:** `CourierQueueResponse` containing delivery tasks.

#### Action Endpoint

```http
POST /api/dashboard/courier/actions/:action
Content-Type: application/json

{
  "entityId": "<subscriptionDayId>",
  "entityType": "subscription_day",
  "payload": {
    "reason": "Courier dispatched",
    "notes": "Optional notes",
    "courierId": "<courierId>"   // Optional
  }
}
```

---

## 6. Action Patterns

### 6.1 Unified Action Executor (Kitchen Board)

```typescript
const updateStatus = useMutation({
  mutationFn: async ({ item, action, reason, notes }) => {
    // Block unsupported actions for pickup-only one-time orders
    if (isOneTimeOrder(item) && isUnsupportedOneTimeOrderAction(action)) {
      throw new Error(
        `Action "${action}" is not supported for pickup-only one-time orders`
      );
    }

    if (isOneTimeOrder(item)) {
      const orderId = item.entityId || item.id;
      const { data } = await api.post(
        `/api/dashboard/orders/${orderId}/actions/${action}`,
        { reason, notes }
      );
      return data;
    } else {
      const { data } = await api.post(
        `/api/dashboard/kitchen/actions/${action}`,
        {
          entityId: item.subscriptionDayId || item.id,
          entityType: "subscription_day",
          payload: { reason, notes },
        }
      );
      return data;
    }
  },
});
```

### 6.2 Pickup Board Action Pattern

```typescript
const executeAction = async ({ item, action, reason, notes, pickupCode }) => {
  if (isOneTimeOrder(item)) {
    const orderId = item.entityId || item.id;
    const body: OneTimeOrderActionRequest = {};
    if (reason) body.reason = reason;
    if (notes) body.notes = notes;
    if (pickupCode) body.pickupCode = pickupCode;

    await otoActionMutation.mutateAsync({
      orderId,
      action: action as OneTimeOrderAction,
      body,
    });
  } else {
    await api.post(`/api/dashboard/pickup/actions/${action}`, {
      entityId: item.subscriptionDayId || item.id,
      entityType: "subscription_day",
      payload: { reason, notes, ...(pickupCode ? { pickupCode } : {}) },
    });
  }
};
```

### 6.3 Status Transition Map

#### Kitchen Queue Sections

| Section | Statuses | Primary Action | Description |
|---------|----------|----------------|-------------|
| Pending | `open`, `locked`, `confirmed` | `prepare` | Waiting to be prepared |
| Preparing | `in_preparation` | `ready_for_pickup` | Currently being prepared |
| Ready | `ready_for_pickup` | — | Ready for pickup/delivery |

#### Pickup Actions

| Action | Target Status | Requires Reason | Requires Pickup Code |
|--------|--------------|-----------------|---------------------|
| `ready_for_pickup` | `ready_for_pickup` | Yes | No |
| `fulfill` | `fulfilled` | No | Optional (staff verifies) |
| `cancel` | `cancelled` | Yes | No |
| `no_show` | `no_show` | Yes | No |
| `reopen` | `open` | Yes | No |

#### Courier Actions

| Action | Target Status | Description |
|--------|--------------|-------------|
| `dispatch` | `out_for_delivery` | Mark ready for courier pickup |
| `fulfill` | `fulfilled` | Confirm successful delivery |
| `cancel` | `delivery_canceled` | Mark delivery as failed/cancelled |

---

## 7. One-Time Order Restrictions

### 7.1 Blocked Actions

The following actions are **explicitly blocked** for one-time orders:

```typescript
const UNSUPPORTED_ONE_TIME_ACTIONS = [
  "dispatch",                    // No delivery dispatch
  "notify_arrival",            // No arrival notifications
  "courier_fulfill",           // No courier-specific fulfill
  "delivery_assignment",       // No delivery assignment
  "delivery_zone_assignment",  // No zone assignment
  "delivery_address_edit",     // No address editing
  "delivery_window_edit",      // No window editing
  "reopen",                    // No reopening cancelled orders
] as const;
```

### 7.2 Payment Gate

```typescript
// Do not prepare unpaid one-time orders
const isNonOperational =
  isOneTimeOrder(item) &&
  (item.paymentStatus !== "paid" || item.status === "pending_payment");
```

**UI Rule:** Show non-operational warning and disable action buttons for unpaid orders.

### 7.3 Pickup Code Behavior

- **Display:** Show `pickup.pickupCode` from backend; staff visually matches customer app code
- **Input:** Do NOT render input field for one-time order fulfillment
- **API:** Do NOT send `pickupCode` in fulfill action body
- **Verification:** Backend trusts staff visual confirmation

---

## 8. Error Handling

### 8.1 One-Time Order Error Codes

| Code | Meaning | Frontend Action |
|------|---------|----------------|
| `INVALID_TRANSITION` | Illegal state transition | Refresh row, show error |
| `ORDER_NOT_FOUND` | Order does not exist | Remove stale row |
| `FORBIDDEN` | Role lacks permission | Hide action, show permission message |
| `ACTION_NOT_ALLOWED` | Action not in `allowedActions` | Refresh row |
| `PAYMENT_NOT_PAID` | Order unpaid | Show non-operational warning |
| `ORDER_FINAL` | Order in terminal state | Disable all actions |
| `DELIVERY_NOT_SUPPORTED` | Delivery not available | Show pickup-only message |
| `ONE_TIME_ORDER_DELIVERY_DISABLED` | Delivery disabled for launch | Show pickup-only message |

### 8.2 Subscription Error Codes

| Code | Meaning | Frontend Action |
|------|---------|----------------|
| `DELIVERY_ALREADY_DEDUCTED_TODAY` | One delivery deduction per day | Disable deduction form, show warning |
| `PICKUP_VERIFICATION_REQUIRED` | Needs code verification | Show code input |
| `PICKUP_CODE_MISMATCH` | Wrong verification code | Show mismatch error |
| `LOCKED_SNAPSHOT_REQUIRED` | Missing preparation snapshot | Refresh, escalate to admin |

### 8.3 Generic Error Pattern

```typescript
onError: (error) => {
  const msg =
    error?.response?.data?.message ||
    error.message ||
    "حدث خطأ أثناء تنفيذ الإجراء";
  toast.error(msg);
  // Refresh after errors — another staff member may have already acted
  queryClient.invalidateQueries({ queryKey: ["<board-key>"] });
};
```

---

## 9. UI Implementation Rules

### 9.1 Kitchen Board

- **Layout:** 3-column Kanban (`Pending` | `Preparing` | `Ready`)
- **Columns:** Filter items by `status` into appropriate columns
- **Cards:** Show customer name, phone, items, status badge
- **One-Time Visual:** Purple border (`border-purple-500/20`) + shopping bag icon
- **Actions:** Primary action per column + cancel/reopen secondary actions
- **Polling:** 30-second refresh interval

### 9.2 Pickup Board

- **Layout:** Responsive card grid (1-4 columns based on viewport)
- **Date Filter:** Date picker to select business date
- **Cards:** Show customer info, pickup details, items, pickup code
- **Actions:** `fulfill` (primary), `ready_for_pickup`, `cancel`, `no_show`, `reopen`
- **Fulfill Dialog:** Optional pickup code input (for verification), confirm button

### 9.3 Courier Board

- **Layout:** Card grid with status-colored top border
- **Info:** Customer name, phone, address, delivery window
- **Actions:** `dispatch` (from `in_preparation`), `fulfill`/`cancel` (from `out_for_delivery`)
- **Map Button:** Show location on map (placeholder for future integration)

### 9.4 Manual Subscription Deduction

- **Search:** Phone number lookup
- **Display:** Customer info, subscription selector (if multiple), remaining balances
- **Form:** `regularMeals` input, `premiumMeals` input, `reason`, `notes`
- **Rules:**
  - Pickup: Allow multiple deductions per day while balance remains
  - Delivery: Block if `hasDeliveryDeductionToday === true`
  - Never show food/product selection

---

## 10. API Quick Reference

### Kitchen Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/kitchen/queue` | Kitchen queue (mixed subscription + orders) |
| `POST` | `/api/dashboard/kitchen/actions/:action` | Subscription day actions |
| `POST` | `/api/dashboard/orders/:orderId/actions/:action` | One-time order actions |
| `POST` | `/api/dashboard/kitchen/days/:date/lock` | Bulk lock open days |

### Pickup Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/pickup/queue` | Pickup queue (ready for pickup items) |
| `POST` | `/api/dashboard/pickup/actions/:action` | Subscription pickup actions |
| `POST` | `/api/dashboard/orders/:orderId/actions/:action` | One-time order pickup actions |

### Courier Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/courier/queue` | Courier delivery tasks |
| `POST` | `/api/dashboard/courier/actions/:action` | Delivery status actions |

### Subscription Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/subscriptions/search?phone=<phone>` | Search subscription by phone |
| `POST` | `/api/dashboard/subscriptions/:id/manual-deduction` | Manual meal deduction |

---

## Appendix A: Status Lifecycles

### One-Time Order Pickup

```
pending_payment ──(paid)──▶ confirmed ──(prepare)──▶ in_preparation
                                                              │
                                                              │ (ready_for_pickup)
                                                              ▼
                                                    ready_for_pickup
                                                              │
                                                              │ (fulfill)
                                                              ▼
                                                        fulfilled

Terminal: fulfilled, cancelled, expired
```

### Subscription Delivery

```
open/locked ──(prepare)──▶ in_preparation ──(dispatch)──▶ out_for_delivery
                                                                    │
                                                                    │ (fulfill)
                                                                    ▼
                                                                fulfilled

Terminal: fulfilled, cancelled, delivery_canceled
```

### Subscription Pickup

```
open/locked ──(prepare)──▶ in_preparation ──(ready_for_pickup)──▶ ready_for_pickup
                                                                          │
                                                                          │ (fulfill)
                                                                          ▼
                                                                    fulfilled

Terminal: fulfilled, cancelled, no_show
```

---

## Appendix B: File Reference

| File | Purpose |
|------|---------|
| `src/types/oneTimeOrderTypes.ts` | One-time order types, statuses, action guards |
| `src/types/kitchenTypes.ts` | Kitchen queue types, row DTOs, summary types |
| `src/types/dashboardOpsTypes.ts` | Unified operational DTOs, filters, helpers |
| `src/utils/fetchKitchenData.ts` | Kitchen API functions, action executors |
| `src/utils/fetchDashboardOpsData.ts` | Ops list/search/action functions |
| `src/components/pages/kitchen-board/KitchenBoard.tsx` | Kitchen queue UI |
| `src/components/pages/pickup-board/PickupBoard.tsx` | Pickup queue UI |
| `src/components/pages/courier-board/CourierBoard.tsx` | Courier task UI |

---

*Last updated: 2026-05-17*  
*Maintainers: Frontend Dashboard Team*
