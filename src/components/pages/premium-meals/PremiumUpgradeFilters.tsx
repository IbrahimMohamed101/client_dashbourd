import { Filter, Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PremiumUpgradeListFilters } from "@/types/premiumUpgradeTypes";

export function PremiumUpgradeFilters({
  filters,
  onChange,
}: {
  filters: PremiumUpgradeListFilters;
  onChange: (filters: PremiumUpgradeListFilters) => void;
}) {
  function update(next: Partial<PremiumUpgradeListFilters>) {
    onChange({ ...filters, ...next, page: next.page ?? 1 });
  }

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="size-4" />
          التصفية والبحث
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        <div className="space-y-2 xl:col-span-2">
          <Label htmlFor="premium-search">بحث</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="premium-search"
              value={filters.q}
              onChange={(event) => update({ q: event.target.value })}
              className="pr-9"
              placeholder="اسم، مفتاح، أو مصدر"
            />
          </div>
        </div>
        <SelectField
          label="الحالة"
          value={filters.status}
          onValueChange={(status) => update({ status })}
          options={[
            ["all", "الكل"],
            ["active", "نشط"],
            ["archived", "مؤرشف"],
          ]}
        />
        <SelectField
          label="مفعل"
          value={filters.isEnabled}
          onValueChange={(isEnabled) => update({ isEnabled })}
          options={[
            ["all", "الكل"],
            ["true", "مفعل"],
            ["false", "معطل"],
          ]}
        />
        <SelectField
          label="ظاهر"
          value={filters.isVisible}
          onValueChange={(isVisible) => update({ isVisible })}
          options={[
            ["all", "الكل"],
            ["true", "ظاهر"],
            ["false", "مخفي"],
          ]}
        />
        <SelectField
          label="مصدر العنصر"
          value={filters.sourceType}
          onValueChange={(sourceType) => update({ sourceType })}
          options={[
            ["all", "الكل"],
            ["menu_option", "خيار منيو"],
            ["menu_product", "منتج منيو"],
          ]}
        />
        <SelectField
          label="نوع الترقية"
          value={filters.selectionType}
          onValueChange={(selectionType) => update({ selectionType })}
          options={[
            ["all", "الكل"],
            ["premium_meal", "بروتين مميز"],
            ["premium_large_salad", "سلطة كبيرة مميزة"],
          ]}
        />
      </CardContent>
    </Card>
  );
}

export function SelectField({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
