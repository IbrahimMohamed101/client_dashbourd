import { useState } from "react";
import { useValidateMenuMutation } from "@/hooks/useMenuQuery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { MenuValidationResult } from "@/types/menuTypes";

export function MenuValidationDialog() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<MenuValidationResult | null>(null);
  const mutation = useValidateMenuMutation();

  const handleValidate = async () => {
    setResult(null);
    const res = await mutation.mutateAsync();
    setResult(res.data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShieldCheck className="size-4" />
          تحقق
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>التحقق من القائمة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!result && (
            <Button
              onClick={handleValidate}
              disabled={mutation.isPending}
              className="w-full gap-2"
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {mutation.isPending ? "جارٍ التحقق..." : "بدء التحقق"}
            </Button>
          )}
          {result && (
            <>
              <div
                className={`flex items-center gap-3 rounded-lg border p-4 ${result.ok ? "border-emerald-500/50 bg-emerald-500/10" : "border-destructive/50 bg-destructive/10"}`}
              >
                {result.ok ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <XCircle className="size-5 text-destructive" />
                )}
                <span className="font-semibold">
                  {result.ok
                    ? "القائمة جاهزة للنشر ✓"
                    : "يوجد أخطاء يجب إصلاحها"}
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 font-semibold text-destructive">
                    <XCircle className="size-4" />
                    أخطاء ({result.errors.length})
                  </h4>
                  {result.errors.map((e, i) => (
                    <p key={i} className="rounded bg-destructive/5 p-2 text-sm">
                      {e.message}
                    </p>
                  ))}
                </div>
              )}
              {result.warnings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 font-semibold text-yellow-600">
                    <AlertTriangle className="size-4" />
                    تحذيرات ({result.warnings.length})
                  </h4>
                  {result.warnings.map((w, i) => (
                    <p key={i} className="rounded bg-yellow-500/5 p-2 text-sm">
                      {w.message}
                    </p>
                  ))}
                </div>
              )}
              {result.summary && (
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-4 text-sm">
                  <span>التصنيفات:</span>
                  <span className="font-semibold">
                    {result.summary.categories}
                  </span>
                  <span>المنتجات:</span>
                  <span className="font-semibold">
                    {result.summary.products}
                  </span>
                  <span>المجموعات:</span>
                  <span className="font-semibold">{result.summary.groups}</span>
                  <span>الخيارات:</span>
                  <span className="font-semibold">
                    {result.summary.options}
                  </span>
                  <span>منتجات نشطة:</span>
                  <span className="font-semibold text-emerald-600">
                    {result.summary.activeProducts}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => setResult(null)}
                className="w-full"
              >
                إعادة التحقق
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
