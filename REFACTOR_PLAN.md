# Refactor Plan: Consolidate All Catalogs into /menu (Modern Patterns Only)

**Goal:** Delete all legacy frontend pages and patterns. Everything lives in `/menu`. Only call `/api/dashboard/menu/*` endpoints. No legacy backend calls allowed.

---

## The Rule

- **KEEP:** `/menu` and everything under it (categories, products, option-groups, options, relations, audit)
- **DELETE:** `/meals`, `/categories`, `/premium-meals` routes, components, hooks, utils, types
- **ENDPOINT RULE:** Any Axios call containing `/meal-planner/` is FORBIDDEN. Only `/api/dashboard/menu/*` is allowed.

---

## Phase 1: Add Missing Entities to /menu Tabs

The old `/meals`, `/categories`, `/premium-meals` managed subscription meal builder data. These must now appear as tabs inside `/menu`.

### 1.1 Update `/menu/index.tsx` — Add New Tabs

Add these tabs alongside existing ones (categories, products, option-groups, options, relations, audit):

| Tab Value | Label | What It Replaces |
|-----------|-------|------------------|
| `proteins` | البروتينات | Old `/meals` page |
| `premium-proteins` | بروتينات مميزة | Old `/premium-meals` page |
| `meal-categories` | تصنيفات الوجبات | Old `/categories` page |

### 1.2 Create New Tab Components

Create these using the **exact same pattern** as existing `MenuCategoriesTab.tsx`:

- `src/components/pages/menu/proteins/MenuProteinsTab.tsx`
- `src/components/pages/menu/premium-proteins/MenuPremiumProteinsTab.tsx`
- `src/components/pages/menu/meal-categories/MenuMealCategoriesTab.tsx`

**Requirements:**
- Use `MenuTabScaffold` (card, toolbar, search, table frame)
- Use server-side pagination (same as existing menu tabs)
- Use `useMutationWithToast` for all mutations
- Columns: index, image, name (ar/en), status, sortOrder, actions

### 1.3 Create New Route Files

Follow the exact pattern of existing menu routes:

- `src/routes/_protected/menu/proteins/create.tsx`
- `src/routes/_protected/menu/proteins/$proteinId/update.tsx`
- `src/routes/_protected/menu/premium-proteins/create.tsx`
- `src/routes/_protected/menu/premium-proteins/$proteinId/update.tsx`
- `src/routes/_protected/menu/meal-categories/create.tsx`
- `src/routes/_protected/menu/meal-categories/$categoryId/update.tsx`

---

## Phase 2: Create Modern Hooks for New Entities

**Rule:** Every hook must use `useMutationWithToast`. No exceptions.

### 2.1 Create `src/hooks/menu/useMenuProteins.ts`

```typescript
const PROTEINS_KEY = "menu.proteins";

export const menuProteinsQueryOptions = (params: MenuListParams = {}) =>
  queryOptions({
    queryKey: [PROTEINS_KEY, params],
    queryFn: () => fetchMenuProteins(params), // calls /api/dashboard/menu/proteins
    staleTime: 1000 * 60 * 2,
  });

export const useCreateMenuProteinMutation = () =>
  useMutationWithToast({
    mutationFn: fetchCreateMenuProtein,
    successMessage: "تم إنشاء البروتين بنجاح",
    invalidateKeys: [[PROTEINS_KEY]],
  });

// ... update, delete, toggle, reorder mutations
```

### 2.2 Create `src/hooks/menu/useMenuPremiumProteins.ts`

Same pattern, key = `"menu.premium-proteins"`, calls `/api/dashboard/menu/premium-proteins`.

### 2.3 Create `src/hooks/menu/useMenuMealCategories.ts`

Same pattern, key = `"menu.meal-categories"`, calls `/api/dashboard/menu/meal-categories`.

---

## Phase 3: Create API Utilities

### 3.1 Create `src/utils/menu/fetchMenuProteins.ts`

