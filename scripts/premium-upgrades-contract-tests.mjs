import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

const types = read("src/types/premiumUpgradeTypes.ts");
const api = read("src/utils/fetchPremiumUpgrades.ts");
const createDialog = read("src/components/pages/premium-meals/CandidateLinkDialog.tsx");
const editDialog = read("src/components/pages/premium-meals/EditPremiumUpgradeDialog.tsx");
const picker = read("src/components/pages/premium-meals/MenuSourcePicker.tsx");
const detail = read("src/components/pages/premium-meals/PremiumUpgradeDetailDrawer.tsx");
const filters = read("src/components/pages/premium-meals/PremiumUpgradeFilters.tsx");

assert.match(types, /sourceProductId\?: string \| null/);
assert.match(types, /sourceGroupId\?: string \| null/);
assert.match(types, /relationId: string/);
assert.match(types, /excludeConfigId\?: string/);

assert.match(api, /if \(filters\.excludeConfigId\) params\.excludeConfigId = filters\.excludeConfigId/);
assert.match(api, /sourceProductId:/);
assert.match(api, /sourceGroupId:/);
const relinkPayloadReturn =
  api.match(/export function buildRelinkPremiumUpgradePayload[\s\S]*?return \{([\s\S]*?)\n  \};/)?.[1] ?? "";
assert.doesNotMatch(relinkPayloadReturn, /premiumKey/);
assert.match(api, /PREMIUM_RELINK_KEY_MISMATCH/);
assert.match(api, /isSourceCompatibleWithConfig/);

assert.match(createDialog, /selectedSource: PremiumUpgradeSourceDto \| null/);
assert.match(createDialog, /sourceHasRequiredRelation\(selectedSource\)/);
assert.match(createDialog, /buildCreatePremiumUpgradePayload\(\{ \.\.\.form, selectedSource \}\)/);

assert.match(editDialog, /excludeConfigId: row\.id/);
assert.match(editDialog, /buildRelinkPremiumUpgradePayload\(\{ row, selectedSource \}\)/);
assert.match(editDialog, /isSourceCompatibleWithConfig\(source, row\)/);

assert.match(picker, /selectedRelationId/);
assert.match(picker, /key=\{relationId\}/);
assert.match(picker, /sourceConflictMessage\(source, currentConfigId\)/);

assert.match(filters, /\["ready",/);
assert.match(filters, /\["broken",/);
assert.match(detail, /تشخيص الإصلاح/);

console.log("premium upgrades contract tests passed");
