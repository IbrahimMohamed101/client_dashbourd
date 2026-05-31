import assert from "node:assert/strict";
import { filterCanonicalSubscriptionPlans } from "../src/utils/fetchGetPackagesData";

const plans = [
  { key: "subscription_1_meal_7_days_100g", isActive: true },
  { key: "subscription_7_days", gramsOptions: [] },
  { key: "subscription_26_days", gramsOptions: [] },
  { key: "subscription_30_days", gramsOptions: [] },
  { key: "subscription_2_meal_26_days_150g", isActive: true },
  { key: "other_plan", gramsOptions: [] },
];

assert.deepEqual(
  filterCanonicalSubscriptionPlans(plans).map((plan) => plan.key),
  ["subscription_7_days", "subscription_26_days", "subscription_30_days"]
);
