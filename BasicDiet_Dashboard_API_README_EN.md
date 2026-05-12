I based this on the version you already have and on the weekly menu rules: the four custom products are `Basic Salad`, `Basic Meal`, `Fruit Salad`, and `Greek Yogurt`; the rest are fixed-price products such as sandwiches, juices, drinks, desserts, and ice cream.
I also preserved the current README rules: prices are in halala, `isAvailable` is for temporary availability, `isActive` is for soft deletion, and mobile contracts remain stable.

---

# Complete Reference Guide for Dashboard API Endpoints

# BasicDiet Dashboard API README

This document is intended for the BasicDiet Dashboard development team.
All routes listed below are written **after `/api`**.

Example:

```http
/dashboard/menu/products
```

means the full route is:

```http
/api/dashboard/menu/products
```

---

## 1. Important General Rules

### 1.1 Currency

All prices in the API are in halala, not SAR.

|      SAR | Halala |
| -------: | -----: |
|  2 SAR   |    200 |
|  7 SAR   |    700 |
| 11 SAR   |   1100 |
| 15 SAR   |   1500 |
| 17 SAR   |   1700 |
| 19 SAR   |   1900 |
| 23 SAR   |   2300 |
| 29 SAR   |   2900 |

---

### 1.2 Difference Between `isAvailable` and `isActive`

| Field         | Usage                                                                 |
| ------------- | --------------------------------------------------------------------- |
| `isAvailable` | Temporary out-of-stock status or weekly disabling. Example: salmon is out this week. |
| `isActive`    | Soft deletion or long-term removal from the menu.                    |

Important rule:

```text
If the item may return next week → use isAvailable=false
If the item is removed from the menu for a long time → use isActive=false
```

---

### 1.3 Mobile App Contracts

Do not change the response shapes used by the mobile app, especially:

```http
GET /api/orders/menu
POST /api/orders/quote
POST /api/orders
GET /api/orders/:id
```

If the dashboard modifies the menu, the mobile app must continue reading the same shape from `/api/orders/menu`.

---

### 1.4 Existing Orders

When an order is created, the system saves a `snapshot` of the product, price, and selected options.
Any later menu change must not affect old orders.

---

## 2. Authentication and Permissions

### 2.1 Required Headers

```http
Authorization: Bearer <dashboard_token>
Content-Type: application/json
Accept: application/json
Accept-Language: ar
```

---

### 2.2 Roles

| Role         | Description                                      |
| ------------ | ------------------------------------------------ |
| `superadmin` | Full permissions                                 |
| `admin`      | Menu, orders, and operations management          |
| `kitchen`    | Order preparation                                |
| `courier`    | Delivery                                         |
| `cashier`    | Verification or branch handoff if supported      |

---

### 2.3 General Permissions Matrix

| Area              | superadmin | admin | kitchen | courier | cashier |
| ----------------- | :--------: | :---: | :-----: | :-----: | :-----: |
| Edit menu         |     ✅     |   ✅  |    ❌   |    ❌   |    ❌   |
| Validate menu     |     ✅     |   ✅  |    ❌   |    ❌   |    ❌   |
| Publish menu      |     ✅     |   ✅  |    ❌   |    ❌   |    ❌   |
| View orders       |     ✅     |   ✅  |    ✅   |    ✅   | Depends on system |
| Prepare order     |     ✅     |   ✅  |    ✅   |    ❌   |    ❌   |
| Ready for pickup  |     ✅     |   ✅  |    ✅   |    ❌   |    ❌   |
| Fulfill order     |     ✅     |   ✅  | Depends on system | Depends on system | Depends on system |
| Identity Mapping  |     ✅     |   ✅  |    ❌   |    ❌   |    ❌   |

---

## 3. Response Format

### 3.1 Success

```json
{
  "status": true,
  "data": {}
}
```

### 3.2 General Error

```json
{
  "status": false,
  "message": "Error message"
}
```

