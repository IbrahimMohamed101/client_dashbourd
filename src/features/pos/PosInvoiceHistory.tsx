import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { formatPreviewAmount } from "./previewCatalog";
import { listPosSales, type PosInvoice, type PosRefund } from "./financialApi";
import { PosInvoiceReceipt, PosCreditNoteReceipt } from "./PosInvoiceReceipt";
import { PosRefundDialog } from "./PosRefundDialog";

export function PosInvoiceHistory({ onSale }: { onSale: () => void }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<PosInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("all");
  const [selected, setSelected] = useState<PosInvoice | null>(null);
  const [returnInvoice, setReturnInvoice] = useState<PosInvoice | null>(null);
  const [savedRefund, setSavedRefund] = useState<PosRefund | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInvoices(await listPosSales());
    } catch {
      setError("تعذر تحميل فواتير الكاشير. تأكد من اتصال الباك إند وصلاحية المستخدم.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = invoices.filter(invoice =>
    (channel === "all" || invoice.channel === channel)
    && (!search.trim() || [
      invoice.number, invoice.externalOrderNumber ?? "",
      invoice.actor.name ?? "", invoice.actor.email,
    ].some(text => text.toLowerCase().includes(search.trim().toLowerCase())))
  );

  return (
    <section dir="rtl" aria-label="الطلبات والفواتير" className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">فواتير نقطة البيع</h2>
          <p className="text-sm text-muted-foreground">
            فواتير نقطة البيع مستقلة عن الاشتراكات، ويتم تحديد نوع المستند من السيرفر.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="min-h-12"
            onClick={() => void refresh()}>تحديث</Button>
          <Button type="button" className="min-h-12" onClick={onSale}>طلب جديد</Button>
        </div>
      </header>
      <div className="grid gap-3 rounded-xl border bg-card p-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="grid gap-1 text-sm">رقم الفاتورة أو مرجع التطبيق
          <Input type="search" aria-label="بحث الفواتير" className="min-h-12"
            value={search} onChange={e => setSearch(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">قناة البيع
          <select aria-label="قناة الفواتير" className="min-h-12 rounded-md border bg-background px-3"
            value={channel} onChange={e => setChannel(e.target.value)}>
            <option value="all">كل القنوات</option>
            <option value="restaurant">المطعم</option>
            <option value="hungerstation">HungerStation</option>
            <option value="keeta">Keeta</option>
            {invoices.map(invoice => invoice.channel)
              .filter((id, index, arr) => id !== "restaurant" && id !== "keeta"
                && id !== "hungerstation" && arr.indexOf(id) === index)
              .map(id => <option value={id} key={id}>{id}</option>)}
          </select>
        </label>
      </div>
      {savedRefund && (
        <p role="status" className="rounded-xl border bg-muted/50 p-3">
          تم تسجيل الإشعار الدائن {savedRefund.number} بقيمة {formatPreviewAmount(savedRefund.totals.grossHalalas)}.
          رد المبلغ الفعلي يتم خارج POS.
        </p>
      )}
      {error && <p role="alert" className="rounded-xl border p-3 text-destructive">{error}</p>}
      <div className="rounded-xl border bg-card p-3">
        {loading ? <p role="status">جاري تحميل الفواتير…</p> : filtered.length === 0 ? (
          <p role="status" className="p-5 text-center text-muted-foreground">
            لا توجد فواتير مطابقة.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[35rem] border-collapse text-right text-sm">
              <thead><tr className="bg-muted">
                <th className="p-3">الفاتورة</th><th className="p-3">القناة</th>
                <th className="p-3">التاريخ</th><th className="p-3">الموظف</th>
                <th className="p-3">الشامل بعد الخصم</th><th className="p-3">الإجراء</th>
              </tr></thead>
              <tbody>
                {filtered.map(invoice => (
                  <tr key={invoice._id} className="border-t">
                    <td className="p-3 font-semibold">{invoice.number}</td>
                    <td className="p-3">{invoice.channel}</td>
                    <td className="p-3">{new Date(invoice.issuedAt).toLocaleString("ar-SA-u-nu-latn")}</td>
                    <td className="p-3">{invoice.actor.name ?? invoice.actor.email}</td>
                    <td className="p-3 tabular-nums">{formatPreviewAmount(invoice.totals.grossHalalas)}</td>
                    <td className="p-3">
                      <Button type="button" variant="outline" className="min-h-12"
                        onClick={() => setSelected(invoice)}>عرض / مرتجع</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {savedRefund && <div className="flex justify-end"><Button type="button" variant="outline" onClick={() => setSavedRefund(null)}>إغلاق إشعار المرتجع</Button></div>}
      {savedRefund && <PosCreditNoteReceipt refund={savedRefund} onClose={() => setSavedRefund(null)} />}
      {selected && <PosInvoiceReceipt invoice={selected}
        onClose={() => setSelected(null)}
        onRefund={() => { setReturnInvoice(selected); setSelected(null); }} />}
      {returnInvoice && <PosRefundDialog invoice={returnInvoice} operatorId={user?.id}
        onClose={() => setReturnInvoice(null)}
        onRecorded={refund => {
          setSavedRefund(refund);
          setReturnInvoice(null);
          void refresh();
        }} />}
    </section>
  );
}
