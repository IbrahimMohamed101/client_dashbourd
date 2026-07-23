import assert from "node:assert/strict";
import { test } from "vitest";

import { canonicalizePremiumUpgradeUpdatePayload } from "../src/hooks/usePremiumUpgradesQuery";
import {
  buildCreatePremiumUpgradePayload,
  sourceHasRequiredRelation,
} from "../src/utils/fetchPremiumUpgrades";

test("premium option relink keeps relation identity for backend resolution", () => {
  const payload = canonicalizePremiumUpgradeUpdatePayload({
    expectedRevision: 4,
    kind: "option",
    sourceId: "option-id",
    relationId: "menu_option:option-id:product-id:group-id",
    sourceProductId: "product-id",
    sourceGroupId: "group-id",
  });

  assert.deepEqual(payload, {
    expectedRevision: 4,
    kind: "option",
    sourceId: "option-id",
    relationId: "menu_option:option-id:product-id:group-id",
    sourceProductId: "product-id",
    sourceGroupId: "group-id",
  });
});

test("normal premium edits keep editable fields unchanged", () => {
  const payload = {
    expectedRevision: 7,
    upgradeDeltaHalala: 1250,
    currency: "SAR" as const,
    isActive: true,
    isVisible: false,
    sortOrder: 20,
  };

  assert.deepEqual(canonicalizePremiumUpgradeUpdatePayload(payload), payload);
});

test("option create accepts product/group relation fields when relationId is absent", () => {
  const selectedSource = {
    id: "option-id",
    sourceId: "option-id",
    kind: "option" as const,
    sourceProductId: "product-id",
    sourceGroupId: "group-id",
    sourceProductKey: "standard_meal",
    sourceGroupKey: "proteins",
    relationId: "",
    key: "beef_steak",
  };

  assert.equal(sourceHasRequiredRelation(selectedSource), true);
  assert.deepEqual(
    buildCreatePremiumUpgradePayload({
      kind: "option",
      selectedSource,
      upgradePriceSarInput: "12.5",
      currency: "SAR",
      isActive: true,
      isVisible: true,
      sortOrder: "10",
    }),
    {
      kind: "option",
      sourceId: "option-id",
      sourceProductId: "product-id",
      sourceGroupId: "group-id",
      upgradeDeltaHalala: 1250,
      currency: "SAR",
      isActive: true,
      isVisible: true,
      sortOrder: 10,
    }
  );
});

test("option create can submit group-only relation for backend inference", () => {
  const selectedSource = {
    id: "option-id",
    sourceId: "option-id",
    kind: "option" as const,
    sourceProductId: null,
    sourceGroupId: "group-id",
    sourceGroupKey: "beef",
    relationId: "",
    key: "steak",
  };

  assert.equal(sourceHasRequiredRelation(selectedSource), true);
  assert.deepEqual(
    buildCreatePremiumUpgradePayload({
      kind: "option",
      selectedSource,
      upgradePriceSarInput: "0",
      currency: "SAR",
      isActive: true,
      isVisible: true,
      sortOrder: "10",
    }),
    {
      kind: "option",
      sourceId: "option-id",
      sourceGroupId: "group-id",
      upgradeDeltaHalala: 0,
      currency: "SAR",
      isActive: true,
      isVisible: true,
      sortOrder: 10,
    }
  );
});