```typescript
import { api } from "@/lib/apis";

export const fetchMenuProteins = (params) =>
  api.get("/menu/proteins", { params }).then(r => r.data.data);

export const fetchCreateMenuProtein = (data) =>
  api.post("/menu/proteins", data).then(r => r.data.data);

// ... update, delete, toggle, reorder
```

**CRITICAL:** The base path is `/menu/proteins`, NOT `/meal-planner/proteins`.

### 3.2 Create `src/utils/menu/fetchMenuPremiumProteins.ts`

Calls `/menu/premium-proteins`.

### 3.3 Create `src/utils/menu/fetchMenuMealCategories.ts`

Calls `/menu/meal-categories`.

---

## Phase 4: Create Form Components

### 4.1 Create `src/components/pages/menu/proteins/ProteinFormFields.tsx`

Extract from old `MealFormFields.tsx`:
- Name (ar/en)
- Description (ar/en)
- Image upload (use `fetchUploadImage` + JSON payload, NOT FormData)
- Macros (protein, carb, fat grams)
- Category select
- Availability toggles
- Sort order

### 4.2 Create `src/components/pages/menu/premium-proteins/PremiumProteinFormFields.tsx`

Extends ProteinFormFields with `extraFeeHalala`.

### 4.3 Create `src/components/pages/menu/meal-categories/MealCategoryFormFields.tsx`

Extract from old `CategoryFormFields.tsx` + merge with `MenuCategoryFormFields.tsx`:
- Key (snake_case, disabled on edit)
- Name (ar/en)
- Description (ar/en)
- Image upload
- isActive, isAvailable, isVisible toggles
- Sort order

---

## Phase 5: Unify the Tab Scaffold

### 5.1 Refactor All Tab Components to Use `MenuTabScaffold`

Every tab (existing + new) should import from `MenuTabScaffold.tsx`:
- `MenuSectionCard`
- `MenuToolbar`
- `MenuSearchInput`
- `MenuTableFrame`
- `MenuLoadingTable`

**If any tab is NOT using these, refactor it.**

### 5.2 Unify Pagination

All tabs must use **server-side pagination**:
```typescript
manualPagination: true,
pageCount: data.meta.pages,
```

If any tab is doing client-side pagination, fix it.

---

## Phase 6: Cleanup — Delete All Legacy Files

### 6.1 Delete Old Routes

- [ ] `src/routes/_protected/meals/` (entire directory)
- [ ] `src/routes/_protected/categories/` (entire directory)
- [ ] `src/routes/_protected/premium-meals/` (entire directory)

### 6.2 Delete Old Components

- [ ] `src/components/pages/meals/`
- [ ] `src/components/pages/categories/`
- [ ] `src/components/pages/premium-meals/`

### 6.3 Delete Old Hooks

- [ ] `src/hooks/useMealsQuery.ts`
- [ ] `src/hooks/useCategoriesQuery.ts`
- [ ] `src/hooks/usePremiumMealsQuery.ts`
- [ ] `src/hooks/useCreateMealForm.ts`
- [ ] `src/hooks/useCreateCategoryForm.ts`
- [ ] `src/hooks/useCreatePremiumMealForm.ts`

### 6.4 Delete Old API Utils

