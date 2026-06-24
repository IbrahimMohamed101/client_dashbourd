import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgePercent,
  Clock3,
  Crown,
  MapPin,
  MenuSquare,
  SettingsIcon,
  ShieldAlert,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_protected/settings/")({
  component: SettingsPage,
});

type SettingsNavigationCard = {
  title: string;
  description: string;
  owner: string;
  route?: string;
  icon: LucideIcon;
  badge?: string;
};

const navigationCards: SettingsNavigationCard[] = [
  {
    title: "مناطق التوصيل",
    description:
      "إدارة أسماء مناطق التوصيل، ترتيب ظهورها، حالة التفعيل ورسوم التوصيل الخاصة بكل منطقة.",
    owner: "Delivery Zones",
    route: "/zones",
    icon: MapPin,
    badge: "رسوم التوصيل",
  },
  {
    title: "ترقيات الوجبات",
    description:
      "إدارة أسعار وترتيب وظهور الوجبات أو البروتينات المميزة من شاشة الترقيات المخصصة.",
    owner: "Premium Upgrades",
    route: "/premium-meals",
    icon: Crown,
    badge: "أسعار المميز",
  },
  {
    title: "قائمة الطعام وبناء الوجبات",
    description:
      "إدارة المنتجات، التصنيفات، خيارات التخصيص وأسعار الوجبات أو السلطات المخصصة من شاشة القائمة.",
    owner: "Menu / Meal Builder",
    route: "/menu",
    icon: MenuSquare,
    badge: "القائمة",
  },
  {
    title: "ساعات عمل المطعم",
    description:
      "إدارة أوقات الفتح والإغلاق، نوافذ التوصيل، وأوقات الإقفال من شاشة ساعات العمل.",
    owner: "Restaurant Hours",
    route: "/restaurant-hours",
    icon: Clock3,
    badge: "الأوقات",
  },
  {
    title: "خطط وسياسات الاشتراك",
    description:
      "سياسات الاشتراكات، حدود التخطي، والخطط يجب أن تدار من شاشة الاشتراكات أو الشاشة المالكة للعقد.",
    owner: "Plans / Subscription Policy",
    route: "/subscriptions",
    icon: SlidersHorizontal,
    badge: "السياسات",
  },
  {
    title: "ضريبة القيمة المضافة",
    description:
      "ضريبة VAT معلومة مالية مملوكة للباك اند، ولا تظهر كحقل قابل للتعديل هنا إلا بعقد مالي موثق.",
    owner: "Backend finance config",
    icon: BadgePercent,
    badge: "معلومة فقط",
  },
];

const blockedControls = [
  "لا يوجد نموذج تعديل عام.",
  "لا يوجد زر حفظ أو إرسال مفاتيح مخفية.",
  "لا يتم تحميل إعدادات من API عند فتح الشاشة.",
  "لا يتم تعديل VAT أو الأسعار أو السياسات من هذه الصفحة.",
];

function SettingsPage() {
  return (
    <div className="space-y-8 px-4 lg:px-6" dir="rtl">
      <Card className="bg-gradient-to-br from-primary/10 via-background to-background text-foreground shadow-none">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-inner">
              <SettingsIcon className="size-6 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight">
                الإعدادات العامة
              </h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                تم توزيع الإعدادات على الشاشات المختصة لتجنب التعارض في الأسعار والسياسات. هذه الصفحة دليل سريع فقط وليست محرر إعدادات عام.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit rounded-full px-4 py-1.5">
            Navigation only
          </Badge>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="gap-1 pb-2">
            <CardTitle className="text-base font-semibold">
              اختر الشاشة المالكة للإعداد
            </CardTitle>
            <CardDescription>
              كل كارت يفتح الشاشة الصحيحة بدل تكرار نفس التحكم داخل إعدادات عامة.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {navigationCards.map((card) => (
              <SettingsOwnerCard key={card.title} card={card} />
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="rounded-2xl border-amber-500/20 bg-amber-500/5 shadow-sm">
            <CardHeader className="gap-1 pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-amber-700 dark:text-amber-300">
                <ShieldAlert className="size-5" />
                قواعد مهمة
              </CardTitle>
              <CardDescription>
                هذه الصفحة لا تملك أي إعداد قابل للحفظ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {blockedControls.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-amber-500/10 bg-background/60 px-3 py-2 text-sm text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="gap-1 pb-2">
              <CardTitle className="text-base font-semibold">
                لا توجد إعدادات عامة قابلة للتعديل هنا
              </CardTitle>
              <CardDescription>
                اختر القسم المختص لإدارة الإعداد. أي إعداد غير موثق يجب اعتباره VERIFY_IN_BACKEND_BEFORE_USE.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SettingsOwnerCard({ card }: { card: SettingsNavigationCard }) {
  const Icon = card.icon;
  const content = (
    <div className="group flex h-full flex-col justify-between gap-5 rounded-2xl border border-muted-foreground/10 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <Icon className="size-5" />
          </div>
          {card.badge ? (
            <Badge variant="outline" className="rounded-full text-[11px]">
              {card.badge}
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2">
          <div>
            <h3 className="font-black text-foreground">{card.title}</h3>
            <p className="mt-1 text-xs font-medium text-muted-foreground" dir="ltr">
              {card.owner}
            </p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {card.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2 text-sm font-bold text-primary">
        <span>{card.route ? "فتح الشاشة" : "معلومة فقط"}</span>
        {card.route ? <ArrowLeft className="size-4" /> : null}
      </div>
    </div>
  );

  if (!card.route) return content;

  return (
    <Link to={card.route} className="block h-full focus:outline-none">
      {content}
    </Link>
  );
}