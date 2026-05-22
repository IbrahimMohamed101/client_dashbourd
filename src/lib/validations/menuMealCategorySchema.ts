import menuCategorySchema from "@/lib/validations/menuCategorySchema";
import { z } from "zod";

const menuMealCategorySchema = menuCategorySchema.extend({
  imageFile: z.any().optional(),
  imageUrl: z.string().trim().optional(),
});

export type MenuMealCategorySchemaInput = z.input<
  typeof menuMealCategorySchema
>;
export type MenuMealCategorySchemaType = z.output<
  typeof menuMealCategorySchema
>;
export default menuMealCategorySchema;
