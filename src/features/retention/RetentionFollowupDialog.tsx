import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/apis";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type FollowupEvent = {
  id: string;
  userId: string;
  channel: string;
  outcome: string;
  reasonCode: string;
  note: string;
  createdAt: string;
};
const CHANNEL: Record<string, string> = {
  phone: "مكالمة", whatsapp: "واتساب (يدوي)", in_person: "في المطعم", other: "وسيلة أخرى",
};
const OUTCOME: Record<string, string> = {
  no_answer: "لم يرد",
  contacted: "تم التواصل",
  interested: "مهتم بالتجديد",
  callback_requested: "يريد اتصالًا لاحقًا",
  not_interested: "غير مهتم",
  client_claims_renewed: "قال إنه جدد — يحتاج إثباتًا",
  do_not_contact: "طلب عدم التواصل",
};
const REASON: Record<string, string> = {
  unknown: "لم يُحدد سبب", price: "السعر", menu: "تنوع المنيو",
  delivery: "التوصيل", quality: "جودة الأكل", payment: "الدفع",
  no_need: "لم يعد محتاجًا للاشتراك", other: "سبب آخر",
};
const stamp = (value: string) => new Intl.DateTimeFormat("ar-SA", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh",
}).format(new Date(value));

export function RetentionFollowupDialog({ customer, onClose }: {
  customer: { id: string; name: string; blocked: boolean } | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const customerId = customer?.id || "";
  const [channel, setChannel] = React.useState("phone");
  const [outcome, setOutcome] = React.useState("no_answer");
  const [reasonCode, setReasonCode] = React.useState("unknown");
  const [note, setNote] = React.useState("");
  const [requestId, setRequestId] = React.useState("");
  const [success, setSuccess] = React.useState("");

  React.useEffect(() => {
    setChannel("phone"); setOutcome("no_answer"); setReasonCode("unknown");
    setNote(""); setRequestId(""); setSuccess("");
  }, [customerId]);

  const history = useQuery({
    queryKey: ["retention-followups", customerId],
    queryFn: async () => {
      const r = await api.get<{ status: boolean; data: FollowupEvent[] }>(
        "/api/dashboard/customer-management/retention/" + encodeURIComponent(customerId) + "/followups"
      );
      return r.data.data;
    },
    enabled: Boolean(customerId),
    staleTime: 10_000,
  });

  const optedOut = Boolean(customer?.blocked || history.data?.some((event) => event.outcome === "do_not_contact"));
  const mutation = useMutation({
    mutationFn: async () => {
      const id = requestId || crypto.randomUUID();
      if (!requestId) setRequestId(id);
      await api.post(
        "/api/dashboard/customer-management/retention/" + encodeURIComponent(customerId) + "/followups",
        { requestId: id, channel, outcome, reasonCode, note: note.trim() }
      );
    },
    onSuccess: () => {
      setSuccess("تم حفظ نتيجة التواصل في سجل العميل.");
      setNote(""); setRequestId("");
      void queryClient.invalidateQueries({ queryKey: ["retention-followups", customerId] });
      void queryClient.invalidateQueries({ queryKey: ["customer-retention-live"] });
    },
  });

  const fieldClass = "mt-1 h-10 w-full rounded-md border bg-background px-2 text-sm";
  return (
    <Dialog open={Boolean(customer)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>تسجيل متابعة — {customer?.name || "العميل"}</DialogTitle>
          <DialogDescription>
            سجّل نتيجة تواصل حصل بالفعل فقط. التسجيل لا يرسل واتساب أو يتصل بالعميل،
            ولا يؤكد التجديد إلا بعد مطابقته بسجلات الدفع.
          </DialogDescription>
        </DialogHeader>
        {optedOut && <p role="alert" className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">العميل طلب عدم التواصل. لا تسجل محاولة تسويق جديدة؛ السجل للعرض فقط.</p>}
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (!optedOut) mutation.mutate(); }}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="retention-channel">وسيلة التواصل</Label>
              <select id="retention-channel" className={fieldClass} value={channel}
                onChange={(event) => { setChannel(event.target.value); setRequestId(""); }}>
                {Object.entries(CHANNEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="retention-outcome">النتيجة</Label>
              <select id="retention-outcome" className={fieldClass} value={outcome}
                onChange={(event) => { setOutcome(event.target.value); setRequestId(""); }}>
                {Object.entries(OUTCOME).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="retention-reason">سبب عدم التجديد حسب كلام العميل</Label>
            <select id="retention-reason" className={fieldClass} value={reasonCode}
              onChange={(event) => { setReasonCode(event.target.value); setRequestId(""); }}>
              {Object.entries(REASON).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="retention-notes">ملاحظات الموظف (بدون بيانات حساسة)</Label>
            <Textarea id="retention-notes" value={note} maxLength={500}
              onChange={(event) => { setNote(event.target.value); setRequestId(""); }}
              placeholder="سجّل المعلومة التي أكدها العميل، وليس استنتاجًا" />
          </div>
          {outcome === "do_not_contact" && (
            <p className="text-sm text-destructive">يجب احترام طلب عدم التواصل في أي حملة مستقبلية.</p>
          )}
          {success && <p className="text-sm text-primary" role="status">{success}</p>}
          {mutation.isError && (
            <p role="alert" className="text-sm text-destructive">
              تعذر حفظ المتابعة. راجع صلاحية الحساب أو تشغيل مسار Backend.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>إغلاق</Button>
            <Button type="submit" disabled={optedOut || mutation.isPending || (reasonCode === "other" && note.trim().length < 3)}>
              {mutation.isPending ? "جاري الحفظ..." : "حفظ المتابعة"}
            </Button>
          </DialogFooter>
        </form>
        <div className="max-h-52 space-y-2 overflow-y-auto border-t pt-3">
          <p className="text-sm font-semibold">آخر سجلات المتابعة</p>
          {history.isLoading && <p className="text-xs">جاري التحميل...</p>}
          {history.isError && <p className="text-xs text-destructive">تعذر تحميل سجل المتابعة.</p>}
          {history.data?.length === 0 && <p className="text-xs text-muted-foreground">لم تُسجل متابعة سابقة.</p>}
          {history.data?.map((event) => (
            <div key={event.id} className="rounded-lg bg-muted/50 p-2 text-xs">
              <p className="font-medium">{OUTCOME[event.outcome] || event.outcome} — {REASON[event.reasonCode] || event.reasonCode}</p>
              <p className="text-muted-foreground">{stamp(event.createdAt)} | {CHANNEL[event.channel] || event.channel}</p>
              {event.note && <p className="mt-1 whitespace-pre-wrap">{event.note}</p>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
