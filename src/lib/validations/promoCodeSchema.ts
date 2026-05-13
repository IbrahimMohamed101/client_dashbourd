import z from "zod";

const promoCodeSchema = z.object({
  code: z.string().min(1, "Required / مطلوب"),
  nameAr: z.string().optional(),
  nameEn: z.string().optional(),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z
    .string()
    .min(1, "Required / مطلوب")
    .refine((value) => Number(value) > 0, "Invalid value / قيمة غير صحيحة"),
  usageLimitTotal: z.string().optional(),
  usageLimitPerUser: z.string().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  appliesTo: z.string().optional(),
  isActive: z.boolean(),
});

type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;

export { promoCodeSchema, type PromoCodeFormValues };
