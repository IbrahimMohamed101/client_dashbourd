import { useMemo, useState } from "react";
import { Check, Search, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { MenuOption } from "@/types/menuTypes";

export function MealPlannerOptionFamilyPicker({
  options,
  selectedIds,
  loading = false,
  error = false,
  disabled = false,
  onRetry,
  onChange,
}: {
  options: MenuOption[];
  selectedIds: string[];
  loading?: boolean;
  error?: boolean;
  disabled?: boolean;
  onRetry?: () => void;
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) =>
      [option.key, option.name?.ar, option.name?.en]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [options, search]);

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium">الخيارات داخل المجموعة</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            اختر الخيارات المطلوبة. سيتم التحقق النهائي من العلاقات عند الحفظ.
          </p>
        </div>
        <Badge variant="outline">{selectedIds.length} محدد</Badge>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث بالاسم أو المفتاح..."
          className="pr-9"
          disabled={loading || disabled}
        />
      </div>

      {loading ? (
        <Message text="جاري تحميل خيارات المجموعة..." />
      ) : error ? (
        <Message text="تعذر تحميل خيارات المجموعة." action={onRetry} />
      ) : disabled ? (
        <Message text="اختر مجموعة خيارات مرتبطة بمنشئ الوجبات أولًا." />
      ) : rows.length ? (
        <div className="grid max-h-80 gap-2 overflow-y-auto rounded-2xl border bg-muted/10 p-2 sm:grid-cols-2">
          {rows.map((option) => {
            const selected = selectedIds.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  onChange(
                    selected
                      ? selectedIds.filter((id) => id !== option.id)
                      : [...selectedIds, option.id]
                  )
                }
                className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-right transition ${
                  selected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                    : "bg-background hover:border-primary/40"
                }`}
              >
                {option.imageUrl ? (
                  <img
                    src={option.imageUrl}
                    alt=""
                    className="size-11 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-muted">
                    <UtensilsCrossed className="size-4 text-muted-foreground" />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {option.name?.ar || option.name?.en || option.key}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {option.name?.en || option.key}
                  </span>
                </span>
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background"
                  }`}
                >
                  {selected ? <Check className="size-3.5" /> : null}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <Message text="لا توجد خيارات داخل هذه المجموعة." />
      )}
    </section>
  );
}

function Message({ text, action }: { text: string; action?: () => void }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">
      <div className="space-y-2">
        <p>{text}</p>
        {action ? (
          <button type="button" className="underline" onClick={action}>
            إعادة المحاولة
          </button>
        ) : null}
      </div>
    </div>
  );
}
