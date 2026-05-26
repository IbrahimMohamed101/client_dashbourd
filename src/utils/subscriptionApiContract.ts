const subscriptionBaseUrl = (subscriptionId: string) =>
  `/api/dashboard/subscriptions/${subscriptionId}`;

export const subscriptionExtendUrl = (subscriptionId: string) =>
  `${subscriptionBaseUrl(subscriptionId)}/extend`;

export const subscriptionDeliveryUrl = (subscriptionId: string) =>
  `${subscriptionBaseUrl(subscriptionId)}/delivery`;

export const subscriptionBalancesUrl = (subscriptionId: string) =>
  `${subscriptionBaseUrl(subscriptionId)}/balances`;

export const subscriptionAddonEntitlementsUrl = (subscriptionId: string) =>
  `${subscriptionBaseUrl(subscriptionId)}/addon-entitlements`;

export const subscriptionDaysUrl = (subscriptionId: string) =>
  `${subscriptionBaseUrl(subscriptionId)}/days`;

export const subscriptionCancelUrl = (subscriptionId: string) =>
  `${subscriptionBaseUrl(subscriptionId)}/cancel`;
