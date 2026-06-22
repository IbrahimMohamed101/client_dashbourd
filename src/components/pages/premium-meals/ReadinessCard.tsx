import { CheckCircle2, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PremiumUpgradeReadinessResponse } from "@/types/premiumUpgradeTypes";
import { formatPremiumList } from "@/utils/fetchPremiumUpgrades";

export function ReadinessCard({
  readiness,
  loading,
  error,
}: {
  readiness: PremiumUpgradeReadinessResponse | null;
  loading: boolean;
  error: boolean;
}) {
  const diagnostics = readiness?.diagnostics;
  const state = diagnostics?.configState;
  const banner = getReadinessBanner(readiness);

  return (
    <Card className="shadow-none">
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              {banner.tone === "success" ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="size-5 text-amber-600" />
              )}
              جاهزية نظام الترقيات
            </CardTitle>
            <CardDescription>
              الترقية تستهلك خانة وجبة موجودة. إذا وُجد أي إعداد، تصبح
              الإعدادات مصدر الحقيقة ولا يسمح بإعداد جزئي في الإنتاج.
            </CardDescription>
          </div>
          <Badge variant={readiness?.isReady ? "default" : "secondary"}>
            {loading ? "جار التحميل" : readiness?.isReady ? "جاهز" : "يحتاج مراجعة"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={banner.className}>
          {error ? "تعذر تحميل الجاهزية." : banner.message}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="كل الإعدادات" value={diagnostics?.totalConfigs ?? "-"} />
          <Metric label="النشطة" value={diagnostics?.activeConfigs ?? "-"} />
          <Metric label="مصادر مفقودة" value={diagnostics?.missingSources ?? "-"} />
          <Metric label="روابط غير صحيحة" value={diagnostics?.invalidRelations ?? "-"} />
          <Metric label="مفاتيح مكررة" value={diagnostics?.duplicateKeys ?? "-"} />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <DetailBlock
            title="حالة الإعداد"
            items={[
              ["مصدر الحقيقة", state?.configsAuthoritative ? "الإعدادات الحالية" : "الرجوع القديم"],
              ["حالة النقل", state?.backfillStatus ?? "-"],
              ["خطر إعداد جزئي", state?.partialConfigRisk ? "نعم" : "لا"],
            ]}
          />
          <DetailBlock
            title="المفاتيح"
            items={[
              ["المعروفة", formatPremiumList(state?.knownKeys)],
              ["المعدة", formatPremiumList(state?.configuredKnownKeys)],
              ["الناقصة", formatPremiumList(state?.missingConfigKeys)],
            ]}
          />
          <DetailBlock
            title="الرجوع القديم"
            items={[
              ["الحالة", state?.legacyFallbackActive ? "مفعل" : "غير مفعل"],
              ["بروتينات المنشئ", String(diagnostics?.legacyChecks?.builderProteinsCount ?? "-")],
              ["اختلافات السعر", String(diagnostics?.priceMismatches?.length ?? 0)],
            ]}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function DetailBlock({
  title,
  items,
}: {
  title: string;
  items: Array<[string, string]>;
}) {
  return (
    <div className="rounded-lg border p-3">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      <div className="space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex gap-2 text-sm">
            <span className="shrink-0 text-muted-foreground">{label}:</span>
            <span className="min-w-0 break-words">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getReadinessBanner(readiness: PremiumUpgradeReadinessResponse | null) {
  const diagnostics = readiness?.diagnostics;
  const state = diagnostics?.configState;
  const baseClass = "rounded-lg border p-3 text-sm";

  if (!readiness) {
    return {
      tone: "info",
      message: "جار تحميل فحص الجاهزية...",
      className: `${baseClass} bg-muted/20 text-muted-foreground`,
    };
  }

  if (state?.partialConfigRisk || (diagnostics?.duplicateKeys ?? 0) > 0) {
    return {
      tone: "critical",
      message:
        "يوجد خطر إعداد جزئي أو مفاتيح مكررة. لا تنشر قبل إكمال كل المفاتيح المعروفة.",
      className: `${baseClass} border-red-200 bg-red-50 text-red-900`,
    };
  }

  if (
    (diagnostics?.missingSources ?? 0) > 0 ||
    (diagnostics?.invalidRelations ?? 0) > 0
  ) {
    return {
      tone: "warning",
      message: "بعض مصادر الترقيات مفقودة أو روابطها غير صحيحة.",
      className: `${baseClass} border-amber-200 bg-amber-50 text-amber-950`,
    };
  }

  if ((diagnostics?.priceMismatches?.length ?? 0) > 0) {
    return {
      tone: "warning",
      message: "يوجد اختلاف بين أسعار الرجوع القديم وإعدادات الترقيات الحالية.",
      className: `${baseClass} border-amber-200 bg-amber-50 text-amber-950`,
    };
  }

  if (state?.isEmpty && state.legacyFallbackActive) {
    return {
      tone: "info",
      message: "لا توجد إعدادات بعد. الرجوع القديم مفعل مؤقتا.",
      className: `${baseClass} border-blue-200 bg-blue-50 text-blue-950`,
    };
  }

  if (readiness.isReady && !state?.partialConfigRisk) {
    return {
      tone: "success",
      message: "نظام الترقيات المميزة جاهز.",
      className: `${baseClass} border-emerald-200 bg-emerald-50 text-emerald-900`,
    };
  }

  return {
    tone: "info",
    message: "راجع تفاصيل الجاهزية قبل استخدام الشاشة في الإنتاج.",
    className: `${baseClass} border-blue-200 bg-blue-50 text-blue-950`,
  };
}
