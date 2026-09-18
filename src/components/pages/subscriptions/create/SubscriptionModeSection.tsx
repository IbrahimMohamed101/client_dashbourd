import { Layers3, SquareStack } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { CreateSubscriptionSchemaType } from "@/lib/validations/createSubscriptionSchema";

interface Props {
  form: UseFormReturn<CreateSubscriptionSchemaType>;
}

export function SubscriptionModeSection({ form }: Props) {
  const mode = form.watch("subscriptionMode");
  const standaloneClass =
    mode === "standalone"
      ? "border-primary bg-primary/5 shadow-sm"
      : "hover:border-primary/40 hover:bg-muted/30";
  const stackedClass =
    mode === "stack_into_current"
      ? "border-primary bg-primary/5 shadow-sm"
      : "hover:border-primary/40 hover:bg-muted/30";

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm" dir="rtl">
      <div className="border-b px-4 py-4 sm:px-6">
        <h2 className="font-semibold">طريقة إضافة الاشتراك</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          حدد هل تريد إنشاء اشتراك مستقل أم إضافة الشراء إلى الرصيد الحالي للعميل.
        </p>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
        <button
          type="button"
          role="radio"
          aria-checked={mode === "standalone"}
          className={"rounded-2xl border p-4 text-right transition " + standaloneClass}
          onClick={() =>
            form.setValue("subscriptionMode", "standalone", {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Layers3 className="size-5" />
            </span>
            <span>
              <span className="block font-semibold">اشتراك مستقل</span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                يظهر كاشتراك منفصل ولا يتم دمجه تلقائيًا مع اشتراك نشط.
              </span>
            </span>
          </div>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === "stack_into_current"}
          className={"rounded-2xl border p-4 text-right transition " + stackedClass}
          onClick={() =>
            form.setValue("subscriptionMode", "stack_into_current", {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <SquareStack className="size-5" />
            </span>
            <span>
              <span className="block font-semibold">إضافة إلى الرصيد الحالي</span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                سيتم تسجيل الشراء كباقة جديدة داخل الاشتراك التشغيلي الحالي.
              </span>
            </span>
          </div>
        </button>
      </div>

      <div className="border-t px-4 py-3 text-xs leading-5 text-muted-foreground sm:px-6">
        {mode === "stack_into_current"
          ? "سيظل الشراء الجديد ظاهرًا كمصدر مستقل داخل الرصيد المجمع، مع بقاء الخصم من الرصيد المجمع."
          : "لن يتم دمج الاشتراك مع اشتراك نشط. إذا كان للعميل اشتراك نشط، سيوقف الخادم العملية ويطلب اختيار الدمج صراحةً."}
      </div>
    </section>
  );
}
