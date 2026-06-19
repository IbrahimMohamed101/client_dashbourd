import api from "@/lib/apis";

export type PackageGramPayload = {
  grams: string;
  proteinGrams?: number;
  carbGrams?: number;
  isActive?: boolean;
};

export type PackageMealOptionPayload = {
  mealsPerDay: number;
  priceHalala?: number;
  isActive?: boolean;
};

export const createPackageGramTier = async (
  planId: string,
  data: PackageGramPayload
) => {
  const response = await api.post(`/api/dashboard/plans/${planId}/grams`, data);
  return response.data;
};

export const createPackageMealOption = async (
  planId: string,
  grams: string,
  data: PackageMealOptionPayload
) => {
  const response = await api.post(
    `/api/dashboard/plans/${planId}/grams/${grams}/meals`,
    data
  );
  return response.data;
};
