import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActivityIcon, ExternalLinkIcon, MousePointerClickIcon } from "lucide-react";
import api from "@/lib/apis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resolveAccountingRangePreset, validateAccountingRange, type AccountingDateRange } from "@/features/accounting/accountingRange";
import { getTodayKSADate } from "@/utils/ksaDate";

interface Bucket { key: string; count: number }
interface LandingAnalyticsData {
  range: { from: string; to: string; days: number; timezone: string };
  kpis: {
    pageViews: number; sessions: number; ctaClicks: number;
    storeClicks: number; storeClickRate: number;
    navClicks: number; sectionViews: number; faqOpens: number; reelClicks: number;
  };
  daily: Array<{ date: string; views: number; ctaClicks: number; storeClicks: number }>;
  sources: Bucket[]; campaigns: Bucket[]; devices: Bucket[];
  ctas: Bucket[]; sections: Bucket[]; stores: Bucket[];
  reels: Bucket[]; referrers: Bucket[]; plans: Bucket[];
  note: string;
}
const initialRange = resolveAccountingRangePreset("last30", getTodayKSADate());
const fmt = (n: number) => new Intl.NumberFormat("ar-SA").format(n);
const locationLabels: Record<string,string> = {
  hero: "الواجهة الرئيسية", header: "شريط التنقل", app: "قسم التطبيق",
  benefits: "الاشتراك على مقاسك",
  plans: "الباقات", final: "آخر الصفحة",
  ios: "iOS", android: "Android", desktop: "كمبيوتر",
  app_store: "App Store", google_play: "Google Play",
  direct: "دخول مباشر",
};
function getLabel(key: string) { return locationLabels[key] || key || "غير محدد"; }

function BucketTable({ title, rows }: { title: string; rows: Bucket[] }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {rows.length ? rows.slice(0, 10).map((row, index) => (
          <div key={row.key + index} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
            <span className="min-w-0 break-all">{getLabel(row.key)}</span>
            <strong className="tabular-nums">{fmt(row.count)}</strong>
          </div>
        )) : <p className="text-sm text-muted-foreground">لا توجد بيانات في الفترة المحددة.</p>}
      </CardContent>
    </Card>
  );
}
export function LandingAnalyticsReport() {
  const [draft, setDraft] = useState<AccountingDateRange>(initialRange);
  const [range, setRange] = useState<AccountingDateRange>(initialRange);
  const error = validateAccountingRange(draft);
  const query = useQuery({
    queryKey: ["landing-analytics", range.from, range.to],
    queryFn: async () => {
      const response = await api.get<{ status: boolean; data: LandingAnalyticsData }>(
        "/api/landing-analytics/report", { params: range }
      );
      return response.data.data;
    },
    staleTime: 60_000,
    retry: false,
  });
  const report = query.data;
  const cards = report ? [
    ["مشاهدات الصفحة", report.kpis.pageViews],
    ["الجلسات التقريبية (تبويب المتصفح)", report.kpis.sessions],
    ["نقرات بدء الاشتراك", report.kpis.ctaClicks],
    ["نقرات متاجر التطبيق", report.kpis.storeClicks],
    ["النقرات داخل القائمة", report.kpis.navClicks],
    ["مشاهدات الأقسام", report.kpis.sectionViews],
    ["فتح الأسئلة الشائعة", report.kpis.faqOpens],
    ["نقرات ريلز إنستجرام", report.kpis.reelClicks],
  ] as const : [];

  return (
    <section dir="rtl" className="space-y-4" aria-label="تحليلات صفحة الهبوط">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ActivityIcon className="size-5 text-primary" />
            تحليلات صفحة Basic Diet
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            زيارات ونقرات فعلية من موقع Basic Diet، محفوظة في الـBackend.
            الأرقام تبدأ من لحظة نشر التتبع، وليست تاريخية.
            نقر زر متجر التطبيق لا يعني تثبيت التطبيق أو شراء اشتراك.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label className="space-y-1 text-sm">من تاريخ
              <Input type="date" value={draft.from} onChange={e => setDraft(r => ({ ...r, from: e.target.value }))} />
            </label>
            <label className="space-y-1 text-sm">إلى تاريخ
              <Input type="date" value={draft.to} onChange={e => setDraft(r => ({ ...r, to: e.target.value }))} />
            </label>
            <Button disabled={!!error} onClick={() => setRange(draft)}>عرض التقرير</Button>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {query.isFetching && <p className="text-sm text-muted-foreground">جاري تحديث التحليلات...</p>}
          {query.isError && <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
            تعذر جلب التقرير من الخادم.
            <Button variant="outline" onClick={() => void query.refetch()}>إعادة المحاولة</Button>
          </div>}
        </CardContent>
      </Card>
      {report && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map(([label, value]) => (
              <Card className="rounded-xl" key={label}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MousePointerClickIcon className="size-4" />
                    <p className="text-xs">{label}</p>
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">{fmt(value)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            نقرات المتاجر لكل 100 مشاهدة: {fmt(report.kpis.storeClickRate)} — مؤشر اهتمام، وليس معدل تثبيت أو شراء.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            <BucketTable title="مصادر الزيارات (UTM)" rows={report.sources} />
            <BucketTable title="الحملات الإعلانية (UTM Campaign)" rows={report.campaigns} />
            <BucketTable title="أماكن الضغط على ابدأ اشتراكك" rows={report.ctas} />
            <BucketTable title="النقرات حسب المتجر" rows={report.stores} />
            <BucketTable title="الأقسام الأكثر مشاهدة" rows={report.sections} />
            <BucketTable title="أنواع الأجهزة" rows={report.devices} />
            <BucketTable title="الروابط المُحيلة" rows={report.referrers} />
            <BucketTable title="الباقات التي تم النقر عليها" rows={report.plans} />
          </div>
          <Card className="rounded-2xl">
            <CardHeader><CardTitle className="text-base">حركة الزيارات يوميًا — بتوقيت الرياض</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-right text-sm">
                <thead><tr className="border-b">
                  <th className="p-2">اليوم</th><th className="p-2">الزيارات</th>
                  <th className="p-2">الضغط على الاشتراك</th><th className="p-2">نقرات المتاجر</th>
                </tr></thead>
                <tbody>{report.daily.map(day => (
                  <tr key={day.date} className="border-b last:border-0">
                    <td className="p-2">{day.date}</td><td className="p-2">{fmt(day.views)}</td>
                    <td className="p-2">{fmt(day.ctaClicks)}</td><td className="p-2">{fmt(day.storeClicks)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </CardContent>
          </Card>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ExternalLinkIcon className="size-3" />
            الزيارات والجلسات تقريبية وتتأثر بحظر المتصفح والأدوات الآلية. لا تُجمع بيانات شخصية.
          </p>
        </>
      )}
    </section>
  );
}
