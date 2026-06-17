import { BoxIcon } from "@/components/ui/box";
import { CalendarCheckIcon } from "@/components/ui/calendar-check";
import { SmilePlusIcon } from "@/components/ui/smile-plus";
import { UsersIcon } from "@/components/ui/users";
import type { SectionCardsData } from "@/types/sectionCardsTypes";
import type { PackageSummary } from "@/types/packageTypes";
import type { SubscriptionSummary } from "@/types/subscriptionTypes";
import { BoxesIcon } from "@/components/ui/boxes";
import { CalendarCogIcon } from "@/components/ui/calendar-cog";
import { CalendarDaysIcon } from "@/components/ui/calendar-days";
import { BadgeCheckIcon } from "lucide-react";

const dashboardSectionCards: SectionCardsData[] = [
  {
    description: "الاشتراكات النشطة",
    value: "0",
    helperText: "اشتراكات فعالة حاليا",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 shadow-sm dark:bg-purple-950 dark:text-purple-400">
        <SmilePlusIcon size={26} />
      </div>
    ),
  },
  {
    description: "توصيلات اليوم",
    value: "0",
    helperText: "طلبات مجدولة للتوصيل اليوم",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shadow-sm dark:bg-amber-950 dark:text-amber-400">
        <BoxIcon size={26} />
      </div>
    ),
  },
  {
    description: "الطلبات المعلقة",
    value: "0",
    helperText: "طلبات تحتاج متابعة تشغيلية",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600 shadow-sm dark:bg-sky-950 dark:text-sky-400">
        <CalendarCheckIcon size={26} />
      </div>
    ),
  },
  {
    description: "مستخدمو التطبيق",
    value: "0",
    helperText: "إجمالي حسابات العملاء",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shadow-sm dark:bg-emerald-950 dark:text-emerald-400">
        <UsersIcon size={26} />
      </div>
    ),
  },
];

const getPackagesSectionCards = (
  summary?: PackageSummary
): SectionCardsData[] => [
  {
    description: "إجمالي الباقات",
    value: summary?.totalPlans?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 shadow-sm dark:bg-purple-950 dark:text-purple-400">
        <BoxesIcon size={26} />
      </div>
    ),
  },
  {
    description: "الباقات النشطة",
    value: summary?.activePlans?.toString() || "0",
    isPositive: true,
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shadow-sm dark:bg-emerald-950 dark:text-emerald-400">
        <CalendarCheckIcon size={26} />
      </div>
    ),
  },
  {
    description: "الباقات المعطلة",
    value: summary?.inactivePlans?.toString() || "0",
    isPositive: false,
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shadow-sm dark:bg-amber-950 dark:text-amber-400">
        <CalendarCogIcon size={26} />
      </div>
    ),
  },
  {
    description: "متوسط عدد الأيام",
    value: summary?.averageDaysCount?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600 shadow-sm dark:bg-sky-950 dark:text-sky-400">
        <CalendarDaysIcon size={26} />
      </div>
    ),
  },
];

const getSubscriptionsSectionCards = (
  summary?: SubscriptionSummary
): SectionCardsData[] => [
  {
    description: "إجمالي الاشتراكات",
    value: summary?.totalSubscriptions?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 shadow-sm dark:bg-purple-950 dark:text-purple-400">
        <BoxesIcon size={26} />
      </div>
    ),
  },
  {
    description: "الاشتراكات النشطة",
    value: summary?.activeSubscriptions?.toString() || "0",
    isPositive: true,
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shadow-sm dark:bg-emerald-950 dark:text-emerald-400">
        <BadgeCheckIcon size={26} />
      </div>
    ),
  },
  {
    description: "الاشتراكات الملغاة",
    value: summary?.canceledSubscriptions?.toString() || "0",
    isPositive: false,
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 shadow-sm dark:bg-red-950 dark:text-red-400">
        <CalendarCogIcon size={26} />
      </div>
    ),
  },
  {
    description: "إجمالي الوجبات المتبقية",
    value: summary?.totalRemainingMeals?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shadow-sm dark:bg-amber-950 dark:text-amber-400">
        <CalendarDaysIcon size={26} />
      </div>
    ),
  },
];

const getFinanceSectionCards = (summary?: {
  totalRevenue: number;
  totalPayments: number;
  pendingPayments: number;
  failedPayments: number;
}): SectionCardsData[] => [
  {
    description: "إجمالي الإيرادات",
    value: summary?.totalRevenue?.toLocaleString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shadow-sm dark:bg-emerald-950 dark:text-emerald-400">
        <BadgeCheckIcon size={26} />
      </div>
    ),
  },
  {
    description: "المدفوعات المكتملة",
    value: summary?.totalPayments?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 shadow-sm dark:bg-purple-950 dark:text-purple-400">
        <BoxesIcon size={26} />
      </div>
    ),
  },
  {
    description: "مدفوعات معلقة",
    value: summary?.pendingPayments?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shadow-sm dark:bg-amber-950 dark:text-amber-400">
        <CalendarCogIcon size={26} />
      </div>
    ),
  },
  {
    description: "مدفوعات فاشلة",
    value: summary?.failedPayments?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600 shadow-sm dark:bg-red-950 dark:text-red-400">
        <BoxIcon size={26} />
      </div>
    ),
  },
];

const getPromoCodesSectionCards = (summary?: {
  totalPromoCodes: number;
  activePromoCodes: number;
  totalUses: number;
}): SectionCardsData[] => [
  {
    description: "إجمالي الأكواد",
    value: summary?.totalPromoCodes?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 shadow-sm dark:bg-purple-950 dark:text-purple-400">
        <BoxesIcon size={26} />
      </div>
    ),
  },
  {
    description: "الأكواد النشطة",
    value: summary?.activePromoCodes?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shadow-sm dark:bg-emerald-950 dark:text-emerald-400">
        <BadgeCheckIcon size={26} />
      </div>
    ),
  },
  {
    description: "إجمالي الاستخدامات",
    value: summary?.totalUses?.toString() || "0",
    icon: (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 text-sky-600 shadow-sm dark:bg-sky-950 dark:text-sky-400">
        <UsersIcon size={26} />
      </div>
    ),
  },
];

export {
  dashboardSectionCards,
  getPackagesSectionCards,
  getSubscriptionsSectionCards,
  getFinanceSectionCards,
  getPromoCodesSectionCards,
};
