import { Input } from "@/components/ui/input";
import type { PosDiscount } from "./financialApi";

export type PosDiscountInput = { type: "percent" | "fixed"; input: string } | null;

export function parseHalalas(input: string): number | null {
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(input)) return null;
  const [riyals, halalas = ""] = input.split(".");
  const total = Number(riyals) * 100 + Number(halalas.padEnd(2, "0"));
  return Number.isSafeInteger(total) && total >= 0 && total <= 1_000_000_000 ? total : null;
}
export function toPosDiscount(value: PosDiscountInput): PosDiscount | undefined {
  if (!value) return null;
  if (value.type === "fixed") {
    const halalas = parseHalalas(value.input);
    return halalas === null ? undefined : { type: "fixed", value: halalas };
  }
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(value.input)) return undefined;
  const n = Number(value.input);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? { type: "percent", value: n } : undefined;
}

export function PosDiscountEditor({ label, value, onChange, disabled = false }: {
  label: string;
  value: PosDiscountInput;
  onChange: (next: PosDiscountInput) => void;
  disabled?: boolean;
}) {
  const valid = toPosDiscount(value) !== undefined;
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
      <span className="font-medium">{label}</span>
      <select aria-label={"نوع " + label}
        className="min-h-12 rounded-md border bg-background px-2"
        disabled={disabled} value={value?.type ?? "none"}
        onChange={event => onChange(event.target.value === "none" ? null
          : { type: event.target.value as "fixed" | "percent", input: "0" })}>
        <option value="none">بدون خصم</option>
        <option value="percent">نسبة %</option>
        <option value="fixed">مبلغ ريال</option>
      </select>
      {value && (
        <Input inputMode="decimal" dir="ltr" aria-label={"قيمة " + label}
          value={value.input} disabled={disabled}
          className="min-h-12 w-28" onChange={event =>
            onChange({ type: value.type, input: event.target.value })} />
      )}
      {!valid && <span role="alert" className="text-destructive">قيمة خصم غير صالحة.</span>}
    </div>
  );
}
