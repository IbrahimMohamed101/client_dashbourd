import { useEffect } from "react";
import { CheckCircle2, FileEdit, Send, Sparkles } from "lucide-react";

import { MealBuilderSimplePage } from "./MealBuilderSimplePage";
import "./meal-builder-experience.css";

const WORKFLOW_STEPS = [
  {
    icon: FileEdit,
    title: "افتح المسودة",
    description: "راجع النسخة الحالية ثم افتح المسودة للتعديل بأمان.",
  },
  {
    icon: CheckCircle2,
    title: "عدّل واحفظ",
    description: "حدّث البطاقات المطلوبة واحفظ المسودة قبل الفحص.",
  },
  {
    icon: Send,
    title: "افحص وانشر",
    description: "أصلح أي أخطاء، ثم انشر النسخة الجاهزة للعميل.",
  },
] as const;

export function MealBuilderExperienceShell() {
  useEffect(() => {
    document.body.classList.add("meal-builder-experience");

    return () => {
      document.body.classList.remove("meal-builder-experience");
    };
  }, []);

  return (
    <div className="meal-builder-experience-shell grid gap-4">
      <section
        className="rounded-xl border bg-card p-4 shadow-xs sm:p-5"
        aria-label="خطوات استخدام منشئ الوجبات"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold">طريقة العمل</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                اعمل دائمًا على المسودة، واحفظها وافحصها قبل النشر. النسخة المنشورة
                تظل كما يراها العميل حتى تؤكد النشر.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:w-[56rem]">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="flex min-w-0 items-start gap-3 rounded-lg bg-muted/35 p-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background text-xs font-semibold text-primary ring-1 ring-border">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className="size-3.5 shrink-0 text-primary" />
                      <p className="text-sm font-medium">{step.title}</p>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-4 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-xs leading-5 text-muted-foreground">
          قسم الوجبات المميزة يُحدَّث تلقائيًا من صفحة الوجبات المميزة، لذلك لا
          يحتاج إلى إضافة أو حذف يدوي من هنا.
        </p>
      </section>

      <MealBuilderSimplePage />
    </div>
  );
}
