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
  useDeleteMenuOptionMutation,
  useMenuOptionGroupsQuery,
  useMenuOptionsQuery,
} from "@/hooks/useMenuQuery";
import type { MenuOption, MenuOptionListParams } from "@/types/menuTypes";
import { getOptionColumns } from "../menu-columns";

export function MenuOptionsTab({ canWrite = true }: { canWrite?: boolean }) {
  const [groupFilter, setGroupFilter] = useState("all");
  const { data: groupsData } = useMenuOptionGroupsQuery({ limit: 100 });
  const groups = groupsData?.data.items ?? [];

  return (
    <MenuEntityTableTab<MenuOption, MenuOptionListParams>
      title="الخيارات"
      description="أضف الخيارات الفردية داخل المجموعات مثل بروتين إضافي أو صوص أو حجم."
      createTo="/menu/options/create"
      createLabel="إضافة خيار"
      searchPlaceholder="بحث في الخيارات..."
      itemsLabel="خيارات"
      emptyMessage="لا توجد خيارات بعد. أضف الخيارات داخل المجموعات المتاحة."
      deleteTitle="حذف الخيار"
      deleteDescription="هل أنت متأكد من حذف هذا الخيار؟ لا يمكن التراجع عن هذا الإجراء."
      columns={(onDelete) => getOptionColumns({ onDelete, canWrite })}
      useQuery={useMenuOptionsQuery}
      useDeleteMutation={useDeleteMenuOptionMutation}
      canWrite={canWrite}
      buildQueryParams={(params) => ({
        ...params,
        groupId: groupFilter !== "all" ? groupFilter : undefined,
      })}
      renderToolbarFilters={(resetPagination) => (
        <Select
          value={groupFilter}
          onValueChange={(value) => {
            setGroupFilter(value);
            resetPagination();
          }}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="تصفية بالمجموعة" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">كل المجموعات</SelectItem>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name.ar || group.name.en || group.key}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    />
  );
}
