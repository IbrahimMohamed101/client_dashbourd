import assert from "node:assert/strict";
import { test } from "vitest";

import { canonicalizePremiumUpgradeUpdatePayload } from "../src/hooks/usePremiumUpgradesQuery";

test("premium relink sends only backend-owned canonical source identity", () => {
  const payload = canonicalizePremiumUpgradeUpdatePayload({
    expectedRevision: 4,
    kind: "option",
    sourceId: "option-id",
    relationId: "legacy-relation-id",
  });

  assert.deepEqual(payload, {
    expectedRevision: 4,
    kind: "option",
    sourceId: "option-id",
  });
  assert.equal("relationId" in payload, false);
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
