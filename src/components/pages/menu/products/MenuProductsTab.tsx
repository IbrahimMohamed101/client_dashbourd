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
  useMenuCategoriesQuery,
  useMenuProductsQuery,
  useToggleMenuProductAvailabilityMutation,
} from "@/hooks/useMenuQuery";
import type {
  MenuProduct,
  MenuProductListParams,
} from "@/types/menuTypes";
import { getProductColumns } from "../menu-columns";

type CategoryFilter = string | "all";

export function MenuProductsTab({ canWrite = true }: { canWrite?: boolean }) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const { data: categoriesData } = useMenuCategoriesQuery({ limit: 100 });
  const toggleAvailability = useToggleMenuProductAvailabilityMutation();
  const duplicateProduct = useDuplicateMenuProductMutation();
  const categories = categoriesData?.data.items ?? [];

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
          canWrite,
        })
      }
      useQuery={useMenuProductsQuery}
      useDeleteMutation={useDeleteMenuProductMutation}
      canWrite={canWrite}
      buildQueryParams={(params) => ({
        ...params,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
      })}
      renderToolbarFilters={(resetPagination) => (
        <Select
          value={categoryFilter}
          onValueChange={(value) => {
            setCategoryFilter(value as CategoryFilter);
            resetPagination();
          }}
        >
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="التصنيف" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">كل التصنيفات</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name.ar || category.name.en || category.key}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    />
  );
}
