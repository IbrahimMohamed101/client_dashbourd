import type {
  Subscription,
  SubscriptionPurchase,
  SubscriptionPurchasePayment,
  SubscriptionStackingReadModel,
} from "./subscriptionTypes";

export type SubscriptionStackingPayment = SubscriptionPurchasePayment;
export type SubscriptionStackingPackage = SubscriptionPurchase;
export type SubscriptionStackingContext = SubscriptionStackingReadModel;

export type SubscriptionWithStacking = Subscription;
