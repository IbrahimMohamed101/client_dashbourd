import assert from "node:assert/strict";
import { getTodayKSADate } from "../src/utils/ksaDate";
import { resolveAccountingDailyReportParams } from "../src/utils/fetchDashboardSupportData";

assert.match(getTodayKSADate(new Date("2026-05-26T12:00:00Z")), /^\d{4}-\d{2}-\d{2}$/);

const resolved = resolveAccountingDailyReportParams({ includeDetails: true });
assert.match(resolved.date!, /^\d{4}-\d{2}-\d{2}$/);
assert.equal(resolved.includeDetails, true);

const withDate = resolveAccountingDailyReportParams({ date: "2026-05-15" });
assert.equal(withDate.date, "2026-05-15");

console.log("ksaDate.test.ts passed");
