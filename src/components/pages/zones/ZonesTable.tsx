import { useState } from "react";
import {
  Archive,
  CheckCircle2,
  Edit3,
  MapPin,
  Plus,
  Power,
  PowerOff,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  DeliveryZone,
  DeliveryZoneActiveFilter,
} from "@/types/deliveryZoneTypes";
import {
  useDeleteDeliveryZoneMutation,
  useDeliveryZonesListQuery,
  useToggleDeliveryZoneMutation,
} from "@/hooks/useDeliveryZonesQuery";
import { useDebounce } from "@/hooks/useDebounce";
import { displayLocalizedText } from "@/utils/displayText";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ZoneFormDialog } from "./ZoneFormDialog";

function getZoneId(zone: DeliveryZone): string {
  return zone._id || zone.id || "";
}

function getZoneDisplayName(zone: DeliveryZone): string {
  return displayLocalizedText(zone.name, "منطقة بدون اسم");
}

function formatSARFromHalala(value: number | null | undefined): string {
  const halala = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(halala / 100);
}

function formatDateTime(value?: string): string {
  if (!value) return "غير محدد";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "غير محدد";
  return new Intl.DateTimeFormat("ar-SA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function readApiErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data;
    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }
  }
  return fallback;
}

function toIsActiveFilter(value: DeliveryZoneActiveFilter): boolean | undefined {
  if (value === "active") return true;
  if (value === "inactive") return false;
  return undefined;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        نشطة
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/10 bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
      <XCircle className="h-3.5 w-3.5" />
      غير نشطة
    </div>
  );
}