- [ ] `src/utils/fetchMeals.ts`
- [ ] `src/utils/fetchCategories.ts`
- [ ] `src/utils/fetchPremiumMeals.ts`
- [ ] `src/utils/fetchCreateMeal.ts`
- [ ] `src/utils/fetchUpdateMeal.ts`
- [ ] `src/utils/fetchDeleteMeal.ts`
- [ ] `src/utils/fetchToggleMealStatus.ts`
- [ ] `src/utils/fetchMealById.ts`
- [ ] `src/utils/fetchCreateCategory.ts`
- [ ] `src/utils/fetchUpdateCategory.ts`
- [ ] `src/utils/fetchDeleteCategory.ts`
- [ ] `src/utils/fetchToggleCategoryStatus.ts`
- [ ] `src/utils/fetchSortCategory.ts`
- [ ] `src/utils/fetchCategoryById.ts`
- [ ] `src/utils/fetchCreatePremiumMeal.ts`
- [ ] `src/utils/fetchUpdatePremiumMeal.ts`
- [ ] `src/utils/fetchDeletePremiumMeal.ts`
- [ ] `src/utils/fetchPremiumMealById.ts`
- [ ] `src/utils/submitMealForm.ts`
- [ ] `src/utils/submitUpdateMealForm.ts`
- [ ] `src/utils/submitCategoryForm.ts`
- [ ] `src/utils/submitUpdateCategoryForm.ts`
- [ ] `src/utils/submitPremiumMealForm.ts`
- [ ] `src/utils/submitUpdatePremiumMealForm.ts`

### 6.5 Delete Old Types

- [ ] `src/types/mealTypes.ts`
- [ ] `src/types/categoryTypes.ts`
- [ ] `src/types/premiumMealTypes.ts`

### 6.6 Delete Old Validation Schemas

- [ ] `src/lib/validations/mealSchema.ts`
- [ ] `src/lib/validations/categorySchema.ts`
- [ ] `src/lib/validations/premiumMealSchema.ts`

---

## Phase 7: Update Navigation & Routing

### 7.1 Update Sidebar

In `AppSidebar.tsx` (or navigation config):
- **Remove links to:** `/meals`, `/categories`, `/premium-meals`
- **Keep only:** `/menu` (labeled as "إدارة المنيو" or "القائمة")

### 7.2 Add Redirects

If user visits old URLs directly, redirect them:
- `/meals` → `/menu?tab=proteins`
- `/categories` → `/menu?tab=meal-categories`
- `/premium-meals` → `/menu?tab=premium-proteins`

Add these redirects in the router config or in the old route files BEFORE deleting them.

---

## Phase 8: Final Verification

### 8.1 Search for Forbidden Strings

Run search across `src/` — these MUST return 0 results:
- `/meal-planner/`
- `submitMealForm`
- `submitCategoryForm`
- `submitPremiumMealForm`
- `fetchMeals`
- `fetchCategories`
- `fetchPremiumMeals`

### 8.2 Verify All /menu Tabs Work

| Tab | Endpoint Called | Should Show |
|-----|---------------|-------------|
| categories | `/menu/categories` | Menu categories |
| products | `/menu/products` | Menu products |
| proteins | `/menu/proteins` | Proteins (old meals data) |
| premium-proteins | `/menu/premium-proteins` | Premium proteins |
| meal-categories | `/menu/meal-categories` | Meal categories (old categories data) |
| option-groups | `/menu/option-groups` | Option groups |
| options | `/menu/options` | Options |
| relations | `/menu/products/.../groups` | Product relations |
| audit | `/menu/audit-logs` | Audit log |

### 8.3 Build Check

```bash
npm run build
```

Must pass with **zero TypeScript errors**.

---

## Important Backend Note

This plan assumes the backend exposes these endpoints:
- `GET/POST/PATCH/DELETE /api/dashboard/menu/proteins`
- `GET/POST/PATCH/DELETE /api/dashboard/menu/premium-proteins`
- `GET/POST/PATCH/DELETE /api/dashboard/menu/meal-categories`

**If these do not exist yet**, the new tabs will be empty until the backend creates them. Coordinate with backend team to expose the old meal-planner data through these new menu endpoints.

---

## Implementation Order for Codex

1. **Phase 2 first** (hooks + API utils) — foundation
2. **Phase 4** (form fields)
3. **Phase 1** (tab components + route files)
4. **Phase 5** (unify scaffold)
5. **Phase 6** (delete everything old)
6. **Phase 7** (navigation)
7. **Phase 8** (verify)
