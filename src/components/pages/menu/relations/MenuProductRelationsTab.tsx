import { useMemo, useState } from "react";
import { Link2, SlidersHorizontal, ToggleLeft } from "lucide-react";

import {
  useLinkGroupsToProductMutation,
  useLinkOptionsToGroupMutation,
  useMenuOptionGroupsQuery,
  useMenuOptionsQuery,
  useMenuProductDetailQuery,
  useMenuProductsQuery,
  useUpdateOptionAvailabilityInProductMutation,
  useUpdateOptionOverrideMutation,
  useUpdateSelectionRulesMutation,
} from "@/hooks/useMenuQuery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  MenuEmptyState,
  MenuKeyBadge,
  MenuSectionCard,
} from "@/components/pages/menu/MenuTabScaffold";
import type {
  MenuProductLinkedGroup,
  ProductGroupOptionOverride,
  ProductGroupRule,
} from "@/types/menuTypes";

const toHalala = (sar: string) => Math.round((Number(sar) || 0) * 100);
const toOptionalNumber = (value: string) =>
  value.trim() === "" ? undefined : Number(value);

const getLinkedGroups = (
  groups?: MenuProductLinkedGroup[],
  optionGroups?: MenuProductLinkedGroup[]
) => optionGroups ?? groups ?? [];

const normalizeGroupRule = (group: MenuProductLinkedGroup): ProductGroupRule => ({
  groupId: group.groupId || group.group?.id || "",
  minSelections: group.minSelections ?? 0,
  maxSelections: group.maxSelections ?? 1,
  isRequired: group.isRequired ?? false,
  sortOrder: group.sortOrder ?? 0,
  isActive: group.isActive ?? true,
  isAvailable: group.isAvailable ?? true,
  isVisible: group.isVisible ?? true,
});

const normalizeOption = (
  option: ProductGroupOptionOverride
): ProductGroupOptionOverride => ({
  optionId: option.optionId,
  extraPriceHalala: option.extraPriceHalala,
  extraWeightUnitGrams: option.extraWeightUnitGrams,
  extraWeightPriceHalala: option.extraWeightPriceHalala,
  isActive: option.isActive ?? true,
  isAvailable: option.isAvailable ?? true,
  isVisible: option.isVisible ?? true,
  sortOrder: option.sortOrder ?? 0,
});