### 3.3 `ok/error` Style Error

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description"
  }
}
```

---

# 4. Dashboard Auth

## 4.1 Login

```http
POST /dashboard/auth/login
```

### Body

```json
{
  "phone": "+966500000000",
  "password": "your_password"
}
```

### Response

```json
{
  "status": true,
  "data": {
    "token": "dashboard_jwt_token",
    "user": {
      "id": "user_id",
      "name": "Admin User",
      "role": "admin"
    }
  }
}
```

---

## 4.2 Current User Data

```http
GET /dashboard/auth/me
```

### Auth

Dashboard token required.

### Response

```json
{
  "status": true,
  "data": {
    "id": "user_id",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

# 5. Menu Management Overview

The dashboard menu is divided into two types:

## 5.1 Custom Products

These products contain option groups and selection rules:

```text
basic_salad    = Basic Salad
basic_meal     = Basic Meal
fruit_salad    = Fruit Salad
greek_yogurt   = Greek Yogurt
```

These products require managing:

```text
price
pricing type: fixed/per_100g
option groups
options
maxSelections
extraPriceHalala
extraWeightUnitGrams
extraWeightPriceHalala
weekly availability
```

---

## 5.2 Fixed Products

These are simple fixed-price products:

```text
Cold Sandwich
Sourdough
Desserts
Juices
Drinks
Ice Cream
```

They are usually managed through:

```text
name
category
price
image
isAvailable
isActive
sortOrder
```

---

# 6. Categories Endpoints

## 6.1 List Categories

```http
GET /dashboard/menu/categories
```

### Query Params

| Param         | Description                         |
| ------------- | ----------------------------------- |
| `page`        | Page number                         |
| `limit`       | Number of items                     |
| `q`           | Text search if supported            |
| `isActive`    | Filter by active status             |
| `isAvailable` | Filter by availability              |

### Response Example

```json
{
  "status": true,
  "data": {
    "items": [
      {
        "id": "category_id",
        "key": "drinks",
        "name": {
          "ar": "المشروبات",
          "en": "Drinks"
        },
        "isActive": true,
        "isAvailable": true,
        "sortOrder": 10
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## 6.2 Create Category

```http
POST /dashboard/menu/categories
```

### Body

```json
{
  "key": "drinks",
  "name": {
    "ar": "المشروبات",
    "en": "Drinks"
  },
  "description": {
    "ar": "",
    "en": ""
  },
  "imageUrl": "",
  "isActive": true,
  "isAvailable": true,
  "isVisible": true,
  "sortOrder": 10
}
```

---

## 6.3 Update Category

```http
PATCH /dashboard/menu/categories/:id
```

### Body

```json
{
  "name": {
    "ar": "مشروبات",
    "en": "Beverages"
  },
  "isAvailable": true,
  "sortOrder": 20
}
```

---

## 6.4 Soft Delete Category

```http
DELETE /dashboard/menu/categories/:id
```

> Note: deletion should be a soft delete and should set `isActive=false` if this is the current backend behavior.

---

## 6.5 Reorder Categories

```http
PATCH /dashboard/menu/categories/reorder
```

### Body

```json
{
  "items": [
    {
      "id": "category_id_1",
      "sortOrder": 1
    },
    {
      "id": "category_id_2",
      "sortOrder": 2
    }
  ]
}
```

---

# 7. Products Endpoints

## 7.1 List Products

```http
GET /dashboard/menu/products
```

### Query Params

| Param          | Description                              |
| -------------- | ---------------------------------------- |
| `page`         | Page number                              |
| `limit`        | Number of items                          |
| `q`            | Search                                   |
| `categoryId`   | Filter by category                       |
| `pricingModel` | `fixed` or `per_100g`                    |
| `itemType`     | Example: `basic_salad`, `drink`          |
| `isActive`     | Filter by active status                  |
| `isAvailable`  | Filter by availability                   |

### Example

```http
GET /dashboard/menu/products?page=1&limit=25&categoryId=...&isAvailable=true
```

### Response Example

```json
{
  "status": true,
  "data": {
    "items": [
      {
        "id": "product_id",
        "key": "basic_salad",
        "itemType": "basic_salad",
        "name": {
          "ar": "سلطة بيسك",
          "en": "Basic Salad"
        },
        "pricingModel": "per_100g",
        "priceHalala": 2900,
        "baseUnitGrams": 100,
        "isActive": true,
        "isAvailable": true,
        "sortOrder": 1
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## 7.2 Create Fixed Product

```http
POST /dashboard/menu/products
```

### Body

```json
{
  "categoryId": "category_id",
  "key": "water",
  "itemType": "drink",
  "name": {
    "ar": "مياه عادية",
    "en": "Water"
  },
  "description": {
    "ar": "",
    "en": ""
  },
  "imageUrl": "",
  "pricingModel": "fixed",
  "priceHalala": 200,
  "isActive": true,
  "isAvailable": true,
  "isVisible": true,
  "sortOrder": 1
}
```

---

## 7.3 Create Custom Product by Weight

```http
POST /dashboard/menu/products
```

### Body

```json
{
  "categoryId": "category_id",
  "key": "basic_salad",
  "itemType": "basic_salad",
  "name": {
    "ar": "سلطة بيسك",
    "en": "Basic Salad"
  },
  "description": {
    "ar": "",
    "en": ""
  },
  "imageUrl": "",
  "pricingModel": "per_100g",
  "priceHalala": 2900,
  "baseUnitGrams": 100,
  "defaultWeightGrams": 100,
  "minWeightGrams": 100,
  "maxWeightGrams": 1000,
  "weightStepGrams": 50,
  "isActive": true,
  "isAvailable": true,
  "isVisible": true,
  "sortOrder": 1
}
```

---

## 7.4 Update Product

```http
PATCH /dashboard/menu/products/:id
```

### Update Fixed Product Price

```json
{
  "priceHalala": 300
}
```

means 3 SAR.

### Update Product Price by Weight

```json
{
  "priceHalala": 3100,
  "baseUnitGrams": 100
}
```

means 31 SAR per 100 grams.

---

## 7.5 Update Product Availability

```http
PATCH /dashboard/menu/products/:id/availability
```

### Body

```json
{
  "isAvailable": false
}
```

---

## 7.6 Soft Delete Product

```http
DELETE /dashboard/menu/products/:id
```

> Use this only for products that will not return soon.
> If the product is temporarily out of stock, use `isAvailable=false`.

---

## 7.7 Reorder Products

```http
PATCH /dashboard/menu/products/reorder
```

### Body

```json
{
  "items": [
    {
      "id": "product_id_1",
      "sortOrder": 1
    },
    {
      "id": "product_id_2",
      "sortOrder": 2
    }
  ]
}
```

---

# 8. Option Groups Endpoints

## 8.1 List Option Groups

```http
GET /dashboard/menu/option-groups
```

### Query Params

| Param         | Description             |
| ------------- | ----------------------- |
| `page`        | Page number             |
| `limit`       | Number of items         |
| `q`           | Search                  |
| `isActive`    | Filter                  |
| `isAvailable` | Filter                  |

---

## 8.2 Create Option Group

```http
POST /dashboard/menu/option-groups
```

### Body

```json
{
  "key": "proteins",
  "name": {
    "ar": "بروتينات",
    "en": "Proteins"
  },
  "description": {
    "ar": "",
    "en": ""
  },
  "isActive": true,
  "isAvailable": true,
  "isVisible": true,
  "sortOrder": 10
}
```

---

## 8.3 Update Option Group

```http
PATCH /dashboard/menu/option-groups/:id
```

### Body

```json
{
  "name": {
    "ar": "البروتينات",
    "en": "Proteins"
  },
  "sortOrder": 20,
  "isAvailable": true
}
```

---

## 8.4 Soft Delete Option Group

```http
DELETE /dashboard/menu/option-groups/:id
```

---

# 9. Options Endpoints

## 9.1 List Options

```http
GET /dashboard/menu/options
```

### Query Params

| Param         | Description              |
| ------------- | ------------------------ |
| `page`        | Page number              |
| `limit`       | Number of items          |
| `q`           | Search                   |
| `groupId`     | Filter by group          |
| `isActive`    | Filter                   |
| `isAvailable` | Filter                   |

### Example

```http
GET /dashboard/menu/options?groupId=proteins_group_id&q=salmon&isAvailable=true
```

---

## 9.2 Create Option

```http
POST /dashboard/menu/options
```

### Body

```json
{
  "groupId": "proteins_group_id",
  "key": "salmon",
  "name": {
    "ar": "سالمون",
    "en": "Salmon"
  },
  "description": {
    "ar": "",
    "en": ""
  },
  "imageUrl": "",
  "extraPriceHalala": 1600,
  "extraWeightUnitGrams": 50,
  "extraWeightPriceHalala": 1000,
  "isActive": true,
  "isAvailable": true,
  "isVisible": true,
  "sortOrder": 1
}
```

---

## 9.3 Update Option

```http
PATCH /dashboard/menu/options/:id
```

### Body

```json
{
  "name": {
    "ar": "سالمون",
    "en": "Salmon"
  },
  "extraPriceHalala": 1600,
  "extraWeightUnitGrams": 50,
  "extraWeightPriceHalala": 1000,
  "isAvailable": true
}
```

---

## 9.4 Soft Delete Option

```http
DELETE /dashboard/menu/options/:id
```

> If the option is only temporarily out of stock, do not use delete.
> Use `isAvailable=false`.

---

# 10. Product Option Group Rules

These endpoints control linking option groups to a product, for example:

```text
Basic Salad -> Proteins -> maxSelections = 1
Greek Yogurt -> Fruits -> maxSelections = 5
```

---

## 10.1 Link Groups to Product

```http
PUT /dashboard/menu/products/:productId/groups
```

### Body

```json
{
  "groups": [
    {
      "groupId": "leafy_group_id",
      "minSelections": 0,
      "maxSelections": 2,
      "isRequired": false,
      "sortOrder": 1,
      "isActive": true,
      "isAvailable": true,
      "isVisible": true
    },
    {
      "groupId": "proteins_group_id",
      "minSelections": 1,
      "maxSelections": 1,
      "isRequired": true,
      "sortOrder": 2,
      "isActive": true,
      "isAvailable": true,
      "isVisible": true
    }
  ]
}
```

> Warning: if this endpoint replaces all groups linked to the product, the dashboard must send the full list, not only the new group.

---

## 10.2 Update Selection Rules for a Group Inside a Product

```http
PATCH /dashboard/menu/products/:productId/option-groups/:groupId/selection-rules
```

### Body

```json
{
  "minSelections": 0,
  "maxSelections": 4,
  "isRequired": false
}
```

---

# 11. Product Group Options / Overrides

These endpoints control the options inside a specific group inside a specific product.

Example:

```text
Basic Salad -> Proteins -> Salmon
```

Salmon can be customized inside Basic Salad with a price different from Salmon inside Basic Meal.

---

## 11.1 Link Options to a Group Inside a Product

```http
PUT /dashboard/menu/products/:productId/groups/:groupId/options
```

### Body

```json
{
  "options": [
    {
      "optionId": "salmon_option_id",
      "extraPriceHalala": 1600,
      "extraWeightUnitGrams": 50,
      "extraWeightPriceHalala": 1000,
      "isActive": true,
      "isAvailable": true,
      "isVisible": true,
      "sortOrder": 1
    },
    {
      "optionId": "chicken_option_id",
      "extraPriceHalala": 0,
      "isActive": true,
      "isAvailable": true,
      "isVisible": true,
      "sortOrder": 2
    }
  ]
}
```

### Important Warning

This endpoint most likely replaces the list of options linked to this group inside the product.
Therefore, when adding a new option, the dashboard must:

1. Fetch the current options.
2. Add the new option locally.
3. Send the full list again.

---

## 11.2 Update Override for One Option

```http
PATCH /dashboard/menu/products/:productId/option-groups/:groupId/options/:optionId
```

### Body

```json
{
  "extraPriceHalala": 1600,
  "extraWeightUnitGrams": 50,
  "extraWeightPriceHalala": 1000,
  "isAvailable": true,
  "sortOrder": 1
}
```

### `extraWeightUnitGrams` Behavior

If `extraWeightUnitGrams` exists on the relation, the system uses it for this product.
If it does not exist or is `null`, the system uses the general value from `MenuOption`.

Example:

```text
MenuOption.extraWeightUnitGrams = 50
ProductGroupOption.extraWeightUnitGrams = 100

Result inside this product = 100
```

---

## 11.3 Disable Option Inside Product

```http
PATCH /dashboard/menu/products/:productId/option-groups/:groupId/options/:optionId/availability
```

### Body

```json
{
  "isAvailable": false
}
```

Use this if the item is out of stock only for this week.

---

# 12. Weekly Custom Menu Workflows

## 12.1 Disable Salmon in Basic Salad

### Steps

1. Search for the `basic_salad` product.
2. Search for the `proteins` group.
3. Search for the `salmon` option.
4. Send:

```http
PATCH /dashboard/menu/products/:basicSaladId/option-groups/:proteinsGroupId/options/:salmonOptionId/availability
```

### Body

```json
{
  "isAvailable": false
}
```

5. Run validation.
6. Publish the menu.

---

## 12.2 Re-enable Salmon

```http
PATCH /dashboard/menu/products/:basicSaladId/option-groups/:proteinsGroupId/options/:salmonOptionId/availability
```

### Body

```json
{
  "isAvailable": true
}
```

---

## 12.3 Add Avocado to Basic Salad

### Step 1: Create the global option if it does not already exist

```http
POST /dashboard/menu/options
```

### Body

```json
{
  "groupId": "vegetables_group_id",
  "key": "avocado",
  "name": {
    "ar": "أفوكادو",
    "en": "Avocado"
  },
  "extraPriceHalala": 500,
  "isActive": true,
  "isAvailable": true,
  "sortOrder": 30
}
```

### Step 2: Link it to Basic Salad

Use:

```http
PUT /dashboard/menu/products/:basicSaladId/groups/:vegetablesGroupId/options
```

### Body

> Send the full list of current options + avocado.

```json
{
  "options": [
    {
      "optionId": "existing_option_id_1",
      "isAvailable": true,
      "sortOrder": 1
    },
    {
      "optionId": "avocado_option_id",
      "extraPriceHalala": 500,
      "isAvailable": true,
      "sortOrder": 30
    }
  ]
}
```

---

## 12.4 Change the Maximum Number of Fruits in Greek Yogurt

```http
PATCH /dashboard/menu/products/:greekYogurtId/option-groups/:fruitsGroupId/selection-rules
```

### Body

```json
{
  "maxSelections": 4
}
```

---

## 12.5 Change Regular Water Price

```http
PATCH /dashboard/menu/products/:waterProductId
```

### Body

```json
{
  "priceHalala": 300
}
```

means 3 SAR.

---

## 12.6 Change Salmon Price and Weight in Basic Meal

```http
PATCH /dashboard/menu/products/:basicMealId/option-groups/:proteinsGroupId/options/:salmonOptionId
```

### Body

```json
{
  "extraPriceHalala": 2000,
  "extraWeightUnitGrams": 50,
  "extraWeightPriceHalala": 1000
}
```

means:

```text
+20 SAR
+10 SAR per 50 grams
```

---

# 13. Menu Validation

## 13.1 Validate Menu

```http
POST /dashboard/menu/validate
```

### Body

No body required.

### Valid Response

```json
{
  "status": true,
  "data": {
    "ok": true,
    "errors": [],
    "warnings": [],
    "summary": {
      "categories": 8,
      "products": 37,
      "groups": 8,
      "options": 120,
      "activeProducts": 37
    }
  }
}
```

### Invalid Response

```json
{
  "status": true,
  "data": {
    "ok": false,
    "errors": [
      {
        "code": "CUSTOM_PRODUCT_MISSING",
        "message": "basic_salad is missing"
      }
    ],
    "warnings": []
  }
}
```

### Important Rules

* `errors` block publishing.
* `warnings` require review.
* Do not publish the menu before fixing errors.

---

# 14. Menu Publish

## 14.1 Publish Menu

```http
POST /dashboard/menu/publish
```

### Body

```json
{
  "notes": "Menu updates for the second week of May"
}
```

### Response Example

```json
{
  "status": true,
  "data": {
    "versionId": "menu_version_id",
    "status": "published",
    "publishedAt": "2026-05-09T12:00:00.000Z"
  }
}
```

### Notes

* Creates a `MenuVersion`.
* Takes a snapshot of the current menu.
* The mobile app reads the published version.
* Old orders are not affected.

---

# 15. Menu Audit Logs

## 15.1 List Menu Change Logs

```http
GET /dashboard/menu/audit-logs
```

### Query Params

| Param        | Description                                |
| ------------ | ------------------------------------------ |
| `page`       | Page number                                |
| `limit`      | Number of items                            |
| `action`     | Example: `create`, `update`, `publish`     |
| `entityType` | Not confirmed from the current code        |
| `entityId`   | Not confirmed from the current code        |

### Response Example

```json
{
  "status": true,
  "data": {
    "items": [
      {
        "id": "audit_id",
        "action": "update",
        "entityType": "MenuProduct",
        "entityId": "product_id",
        "before": {
          "priceHalala": 200
        },
        "after": {
          "priceHalala": 300
        },
        "actorId": "admin_id",
        "createdAt": "2026-05-09T12:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 1
    }
  }
}
```

---

# 16. Shared Menu Identity Mapping

These endpoints are used to understand the mapping between the one-time order menu and the subscription menu.
These endpoints are admin-only and do not change the current mobile menu.

---

## 16.1 List Shared Identities

```http
GET /dashboard/menu-identities
```

### Query Params

| Param      | Description          |
| ---------- | -------------------- |
| `page`     | Page number          |
| `limit`    | Number of items      |
| `key`      | Search by key        |
| `type`     | Identity type        |
| `isActive` | Filter               |

---

## 16.2 Shared Identity Details

```http
GET /dashboard/menu-identities/:id
```

---

## 16.3 Shared Identity Links

```http
GET /dashboard/menu-identities/:id/links
```

---

## 16.4 All Identity Links

```http
GET /dashboard/menu-identity-links
```

### Query Params

| Param         | Description                            |
| ------------- | -------------------------------------- |
| `channel`     | `one_time` or `subscription`           |
| `sourceModel` | Example: `MenuOption`, `BuilderProtein` |
| `confidence`  | `exact`, `alias`, `manual`             |
| `status`      | `pending`, `confirmed`, `rejected`     |
| `isActive`    | Filter                                 |

---

# 17. Menu Identity Suggestions

These endpoints are used to review automatic suggestions for linking menu items between one-time and subscriptions.

Approving a suggestion does not change the mobile menu or pricing logic.
It only creates an internal mapping.

---

## 17.1 List Suggestions

```http
GET /dashboard/menu-identity-suggestions
```

### Query Params

| Param        | Description                            |
| ------------ | -------------------------------------- |
| `page`       | Page number                            |
| `limit`      | Number of items                        |
| `status`     | `pending`, `approved`, `rejected`      |
| `confidence` | `exact`, `alias`, `manual`             |
| `type`       | Identity type                          |

---

## 17.2 Suggestion Details

```http
GET /dashboard/menu-identity-suggestions/:id
```

---

## 17.3 Approve Suggestion

```http
POST /dashboard/menu-identity-suggestions/:id/approve
```

### Body

```json
{
  "notes": "Confirmed that shrimp and prawn refer to the same item"
}
```

### Result

* Creates or uses `SharedMenuIdentity`.
* Creates `MenuIdentityLink`.
* Records an ActivityLog.
* Does not change `/api/orders/menu`.

---

## 17.4 Reject Suggestion

```http
POST /dashboard/menu-identity-suggestions/:id/reject
```

### Body

```json
{
  "notes": "Not the same ingredient"
}
```

---

# 18. Dashboard Orders

## 18.1 Orders List

```http
GET /dashboard/orders
```

### Query Params

| Param               | Description                         |
| ------------------- | ----------------------------------- |
| `status`            | Example: `confirmed,in_preparation` |
| `paymentStatus`     | Example: `paid`, `pending`          |
| `fulfillmentMethod` | Example: `pickup`                   |
| `from`              | Start date                          |
| `to`                | End date                            |
| `q`                 | Search by customer or order number  |
| `page`              | Page number                         |
| `limit`             | Number of items                     |

### Response Example

```json
{
  "status": true,
  "data": {
    "items": [
      {
        "source": "one_time_order",
        "entityType": "order",
        "orderId": "order_id",
        "orderNumber": "ORD-709834E2",
        "status": "confirmed",
        "paymentStatus": "paid",
        "fulfillmentMethod": "pickup",
        "customer": {
          "id": "customer_id",
          "name": "كريم",
          "phone": "+201000000000"
        },
        "pricing": {
          "totalHalala": 400,
          "currency": "SAR"
        },
        "allowedActions": ["prepare", "cancel"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## 18.2 Order Details

```http
GET /dashboard/orders/:orderId
```

### Response Includes

```text
order data
customer
items
pricing
payment
pickup
delivery if applicable
activity
allowedActions
```

---

## 18.3 Execute an Action on an Order

```http
POST /dashboard/orders/:orderId/actions/:action
```

### Actions

| Action             | From               | To                 |
| ------------------ | ------------------ | ------------------ |
| `prepare`          | `confirmed`        | `in_preparation`   |
| `ready_for_pickup` | `in_preparation`   | `ready_for_pickup` |
| `fulfill`          | `ready_for_pickup` | `fulfilled`        |
| `cancel`           | Multiple statuses  | `canceled`         |

### Body

```json
{
  "notes": "Ready for pickup",
  "reason": "Order is ready"
}
```

### Note

Use `allowedActions` from the order details to determine the available buttons in the UI.

---

# 19. Dashboard Boards / Operations

## 19.1 Kitchen Queue

```http
GET /dashboard/boards/kitchen/queue
```

### Query Params

| Param    | Description  |
| -------- | ------------ |
| `date`   | `YYYY-MM-DD` |
| `status` | Order status |
| `page`   | Page number  |
| `limit`  | Number of items |

---

## 19.2 Pickup Queue

```http
GET /dashboard/boards/pickup/queue
```

### Query Params

| Param    | Description  |
| -------- | ------------ |
| `date`   | `YYYY-MM-DD` |
| `status` | Order status |
| `page`   | Page number  |
| `limit`  | Number of items |

---

# 20. Subscription / Meal Planner Admin

These endpoints manage the subscription menu and are separate from the One-Time Menu.

> Not confirmed from the current code: the final routes and exact details of these endpoints.
> The routes commonly discussed in the project usually start with:
>
> ```http
> /dashboard/meal-planner
> /admin/meal-planner-menu
> ```

## Expected Sections

```text
categories
proteins
carbs
sandwiches
salad-ingredients
addons
```

### General Example for Creating a Protein

```json
{
  "key": "grilled_chicken",
  "name": {
    "ar": "دجاج مشوي",
    "en": "Grilled Chicken"
  },
  "isActive": true,
  "isAvailable": true,
  "sortOrder": 1
}
```

---

# 21. Uploads / Images

## 21.1 Upload Image

```http
POST /dashboard/uploads/image
```

### Content-Type

```http
multipart/form-data
```

### Field

```text
image
```

### Response Example

```json
{
  "status": true,
  "data": {
    "url": "https://..."
  }
}
```

After uploading the image, use `url` in:

```json
{
  "imageUrl": "https://..."
}
```

inside a product or option.

> Not confirmed from the current code: the final upload image endpoint name if it is different.

---

# 22. Settings / Misc

> Not confirmed from the current code: all settings endpoints.

Expected examples:

```http
GET /dashboard/settings
PATCH /dashboard/settings
GET /dashboard/settings/restaurant-hours
PUT /dashboard/settings/restaurant-hours
```

---

# 23. Full Workflow for Updating the Weekly Menu

## 23.1 Steps

1. Open the menu screen in the dashboard.
2. Edit products or options.
3. Use `isAvailable=false` for items that are temporarily out of stock.
4. Add new options if they appear this week.
5. Update maxSelections if the rules change.
6. Update prices for fixed products or custom products.
7. Run:

```http
POST /dashboard/menu/validate
```

8. If `ok=false`, display the errors and do not allow publishing.
9. If `ok=true`, run:

```http
POST /dashboard/menu/publish
```

10. The mobile app reads the new menu from:

```http
GET /api/orders/menu
```

---

# 24. Safety Rules Before Publishing

* Do not use `delete` for items that may return.
* Do not use `isActive=false` for temporary out-of-stock cases.
* All prices are in halala.
* Do not publish before validating.
* Do not modify mobile-specific endpoints.
* Do not trust the price sent by the client.
* Old orders are preserved through snapshots.
* Mapping approval does not currently change the runtime menu.

---

# 25. Important Backend Test Commands

```bash
npm run validate:backend
npm run test:weekly-menu-dashboard
npm run test:one-time-menu
npm run test:mobile-contracts
npm run test:one-time-full-flow
npm run test:menu-identity
npm run test:menu-identity-suggestions
```

---

# 26. Glossary

| Term                   | Meaning                                              |
| ---------------------- | ---------------------------------------------------- |
| Halala                 | Smallest currency unit. 100 halala = 1 SAR           |
| fixed                  | Fixed-price product                                  |
| per_100g               | Product priced per 100 grams                         |
| Option Group           | Group of options such as proteins or fruits          |
| Option                 | Item inside a group, such as salmon or mango         |
| ProductGroupOption     | Links an option to a specific product with overrides |
| extraPriceHalala       | Fixed extra price                                    |
| extraWeightUnitGrams   | Extra weight unit                                    |
| extraWeightPriceHalala | Price per extra weight unit                          |
| MenuVersion            | Published menu version                               |
| Snapshot               | Saved copy of the product at order time              |
| SharedMenuIdentity     | Shared identity between one-time and subscriptions   |
| MenuIdentitySuggestion | Suggested link between similar items                 |
| Publish                | Publish changes so they appear in the app            |
