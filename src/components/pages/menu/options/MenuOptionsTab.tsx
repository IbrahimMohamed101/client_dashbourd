import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  useDeleteMenuOptionMutation,
  useMenuOptionGroupsQuery,
  useMenuOptionsQuery,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { MenuOption } from "@/types/menuTypes";

export function MenuOptionsTab() {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  const { data: groupsData } = useMenuOptionGroupsQuery({});
  const optionGroups = groupsData?.data?.items || [];

  const { data, isLoading } = useMenuOptionsQuery({
    q: debouncedSearch || undefined,
    groupId: groupFilter !== "all" ? groupFilter : undefined,
  });
  const deleteMutation = useDeleteMenuOptionMutation();
  const options = data?.data?.items || [];
  const formatPrice = (halala: number) => (halala / 100).toFixed(2);

  return (
    <MenuSectionCard
      title="الخيارات"
      description="أضف الخيارات الفعلية داخل كل مجموعة، مع السعر الإضافي والترتيب."
      action={
        <Button asChild>
          <Link to="/menu/options/create">
            <Plus data-icon="inline-start" />
            إضافة خيار
          </Link>
        </Button>
      }
    >
      <MenuToolbar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <MenuSearchInput
            placeholder="بحث في الخيارات..."
            value={search}
            onChange={setSearch}
          />
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="فلترة حسب المجموعة" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">كل المجموعات</SelectItem>
                {optionGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name.ar}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {options.length} خيار في النتائج
        </p>
      </MenuToolbar>

      {isLoading ? (
        <MenuLoadingTable columns={7} />
      ) : options.length === 0 ? (
        <MenuEmptyState
          title="لا توجد خيارات بعد"
          description="أضف خيارات مثل الأحجام أو الإضافات بعد إنشاء مجموعاتها حتى يمكن ربطها بالمنتجات."
        />
      ) : (
        <MenuTableFrame>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>المفتاح</TableHead>
                <TableHead>الخيار</TableHead>
                <TableHead className="text-center">السعر الإضافي</TableHead>
                <TableHead className="text-center">التوفر</TableHead>
                <TableHead className="text-center">الترتيب</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {options.map((option: MenuOption, index: number) => (
                <TableRow key={option.id}>
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <MenuKeyBadge value={option.key} />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-44 flex-col gap-1">
                      <span className="font-medium">{option.name.ar}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.name.en}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {option.extraPriceHalala > 0
                      ? `+${formatPrice(option.extraPriceHalala)} ر.س`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <MenuStatusBadge
                      active={option.isAvailable}
                      activeLabel="متوفر"
                      inactiveLabel="غير متوفر"
                    />
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {option.sortOrder}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to="/menu/options/$optionId/update"
                          params={{ optionId: option.id }}
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
                            aria-label="حذف الخيار"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف الخيار</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف "{option.name.ar}"؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(option.id)}
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
