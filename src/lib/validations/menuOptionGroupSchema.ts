import { z } from "zod";

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

const menuOptionGroupSchema = z.object({
  key: optionalGeneratedKey,
  name: z.object({
    ar: z.string({ message: "الاسم بالعربية مطلوب" }).min(1, "الاسم بالعربية مطلوب").trim(),
    en: z.string({ message: "الاسم بالإنجليزية مطلوب" }).min(1, "الاسم بالإنجليزية مطلوب").trim(),
  }),
  description: z.object({
    ar: z.string().default(""),
    en: z.string().default(""),
  }),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  ui: z
    .object({
      displayStyle: z
        .enum(["chips", "radio_cards", "checkbox_grid", "dropdown", "stepper"])
        .optional(),
    })
    .default({}),
  sortOrder: z.coerce
    .number({ message: "ترتيب العرض يجب أن يكون رقماً" })
    .int("ترتيب العرض يجب أن يكون رقماً صحيحاً")
    .min(0, "ترتيب العرض لا يمكن أن يكون أقل من 0")
    .default(0),
});

export type MenuOptionGroupSchemaInput = z.input<typeof menuOptionGroupSchema>;
export type MenuOptionGroupSchemaType = z.output<typeof menuOptionGroupSchema>;
export default menuOptionGroupSchema;
