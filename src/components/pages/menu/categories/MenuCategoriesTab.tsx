import { MenuEntityTableTab } from "@/components/pages/menu/MenuEntityTableTab";
import { getCategoryColumns } from "../menu-columns";
import {
  useDeleteMenuCategoryMutation,
  useMenuCategoriesQuery,
} from "@/hooks/useMenuQuery";
import type { MenuCategory } from "@/types/menuTypes";

export function MenuCategoriesTab() {
  return (
    <MenuEntityTableTab<MenuCategory>
      title="التصنيفات"
      description="رتب أقسام القائمة التي تظهر للعميل قبل إضافة المنتجات."
      createTo="/menu/categories/create"
      createLabel="إضافة تصنيف"
      searchPlaceholder="بحث في التصنيفات..."
      itemsLabel="تصنيفات"
      emptyMessage="لا توجد تصنيفات بعد. ابدأ بإضافة تصنيف."
      deleteTitle="حذف التصنيف"
      deleteDescription="هل أنت متأكد من حذف هذا التصنيف؟ لا يمكن التراجع عن هذا الإجراء."
      columns={(onDelete) => getCategoryColumns({ onDelete })}
      useQuery={useMenuCategoriesQuery}
      useDeleteMutation={useDeleteMenuCategoryMutation}
    />
  );
}
