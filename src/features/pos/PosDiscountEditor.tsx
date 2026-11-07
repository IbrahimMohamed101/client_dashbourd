import { Input } from "@/components/ui/input";
import { toPosDiscount, type PosDiscountInput } from "./posDiscountMath";

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
