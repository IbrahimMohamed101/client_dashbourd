import { useState } from "react";
import {
  MapPin,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DeliveryZone } from "@/types/deliveryZoneTypes";
import { useDeleteDeliveryZoneMutation } from "@/hooks/useDeliveryZonesQuery";
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

interface ZonesTableProps {
  data: DeliveryZone[];
  isLoading: boolean;
}

function safeStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (val == null) return "";
  if (typeof val === "object" && "ar" in (val as Record<string, unknown>))
    return String((val as Record<string, unknown>).ar ?? val);
  return String(val);
}

export function ZonesTable({ data, isLoading }: ZonesTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState<DeliveryZone | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = useDeleteDeliveryZoneMutation();

  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    return data.filter((item) => {
      const name =
        typeof item.name === "string" ? item.name : String(item.name ?? "");
      const desc =
        typeof item.sortOrder === "number" ? String(item.sortOrder) : "";
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    });
  };

  const handleEdit = (zone: DeliveryZone) => {
    setEditData(zone);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditData(undefined);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success("تم حذف المنطقة بنجاح");
      setDeleteId(null);
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    }
  };

  if (isLoading) {
    return (
      <div className="flex animate-pulse flex-col gap-4 px-4 lg:px-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 w-full rounded-xl bg-muted/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-muted-foreground/10 bg-background/50 p-4 backdrop-blur-md sm:flex-row sm:items-center">
        <div className="group relative max-w-sm flex-1">
          <Search className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="البحث عن منطقة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 rounded-2xl border-muted-foreground/5 bg-muted/30 pr-11 ring-offset-background transition-all focus:bg-background"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-12 gap-2 rounded-2xl border-muted-foreground/10 px-5 transition-colors hover:bg-muted/50"
          >
            <Filter className="size-4" />
            تصفية
          </Button>
          <Button
            onClick={handleAdd}
            className="h-12 gap-2 rounded-2xl px-6 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-4" />
            إضافة منطقة جديدة
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2.5rem] border border-muted-foreground/10 bg-card/30 shadow-xl shadow-foreground/5 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="border-b border-muted-foreground/10 bg-muted/30">
                <th className="h-16 p-4 text-sm font-black text-foreground/80">
                  المنطقة
                </th>
                <th className="h-16 p-4 text-sm font-black text-foreground/80">
                  رسوم التوصيل
                </th>
                <th className="h-16 p-4 text-sm font-black text-foreground/80">
                  الوصف
                </th>
                <th className="h-16 p-4 text-sm font-black text-foreground/80">
                  الحالة
                </th>
                <th className="h-16 p-4 text-center text-sm font-black text-foreground/80">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted-foreground/5">
              {getFilteredData().length === 0 && (
                <tr key="empty-row">
                  <td
                    colSpan={5}
                    className="h-64 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-4 opacity-50 grayscale">
                      <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                        <MapPin className="size-10 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-muted-foreground">
                          لا توجد مناطق توصيل
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground/60">
                          جرب تغيير كلمة البحث أو أضف منطقة جديدة
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {getFilteredData().map((zone: DeliveryZone, idx: number) => (
                <tr
                  key={zone.id ?? `zone-${idx}`}
                  className="group border-muted-foreground/5 transition-colors hover:bg-primary/[0.03]"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                        <MapPin className="size-5" />
                      </div>
                      <span className="text-base font-black tracking-tight text-foreground/90">
                        {safeStr(zone.name)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-base font-bold tabular-nums">
                      {zone.deliveryFeeHalala?.toLocaleString() || 0} ر.س
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="line-clamp-1 max-w-[200px] text-sm text-muted-foreground">
                      {typeof zone.sortOrder === "number"
                        ? `الترتيب: ${zone.sortOrder}`
                        : "—"}
                    </span>
                  </td>
                  <td className="p-4">
                    <StatusBadge isActive={zone.isActive} />
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        onClick={() => handleEdit(zone)}
                        className="size-9 rounded-xl transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit3 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setDeleteId(zone.id)}
                        className="size-9 rounded-xl text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ZoneFormDialog
        key={editData?.id ?? "new"}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        zone={editData}
      />

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent className="rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-black">
              <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <Trash2 className="size-5" />
              </div>
              هل أنت متأكد من الحذف؟
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-right font-medium text-muted-foreground">
              سيتم حذف منطقة التوصيل بشكل نهائي. هذا الإجراء لا يمكن التراجع
              عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={handleDelete}
              className="h-11 rounded-xl bg-rose-500 px-6 transition-all hover:bg-rose-600 active:scale-95"
            >
              نعم، احذف المنطقة
            </AlertDialogAction>
            <AlertDialogCancel className="mt-0 h-11 rounded-xl border-muted-foreground/10 px-6 hover:bg-muted/50">
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        نشط
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/10 bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
      <XCircle className="h-3 w-3" />
      غير نشط
    </div>
  );
}
