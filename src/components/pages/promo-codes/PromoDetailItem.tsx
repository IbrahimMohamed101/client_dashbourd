
export function PromoDetailItem({
  label,
  value,
  dir,
}: {
  label: string;
  value: string | number | null | undefined;
  dir?: "rtl" | "ltr";
}) {
  return (
    <div className="rounded-lg border border-muted-foreground/10 bg-muted/20 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 min-h-5 break-words font-medium" dir={dir}>
        {value ?? ""}
      </p>
    </div>
  );
}