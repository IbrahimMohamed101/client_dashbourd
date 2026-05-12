import type { MenuCategorySchemaType } from "@/lib/validations/menuCategorySchema";
import type { MenuOptionGroupSchemaType } from "@/lib/validations/menuOptionGroupSchema";
import type { MenuOptionSchemaType } from "@/lib/validations/menuOptionSchema";
import type { MenuProductSchemaType } from "@/lib/validations/menuProductSchema";
import type {
  CreateMenuCategoryPayload,
  CreateMenuOptionGroupPayload,
  CreateMenuOptionPayload,
  CreateMenuProductPayload,
  UpdateMenuCategoryPayload,
  UpdateMenuOptionGroupPayload,
  UpdateMenuOptionPayload,
  UpdateMenuProductPayload,
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
