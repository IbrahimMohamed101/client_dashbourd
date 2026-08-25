import assert from "node:assert/strict";
import { test } from "vitest";

import createPackageSchema from "../src/lib/validations/createPackageSchema";
import { normalizePackage } from "../src/utils/packageAdapter";
import { buildPackagePayload } from "../src/utils/submitCreatePackageForm";

test("package timeline days remain separate from meal entitlement days", () => {
  const parsed = createPackageSchema.parse({
    name: { ar: "اشتراك 30 يوم", en: "30-day subscription" },
    daysCount: 30,
    timelineExtraDays: 5,
    currency: "SAR",
    sortOrder: 3,
    isActive: true,
    skipPolicy: { enabled: false },
    freezePolicy: { enabled: false },
    gramsOptions: [
      {
        grams: 150,
        sortOrder: 0,
        isActive: true,
        mealsOptions: [
          {
            mealsPerDay: 2,
            sortOrder: 0,
            isActive: true,
            priceSar: 1131,
          },
        ],
      },
    ],
  });

  assert.equal(parsed.daysCount, 30);
  assert.equal(parsed.timelineExtraDays, 5);
  assert.equal(
    parsed.daysCount * parsed.gramsOptions[0].mealsOptions[0].mealsPerDay,
    60
  );
  const payload = buildPackagePayload(parsed);
  assert.equal(payload.gramsOptions[0].mealsOptions[0].priceHalala, 113100);
  assert.equal(payload.gramsOptions[0].mealsOptions[0].compareAtHalala, 0);

  const normalized = normalizePackage({
    _id: "plan-30",
    name: { ar: "اشتراك 30 يوم", en: "30-day subscription" },
    daysCount: 30,
    timelineExtraDays: 5,
    gramsOptions: [],
  });

  assert.equal(normalized.daysCount, 30);
  assert.equal(normalized.timelineExtraDays, 5);
});
