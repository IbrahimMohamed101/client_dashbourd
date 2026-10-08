import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2Icon, MessageCircleIcon, RefreshCcwIcon, UsersRoundIcon } from "lucide-react";
import api from "@/lib/apis";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATUS = {
  new: "جديد — بانتظار التواصل",
  contacted: "تم التواصل",
  interested: "مهتم",
  converted: "تم الاشتراك (تأكيد يدوي)",
  not_interested: "غير مهتم",
} as const;
type Status = keyof typeof STATUS;
type Lead = {
  _id: string;
  requestId: string;
  name: string;
  phone: string;
  daysCount: number;
  grams: number;
  mealsPerDay: number;
  fulfillmentMethod?: "delivery" | "pickup" | "unspecified";
  status: Status;
  staffNote: string;
  marketingConsent: boolean;
  source: string; campaign: string; medium: string; referrerHost: string;
  location: string; createdAt: string; contactedAt?: string;
};
type LeadPage = { rows: Lead[]; total: number; page: number; pageSize: number };
const displaySource = (lead: Lead) => lead.source || lead.referrerHost || "مباشر / غير معروف";
const created = (date: string) => new Intl.DateTimeFormat("ar-SA", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
}).format(new Date(date));

function LeadCard({ lead }: { lead: Lead }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>(lead.status);
  const [note, setNote] = useState(lead.staffNote || "");
  const [feedback, setFeedback] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await api.patch<{ status: boolean; data: Lead }>(
        "/api/dashboard/landing-leads/" + encodeURIComponent(lead._id),
        { status, staffNote: note.trim().slice(0, 280) }
      );
      return result.data;
    },
    onSuccess: () => {
      setFeedback("تم تحديث حالة الطلب");
      void queryClient.invalidateQueries({ queryKey: ["landing-leads"] });
    },
    onError: () => setFeedback("تعذر حفظ التعديل، حاول تاني."),
  });
  const digits = lead.phone.replace(/\D/g, "");
  const whatsApp = /^9665\d{8}$/.test(digits)
    ? "https://wa.me/" + digits + "?text=" + encodeURIComponent(
      "مرحبًا، معك فريق Basic Diet بخصوص طلب الاشتراك الذي أرسلته من موقعنا."
    ) : "";
  return (
    <Card className="rounded-2xl border-foreground/10">
      <CardContent className="space-y-4 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-base">{lead.name || "عميل محتمل"}</h2>
            <p className="mt-1 font-mono text-sm" dir="ltr">{lead.phone}</p>
            <p className="mt-1 text-xs text-muted-foreground">{created(lead.createdAt)}</p>
          </div>
          <Badge variant={lead.status === "new" ? "default" : "secondary"}>{STATUS[lead.status]}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-2"><span className="block text-xs text-muted-foreground">الباقة</span><b>{lead.daysCount} يوم</b></div>
          <div className="rounded-lg bg-muted/50 p-2"><span className="block text-xs text-muted-foreground">الكمية</span><b>{lead.grams} جرام</b></div>
          <div className="rounded-lg bg-muted/50 p-2"><span className="block text-xs text-muted-foreground">وجبات يوميًا</span><b>{lead.mealsPerDay}</b></div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <span>المصدر: <strong className="text-foreground">{displaySource(lead)}</strong></span>
          <span>الاستلام المفضل: <strong className="text-foreground">{lead.fulfillmentMethod === "delivery" ? "توصيل" : lead.fulfillmentMethod === "pickup" ? "استلام من الفرع" : "غير محدد"}</strong></span>
          {lead.location === "benefits" && <span>من قسم: <strong className="text-foreground">الاشتراك على مقاسك</strong></span>}
          {lead.campaign && <span>الحملة: <strong className="text-foreground">{lead.campaign}</strong></span>}
          <span>موافقة العروض: {lead.marketingConsent ? "نعم" : "لا"}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="space-y-1 text-sm">حالة المتابعة
            <select className="w-full h-10 rounded-md border bg-background px-3"
              value={status} onChange={event => setStatus(event.target.value as Status)}>
              {(Object.keys(STATUS) as Status[]).map(key => <option key={key} value={key}>{STATUS[key]}</option>)}
            </select>
          </label>
          {whatsApp && (
            <a className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
              href={whatsApp} target="_blank" rel="noopener noreferrer">
              <MessageCircleIcon className="size-4" /> واتساب
            </a>
          )}
        </div>
        <label className="block space-y-1 text-sm">ملاحظات المتابعة
          <textarea value={note} maxLength={280} rows={2}
            onChange={event => setNote(event.target.value)}
            placeholder="مثال: يفضل التواصل بعد العصر"
            className="w-full resize-y rounded-md border bg-background p-3 text-sm"/>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={mutation.isPending || (status === lead.status && note.trim() === (lead.staffNote || ""))}
            onClick={() => { setFeedback(""); mutation.mutate(); }}>
            {mutation.isPending ? "جاري الحفظ..." : "حفظ المتابعة"}
          </Button>
          {feedback && <span role="status" className="text-xs text-muted-foreground">{feedback}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
export function LandingLeadsPage() {
  const [status, setStatus] = useState<Status | "all">("all");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["landing-leads", status, page],
    queryFn: async () => {
      const res = await api.get<{ status: boolean; data: LeadPage }>(
        "/api/dashboard/landing-leads", { params: { status, page } }
      );
      return res.data.data;
    },
    refetchInterval: 60_000,
    staleTime: 20_000,
    retry: false,
  });
  return (
    <main dir="rtl" className="space-y-5 px-4 py-5 lg:px-6">
      <Card className="rounded-2xl">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-xl"><UsersRoundIcon className="size-5 text-primary"/> طلبات الاشتراك من الموقع</CardTitle>
            <Button size="sm" variant="outline" onClick={() => void query.refetch()}>
              <RefreshCcwIcon className="size-4" /> تحديث
            </Button>
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            أشخاص طلبوا التواصل بشأن باقة اختاروها من صفحة Basic Diet. الطلب مش اشتراك مدفوع.
            حالة «تم الاشتراك» هنا علامة متابعة يدوية وليست تأكيدًا من بوابة الدفع.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-sm">عرض الطلبات
            <select value={status} className="me-2 h-10 rounded-md border bg-background px-3"
              onChange={event => { setPage(1); setStatus(event.target.value as Status | "all"); }}>
              <option value="all">جميع الحالات</option>
              {(Object.keys(STATUS) as Status[]).map(key => <option key={key} value={key}>{STATUS[key]}</option>)}
            </select>
          </label>
          <span className="text-sm text-muted-foreground">عدد الطلبات: {query.data?.total ?? "—"}</span>
        </CardContent>
      </Card>
      {query.isLoading && <p className="text-sm text-muted-foreground">جاري تحميل الطلبات...</p>}
      {query.isError && (
        <Card><CardContent className="space-y-2 p-5">
          <p className="text-sm text-destructive">تعذر تحميل الطلبات. تأكد من الصلاحيات والاتصال.</p>
          <Button variant="outline" onClick={() => void query.refetch()}>إعادة المحاولة</Button>
        </CardContent></Card>
      )}
      {query.data?.rows.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">لا توجد طلبات في هذه الحالة حتى الآن.</CardContent></Card>}
      {query.data && query.data.rows.length > 0 && (
        <div className="grid gap-3 xl:grid-cols-2">
          {query.data.rows.map(lead => <LeadCard key={lead._id} lead={lead}/>)}
        </div>
      )}
      {query.data && query.data.total > query.data.pageSize && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>السابق</Button>
          <span className="text-sm">صفحة {page}</span>
          <Button variant="outline" disabled={page * query.data.pageSize >= query.data.total} onClick={() => setPage(page + 1)}>التالي</Button>
        </div>
      )}
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><Link2Icon className="size-4"/>
        الطلبات يتم الاحتفاظ بها لمدة 180 يومًا، ولا تُرسل رسائل تسويقية لمن لم يوافق عليها.
      </p>
    </main>
  );
}
