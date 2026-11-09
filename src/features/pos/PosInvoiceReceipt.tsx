import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { formatPreviewAmount } from "./previewCatalog";
import type { PosInvoice, PosRefund, PosSeller } from "./financialApi";

type Document = PosInvoice | PosRefund;
const fallbackSeller: PosSeller = {
  legalNameAr: "مؤسسة بيسيك دايت", legalNameEn: "Basic Diet Establishment",
  vatRegistrationNumber: "313015429700003", crNumber: "7050136014",
  addressAr: "جدة - حي الصفا - المغيرة بن عبدالله - 23455",
  addressEn: "Jeddah - As Safa Dist",
};
function amount(halalas: number) { return formatPreviewAmount(halalas); }

export function PosTaxDocumentReceipt({ doc, onClose, onRefund }: {
  doc: Document;
  onClose: () => void;
  onRefund?: () => void;
}) {
  const credit = "invoiceNumber" in doc;
  const staging = doc.documentType === "STAGING_TEST_NON_TAX" ||
    doc.documentKind === "STAGING_TEST_NON_TAX" ||
    doc.number.startsWith("STG-");
  const seller = doc.seller ?? fallbackSeller;
  const totals = doc.totals;
  const issuedAt = credit ? doc.recordedAt : doc.issuedAt;
  const lineItems = credit ? doc.lines : doc.lines;
  const discount = credit ? 0 : (doc.totals.totalDiscountHalalas ?? 0);
  const beforeDiscount = credit ? totals.grossHalalas : doc.totals.beforeDiscountHalalas;
  const payment = credit
    ? (doc.method === "cash" ? "كاش" : doc.method === "network" ? "شبكة" : "خارجي")
    : (doc.tender.method === "cash" ? "كاش" : doc.tender.method === "network" ? "شبكة" : "تطبيق توصيل");
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent dir="rtl" className="flex max-h-[92dvh] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden text-right">
        <DialogHeader>
          <DialogTitle>{credit ? "إشعار دائن" : "فاتورة"} {doc.number}</DialogTitle>
          <DialogDescription>{staging ? "تجريبية — Staging. لا تمثل مستندًا ضريبيًا مُصدرًا." : "مستند نقطة البيع — بيانات المبالغ والرمز من السيرفر."}</DialogDescription>
        </DialogHeader>
        <style>{String.raw`@media print {
          @page { size: A4 portrait; margin: 12mm; }
          body * { visibility: hidden !important; }
          #pos-printable-receipt, #pos-printable-receipt * { visibility: visible !important; }
          #pos-printable-receipt {
            position: fixed !important; inset: 0 auto auto 0 !important;
            width: 100% !important; overflow: visible !important; padding: 8mm;
            color: #000 !important; background: #fff !important;
          }
          #pos-printable-receipt table { width: 100%; border-collapse: collapse; }
          #pos-printable-receipt th, #pos-printable-receipt td { border-bottom: 1px solid #aaa; padding: 6px 3px; }
        }`}</style>
        <section id="pos-printable-receipt" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-white p-4 text-sm text-black" aria-label="مستند نقطة البيع">
          <div className="text-center">
            <img src="/logo.png" alt="" className="mx-auto mb-2 h-16 w-16 object-contain" />
            <p className="text-lg font-bold">{seller.legalNameAr}</p>
            <p>{seller.legalNameEn}</p>
            <p>{seller.addressAr}</p>
            <p>السجل التجاري: <b dir="ltr">{seller.crNumber}</b></p>
            <p>الرقم الضريبي: <b dir="ltr">{seller.vatRegistrationNumber}</b></p>
            <h2 className="my-3 border-y py-3 text-xl font-extrabold">
              {credit ? "إشعار دائن — Credit Note" : "فاتورة ضريبية — Tax Invoice"}
            </h2>
            {staging && <p className="mb-2 border border-dashed p-2 font-bold">تجريبية — Staging · STAGING_TEST_NON_TAX</p>}
          </div>
          <div className="grid gap-1">
            <p>الرقم: <strong dir="ltr">{doc.number}</strong></p>
            {credit && <p>الفاتورة الأصلية: <b dir="ltr">{doc.invoiceNumber}</b></p>}
            <p>تاريخ الإصدار: {new Date(issuedAt).toLocaleString("ar-SA-u-nu-latn")}</p>
            {!credit && <p>قناة البيع: {doc.channel}</p>}
          </div>
          <table className="w-full table-fixed text-xs">
            <thead><tr><th className="w-[42%] text-right">الصنف / الإضافة</th><th>العدد</th><th>الضريبة</th><th>الشامل</th></tr></thead>
            <tbody>{lineItems.map((line, i) => (
              <tr key={("lineId" in line ? line.lineId : line.id) + i}>
                <td className="break-words py-2">{"parentLineId" in line && line.parentLineId ? "إضافة: " : ""}{line.name} {line.variantLabel ? "— " + line.variantLabel : ""}</td>
                <td>{line.quantity}</td>
                <td>{amount(line.vatHalalas)}</td>
                <td className="font-semibold">{amount(line.grossHalalas)}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="space-y-2 border-t pt-3">
            <div className="flex justify-between"><span>قبل الخصم (شامل الضريبة)</span><b>{amount(beforeDiscount)}</b></div>
            <div className="flex justify-between"><span>الخصم</span><b>{amount(discount)}</b></div>
            <div className="flex justify-between"><span>الإجمالي قبل الضريبة</span><b>{amount(totals.netHalalas)}</b></div>
            <div className="flex justify-between"><span>ضريبة القيمة المضافة (15%)</span><b>{amount(totals.vatHalalas)}</b></div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>{credit ? "إجمالي الإشعار الدائن" : "الإجمالي شامل الضريبة"}</span><span>{amount(totals.grossHalalas)}</span></div>
          </div>
          <p>طريقة {credit ? "المرتجع" : "الدفع"}: {payment}</p>
          {credit && <p>سبب المرتجع: {doc.reason}</p>}
          {doc.qrPayloadBase64 && <div className="flex flex-col items-center gap-1 border-t pt-4">
            <QRCodeSVG value={doc.qrPayloadBase64} size={140} marginSize={1} />
            <span className="text-xs">رمز QR الضريبي (TLV)</span>
          </div>}
          <p className="border-t pt-3 text-center text-xs">
            {staging ? "مستند تجريبي — غير ضريبي" : credit ? "هذا إشعار دائن للفاتورة المذكورة أعلاه." : "شكرًا لتعاملكم مع بيسك دايت"}
          </p>
        </section>
        <DialogFooter className="shrink-0 border-t pt-3">
          {!credit && onRefund && <Button type="button" variant="outline" onClick={onRefund}>تسجيل مرتجع</Button>}
          <Button type="button" variant="outline" onClick={() => window.print()}>طباعة</Button>
          <Button type="button" onClick={onClose}>إغلاق</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export function PosInvoiceReceipt({ invoice, onClose, onRefund }: {
  invoice: PosInvoice; onClose: () => void; onRefund?: () => void;
}) {
  return <PosTaxDocumentReceipt doc={invoice} onClose={onClose} onRefund={onRefund} />;
}
export function PosCreditNoteReceipt({ refund, onClose }: {
  refund: PosRefund; onClose: () => void;
}) {
  return <PosTaxDocumentReceipt doc={refund} onClose={onClose} />;
}
