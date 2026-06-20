import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeftRight, Check, PackagePlus, Pencil, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBulkAssignProductsToCategoryMutation,
  useBulkUpdateMenuProductsMutation,
  useMenuCategoriesQuery,
  useMenuProductsQuery,
} from "@/hooks/useMenuQuery";
import type { MenuCategoryDetail, MenuProduct } from "@/types/menuTypes";
import { MenuKeyBadge, MenuStatusBadge } from "@/components/pages/menu/MenuTabScaffold";

interface CategoryProductsPanelProps {
  category: MenuCategoryDetail;
  categoryId: string;
}

export function CategoryProductsPanel({
  category,
  categoryId,
}: CategoryProductsPanelProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [moveProduct, setMoveProduct] = useState<MenuProduct | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState("");

  const assignedProducts = useMemo(
    () => category.products ?? [],
    [category.products]
  );
  const assignedIds = useMemo(
    () => new Set(assignedProducts.map((product) => product.id)),
    [assignedProducts]
  );

  const { data: productsData, isLoading: isLoadingProducts } =
    useMenuProductsQuery({ limit: 200 });
  const { data: categoriesData } = useMenuCategoriesQuery({ limit: 100 });
  const assignProducts = useBulkAssignProductsToCategoryMutation();
  const bulkUpdateProducts = useBulkUpdateMenuProductsMutation();

  const products = productsData?.data.items ?? [];
  const categories = categoriesData?.data.items ?? [];
  const targetCategories = categories.filter((item) => item.id !== categoryId);

  const assignableProducts = products.filter((product) => {
    const haystack = [
      product.name?.ar,
      product.name?.en,
      product.key,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      !assignedIds.has(product.id) &&
      (!productSearch.trim() ||
        haystack.includes(productSearch.trim().toLowerCase()))
    );
  });

  const toggleSelectedProduct = (productId: string) => {
    setSelectedProductIds((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  };

  const handleAssignProducts = async () => {
    if (!selectedProductIds.length) return;
    await assignProducts.mutateAsync({
      categoryId,
      data: { mode: "assign", productIds: selectedProductIds },
    });
    setSelectedProductIds([]);
    setProductSearch("");
    setIsAssignOpen(false);
  };

  const openMoveDialog = (product: MenuProduct) => {
    setMoveProduct(product);
    setTargetCategoryId("");
  };

  const handleMoveProduct = async () => {
    if (!moveProduct || !targetCategoryId) return;
    await bulkUpdateProducts.mutateAsync({
      action: "move_to_category",
      productIds: [moveProduct.id],
      categoryId: targetCategoryId,
    });
    setMoveProduct(null);
    setTargetCategoryId("");
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>منتجات هذا التصنيف</CardTitle>
            <CardDescription>
              هذا القسم ينظم المنتجات داخل التصنيف فقط، وتعديل المنتج الكامل يتم من صفحة المنتج.
            </CardDescription>
          </div>
          <Button type="button" onClick={() => setIsAssignOpen(true)}>
            <PackagePlus data-icon="inline-start" />
            إضافة منتجات للتصنيف
          </Button>
        </CardHeader>
        <CardContent>
          {assignedProducts.length ? (
            <div className="overflow-hidden rounded-lg border">
              <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground">
                <span>المنتج</span>
                <span>الحالة</span>
                <span>الإجراءات</span>
              </div>
              <div className="divide-y">
                {assignedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {product.name?.ar || product.name?.en || product.key}
                        </span>
                        <MenuKeyBadge value={product.key} />
                        {product.isCustomizable ? (
                          <Badge variant="secondary">قابل للتخصيص</Badge>
                        ) : (
                          <Badge variant="outline">مباشر</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {product.name?.en || product.key}
                      </p>
                    </div>
                    <MenuStatusBadge
                      active={product.isAvailable}
                      activeLabel="متوفر"
                      inactiveLabel="غير متوفر"
                    />
                    <div className="flex items-center justify-end gap-1">
                      <Button type="button" variant="ghost" size="sm" asChild>
                        <Link
                          to="/menu/products/$productId/update"
                          params={{ productId: product.id }}
                        >
                          <Pencil data-icon="inline-start" />
                          تعديل
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openMoveDialog(product)}
                      >
                        <ArrowLeftRight data-icon="inline-start" />
                        نقل
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
              <PackagePlus className="mb-3 size-8 text-muted-foreground" />
              <p className="font-medium">لا توجد منتجات داخل هذا التصنيف</p>
              <p className="mt-1 text-sm text-muted-foreground">
                أضف منتجات موجودة أو أنشئ منتجا جديدا ثم اربطه بهذا التصنيف.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة منتجات للتصنيف</DialogTitle>
            <DialogDescription>
              سيتم نقل المنتجات المختارة إلى هذا التصنيف باستخدام عقد التعيين الجماعي.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="ابحث باسم المنتج أو المفتاح"
                className="pr-9"
              />
            </div>

            <div className="max-h-96 overflow-auto rounded-lg border">
              {isLoadingProducts ? (
                <div className="p-4 text-sm text-muted-foreground">
                  جاري تحميل المنتجات...
                </div>
              ) : assignableProducts.length ? (
                <div className="divide-y">
                  {assignableProducts.map((product) => {
                    const checked = selectedProductIds.includes(product.id);
                    return (
                      <label
                        key={product.id}
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleSelectedProduct(product.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">
                            {product.name?.ar || product.name?.en || product.key}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {product.key}
                          </span>
                        </span>
                        {checked ? <Check className="size-4 text-primary" /> : null}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  لا توجد منتجات متاحة للإضافة.
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              onClick={handleAssignProducts}
              disabled={!selectedProductIds.length || assignProducts.isPending}
            >
              إضافة {selectedProductIds.length ? `(${selectedProductIds.length})` : ""}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(moveProduct)} onOpenChange={(open) => !open && setMoveProduct(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>نقل المنتج من التصنيف</DialogTitle>
            <DialogDescription>
              المنتجات يجب أن تبقى داخل تصنيف، لذلك يتم النقل إلى تصنيف آخر بدلا من تركها بدون تصنيف.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>التصنيف الجديد</Label>
            <Select value={targetCategoryId} onValueChange={setTargetCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="اختر التصنيف" />
              </SelectTrigger>
              <SelectContent>
                {targetCategories.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name.ar || item.name.en || item.key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              onClick={handleMoveProduct}
              disabled={!targetCategoryId || bulkUpdateProducts.isPending}
            >
              نقل المنتج
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMoveProduct(null)}
            >
              <X data-icon="inline-start" />
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
