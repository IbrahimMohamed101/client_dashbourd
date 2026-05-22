import { z } from "zod";
import menuProteinSchema from "@/lib/validations/menuProteinSchema";

const menuPremiumProteinSchema = menuProteinSchema.extend({
  currency: z.string().default("SAR"),
  extraFeeSar: z.coerce.number().min(0).default(0),
});

export type MenuPremiumProteinSchemaInput = z.input<
  typeof menuPremiumProteinSchema
>;
export type MenuPremiumProteinSchemaType = z.output<
  typeof menuPremiumProteinSchema
>;
export default menuPremiumProteinSchema;
