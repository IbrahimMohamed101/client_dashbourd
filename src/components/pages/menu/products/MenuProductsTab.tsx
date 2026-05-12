import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";

import {
  useDeleteMenuProductMutation,
  useMenuProductsQuery,
  useToggleMenuProductAvailabilityMutation,
} from "@/hooks/useMenuQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { Badge } from "@/components/ui/badge";
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
  MenuTableFrame,
  MenuToolbar,
} from "@/components/pages/menu/MenuTabScaffold";
import type { MenuProduct } from "@/types/menuTypes";

export function MenuProductsTab() {
  const [search, setSearch] = useState("");
  const [pricingFilter, setPricingFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useMenuProductsQuery({
    q: debouncedSearch || undefined,
    pricingModel:
      pricingFilter !== "all"
        ? (pricingFilter as "fixed" | "per_100g")
        : undefined,
  });
  const deleteMutation = useDeleteMenuProductMutation();
  const toggleAvailability = useToggleMenuProductAvailabilityMutation();
  const products = data?.data?.items || [];
  const formatPrice = (halala: number) => (halala / 100).toFixed(2);

  return (
    <MenuSectionCard
      title="المنتجات"
      description="أدر عناصر القائمة، نماذج التسعير، والتوفر قبل ربطها بالخيارات."
      action={
        <Button asChild>
          <Link to="/menu/products/create">
            <Plus data-icon="inline-start" />
            إضافة منتج
          </Link>
        </Button>
      }
    >
      <MenuToolbar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center">
          <MenuSearchInput
            placeholder="بحث في المنتجات..."
            value={search}
            onChange={setSearch}
          />
          <Select value={pricingFilter} onValueChange={setPricingFilter}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="نوع التسعير" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">كل الأسعار</SelectItem>
                <SelectItem value="fixed">سعر ثابت</SelectItem>
                <SelectItem value="per_100g">بالوزن</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">
          {products.length} منتج في النتائج
        </p>
      </MenuToolbar>

      {isLoading ? (
        <MenuLoadingTable columns={8} />
      ) : products.length === 0 ? (
        <MenuEmptyState
          title="لا توجد منتجات بعد"
          description="أضف المنتجات الأساسية وحدد التسعير والتوفر حتى تصبح جاهزة للظهور في قائمة الطلبات."
        />
      ) : (
        <MenuTableFrame>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>المفتاح</TableHead>
                <TableHead>المنتج</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>التسعير</TableHead>
                <TableHead className="text-center">السعر</TableHead>
                <TableHead className="text-center">التوفر</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product: MenuProduct, index: number) => (
                <TableRow key={product.id}>
                  <TableCell className="text-center text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <MenuKeyBadge value={product.key} />
                  </TableCell>
                  <TableCell>
                    <div className="flex min-w-44 flex-col gap-1">
                      <span className="font-medium">{product.name.ar}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.name.en}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.itemType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.pricingModel === "fixed"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {product.pricingModel === "fixed" ? "ثابت" : "بالوزن"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {formatPrice(product.priceHalala)} ر.س
                    {product.pricingModel === "per_100g" ? (
                      <span className="block text-xs text-muted-foreground">
                        لكل {product.baseUnitGrams || 100}غ
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleAvailability.mutate({
                          id: product.id,
                          isAvailable: !product.isAvailable,
                        })
                      }
                    >
                      {product.isAvailable ? (
                        <Eye data-icon="inline-start" />
                      ) : (
                        <EyeOff data-icon="inline-start" />
                      )}
                      {product.isAvailable ? "متوفر" : "مخفي"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to="/menu/products/$productId/update"
                          params={{ productId: product.id }}
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
                            aria-label="حذف المنتج"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف المنتج</AlertDialogTitle>
                            <AlertDialogDescription>
                              هل أنت متأكد من حذف "{product.name.ar}"؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMutation.mutate(product.id)
                              }
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
