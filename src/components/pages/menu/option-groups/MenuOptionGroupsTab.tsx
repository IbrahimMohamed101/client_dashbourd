import { MenuEntityTableTab } from "@/components/pages/menu/MenuEntityTableTab";
import {
  useDeleteMenuOptionGroupMutation,
  useMenuOptionGroupsQuery,
} from "@/hooks/useMenuQuery";
import type { MenuOptionGroup } from "@/types/menuTypes";
import { getOptionGroupColumns } from "../menu-columns";

export function MenuOptionGroupsTab() {
  return (
    <MenuEntityTableTab<MenuOptionGroup>
      title="مجموعات الخيارات"
      description="حدد مجموعات الإضافات التي يمكن ربطها بالمنتجات مثل الحجم أو نوع البروتين."
      createTo="/menu/option-groups/create"
      createLabel="إضافة مجموعة"
      searchPlaceholder="بحث في المجموعات..."
      itemsLabel="مجموعات"
      emptyMessage="لا توجد مجموعات خيارات. أنشئ مجموعة مثل اختيار الحجم أو الصوص."
      deleteTitle="حذف المجموعة"
      deleteDescription="هل أنت متأكد من حذف هذه المجموعة؟ لا يمكن التراجع عن هذا الإجراء."
      columns={(onDelete) => getOptionGroupColumns({ onDelete })}
      useQuery={useMenuOptionGroupsQuery}
      useDeleteMutation={useDeleteMenuOptionGroupMutation}
    />
  );
}
