import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  useDeleteMenuOptionGroupMutation,
  useMenuOptionGroupsQuery,
} from "@/hooks/useMenuQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MenuEmptyState,
  MenuKeyBadge,
  MenuLoadingTable,
  MenuSearchInput,
  MenuSectionCard,
  MenuStatusBadge,
  MenuTableFrame,
  MenuToolbar,
} from "@/components/pages/menu/MenuTabScaffold";
import type { MenuOptionGroup } from "@/types/menuTypes";

export function MenuOptionGroupsTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useMenuOptionGroupsQuery({
    q: debouncedSearch || undefined,
  });
  const deleteMutation = useDeleteMenuOptionGroupMutation();
  const groups = data?.data?.items || [];

  return (
    <MenuSectionCard
      title="مجموعات الخيارات"
      description="حدد مجموعات الإضافات التي يمكن ربطها بالمنتجات مثل الحجم أو نوع البروتين."
      action={
        <Button asChild>
          <Link to="/menu/option-groups/create">
            <Plus data-icon="inline-start" />
            إضافة مجموعة
          </Link>
        </Button>
      }
    >
      <MenuToolbar>
        <MenuSearchInput
          placeholder="بحث في المجموعات..."
          value={search}
          onChange={setSearch}
        />
        <p className="text-sm text-muted-foreground">
          {groups.length} مجموعة في النتائج
        </p>
      </MenuToolbar>

      {isLoading ? (
        <MenuLoadingTable columns={8} />
      ) : groups.length === 0 ? (
        <MenuEmptyState
          title="لا توجد مجموعات خيارات"
          description="أنشئ مجموعة مثل اختيار الحجم أو الصوص، ثم أضف الخيارات التابعة لها في الخطوة التالية."
        />
      ) : (
        <MenuTableFrame>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>المفتاح</TableHead>
                <TableHead>الاسم العربي</TableHead>
                <TableHead>الاسم الإنجليزي</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-center">التوفر</TableHead>
                <TableHead className="text-center">الترتيب</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group: MenuOptionGroup, index: number) => (
                <TableRow key={group.id}>
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <MenuKeyBadge value={group.key} />
                  </TableCell>
                  <TableCell className="font-medium">{group.name.ar}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {group.name.en}
                  </TableCell>
                  <TableCell className="text-center">
                    <MenuStatusBadge
                      active={group.isActive}
                      activeLabel="نشط"
                      inactiveLabel="غير نشط"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <MenuStatusBadge
                      active={group.isAvailable}
                      activeLabel="متوفر"
                      inactiveLabel="غير متوفر"
                    />
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {group.sortOrder}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to="/menu/option-groups/$groupId/update"
                          params={{ groupId: group.id }}
                        >
                          <Pencil data-icon="inline-start" />
                          تعديل
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="حذف المجموعة"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف المجموعة</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف "{group.name.ar}"؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(group.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </MenuTableFrame>
      )}
    </MenuSectionCard>
  );
}