export function ZonesTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 350);
  const [activeFilter, setActiveFilter] = useState<DeliveryZoneActiveFilter>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState<DeliveryZone | undefined>();
  const [archiveZone, setArchiveZone] = useState<DeliveryZone | null>(null);
  const { data: response, isLoading } = useDeliveryZonesListQuery(
    debouncedSearchQuery,
    toIsActiveFilter(activeFilter)
  );
  const zones = response?.data ?? [];
  const resultCount = response?.meta?.totalCount ?? zones.length;
  const archiveMutation = useDeleteDeliveryZoneMutation();
  const toggleMutation = useToggleDeliveryZoneMutation();

  async function handleArchive() {
    if (!archiveZone) return;
    try {
      await archiveMutation.mutateAsync(getZoneId(archiveZone));
      toast.success("تم تعطيل المنطقة بنجاح");
      setArchiveZone(null);
    } catch (error) {
      toast.error(readApiErrorMessage(error, "تعذر تعطيل المنطقة. حاول مرة أخرى."));
    }
  }

  async function handleToggle(zone: DeliveryZone) {
    try {
      await toggleMutation.mutateAsync(getZoneId(zone));
      toast.success(zone.isActive ? "تم تعطيل المنطقة" : "تم تفعيل المنطقة");
    } catch (error) {
      toast.error(readApiErrorMessage(error, "تعذر تغيير حالة المنطقة. حاول مرة أخرى."));
    }
  }

  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col gap-4 px-4 lg:px-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 w-full rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-muted-foreground/10 bg-background/50 p-4 backdrop-blur-md lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="group relative min-w-0 flex-1">
            <Search className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="البحث باسم المنطقة العربي أو الإنجليزي..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 rounded-2xl border-muted-foreground/5 bg-muted/30 pr-11 ring-offset-background transition-all focus:bg-background"
            />
          </div>
          <Select
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value as DeliveryZoneActiveFilter)}
            dir="rtl"
          >
            <SelectTrigger className="h-12 rounded-2xl border-muted-foreground/10 bg-muted/30 sm:w-44">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="active">نشطة</SelectItem>
              <SelectItem value="inactive">غير نشطة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            النتائج: {resultCount.toLocaleString("ar-SA")}
          </span>
          <Button onClick={() => { setEditData(undefined); setIsDialogOpen(true); }} className="h-12 gap-2 rounded-2xl px-6 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95">
            <Plus className="size-4" />
            إضافة منطقة جديدة
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-muted-foreground/10 bg-card/30 shadow-xl shadow-foreground/5 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-right">
            <thead>
              <tr className="border-b border-muted-foreground/10 bg-muted/30">
                <th className="h-16 p-4 text-sm font-black text-foreground/80">المنطقة</th>
                <th className="h-16 p-4 text-sm font-black text-foreground/80">الاسم بالإنجليزية</th>
                <th className="h-16 p-4 text-sm font-black text-foreground/80">رسوم التوصيل</th>
                <th className="h-16 p-4 text-sm font-black text-foreground/80">ترتيب العرض</th>
                <th className="h-16 p-4 text-sm font-black text-foreground/80">آخر تحديث</th>
                <th className="h-16 p-4 text-sm font-black text-foreground/80">الحالة</th>
                <th className="h-16 p-4 text-center text-sm font-black text-foreground/80">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-foreground/5">
              {zones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-64 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-70">
                      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                        <MapPin className="size-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-muted-foreground">لا توجد مناطق توصيل مطابقة.</p>
                        <p className="mt-1 text-sm text-muted-foreground/70">جرّب تغيير البحث أو الحالة أو أضف منطقة جديدة.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                zones.map((zone) => (
                  <tr key={getZoneId(zone)} className="group transition-colors hover:bg-primary/[0.03]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                          <MapPin className="size-5" />
                        </div>
                        <span className="text-base font-black tracking-tight text-foreground/90">{getZoneDisplayName(zone)}</span>
                      </div>
                    </td>
                    <td className="p-4"><span className="line-clamp-1 max-w-[220px] text-sm text-muted-foreground" dir="ltr">{zone.name.en || "—"}</span></td>
                    <td className="p-4"><span className="text-base font-bold tabular-nums" dir="ltr">{formatSARFromHalala(zone.deliveryFeeHalala)}</span></td>
                    <td className="p-4"><span className="text-sm font-medium tabular-nums">{zone.sortOrder.toLocaleString("ar-SA")}</span></td>
                    <td className="p-4"><span className="text-sm text-muted-foreground">{formatDateTime(zone.updatedAt)}</span></td>
                    <td className="p-4"><StatusBadge isActive={zone.isActive} /></td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" onClick={() => { setEditData(zone); setIsDialogOpen(true); }} className="size-9 rounded-xl transition-colors hover:bg-primary/10 hover:text-primary" aria-label="تعديل المنطقة"><Edit3 className="size-4" /></Button>
                        <Button variant="ghost" onClick={() => handleToggle(zone)} disabled={toggleMutation.isPending} className="size-9 rounded-xl transition-colors hover:bg-primary/10 hover:text-primary" aria-label={zone.isActive ? "تعطيل المنطقة" : "تفعيل المنطقة"}>{zone.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}</Button>
                        <Button variant="ghost" onClick={() => setArchiveZone(zone)} disabled={!zone.isActive || archiveMutation.isPending} className="size-9 rounded-xl text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500" aria-label="تعطيل المنطقة"><Archive className="size-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ZoneFormDialog key={editData?._id ?? editData?.id ?? "new"} isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} zone={editData} />

      <AlertDialog open={Boolean(archiveZone)} onOpenChange={(open) => !open && setArchiveZone(null)}>
        <AlertDialogContent className="rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl" dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-black">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500"><Archive className="size-5" /></div>
              هل تريد تعطيل منطقة التوصيل؟
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-right font-medium text-muted-foreground">
              سيتم تعطيل المنطقة ولن تُحذف نهائياً. هل تريد المتابعة؟
              {archiveZone ? <span className="mt-3 block font-bold text-foreground">{getZoneDisplayName(archiveZone)}</span> : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row-reverse gap-2">
            <AlertDialogAction onClick={handleArchive} disabled={archiveMutation.isPending} className="h-11 rounded-xl bg-rose-500 px-6 transition-all hover:bg-rose-600 active:scale-95">
              {archiveMutation.isPending ? "جاري التعطيل..." : "نعم، عطّل المنطقة"}
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-11 rounded-xl border-muted-foreground/10 px-6 hover:bg-muted/50">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
