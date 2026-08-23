import { z } from "zod";
import type {
  PromoCodeAppliesTo,
  PromoCodeDTO,
  PromoCodePayload,
} from "@/types/financeTypes";
import {
  halalaToRiyalInput,
  isValidRiyalInput,
  riyalToHalala,
} from "@/utils/price";

export const promoCodeSchema = z
  .object({
    code: z.string().min(1, "مطلوب"),
    nameAr: z.string().optional(),
    nameEn: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.string().min(1, "مطلوب"),
    usageLimitTotal: z.string().optional(),
    usageLimitPerUser: z.string().optional(),
    startsAt: z.string().optional(),
    expiresAt: z.string().optional(),
    appliesTo: z.enum(["subscription", "addon_plans", "all"]),
    isActive: z.boolean(),
    showInApp: z.boolean(),
    showOnHome: z.boolean(),
    showOnPlans: z.boolean(),
    displayPriority: z.string(),
    appTitleAr: z.string().max(240).optional(),
    appTitleEn: z.string().max(240).optional(),
    appDescriptionAr: z.string().max(240).optional(),
    appDescriptionEn: z.string().max(240).optional(),
    homeMessageAr: z.string().max(240).optional(),
    homeMessageEn: z.string().max(240).optional(),
  })
  .superRefine((values, context) => {
    const valid =
      values.discountType === "fixed"
        ? isValidRiyalInput(values.discountValue) &&
          riyalToHalala(values.discountValue) > 0
        : Number(values.discountValue) > 0;
    if (!valid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discountValue"],
        message: "قيمة غير صحيحة",
      });
    }
    if (values.showInApp && !values.showOnHome && !values.showOnPlans) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["showInApp"],
        message: "اختر الصفحة الرئيسية أو شاشة الباقات على الأقل",
      });
    }
    if (values.showInApp && values.appliesTo === "addon_plans") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["appliesTo"],
        message: "العرض داخل تطبيق الاشتراكات يتطلب كود اشتراك أو كودًا عامًا",
      });
    }
    const priority = Number(values.displayPriority || 0);
    if (!Number.isInteger(priority) || priority < -1000 || priority > 1000) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["displayPriority"],
        message: "الأولوية يجب أن تكون رقمًا صحيحًا بين -1000 و1000",
      });
    }
  });

export type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;

function formatDateTimeInputValue(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const readPart = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${readPart("year")}-${readPart("month")}-${readPart("day")}T${readPart("hour")}:${readPart("minute")}`;
}

function riyadhDateTimeInputToIso(value?: string): string | null {
  if (!value) return null;
  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if ([year, month, day, hour, minute].some((part) => !Number.isFinite(part))) {
    return null;
  }
  return new Date(
    Date.UTC(year, month - 1, day, hour - 3, minute)
  ).toISOString();
}

export function getDefaultValues(editData?: PromoCodeDTO): PromoCodeFormValues {
  const discountType =
    editData?.discountType === "fixed_amount"
      ? "fixed"
      : (editData?.discountType ?? "percentage");
  return {
    code: editData?.code ?? "",
    nameAr: editData?.name?.ar ?? "",
    nameEn: editData?.name?.en ?? "",
    discountType: discountType === "fixed" ? "fixed" : "percentage",
    discountValue:
      discountType === "fixed"
        ? halalaToRiyalInput(editData?.discountValue)
        : (editData?.discountValue?.toString() ?? ""),
    usageLimitTotal: editData?.usageLimitTotal?.toString() ?? "",
    usageLimitPerUser: editData?.usageLimitPerUser?.toString() ?? "",
    startsAt: formatDateTimeInputValue(editData?.startsAt),
    expiresAt: formatDateTimeInputValue(editData?.expiresAt),
    appliesTo:
      editData?.appliesTo === "addon_plans" || editData?.appliesTo === "all"
        ? editData.appliesTo
        : "subscription",
    isActive: editData?.isActive ?? true,
    showInApp: editData?.appDisplay?.isVisible ?? false,
    showOnHome: editData?.appDisplay?.showOnHome ?? true,
    showOnPlans: editData?.appDisplay?.showOnPlans ?? true,
    displayPriority: String(editData?.appDisplay?.priority ?? 0),
    appTitleAr: editData?.appDisplay?.title?.ar ?? "",
    appTitleEn: editData?.appDisplay?.title?.en ?? "",
    appDescriptionAr: editData?.appDisplay?.description?.ar ?? "",
    appDescriptionEn: editData?.appDisplay?.description?.en ?? "",
    homeMessageAr: editData?.appDisplay?.homeMessage?.ar ?? "",
    homeMessageEn: editData?.appDisplay?.homeMessage?.en ?? "",
  };
}

function optionalInteger(value?: string): number | null {
  if (!value) return null;
  return Math.max(0, Math.floor(Number(value)));
}

export function toPromoCodePayload(
  values: PromoCodeFormValues
): PromoCodePayload {
  const discountValue =
    values.discountType === "fixed"
      ? riyalToHalala(values.discountValue)
      : Number(values.discountValue);
  return {
    code: values.code.trim().toUpperCase(),
    name: {
      ar: values.nameAr?.trim() ?? "",
      en: values.nameEn?.trim() ?? "",
    },
    discountType: values.discountType,
    discountValue,
    usageLimitTotal: optionalInteger(values.usageLimitTotal),
    usageLimitPerUser: optionalInteger(values.usageLimitPerUser),
    startsAt: riyadhDateTimeInputToIso(values.startsAt),
    expiresAt: riyadhDateTimeInputToIso(values.expiresAt),
    appliesTo: values.appliesTo as PromoCodeAppliesTo,
    isActive: values.isActive,
    appDisplay: {
      isVisible: values.showInApp,
      showOnHome: values.showOnHome,
      showOnPlans: values.showOnPlans,
      priority: Number(values.displayPriority || 0),
      title: {
        ar: values.appTitleAr?.trim() ?? "",
        en: values.appTitleEn?.trim() ?? "",
      },
      description: {
        ar: values.appDescriptionAr?.trim() ?? "",
        en: values.appDescriptionEn?.trim() ?? "",
      },
      homeMessage: {
        ar: values.homeMessageAr?.trim() ?? "",
        en: values.homeMessageEn?.trim() ?? "",
      },
    },
  };
}
