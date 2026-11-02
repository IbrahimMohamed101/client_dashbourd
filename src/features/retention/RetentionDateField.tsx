import * as React from "react";
import { CalendarDays, X } from "lucide-react";
import { arSA } from "react-day-picker/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Values are plain "yyyy-MM-dd" strings (what the API expects); they are parsed and
// formatted with local date parts so no timezone shift can move the selected day.
const parseValue = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const toValue = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");
// dd/MM/yyyy, the same format used everywhere else on the page.
const toLabel = (value: string) => {
  const date = parseValue(value);
  if (!date) return "";
  return [
    String(date.getDate()).padStart(2, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    date.getFullYear(),
  ].join("/");
};

type RetentionDateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
};

export function RetentionDateField({ label, value, onChange, min, max }: RetentionDateFieldProps) {
  const [open, setOpen] = React.useState(false);
  const selected = parseValue(value);
  const minDate = min ? parseValue(min) : undefined;
  const maxDate = max ? parseValue(max) : undefined;
  const disabled = [
    ...(minDate ? [{ before: minDate }] : []),
    ...(maxDate ? [{ after: maxDate }] : []),
  ];

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" aria-label={label}
            className="h-10 w-40 justify-between px-3 text-[13px] font-normal">
            <span className={value ? "tabular-nums" : "text-muted-foreground"} dir="ltr">
              {toLabel(value) || "يوم / شهر / سنة"}
            </span>
            <CalendarDays className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar mode="single" dir="rtl" locale={arSA} selected={selected}
            defaultMonth={selected ?? minDate ?? maxDate} disabled={disabled}
            onSelect={(next) => { onChange(next ? toValue(next) : ""); setOpen(false); }} />
        </PopoverContent>
      </Popover>
      {value && (
        <Button type="button" variant="ghost" size="icon" aria-label={"مسح " + label}
          className="size-8" onClick={() => onChange("")}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
