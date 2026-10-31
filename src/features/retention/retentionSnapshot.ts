/**
 * Historical, read-only audit snapshot. NOT live data and NOT a contact list.
 * Evidence: basicdiet-marketing-os PR #18, retention/01 and retention_metrics.json.
 * Cutoff: 2026-10-31 18:00:53 Asia/Riyadh (end-exclusive).
 *
 * Never update these numbers in-place as though they were a live API response.
 * Replace this source with a protected, validated live server read model later.
 */
export const RETENTION_OCT_2026 = {
  cutoffIso: "2026-10-31T15:00:53.000Z",
  cutoffLabel: "31 أكتوبر 2026، 18:00:53 بتوقيت السعودية",
  oldCustomers: 190,
  newCustomersOctober: 42,
  renewedOctober: 16,
  purchasesByOldRenewers: 17,
  dueOldOctober: 76,
  dueOldRenewed: 11,
  returnedAfterEarlierExpiry: 5,
  uncertainDue: 1,
  statuses: {
    renewedOctober: 16,
    expiresNovember: 23,
    expiredInOctober: 65,
    expiredBeforeOctober: 83,
    canceledNoReturn: 1,
    requiresReview: 2,
  },
  grace7: {
    matured: 40,
    renewedWithinGrace: 6,
    maturedNoRenewal: 32,
    returnedLate: 2,
    pendingNoRenewal: 33,
  },
  grace14: {
    matured: 23,
    renewedWithinGrace: 4,
    maturedNoRenewal: 18,
    returnedLate: 1,
    pendingNoRenewal: 47,
  },
  firstRenewal: {
    dueOldNoPreviousRenewal: 51,
    renewed: 3,
  },
  source: "https://github.com/IbrahimMohamed101/basicdiet-marketing-os/blob/reports/october-2026-audit/reports/2026-10/retention/01_ARABIC_RETENTION_REPORT.md",
} as const;

export function summarizeRetention(snapshot = RETENTION_OCT_2026) {
  const s = snapshot.statuses;
  const classifiedTotal = Object.values(s).reduce((sum, count) => sum + count, 0);
  return {
    classifiedTotal,
    allRecordedCustomers: snapshot.oldCustomers + snapshot.newCustomersOctober,
    renewalObservedRate: snapshot.dueOldRenewed / snapshot.dueOldOctober,
    firstRenewalObservedRate: snapshot.firstRenewal.renewed / snapshot.firstRenewal.dueOldNoPreviousRenewal,
    oldExpiredNoRepeat: s.expiredInOctober + s.expiredBeforeOctober,
    beyondGrace14NoRepeat: snapshot.grace14.maturedNoRenewal + s.expiredBeforeOctober,
    withinGrace14NoRepeat: snapshot.grace14.pendingNoRenewal,
  };
}
