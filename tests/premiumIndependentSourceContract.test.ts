import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

const candidateSource = readFileSync(
  new URL(
    "../src/components/pages/premium-meals/CandidateLinkDialog.tsx",
    import.meta.url
  ),
  "utf8"
);
const hookSource = readFileSync(
  new URL("../src/hooks/usePremiumUpgradesQuery.ts", import.meta.url),
  "utf8"
);
const typeSource = readFileSync(
  new URL("../src/types/premiumUpgradeTypes.ts", import.meta.url),
  "utf8"
);

test("premium source authoring is independent from product relations", () => {
  assert.match(candidateSource, /status:\s*"all"/);
  assert.doesNotMatch(candidateSource, /sourceHasRequiredRelation/);
  assert.match(
    candidateSource,
    /form\.selectedSource\.selectable\s*===\s*false/
  );
  assert.match(candidateSource, /خيار المنيو لا يحتاج إلى ربطه بمنتج محدد/);

  assert.match(hookSource, /PREMIUM_UPGRADES_SOURCES_QUERY_VERSION\s*=\s*"v4-independent"/);
  assert.match(hookSource, /PREMIUM_SOURCES_STALE_TIME\s*=\s*0/);
  assert.match(hookSource, /refetchOnMount:\s*"always"/);
  assert.match(
    hookSource,
    /canonicalizePremiumUpgradeUpdatePayload[\s\S]*return payload;/
  );

  assert.match(typeSource, /relationId\?:\s*string\s*\|\s*null/);
  assert.match(typeSource, /relationRequired\?:\s*boolean/);
  assert.match(typeSource, /reasonCodes\?:\s*string\[\]/);
  assert.match(typeSource, /issueCode\?:\s*string\s*\|\s*null/);
});
