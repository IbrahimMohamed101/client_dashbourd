import { z } from "zod";

const localizedTextSchema = z.object({
  ar: z.string({ message: "Arabic name is required" }).min(1).trim(),
  en: z.string({ message: "English name is required" }).min(1).trim(),
});

const optionalLocalizedTextSchema = z.object({
  ar: z.string().default(""),
  en: z.string().default(""),
});

const menuProteinSchema = z.object({
  name: localizedTextSchema,
  description: optionalLocalizedTextSchema,
  imageFile: z.any().optional(),
  imageUrl: z.string().trim().optional(),
  categoryId: z.string({ message: "Category is required" }).min(1).trim(),
  proteinGrams: z.coerce.number().min(0).default(0),
  carbGrams: z.coerce.number().min(0).default(0),
  fatGrams: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  availableForOrder: z.boolean().default(true),
  availableForSubscription: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type MenuProteinSchemaInput = z.input<typeof menuProteinSchema>;
export type MenuProteinSchemaType = z.output<typeof menuProteinSchema>;
export default menuProteinSchema;
