import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PosSalePage } from "@/features/pos/PosSalePage";
import { posRuntimeStatusOptions } from "@/features/pos/posRuntimeStatus";

function PosEntryPage() {
  const status = useQuery(posRuntimeStatusOptions);
  if (status.data?.enabled !== true) {
    return (
      <section dir="rtl" role="status" aria-live="polite" className="m-4 rounded-xl border p-5 text-right">
        <h1 className="text-xl font-bold">الكاشير غير مفعّل</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          لا يمكن تسجيل مبيعات أو مرتجعات قبل تفعيل نقطة البيع من السيرفر.
        </p>
      </section>
    );
  }
  return <PosSalePage />;
}

export const Route = createFileRoute("/_protected/pos/")({ component: PosEntryPage });
