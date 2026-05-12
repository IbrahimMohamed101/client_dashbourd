import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  useDeleteMenuCategoryMutation,
  useMenuCategoriesQuery,
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
import type { MenuCategory } from "@/types/menuTypes";

export function MenuCategoriesTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useMenuCategoriesQuery({
    q: debouncedSearch || undefined,
  });
  const deleteMutation = useDeleteMenuCategoryMutation();
  const categories = data?.data?.items || [];

  return (
    <MenuSectionCard
      title="التصنيفات"
      description="رتب أقسام القائمة التي تظهر للعميل قبل إضافة المنتجات."
      action={
        <Button asChild>
          <Link to="/menu/categories/create">
            <Plus data-icon="inline-start" />
            إضافة تصنيف
          </Link>
        </Button>
      }
    >
      <MenuToolbar>
        <MenuSearchInput
          placeholder="بحث في التصنيفات..."
          value={search}
          onChange={setSearch}
        />
        <p className="text-sm text-muted-foreground">
          {categories.length} تصنيف في النتائج
        </p>
      </MenuToolbar>

      {isLoading ? (
        <MenuLoadingTable columns={8} />
      ) : categories.length === 0 ? (
        <MenuEmptyState
          title="لا توجد تصنيفات بعد"
          description="ابدأ بإضافة تصنيف واضح مثل الوجبات الرئيسية أو المشروبات حتى تصبح القائمة سهلة التصفح."
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
              {categories.map((cat: MenuCategory, index: number) => (
                <TableRow key={cat.id}>
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <MenuKeyBadge value={cat.key} />
                  </TableCell>
                  <TableCell className="font-medium">{cat.name.ar}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cat.name.en}
                  </TableCell>
                  <TableCell className="text-center">
                    <MenuStatusBadge
                      active={cat.isActive}
                      activeLabel="نشط"
                      inactiveLabel="غير نشط"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <MenuStatusBadge
                      active={cat.isAvailable}
                      activeLabel="متوفر"
                      inactiveLabel="غير متوفر"
                    />
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {cat.sortOrder}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to="/menu/categories/$categoryId/update"
                          params={{ categoryId: cat.id }}
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
                            aria-label="حذف التصنيف"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف التصنيف</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف "{cat.name.ar}"؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(cat.id)}
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
