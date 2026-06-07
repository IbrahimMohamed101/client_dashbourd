import { useMemo, useState } from "react";
import { Check, CircleOff, ListPlus, Pencil, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";

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
import { useMenuOptionsQuery } from "@/hooks/useMenuQuery";
import type { MenuOption } from "@/types/menuTypes";

interface OptionGroupOptionsPanelProps {
  assignedOptions?: MenuOption[];
  selectedOptionIds?: string[];
  onSelectDraftOptions?: (optionIds: string[]) => void;
  onAssignExistingOptions?: (optionIds: string[]) => Promise<void>;
  isAssigning?: boolean;
}

export function OptionGroupOptionsPanel({
  assignedOptions = [],
  selectedOptionIds = [],
  onSelectDraftOptions,
  onAssignExistingOptions,
  isAssigning = false,
}: OptionGroupOptionsPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogSelection, setDialogSelection] = useState<string[]>([]);
  const { data: optionsData, isLoading } = useMenuOptionsQuery({
    limit: 300,
    includeInactive: true,
  });
  const options = optionsData?.data.items ?? [];

  const assignedIds = useMemo(
    () => new Set([...assignedOptions.map((option) => option.id), ...selectedOptionIds]),
    [assignedOptions, selectedOptionIds]
  );

  const selectedDraftOptions = options.filter((option) =>
    selectedOptionIds.includes(option.id)
  );
  const visibleOptions = assignedOptions.length ? assignedOptions : selectedDraftOptions;

  const selectableOptions = options.filter((option) => {
    const haystack = [
      option.name?.ar,
      option.name?.en,
      option.key,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      !assignedIds.has(option.id) &&
      option.isActive !== false &&
      option.isVisible !== false &&
      option.isAvailable !== false &&
      (!search.trim() || haystack.includes(search.trim().toLowerCase()))
    );
  });

  const toggle = (optionId: string) => {
    setDialogSelection((current) =>
      current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
    );
  };

  const openDialog = () => {
    setDialogSelection([]);
    setSearch("");
    setIsDialogOpen(true);
  };

  const confirmSelection = async () => {
    if (!dialogSelection.length) return;
    if (onSelectDraftOptions) {
      onSelectDraftOptions([...selectedOptionIds, ...dialogSelection]);
    }
    if (onAssignExistingOptions) {
      await onAssignExistingOptions(dialogSelection);
    }
    setDialogSelection([]);
    setSearch("");
    setIsDialogOpen(false);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>خيارات المجموعة</CardTitle>
            <CardDescription>
              اختر من الخيارات الموجودة فقط. إنشاء خيار جديد يتم من صفحة الخيارات أولا.
            </CardDescription>
          </div>
          <Button type="button" onClick={openDialog}>
            <ListPlus data-icon="inline-start" />
            إضافة خيارات موجودة
          </Button>
        </CardHeader>
        <CardContent>
          {visibleOptions.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleOptions.map((option) => (
                <OptionCard key={option.id} option={option} />
              ))}
            </div>
          ) : (
            <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
              <ListPlus className="mb-3 size-8 text-muted-foreground" />
              <p className="font-medium">لا توجد خيارات مرتبطة بهذه المجموعة</p>
              <p className="mt-1 text-sm text-muted-foreground">
                أنشئ الخيارات من صفحة الخيارات، ثم اخترها هنا.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة خيارات موجودة</DialogTitle>
            <DialogDescription>
              سيتم ربط الخيارات المختارة بهذه المجموعة. لا يتم إنشاء خيارات جديدة من هنا.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ابحث باسم الخيار أو المفتاح"
                className="pr-9"
              />
            </div>

            <div className="max-h-96 overflow-auto rounded-lg border">
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">
                  جاري تحميل الخيارات...
                </div>
              ) : selectableOptions.length ? (
                <div className="divide-y">
                  {selectableOptions.map((option) => {
                    const checked = dialogSelection.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggle(option.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">
                            {option.name?.ar || option.name?.en || option.key}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {option.key}
                          </span>
                        </span>
                        {checked ? <Check className="size-4 text-primary" /> : null}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  لا توجد خيارات متاحة للإضافة.
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              onClick={confirmSelection}
              disabled={!dialogSelection.length || isAssigning}
            >
              إضافة {dialogSelection.length ? `(${dialogSelection.length})` : ""}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OptionCard({ option }: { option: MenuOption }) {
  const isOffered =
    option.isActive !== false &&
    option.isVisible !== false &&
    option.isAvailable !== false;

  return (
    <div className="flex min-h-40 flex-col justify-between rounded-lg border bg-background p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="truncate font-semibold">
              {option.name?.ar || option.name?.en || option.key}
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {option.name?.en || option.id}
            </p>
          </div>
          <Badge variant={isOffered ? "secondary" : "destructive"}>
            {isOffered ? "متاح للعميل" : "غير نشط"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{option.key}</Badge>
          {option.isActive === false ? (
            <Badge variant="outline">
              <CircleOff data-icon="inline-start" />
              معطل
            </Badge>
          ) : null}
          {option.isVisible === false ? (
            <Badge variant="outline">مخفي</Badge>
          ) : null}
          {option.isAvailable === false ? (
            <Badge variant="outline">غير متوفر</Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {isOffered
            ? "يظهر كخيار قابل للاختيار"
            : "ظاهر للإدارة فقط ولا يعرض للعميل"}
        </p>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link
            to="/menu/options/$optionId/update"
            params={{ optionId: option.id }}
          >
            <Pencil data-icon="inline-start" />
            تعديل
          </Link>
        </Button>
      </div>
    </div>
  );
}
