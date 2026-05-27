export type SettingEndpointKey =
  | "cutoff"
  | "delivery-windows"
  | "skip-allowance"
  | "premium-price"
  | "subscription-delivery-fee"
  | "vat-percentage"
  | "custom-salad-base-price"
  | "custom-meal-base-price";

export const settingEndpointUrl = (key: SettingEndpointKey) =>
  `/api/dashboard/settings/${key}`;
