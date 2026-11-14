import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fetchPosCatalog, posCatalogKey } from "./catalogApi";
import { PosOperationsShell } from "./PosOperationsShell";

export function PosSalePage({ documentType }: { documentType?: string }) {
  const query = useQuery({
    queryKey: posCatalogKey,
    queryFn: fetchPosCatalog,
    refetchOnWindowFocus: "always",
  });
  if (query.data) return <PosOperationsShell catalog={query.data} documentType={documentType} />;
  return (
    <section
      dir="rtl"
      className="mx-4 rounded-xl border p-5"
      aria-live="polite"
    >
      <h1 className="text-xl font-bold">نقطة البيع</h1>
      <p className="my-3">
        {query.isError
          ? "تعذر تحميل منيو الكاشير."
          : "جاري تحميل منيو الكاشير…"}
      </p>
      {query.isError && (
        <Button onClick={() => void query.refetch()}>إعادة المحاولة</Button>
      )}
    </section>
  );
}
