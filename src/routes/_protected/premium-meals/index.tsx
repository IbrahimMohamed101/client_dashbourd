import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { MealBuilderPage } from "@/components/pages/menu/meal-builder/MealBuilderPage";

export const Route = createFileRoute("/_protected/premium-meals/")({
  component: PremiumMealsScreen,
});

function PremiumMealsScreen() {
  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-6 lg:px-6" dir="rtl">
      <header className="rounded-lg border bg-card p-5 shadow-xs lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0 space-y-2">
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                وجبات بريميوم
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                شاشة مستقلة لإدارة ترقيات مخطط الاشتراك: بروتينات البريميوم
                والسلطة الكبيرة البريميوم. هذه الترقيات تستهلك خانات الوجبات
                وليست إضافات مستقلة.
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">
            11G Subscription Planner Upgrades
          </div>
        </div>
      </header>

      <MealBuilderPage embedded />
    </div>
  );
}
