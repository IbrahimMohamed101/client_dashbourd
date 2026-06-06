import { z } from "zod";
import {
  DEFAULT_MENU_AVAILABLE_FOR,
  MENU_AVAILABLE_CHANNELS,
} from "@/constants/menuCatalog";

const optionalGeneratedKey = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9_]+$/,
    "المفتاح يجب أن يحتوي فقط على حروف إنجليزية صغيرة وأرقام و _"
  )
  .or(z.literal(""))
  .optional()
  .default("");

const menuOptionSchema = z.object({
  groupId: z
    .string({ message: "مجموعة الخيارات مطلوبة" })
    .min(1, "مجموعة الخيارات مطلوبة"),
  key: optionalGeneratedKey,
  name: z.object({
    ar: z
      .string({ message: "الاسم بالعربية مطلوب" })
      .min(1, "الاسم بالعربية مطلوب")
      .trim(),
    en: z
      .string({ message: "الاسم بالإنجليزية مطلوب" })
      .min(1, "الاسم بالإنجليزية مطلوب")
      .trim(),
  }),
  description: z.object({
    ar: z.string().default(""),
    en: z.string().default(""),
  }),
  imageFile: z.any().optional(),
  imageUrl: z.string().trim().optional(),
  // User enters in SAR, we convert to halala on submit
  extraPriceSar: z.coerce
    .number({ message: "السعر الإضافي مطلوب" })
    .min(0, "السعر الإضافي لا يمكن أن يكون أقل من 0")
    .default(0),
  extraWeightUnitGrams: z.coerce
    .number()
    .min(0, "وحدة الوزن الإضافية لا يمكن أن تكون أقل من 0")
    .optional(),
  // User enters in SAR
  extraWeightPriceSar: z.coerce
    .number()
    .min(0, "سعر الوزن الإضافي لا يمكن أن يكون أقل من 0")
    .optional(),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  displayCategoryKey: z.string().trim().optional(),
  proteinFamilyKey: z.string().trim().optional(),
  premiumKey: z.string().trim().optional().default(""),
  extraFeeSar: z.coerce
    .number()
    .min(0, "الرسوم الإضافية لا يمكن أن تكون أقل من 0")
    .optional()
    .default(0),
  ruleTags: z.string().trim().optional().default(""),
  selectionType: z.string().trim().optional().default(""),
  availableFor: z
    .array(z.enum(MENU_AVAILABLE_CHANNELS))
    .default([...DEFAULT_MENU_AVAILABLE_FOR]),
  availableForSubscription: z.boolean().default(true),
  sortOrder: z.coerce
    .number({ message: "ترتيب العرض يجب أن يكون رقماً" })
    .int("ترتيب العرض يجب أن يكون رقماً صحيحاً")
    .min(0, "ترتيب العرض لا يمكن أن يكون أقل من 0")
    .default(0),
});

export type MenuOptionSchemaInput = z.input<typeof menuOptionSchema>;
export type MenuOptionSchemaType = z.output<typeof menuOptionSchema>;
export default menuOptionSchema;
