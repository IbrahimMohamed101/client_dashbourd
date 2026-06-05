import { useState } from "react";
import { MenuEntityTableTab } from "@/components/pages/menu/MenuEntityTableTab";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useDeleteMenuProductMutation,
  useDuplicateMenuProductMutation,
  useMenuProductsQuery,
  useToggleMenuProductAvailabilityMutation,
} from "@/hooks/useMenuQuery";
import type {
  MenuProduct,
  MenuProductListParams,
  PricingModel,
} from "@/types/menuTypes";
import { getProductColumns } from "../menu-columns";

type PricingFilter = PricingModel | "all";

export function MenuProductsTab() {
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>("all");
  const toggleAvailability = useToggleMenuProductAvailabilityMutation();
  const duplicateProduct = useDuplicateMenuProductMutation();

  return (
    <MenuEntityTableTab<MenuProduct, MenuProductListParams>
      title="المنتجات"
      description="إدارة عناصر القائمة والأسعار والتوفر والخيارات المرتبطة بكل منتج."
      createTo="/menu/products/create"
      createLabel="إضافة منتج"
      searchPlaceholder="بحث في المنتجات..."
      itemsLabel="منتجات"
      emptyMessage="لا توجد منتجات بعد. أضف المنتجات الأساسية لتظهر هنا."
      deleteTitle="حذف المنتج"
      deleteDescription="هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
      columns={(onDelete) =>
        getProductColumns({
          onToggleAvailability: (id, isAvailable) =>
            toggleAvailability.mutate({ id, isAvailable }),
          onDuplicate: (id) => duplicateProduct.mutate(id),
          onDelete,
        })
      }
      useQuery={useMenuProductsQuery}
      useDeleteMutation={useDeleteMenuProductMutation}
      buildQueryParams={(params) => ({
        ...params,
        pricingModel: pricingFilter !== "all" ? pricingFilter : undefined,
      })}
      renderToolbarFilters={(resetPagination) => (
        <Select
          value={pricingFilter}
          onValueChange={(value) => {
            setPricingFilter(value as PricingFilter);
            resetPagination();
          }}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="نوع التسعير" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">كل الأسعار</SelectItem>
              <SelectItem value="fixed">سعر ثابت</SelectItem>
              <SelectItem value="per_100g">حسب الوزن</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    />
  );
}
