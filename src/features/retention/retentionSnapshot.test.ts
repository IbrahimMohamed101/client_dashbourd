import { describe, expect, it } from "vitest";
import { RETENTION_OCT_2026, summarizeRetention } from "./retentionSnapshot";

describe("October retention snapshot integrity", () => {
  const report = summarizeRetention();

  it("uses mutually exclusive old-customer categories", () => {
    expect(report.classifiedTotal).toBe(RETENTION_OCT_2026.oldCustomers);
    expect(report.allRecordedCustomers).toBe(232);
  });

  it("separates renewal-cohort success from old returning customers", () => {
    expect(RETENTION_OCT_2026.dueOldRenewed + RETENTION_OCT_2026.returnedAfterEarlierExpiry)
      .toBe(RETENTION_OCT_2026.renewedOctober);
    expect(report.renewalObservedRate).toBeCloseTo(11 / 76);
  });

  it("does not count 14-day pending renewals as mature lost customers", () => {
    expect(report.oldExpiredNoRepeat).toBe(148);
    expect(report.beyondGrace14NoRepeat).toBe(101);
    expect(report.withinGrace14NoRepeat).toBe(47);
    expect(report.beyondGrace14NoRepeat + report.withinGrace14NoRepeat)
      .toBe(report.oldExpiredNoRepeat);
    expect(RETENTION_OCT_2026.grace14.maturedNoRenewal +
      RETENTION_OCT_2026.grace14.renewedWithinGrace +
      RETENTION_OCT_2026.grace14.returnedLate).toBe(RETENTION_OCT_2026.grace14.matured);
  });

  it("never implies that the snapshot is live", () => {
    expect(RETENTION_OCT_2026.cutoffIso).toBe("2026-10-31T15:00:53.000Z");
  });
});