export function MenuProductRelationsTab() {
  const [productId, setProductId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [optionId, setOptionId] = useState("");
  const [minSelections, setMinSelections] = useState("0");
  const [maxSelections, setMaxSelections] = useState("1");
  const [groupSortOrder, setGroupSortOrder] = useState("0");
  const [isRequired, setIsRequired] = useState(false);
  const [extraPriceSar, setExtraPriceSar] = useState("0");
  const [extraWeightUnitGrams, setExtraWeightUnitGrams] = useState("");
  const [extraWeightPriceSar, setExtraWeightPriceSar] = useState("");
  const [optionSortOrder, setOptionSortOrder] = useState("0");
  const [optionAvailable, setOptionAvailable] = useState(true);

  const { data: productsData } = useMenuProductsQuery({ limit: 100 });
  const { data: groupsData } = useMenuOptionGroupsQuery({ limit: 100 });
  const { data: optionsData } = useMenuOptionsQuery({
    limit: 100,
    groupId: groupId || undefined,
  });
  const { data: productData } = useMenuProductDetailQuery(productId);

  const linkGroups = useLinkGroupsToProductMutation();
  const updateRules = useUpdateSelectionRulesMutation();
  const linkOptions = useLinkOptionsToGroupMutation();
  const updateOverride = useUpdateOptionOverrideMutation();
  const updateAvailability = useUpdateOptionAvailabilityInProductMutation();

  const products = productsData?.data?.items || [];
  const groups = groupsData?.data?.items || [];
  const options = optionsData?.data?.items || [];
  const product = productData?.data;
  const linkedGroups = useMemo(
    () => getLinkedGroups(product?.groups, product?.optionGroups),
    [product]
  );
  const selectedLinkedGroup = linkedGroups.find(
    (group) => (group.groupId || group.group?.id) === groupId
  );
  const linkedOptions = selectedLinkedGroup?.options || [];

  const groupPayload = () => {
    const nextRule: ProductGroupRule = {
      groupId,
      minSelections: Number(minSelections) || 0,
      maxSelections: Number(maxSelections) || 1,
      isRequired,
      sortOrder: Number(groupSortOrder) || 0,
      isActive: true,
      isAvailable: true,
      isVisible: true,
    };
    const existing = linkedGroups
      .map(normalizeGroupRule)
      .filter((group) => group.groupId && group.groupId !== groupId);
    return { groups: [...existing, nextRule] };
  };

  const optionPayload = () => {
    const nextOption: ProductGroupOptionOverride = {
      optionId,
      extraPriceHalala: toHalala(extraPriceSar),
      extraWeightUnitGrams: toOptionalNumber(extraWeightUnitGrams),
      extraWeightPriceHalala:
        extraWeightPriceSar.trim() === ""
          ? undefined
          : toHalala(extraWeightPriceSar),
      isActive: true,
      isAvailable: optionAvailable,
      isVisible: true,
      sortOrder: Number(optionSortOrder) || 0,
    };
    const existing = linkedOptions
      .map((option) =>
        normalizeOption({
          ...option,
          optionId: option.optionId || option.option?.id || "",
        })
      )
      .filter((option) => option.optionId && option.optionId !== optionId);
    return { options: [...existing, nextOption] };
  };

  const canSaveGroup = Boolean(productId && groupId);
  const canSaveOption = Boolean(productId && groupId && optionId);

  return (
    <MenuSectionCard
      title="ربط دورة المنيو"
      description="اربط المنتجات بمجموعات الخيارات واضبط قواعد الاختيار والتجاوزات الأسبوعية."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>المنتج</Label>
              <Select
                value={productId}
                onValueChange={(value) => {
                  setProductId(value);
                  setGroupId("");
                  setOptionId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المنتج" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name.ar}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>مجموعة الخيارات</Label>
              <Select
                value={groupId}
                onValueChange={(value) => {
                  setGroupId(value);
                  setOptionId("");
                }}
                disabled={!productId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المجموعة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name.ar}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>الحد الأدنى</Label>
              <Input
                type="number"
                min="0"
                value={minSelections}
                onChange={(event) => setMinSelections(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الحد الأقصى</Label>
              <Input
                type="number"
                min="0"
                value={maxSelections}
                onChange={(event) => setMaxSelections(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>الترتيب</Label>
              <Input
                type="number"
                min="0"
                value={groupSortOrder}
                onChange={(event) => setGroupSortOrder(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-3 pb-2">
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
              <span className="text-sm font-medium">
                {isRequired ? "إجباري" : "اختياري"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!canSaveGroup || linkGroups.isPending}
              onClick={() =>
                linkGroups.mutate({
                  productId,
                  data: groupPayload(),
                })
              }
            >
              <Link2 data-icon="inline-start" />
              ربط المجموعة
            </Button>
            <Button
              variant="outline"
              disabled={!canSaveGroup || updateRules.isPending}
              onClick={() =>
                updateRules.mutate({
                  productId,
                  groupId,
                  data: {
                    minSelections: Number(minSelections) || 0,
                    maxSelections: Number(maxSelections) || 1,
                    isRequired,
                  },
                })
              }
            >
              <SlidersHorizontal data-icon="inline-start" />
              تحديث القواعد
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>الخيار</Label>
              <Select
                value={optionId}
                onValueChange={setOptionId}
                disabled={!groupId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الخيار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {options.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name.ar}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>السعر الإضافي (ر.س)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={extraPriceSar}
                onChange={(event) => setExtraPriceSar(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>وحدة الوزن</Label>
              <Input
                type="number"
                min="0"
                value={extraWeightUnitGrams}
                onChange={(event) =>
                  setExtraWeightUnitGrams(event.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>سعر الوزن (ر.س)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={extraWeightPriceSar}
                onChange={(event) =>
                  setExtraWeightPriceSar(event.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>الترتيب</Label>
              <Input
                type="number"
                min="0"
                value={optionSortOrder}
                onChange={(event) => setOptionSortOrder(event.target.value)}
              />
            </div>
            <div className="flex items-end gap-3 pb-2">
              <Switch
                checked={optionAvailable}
                onCheckedChange={setOptionAvailable}
              />
              <span className="text-sm font-medium">
                {optionAvailable ? "متوفر" : "غير متوفر"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!canSaveOption || linkOptions.isPending}
              onClick={() =>
                linkOptions.mutate({
                  productId,
                  groupId,
                  data: optionPayload(),
                })
              }
            >
              <Link2 data-icon="inline-start" />
              ربط الخيار
            </Button>
            <Button
              variant="outline"
              disabled={!canSaveOption || updateOverride.isPending}
              onClick={() =>
                updateOverride.mutate({
                  productId,
                  groupId,
                  optionId,
                  data: optionPayload().options.at(-1) || {},
                })
              }
            >
              <SlidersHorizontal data-icon="inline-start" />
              تحديث التجاوز
            </Button>
            <Button
              variant="outline"
              disabled={!canSaveOption || updateAvailability.isPending}
              onClick={() =>
                updateAvailability.mutate({
                  productId,
                  groupId,
                  optionId,
                  isAvailable: optionAvailable,
                })
              }
            >
              <ToggleLeft data-icon="inline-start" />
              تحديث التوفر
            </Button>
          </div>
        </div>
      </div>

      {product ? (
        <div className="rounded-lg border bg-background p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">المجموعات المرتبطة</span>
            <MenuKeyBadge value={product.key} />
          </div>
          {linkedGroups.length === 0 ? (
            <MenuEmptyState
              title="لا توجد مجموعات مرتبطة"
              description="اختر مجموعة واضبط قواعدها ثم احفظ الربط لهذا المنتج."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {linkedGroups.map((group) => (
                <div
                  key={group.groupId || group.group?.id}
                  className="rounded-md border bg-muted/20 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {group.group?.name?.ar || group.groupId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.minSelections ?? 0} - {group.maxSelections ?? 1} اختيارات
                      </p>
                    </div>
                    <Badge variant={group.isRequired ? "default" : "outline"}>
                      {group.isRequired ? "إجباري" : "اختياري"}
                    </Badge>
                  </div>
                  {group.options?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {group.options.map((option) => (
                        <Badge
                          key={option.optionId || option.option?.id}
                          variant={option.isAvailable === false ? "outline" : "secondary"}
                        >
                          {option.option?.name?.ar || option.optionId}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </MenuSectionCard>
  );
}
