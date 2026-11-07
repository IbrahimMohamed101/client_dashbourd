import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { parseApiError } from "@/lib/apiErrors";
import { formatPreviewAmount } from "./previewCatalog";
import {
  listPosRefunds, recordPosRefund,
  type PosInvoice, type PosRefund, type PosRefundRequest,
} from "./financialApi";

export function PosRefundDialog({ invoice, onClose, onRecorded }: {
  invoice: PosInvoice;
  onClose: () => void;
  onRecorded: (refund: PosRefund) => void;
}) {
  const [prior, setPrior] = useState<PosRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<"cash" | "network" | "external">("external");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);

  useEffect(() => {
    let active = true;
    void listPosRefunds(invoice._id).then(data => {
      if (active) { setPrior(data); setLoading(false); }
    }).catch(() => {
      if (active) { setLoading(false); setFailed("تعذر تحميل المرتجعات السابقة؛ لا يمكن اعتماد مرتجع جديد."); }
    });
    return () => { active = false; };
  }, [invoice._id]);

  const remaining = (lineId: string, original: number) =>
    Math.max(0, original - prior.reduce((sum, refund) => sum
      + refund.lines.filter(line => line.lineId === lineId)
        .reduce((q, line) => q + line.quantity, 0), 0));

  const lines = invoice.lines
    .map(line => ({ lineId: line.id, quantity: quantities[line.id] ?? 0 }))
    .filter(line => line.quantity > 0);
  const valid = !loading && !failed && reason.trim().length >= 3 && lines.length > 0
    && lines.every(line => line.quantity <= remaining(line.lineId,
      invoice.lines.find(item => item.id === line.lineId)!.quantity));
  async function submit() {
    if (!valid || busy) return;
    const body: PosRefundRequest = {
      invoiceId: invoice._id, reason: reason.trim(), method, lines,
    };
    const signature = JSON.stringify(body);
    if (!attempt.current || attempt.current.signature !== signature) {
      attempt.current = { signature, key: crypto.randomUUID() };
    }
    setBusy(true);
    setFailed(null);
    try {
      const refund = await recordPosRefund(body, attempt.current.key);
      onRecorded(refund);
    } catch (cause) {
      const error = parseApiError(cause);
      setFailed(error.message ?? "لم نتأكد من حفظ المرتجع؛ أعد المحاولة بنفس المفتاح.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <DialogContent dir="rtl" className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden text-right">
        <DialogHeader className="shrink-0">
          <DialogTitle>مرتجع الفاتورة {invoice.number}</DialogTitle>
          <DialogDescription>
            رد الأموال يتم خارج POS. التسجيل هنا تجريبي على Staging، بمستند منفصل وسبب إجباري.
          </DialogDescription>
        </DialogHeader>
        <section aria-label="تفاصيل المرتجع" className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          {loading ? <p role="status">جاري تحميل الكميات المرتجعة…</p> : (
            <div className="space-y-2">
              <h3 className="font-semibold">اختر كمية المرتجع لكل سطر</h3>
              {invoice.lines.map(line => {
                const allowed = remaining(line.id, line.quantity);
                return (
                  <div key={line.id} className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-2 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="break-words font-medium">{line.parentLineId ? "↳ " : ""}{line.name} · {line.variantLabel}</p>
                      <p className="text-xs text-muted-foreground">
                        المتبقي {allowed} من {line.quantity} · قيمة السطر الأصلية {formatPreviewAmount(line.grossHalalas)}
                      </p>
                    </div>
                    <Input type="number" aria-label={"كمية مرتجع " + line.name}
                      min={0} max={allowed} step={1} inputMode="numeric"
                      className="min-h-12" disabled={allowed === 0 || busy}
                      value={quantities[line.id] ?? 0}
                      onChange={event => {
                        const n = Number(event.target.value);
                        setQuantities(old => ({ ...old,
                          [line.id]: Number.isSafeInteger(n) ? Math.max(0, Math.min(n, allowed)) : 0 }));
                      }} />
                  </div>
                );
              })}
            </div>
          )}
          <label className="grid gap-2 text-sm font-medium">
            سبب المرتجع (إجباري)
            <Textarea aria-label="سبب المرتجع" rows={3} value={reason}
              disabled={busy} maxLength={500} onChange={e => setReason(e.target.value)}
              placeholder="سبب واضح لإرجاع الصنف" />
          </label>
          <fieldset className="rounded-lg border p-3">
            <legend className="px-1 font-semibold">طريقة رد المبلغ خارج POS</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([["cash", "كاش"], ["network", "شبكة"], ["external", "خارجي"]] as const)
                .map(([id, label]) => (
                  <Button type="button" key={id} aria-pressed={method === id}
                    className={"min-h-12 gap-1 border-2 " + (method === id
                      ? "border-primary bg-primary/10 font-bold text-foreground" : "border-border")}
                    variant={method === id ? "secondary" : "outline"}
                    disabled={busy} onClick={() => setMethod(id)}>
                    {method === id && <Check aria-hidden="true" className="size-4 text-primary" />}
                    {label}
                  </Button>
                ))}
            </div>
          </fieldset>
          {failed && <p role="alert" className="rounded-lg border p-3 text-sm text-destructive">{failed}</p>}
          <p className="text-xs text-muted-foreground">
            الضريبة والمبلغ المرتجع يحسبهما السيرفر من سطور الفاتورة الأصلية والكمية المتبقية.
            التأكيد يسجّل مستندًا فقط، ولا ينفذ أي تحويل أموال.
          </p>
        </section>
        <DialogFooter className="!static !mx-0 !mb-0 !shrink-0 !border-t !bg-popover !px-0 !pt-3 !pb-0">
          <Button type="button" variant="outline" className="min-h-12" disabled={busy} onClick={onClose}>إلغاء</Button>
          <Button type="button" className="min-h-12" disabled={!valid || busy} onClick={() => void submit()}>
            {busy ? "جار تسجيل المرتجع..." : "تسجيل المرتجع التجريبي"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
