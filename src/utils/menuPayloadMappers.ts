import type { MenuCategorySchemaType } from "@/lib/validations/menuCategorySchema";
import type { MenuOptionGroupSchemaType } from "@/lib/validations/menuOptionGroupSchema";
import type { MenuOptionSchemaType } from "@/lib/validations/menuOptionSchema";
import type { MenuProductSchemaType } from "@/lib/validations/menuProductSchema";
import type { MenuProteinSchemaType } from "@/lib/validations/menuProteinSchema";
import type { MenuPremiumProteinSchemaType } from "@/lib/validations/menuPremiumProteinSchema";
import type { MenuMealCategorySchemaType } from "@/lib/validations/menuMealCategorySchema";
import type {
  CreateMenuCategoryPayload,
  CreateMenuMealCategoryPayload,
  CreateMenuOptionGroupPayload,
  CreateMenuOptionPayload,
  CreateMenuPremiumProteinPayload,
  CreateMenuProductPayload,
  CreateMenuProteinPayload,
  UpdateMenuCategoryPayload,
  UpdateMenuMealCategoryPayload,
  UpdateMenuOptionGroupPayload,
  UpdateMenuOptionPayload,
  UpdateMenuPremiumProteinPayload,
  UpdateMenuProductPayload,
  UpdateMenuProteinPayload,
} from "@/types/menuTypes";

const sarToHalala = (amount: number) => Math.round(amount * 100);

const optionalSarToHalala = (amount?: number) =>
  amount === undefined ? undefined : sarToHalala(amount);

export const toCreateMenuCategoryPayload = (
  data: MenuCategorySchemaType
): CreateMenuCategoryPayload => ({
  key: data.key,
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});

export const toUpdateMenuCategoryPayload = (
  data: MenuCategorySchemaType
): UpdateMenuCategoryPayload => ({
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});

export const toCreateMenuMealCategoryPayload = (
  data: MenuMealCategorySchemaType
): CreateMenuMealCategoryPayload => ({
  key: data.key,
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});

export const toUpdateMenuMealCategoryPayload = (
  data: MenuMealCategorySchemaType
): UpdateMenuMealCategoryPayload => ({
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});

export const toCreateMenuProteinPayload = (
  data: MenuProteinSchemaType
): CreateMenuProteinPayload => ({
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  categoryId: data.categoryId,
  proteinGrams: data.proteinGrams,
  carbGrams: data.carbGrams,
  fatGrams: data.fatGrams,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  availableForOrder: data.availableForOrder,
  availableForSubscription: data.availableForSubscription,
  sortOrder: data.sortOrder,
});

export const toUpdateMenuProteinPayload = (
  data: MenuProteinSchemaType
): UpdateMenuProteinPayload => ({
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  categoryId: data.categoryId,
  proteinGrams: data.proteinGrams,
  carbGrams: data.carbGrams,
  fatGrams: data.fatGrams,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  availableForOrder: data.availableForOrder,
  availableForSubscription: data.availableForSubscription,
  sortOrder: data.sortOrder,
});

export const toCreateMenuPremiumProteinPayload = (
  data: MenuPremiumProteinSchemaType
): CreateMenuPremiumProteinPayload => ({
  ...toCreateMenuProteinPayload(data),
  currency: data.currency,
  extraFeeHalala: sarToHalala(data.extraFeeSar),
});

export const toUpdateMenuPremiumProteinPayload = (
  data: MenuPremiumProteinSchemaType
): UpdateMenuPremiumProteinPayload => ({
  ...toUpdateMenuProteinPayload(data),
  currency: data.currency,
  extraFeeHalala: sarToHalala(data.extraFeeSar),
});

export const toCreateMenuProductPayload = (
  data: MenuProductSchemaType
): CreateMenuProductPayload => ({
  categoryId: data.categoryId,
  key: data.key,
  itemType: data.itemType,
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  pricingModel: data.pricingModel,
  priceHalala: sarToHalala(data.priceSar),
  baseUnitGrams: data.baseUnitGrams,
  defaultWeightGrams: data.defaultWeightGrams,
  minWeightGrams: data.minWeightGrams,
  maxWeightGrams: data.maxWeightGrams,
  weightStepGrams: data.weightStepGrams,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});

export const toUpdateMenuProductPayload = (
  data: MenuProductSchemaType
): UpdateMenuProductPayload => ({
  categoryId: data.categoryId,
  itemType: data.itemType,
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  pricingModel: data.pricingModel,
  priceHalala: sarToHalala(data.priceSar),
  baseUnitGrams: data.baseUnitGrams,
  defaultWeightGrams: data.defaultWeightGrams,
  minWeightGrams: data.minWeightGrams,
  maxWeightGrams: data.maxWeightGrams,
  weightStepGrams: data.weightStepGrams,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});

export const toCreateMenuOptionGroupPayload = (
  data: MenuOptionGroupSchemaType
): CreateMenuOptionGroupPayload => ({
  key: data.key,
  name: data.name,
  description: data.description,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});

export const toUpdateMenuOptionGroupPayload = (
  data: MenuOptionGroupSchemaType
): UpdateMenuOptionGroupPayload => ({
  name: data.name,
  description: data.description,
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});

export const toCreateMenuOptionPayload = (
  data: MenuOptionSchemaType
): CreateMenuOptionPayload => ({
  groupId: data.groupId,
  key: data.key,
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  extraPriceHalala: sarToHalala(data.extraPriceSar),
  extraWeightUnitGrams: data.extraWeightUnitGrams,
  extraWeightPriceHalala: optionalSarToHalala(data.extraWeightPriceSar),
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});

export const toUpdateMenuOptionPayload = (
  data: MenuOptionSchemaType
): UpdateMenuOptionPayload => ({
  name: data.name,
  description: data.description,
  imageUrl: data.imageUrl,
  extraPriceHalala: sarToHalala(data.extraPriceSar),
  extraWeightUnitGrams: data.extraWeightUnitGrams,
  extraWeightPriceHalala: optionalSarToHalala(data.extraWeightPriceSar),
  isActive: data.isActive,
  isAvailable: data.isAvailable,
  isVisible: data.isVisible,
  sortOrder: data.sortOrder,
});
