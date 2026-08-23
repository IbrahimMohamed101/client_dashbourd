import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchCatalogItems,
  updateCatalogItemNutrition,
} from "@/utils/fetchCatalogItems";
import type { CatalogItem, CatalogNutrition } from "@/types/catalogItemTypes";

const QUERY_KEY = ["catalog-items", "nutrition"] as const;

const emptyNutrition = (): CatalogNutrition => ({
  calories: 0,
  proteinGrams: 0,
  carbsGrams: 0,
  fatGrams: 0,
});

export function CatalogNutritionTab({
  canWrite = true,
}: {
  canWrite?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [nutrition, setNutrition] = useState<CatalogNutrition>(emptyNutrition);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => fetchCatalogItems(),
    staleTime: 30_000,
  });
  const items = useMemo(() => query.data?.data ?? [], [query.data?.data]);
  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.key, item.nameI18n.ar, item.nameI18n.en, item.itemKind].some(
        (value) => value?.toLowerCase().includes(needle)
      )
    );
  }, [items, search]);
  const selected = items.find((item) => item.id === selectedId) ?? null;

  const save = useMutation({
    mutationFn: () => updateCatalogItemNutrition(selectedId, nutrition),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["menu.products"] });
      toast.success("تم حفظ القيم الغذائية بنجاح");
    },
    onError: () => toast.error("تعذر حفظ القيم الغذائية"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-5" />
          السعرات والقيم الغذائية
        </CardTitle>
        <CardDescription>
          المصدر الموحد للقيم التي تظهر للمنتجات والخيارات المرتبطة في التطبيق.
          القيم الوزنية تُفسر لكل 100 جم.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[minmax(280px,0.9fr)_minmax(360px,1.1fr)]">
        <div className="space-y-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو المفتاح..."
          />
          <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-md border p-2">
            {query.isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              visibleItems.map((item) => (
                <CatalogItemButton
                  key={item.id}
                  item={item}
                  active={item.id === selectedId}
                  onClick={() => {
                    setSelectedId(item.id);
                    setNutrition({ ...emptyNutrition(), ...item.nutrition });
                  }}
                />
              ))
            )}
            {!query.isLoading && visibleItems.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                لا توجد أصناف مطابقة.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-md border p-4">
          {!selected ? (
            <p className="text-sm text-muted-foreground">
              اختر صنفًا لإدخال السعرات والقيم الغذائية.
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold">
                  {selected.nameI18n.ar || selected.nameI18n.en || selected.key}
                </h3>
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {selected.key}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <NutritionInput
                  label="السعرات الحرارية"
                  value={nutrition.calories}
                  onChange={(calories) =>
                    setNutrition((value) => ({ ...value, calories }))
                  }
                />
                <NutritionInput
                  label="البروتين (جم)"
                  value={nutrition.proteinGrams}
                  onChange={(proteinGrams) =>
                    setNutrition((value) => ({ ...value, proteinGrams }))
                  }
                />
                <NutritionInput
                  label="الكربوهيدرات (جم)"
                  value={nutrition.carbsGrams}
                  onChange={(carbsGrams) =>
                    setNutrition((value) => ({ ...value, carbsGrams }))
                  }
                />
                <NutritionInput
                  label="الدهون (جم)"
                  value={nutrition.fatGrams}
                  onChange={(fatGrams) =>
                    setNutrition((value) => ({ ...value, fatGrams }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                مرتبط بـ {selected.linkedProductsCount} منتج و
                {selected.linkedOptionsCount} خيار. القيمة 0 لن تُعرض في
                التطبيق.
              </p>
              <Button
                disabled={!canWrite || save.isPending}
                onClick={() => save.mutate()}
              >
                <Save className="size-4" />
                {save.isPending ? "جارٍ الحفظ..." : "حفظ القيم"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CatalogItemButton({
  item,
  active,
  onClick,
}: {
  item: CatalogItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-md border p-3 text-right transition-colors ${active ? "border-primary bg-primary/5" : "hover:bg-muted/60"}`}
    >
      <span className="block text-sm font-medium">
        {item.nameI18n.ar || item.nameI18n.en || item.key}
      </span>
      <span className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{item.itemKind}</span>
        <span>{Number(item.nutrition?.calories || 0)} سعرة</span>
      </span>
    </button>
  );
}

function NutritionInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        min="0"
        step="0.1"
        value={value}
        onChange={(event) =>
          onChange(Math.max(0, Number(event.target.value) || 0))
        }
      />
    </div>
  );
}
