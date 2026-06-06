import { z } from "zod";
import {
  DEFAULT_MENU_AVAILABLE_FOR,
  MENU_AVAILABLE_CHANNELS,
  MENU_ITEM_TYPES,
  MENU_PRODUCT_CARD_VARIANTS,
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

const menuProductSchema = z
  .object({
    categoryId: z.string({ message: "التصنيف مطلوب" }).min(1, "التصنيف مطلوب"),
    key: optionalGeneratedKey,
    itemType: z.enum(MENU_ITEM_TYPES, { message: "نوع العنصر مطلوب" }),
    name: z.object({
      ar: z.string({ message: "الاسم بالعربية مطلوب" }).min(1, "الاسم بالعربية مطلوب").trim(),
      en: z.string({ message: "الاسم بالإنجليزية مطلوب" }).min(1, "الاسم بالإنجليزية مطلوب").trim(),
    }),
    description: z.object({
      ar: z.string().default(""),
      en: z.string().default(""),
    }),
    imageFile: z.any().optional(),
    imageUrl: z.string().trim().optional(),
    pricingModel: z.enum(["fixed", "per_100g"], {
      message: "نوع التسعير مطلوب",
    }),
    priceSar: z.coerce
      .number({ message: "السعر مطلوب" })
      .min(0, "السعر لا يمكن أن يكون أقل من 0"),
    baseUnitGrams: z.coerce.number().optional(),
    defaultWeightGrams: z.coerce.number().optional(),
    minWeightGrams: z.coerce.number().optional(),
    maxWeightGrams: z.coerce.number().optional(),
    weightStepGrams: z.coerce.number().optional(),
    isActive: z.boolean().default(true),
    isAvailable: z.boolean().default(true),
    isVisible: z.boolean().default(true),
    isCustomizable: z.boolean().default(false),
    availableFor: z
      .array(z.enum(MENU_AVAILABLE_CHANNELS))
      .default([...DEFAULT_MENU_AVAILABLE_FOR]),
    ui: z
      .object({
        cardVariant: z
          .enum(MENU_PRODUCT_CARD_VARIANTS)
          .optional()
          .default("standard"),
        badge: z.string().trim().optional().default(""),
        ctaLabel: z.string().trim().optional().default(""),
        imageRatio: z.string().trim().optional().default("square"),
      })
      .default({ cardVariant: "standard", badge: "", ctaLabel: "", imageRatio: "square" }),
    sortOrder: z.coerce
      .number({ message: "ترتيب العرض يجب أن يكون رقماً" })
      .int("ترتيب العرض يجب أن يكون رقماً صحيحاً")
      .min(0, "ترتيب العرض لا يمكن أن يكون أقل من 0")
      .default(0),
  })
  .refine(
    (data) => {
      if (data.pricingModel === "per_100g") {
        return (data.baseUnitGrams ?? 0) > 0;
      }
      return true;
    },
    {
      message: "وحدة الوزن الأساسية مطلوبة للمنتجات بالوزن",
      path: ["baseUnitGrams"],
    }
  );

export type MenuProductSchemaInput = z.input<typeof menuProductSchema>;
export type MenuProductSchemaType = z.output<typeof menuProductSchema>;
export default menuProductSchema;
