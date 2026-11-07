import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatPreviewAmount } from "./previewCatalog";
import type { PosInvoice } from "./financialApi";

export function PosInvoiceReceipt({ invoice, onClose, onRefund }: {
  invoice: PosInvoice;
  onClose: () => void;
  onRefund?: () => void;
}) {
  const tenderName = invoice.tender.method === "cash" ? "كاش"
    : invoice.tender.method === "network" ? "شبكة" : "مستحق على تطبيق التوصيل";
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent dir="rtl" className="flex max-h-[92dvh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden text-right">
        <DialogHeader className="shrink-0">
          <DialogTitle>الفاتورة {invoice.number}</DialogTitle>
          <DialogDescription>مستند Staging تجريبي فقط، ولا يمثل فاتورة ضريبية معتمدة.</DialogDescription>
        </DialogHeader>
        <style>{`@media print {
          @page { size: A4 portrait; margin: 13mm; }
          body * { visibility: hidden !important; }
          #pos-printable-receipt, #pos-printable-receipt * { visibility: visible !important; }
          #pos-printable-receipt {
            position: fixed !important; inset: 0 auto auto 0 !important;
            width: 100% !important; overflow: visible !important; padding: 12mm;
            color: black !important; background: white !important;
          }
          #pos-printable-receipt table { width: 100%; border-collapse: collapse; }
          #pos-printable-receipt th, #pos-printable-receipt td {
            border-bottom: 1px solid #aaa; padding: 6px 4px; }
        }`}</style>
        <section id="pos-printable-receipt" aria-label="بيانات الفاتورة التجريبية"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain text-sm">
          <h2 className="text-center text-xl font-extrabold">فاتورة تجريبية — غير ضريبية</h2>
          <div className="grid gap-1 rounded-lg border p-3">
            <p><strong>بيسك دايت — Staging</strong></p>
            <p>الرقم: <b dir="ltr">{invoice.number}</b></p>
            <p>التاريخ: {new Date(invoice.issuedAt).toLocaleString("ar-SA-u-nu-latn")}</p>
            <p>قناة البيع: {invoice.channel}</p>
            <p>الموظف: {invoice.actor.name ?? invoice.actor.email} ({invoice.actor.role})</p>
            <p>المنيو المنشور: {invoice.publishedRevision}</p>
            {invoice.externalOrderNumber && <p>مرجع التطبيق: {invoice.externalOrderNumber}</p>}
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full table-fixed text-xs sm:text-sm">
              <thead><tr className="bg-muted">
                <th className="w-[38%] p-2 text-right">الصنف</th>
                <th className="w-[12%] p-2 text-right">العدد</th>
                <th className="w-[18%] p-2 text-right">الخصم</th>
                <th className="w-[16%] p-2 text-right">الضريبة</th>
                <th className="w-[16%] p-2 text-right">الشامل</th>
              </tr></thead>
              <tbody>
                {invoice.lines.map((line) => (
                  <tr key={line.id} className="border-t">
                    <td className="break-words p-2">
                      {line.parentLineId ? "↳ إضافة: " : ""}{line.name} · {line.variantLabel}
                    </td>
                    <td className="p-2">{line.quantity}</td>
                    <td className="p-2">{formatPreviewAmount(line.lineDiscountHalalas + line.invoiceDiscountPartHalalas)}</td>
                    <td className="p-2">{formatPreviewAmount(line.vatHalalas)}</td>
                    <td className="p-2 font-semibold">{formatPreviewAmount(line.grossHalalas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl className="grid gap-2 border-t pt-3">
            <div className="flex justify-between gap-2"><dt>الإجمالي قبل الخصم</dt>
              <dd>{formatPreviewAmount(invoice.totals.beforeDiscountHalalas)}</dd></div>
            <div className="flex justify-between gap-2"><dt>جميع الخصومات</dt>
              <dd>{formatPreviewAmount(invoice.totals.totalDiscountHalalas)}</dd></div>
            <div className="flex justify-between gap-2"><dt>الصافي بدون الضريبة</dt>
              <dd>{formatPreviewAmount(invoice.totals.netHalalas)}</dd></div>
            <div className="flex justify-between gap-2"><dt>الضريبة المستخرجة (15%)</dt>
              <dd>{formatPreviewAmount(invoice.totals.vatHalalas)}</dd></div>
            <div className="flex justify-between gap-2 border-t pt-2 text-lg font-bold"><dt>المجموع الشامل بعد الخصم</dt>
              <dd>{formatPreviewAmount(invoice.totals.grossHalalas)}</dd></div>
          </dl>
          <div className="rounded-lg border bg-muted/50 p-3">
            <p>طريقة التسجيل: {tenderName}</p>
            {invoice.tender.method === "cash" && (
              <p>المستلم: {formatPreviewAmount(invoice.tender.receivedHalalas ?? 0)} —
                الباقي: {formatPreviewAmount(invoice.tender.changeHalalas ?? 0)}</p>
            )}
            {invoice.tender.method === "app_receivable" && (
              <p>حالة التطبيق المُدخلة: {invoice.appPaymentStatus === "paid" ? "مدفوع" : "كاش"} —
                هذا مستحق على التطبيق، لا يدخل درج المطعم.</p>
            )}
          </div>
          <p className="text-center text-xs font-bold">فاتورة تجريبية — غير ضريبية — ليست مستند ZATCA</p>
        </section>
        <DialogFooter className="!static !mx-0 !mb-0 !shrink-0 !border-t !bg-popover !px-0 !pt-3 !pb-0">
          {onRefund && <Button type="button" variant="outline" className="min-h-12" onClick={onRefund}>
            تسجيل مرتجع
          </Button>}
          <Button type="button" variant="outline" className="min-h-12"
            onClick={() => window.print()}>طباعة من المتصفح</Button>
          <Button type="button" className="min-h-12" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
