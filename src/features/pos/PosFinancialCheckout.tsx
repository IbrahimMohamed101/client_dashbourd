import { useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { parseApiError } from "@/lib/apiErrors";
import { formatPreviewAmount } from "./previewCatalog";
import { parseHalalas } from "./posDiscountMath";
import {
  issuePosSale, abandonPosOperation, getPosOperation, getActivePosOperation, getPosSale,
  type PosFinanceQuote, type PosFinanceQuoteRequest, type PosInvoice, type PosSaleIntent,
} from "./financialApi";

export function PosFinancialCheckout({
  quote, request, channelName, serviceMode,
  externalOrderNumber, externalPaymentStatus, operatorId, onClose, onSale,
}: {
  quote: PosFinanceQuote;
  request: PosFinanceQuoteRequest;
  channelName: string;
  serviceMode: "dine-in" | "takeaway" | "delivery";
  externalOrderNumber: string;
  externalPaymentStatus: "paid" | "cash";
  operatorId?: string | null;
  onClose: () => void;
  onSale: (invoice: PosInvoice) => void;
}) {
  const [method, setMethod] = useState<"cash" | "network">("cash");
  const [receivedText, setReceivedText] = useState(
    (quote.totals.grossHalalas / 100).toFixed(2));
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const [menuConflict, setMenuConflict] = useState(false);
  const inFlight = useRef(false);
  const [failed, setFailed] = useState<string | null>(null);
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const restaurant = request.channel === "restaurant";
  const received = parseHalalas(receivedText);
  const allowedCash = received !== null && received >= quote.totals.grossHalalas;
  const allowed = !busy && (!restaurant || method === "network" || allowedCash);
  const storageKey = operatorId && /^[a-zA-Z0-9_-]{1,128}$/.test(operatorId)
    ? "basicdiet:pos:pending-sale:v1:" + operatorId : null;

  type Pending = { signature: string; key: string };
  function readPending(): Pending | null {
    if (!storageKey) return null;
    try {
      const item = sessionStorage.getItem(storageKey);
      if (!item || item.length > 20000) return null;
      const parsed: unknown = JSON.parse(item);
      if (!parsed || typeof parsed !== "object") return null;
      const value = parsed as { signature?: unknown; key?: unknown };
      if (typeof value.signature !== "string" || typeof value.key !== "string"
        || !/^[a-zA-Z0-9_-]{16,128}$/.test(value.key)) return null;
      // Never expire an unresolved server operation based on browser time alone.
      return { signature: value.signature, key: value.key };
    } catch { return null; }
  }
  function clearPending() {
    if (storageKey) {
      try { sessionStorage.removeItem(storageKey); } catch { /* Storage blocked. */ }
    }
    attempt.current = null;
    setLocked(false);
  }
  async function settlePending(pending: Pending): Promise<"cleared" | "recovered" | "blocked"> {
    if (inFlight.current) return "blocked";
    inFlight.current = true;
    setBusy(true);
    setFailed(null);
    try {
      // GET is informational only: even an unseen (404) operation MUST be
      // tombstoned on the server before a new key can be used.
      const inspected = await getPosOperation(pending.key);
      if (inspected?.status === "rejected" || inspected?.status === "abandoned") {
        clearPending();
        return "cleared";
      }
      const settled = inspected?.status === "committed"
        ? inspected : await abandonPosOperation(pending.key, "sale");
      if (settled.status === "committed" && settled.resultId) {
        const invoice = await getPosSale(settled.resultId);
        clearPending();
        onSale(invoice);
        return "recovered";
      }
      if (settled.status === "abandoned" || settled.status === "rejected") {
        clearPending();
        return "cleared";
      }
      setFailed("البيع السابق لم يُحسم. اضغط «تحقق مرة أخرى» قبل أي بيع جديد.");
      setLocked(true);
      return "blocked";
    } catch {
      setFailed("تعذر الاتصال للتأكد من العملية السابقة. لا تُصدر فاتورة أخرى. تحقق مرة أخرى.");
      setLocked(true);
      return "blocked";
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  async function handleBack() {
    if (busy || inFlight.current) return;
    const pending = attempt.current ?? readPending();
    if (!pending) { onClose(); return; }
    const outcome = await settlePending(pending);
    if (outcome === "cleared") onClose();
  }
  async function confirm() {
    if (!allowed || inFlight.current || menuConflict) return;
    const body: PosSaleIntent = restaurant ? {
      ...request, serviceMode,
      tender: method === "cash"
        ? { method: "cash", receivedHalalas: received! }
        : { method: "network" },
    } : {
      ...request, externalOrderNumber: externalOrderNumber.trim(),
      appPaymentStatus: externalPaymentStatus,
    };
    const signature = JSON.stringify(body);
    const pending = attempt.current ?? readPending();
    if (pending && pending.signature !== signature) {
      const outcome = await settlePending(pending);
      if (outcome !== "cleared") return;
    }
    if (!pending || pending.signature !== signature) {
      attempt.current = { signature, key: crypto.randomUUID() };
      if (storageKey) {
        try { sessionStorage.setItem(storageKey, JSON.stringify({ ...attempt.current, at: Date.now() })); }
        catch { /* Private sessions still retain the in-memory key. */ }
      }
    } else attempt.current = pending;
    setLocked(true);
    inFlight.current = true;
    setBusy(true);
    setFailed(null);
    try {
      const invoice = await issuePosSale(body, attempt.current!.key);
      clearPending();
      onSale(invoice);
    } catch (cause) {
      const error = parseApiError(cause);
      if (error.code === "POS_OPERATION_PENDING") {
        // A different unresolved key may belong to this same cashier,
        // e.g. after a tab crash. Recover the REAL pending key first.
        try {
          const active = await getActivePosOperation("sale");
          if (active && attempt.current?.key !== active.key) {
            attempt.current = { signature: "", key: active.key };
            if (storageKey) {
              try { sessionStorage.setItem(storageKey,
                JSON.stringify({ ...attempt.current, at: Date.now() })); } catch { /* blocked */ }
            }
          }
        } catch { /* Preserve uncertainty until connectivity is restored. */ }
      }
      const final = error.status !== undefined && error.status >= 400 && error.status < 500
        && Boolean(error.code) && error.code !== "POS_OPERATION_PENDING";
      if (final) {
        clearPending();
        if (error.code === "POS_CATALOG_CONFLICT") {
          setMenuConflict(true);
          setFailed("المنيو اتحدّث — ارجع للسلة وأكد الأسعار الجديدة");
        } else {
          setFailed(error.message);
        }
      } else {
        setLocked(true);
        setFailed(error.code === "POS_OPERATION_PENDING"
          ? "عملية البيع السابقة قيد المعالجة. اضغط «تحقق مرة أخرى» أو أعد المحاولة."
          : "نتيجة البيع غير مؤكدة. أعد المحاولة أو تحقق من العملية قبل تغيير السلة.");
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={open => { if (!open && !busy) void handleBack(); }}>
      <DialogContent dir="rtl" className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden text-right">
        <DialogHeader className="shrink-0">
          <DialogTitle>مراجعة الطلب وتأكيد الفاتورة التجريبية</DialogTitle>
          <DialogDescription>
            الأسعار الشاملة والضريبة والخصومات من سيرفر Staging، نسخة المنيو {quote.revision}.
          </DialogDescription>
        </DialogHeader>
        <section aria-label="مراجعة الفاتورة النهائية التجريبية"
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain text-sm">
          <p role="status" className="rounded-lg border bg-muted/50 p-3 font-bold">
            فاتورة تجريبية — غير ضريبية — لا يوجد ربط بجهاز دفع أو Moyasar أو ZATCA.
          </p>
          <div className="flex flex-wrap justify-between gap-2">
            <span>القناة: <b>{channelName}</b></span>
            <span>عدد السطور: {quote.lines.length}</span>
            {restaurant && <span>نوع الطلب: {serviceMode === "takeaway" ? "سفري"
              : serviceMode === "delivery" ? "توصيل" : "محلي"}</span>}
            {!restaurant && <span>مرجع التطبيق: {externalOrderNumber || "غير محدد"}</span>}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full table-fixed text-xs sm:text-sm">
              <thead><tr className="bg-muted">
                <th className="w-[43%] p-2 text-right">الصنف</th>
                <th className="w-[12%] p-2 text-right">العدد</th>
                <th className="w-[22%] p-2 text-right">الخصم</th>
                <th className="w-[23%] p-2 text-right">الشامل</th>
              </tr></thead>
              <tbody>
                {quote.lines.map(line => (
                  <tr key={line.id} className="border-t">
                    <td className="break-words p-2">{line.parentLineId ? "↳ " : ""}{line.name} · {line.variantLabel}</td>
                    <td className="p-2 tabular-nums">{line.quantity}</td>
                    <td className="p-2">{formatPreviewAmount(line.lineDiscountHalalas + line.invoiceDiscountPartHalalas)}</td>
                    <td className="p-2 font-semibold">{formatPreviewAmount(line.grossHalalas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="grid gap-2 rounded-lg border p-3">
            <div className="flex justify-between"><dt>قبل الخصم</dt>
              <dd>{formatPreviewAmount(quote.totals.beforeDiscountHalalas)}</dd></div>
            <div className="flex justify-between"><dt>الخصم</dt>
              <dd>{formatPreviewAmount(quote.totals.totalDiscountHalalas)}</dd></div>
            <div className="flex justify-between"><dt>الصافي بدون الضريبة</dt>
              <dd>{formatPreviewAmount(quote.totals.netHalalas)}</dd></div>
            <div className="flex justify-between"><dt>الضريبة المضمنة 15%</dt>
              <dd>{formatPreviewAmount(quote.totals.vatHalalas)}</dd></div>
            <div className="flex justify-between border-t pt-2 text-lg font-extrabold">
              <dt>المستحق شامل الضريبة</dt>
              <dd>{formatPreviewAmount(quote.totals.grossHalalas)}</dd>
            </div>
          </dl>
          {restaurant ? (
            <fieldset className="rounded-lg border p-3">
              <legend className="px-1 font-semibold">وسيلة الدفع (تسجيل Staging فقط)</legend>
              <div className="mt-2 flex gap-2">
                {([["cash", "كاش"], ["network", "شبكة"]] as const).map(([id, label]) => (
                  <Button key={id} type="button" variant={method === id ? "secondary" : "outline"}
                    className={"min-h-12 flex-1 gap-2 border-2 " + (method === id
                      ? "border-primary bg-primary/10 font-bold text-foreground" : "border-border")}
                    aria-pressed={method === id} disabled={busy || locked}
                    onClick={() => setMethod(id)}>
                    {method === id && <Check aria-hidden="true" className="size-5 text-primary" />}
                    {label}
                  </Button>
                ))}
              </div>
              {method === "cash" && (
                <label className="mt-3 grid gap-1">المبلغ المستلم (ريال)
                  <Input type="text" inputMode="decimal" aria-label="المبلغ النقدي المستلم"
                    dir="ltr" className="min-h-12" value={receivedText}
                    disabled={busy || locked} onChange={e => setReceivedText(e.target.value)} />
                  {!allowedCash && <span role="alert" className="text-destructive">
                    المبلغ المستلم يجب أن يكون على الأقل قيمة الفاتورة.
                  </span>}
                  {allowedCash && <span>الباقي: {formatPreviewAmount(received! - quote.totals.grossHalalas)}</span>}
                </label>
              )}
            </fieldset>
          ) : (
            <p className="rounded-lg border bg-muted/50 p-3">
              يُسجل كمستحق على {channelName} — حالة الكاشير: {externalPaymentStatus === "paid" ? "مدفوع" : "كاش"}.
              لا يدخل درج المطعم.
            </p>
          )}
        </section>
        {failed && <p role="alert" className="shrink-0 rounded-lg border p-2 text-sm text-destructive">{failed}</p>}
        <DialogFooter className="!static !mx-0 !mb-0 !shrink-0 !border-t !bg-popover !px-0 !pt-3 !pb-0">
          <Button type="button" variant="outline" className="min-h-12"
            disabled={busy} onClick={() => void handleBack()}>رجوع للسلة</Button>
          {!menuConflict && locked && (
            <Button type="button" variant="outline" className="min-h-12" disabled={busy}
              onClick={() => {
                const current = attempt.current ?? readPending();
                if (current) void settlePending(current);
              }}>تحقق مرة أخرى</Button>
          )}
          {!menuConflict && <Button type="button" className="min-h-14"
            disabled={!allowed} onClick={() => void confirm()}>
            {busy ? "جار حفظ الفاتورة..." : locked
              ? "إعادة المحاولة" : "تأكيد البيع وإصدار الفاتورة التجريبية"}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
