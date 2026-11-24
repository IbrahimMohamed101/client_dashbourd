// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ data: {} as unknown, paid: undefined as unknown }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: { queryKey?: unknown[] }) => ({ data: options.queryKey?.[0] === "landing-paid-conversions" ? state.paid : state.data, isFetching: false, isError: false, refetch: vi.fn() }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: () => ({ isPending: false, mutate: vi.fn() }),
}));
import { LandingLeadsPage } from '../src/features/landing-leads/LandingLeadsPage';
import { LandingAnalyticsReport } from '../src/features/accounting/components/LandingAnalyticsReport';
afterEach(() => { cleanup(); state.paid = undefined; });

describe('website offer inquiries and conversion reporting', () => {
  it('shows no chosen plan and offer interest without inventing a paid subscription', () => {
    state.data = { total: 1, rows: [{ _id: 'qa', requestId: 'qa', name: 'QA fixture',
      phone: '+966500000000', daysCount: null, grams: null, mealsPerDay: null,
      planSelectionStatus: 'unselected', content: 'menu_basic15_header|offer15|plan_to_confirm',
      fulfillmentMethod: 'unspecified', status: 'new', staffNote: '', marketingConsent: false,
      source: '', medium: '', campaign: '', referrerHost: '', createdAt: '2026-10-28T09:00:00Z',
    }] };
    render(<LandingLeadsPage />);
    expect(screen.getAllByText('لم يحدد باقة').length).toBe(2);
    expect(screen.getByText('مهتم بعرض الموقع 15%')).toBeTruthy();
    expect(screen.queryByText('26 يوم')).toBeNull();
    expect(screen.queryByText('اشتراك فعلي مؤكد')).toBeNull();
  });
  it('shows the funnel only when supported by backend and preserves saved lead count', () => {
    state.data = { kpis: { pageViews: 100, sessions: 80, ctaClicks: 20, uniqueLeads: 7,
      storeClicks: 5, storeClickRate: 5, navClicks: 1, sectionViews: 60, faqOpens: 3,
      reelClicks: 0, leadFormOpens: 20, leadFormCompleted: 8, leadFormCompletionRate: 40 },
      sources: [], campaigns: [], devices: [], ctas: [], sections: [], stores: [], reels: [],
      referrers: [], plans: [], daily: [], leadOpensByPlacement: [], leadSubmissionsByPlacement: [],
    };
    render(<LandingAnalyticsReport />);
    expect(screen.getByText('فتح نموذج التسجيل')).toBeTruthy();
    expect(screen.getByText('إشارات إتمام نموذج التسجيل')).toBeTruthy();
    expect(screen.getByText('طلبات تواصل فريدة محفوظة')).toBeTruthy();
    expect(screen.getByText('إتمام التسجيل حسب موضع الزر')).toBeTruthy();
  });
  it('shows verified paid conversion counts separately from clicks and manual lead states', () => {
    state.data = undefined;
    state.paid = { completed: 2, activationPayments: 1, renewalPayments: 1, firstRecordedPaidPurchases: 1,
      repeatOrRenewalPurchases: 1, unknownPurchaseHistory: 0, amountHalala: 20000, leadMatched: 1,
      leadMatchedAmountHalala: 10000, unmatched: 1, sources: [{ source: "instagram", completed: 1, amountHalala: 10000 }] };
    render(<LandingAnalyticsReport />);
    expect(screen.getByText('مدفوعات التطبيق المكتملة')).toBeTruthy();
    expect(screen.getByText('أول عملية دفع مسجلة للعميل')).toBeTruthy();
    expect(screen.getByText('مدفوعات بدون رابط موقع مثبت')).toBeTruthy();
    expect(screen.getByText('instagram')).toBeTruthy();
  });
  it('does not turn missing legacy funnel measurements into zero conversions', () => {
    state.data = { kpis: { pageViews: 10, sessions: 10, ctaClicks: 2, uniqueLeads: 1,
      storeClicks: 0, storeClickRate: 0, navClicks: 0, sectionViews: 0, faqOpens: 0, reelClicks: 0 },
      sources: [], campaigns: [], devices: [], ctas: [], sections: [], stores: [], reels: [],
      referrers: [], plans: [], daily: [],
    };
    render(<LandingAnalyticsReport />);
    expect(screen.queryByText('مدفوعات التطبيق المكتملة')).toBeNull();
    expect(screen.queryByText('فتح نموذج التسجيل')).toBeNull();
    expect(screen.queryByText('إشارات إتمام نموذج التسجيل')).toBeNull();
    expect(screen.getByText('طلبات تواصل فريدة محفوظة')).toBeTruthy();
  });
});
