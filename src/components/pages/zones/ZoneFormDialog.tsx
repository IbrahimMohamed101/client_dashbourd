import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateDeliveryZoneMutation,
  useUpdateDeliveryZoneMutation,
} from "@/hooks/useDeliveryZonesQuery";
import type { DeliveryZone } from "@/types/deliveryZoneTypes";

interface ZoneFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  zone?: DeliveryZone;
}

interface FormData {
  name: string;
  delivery_fee: string;
  coverage_description: string;
  is_active: boolean;
}

function safeStr(val: unknown): string {
  if (typeof val === "string") return val;
  if (val == null) return "";
  if (typeof val === "object" && "ar" in (val as Record<string, unknown>)) return String((val as Record<string, unknown>).ar ?? val);
  return String(val);
}

function getInitialFormData(zone?: DeliveryZone): FormData {
  if (zone) {
    return {
      name: safeStr(zone.name),
      delivery_fee: String(zone.delivery_fee ?? 0),
      coverage_description: safeStr(zone.coverage_description),
      is_active: zone.is_active,
    };
  }
  return {
    name: "",
    delivery_fee: "",
    coverage_description: "",
    is_active: true,
  };
}

export function ZoneFormDialog({ isOpen, onClose, zone }: ZoneFormDialogProps) {
  const isEditing = !!zone;

  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(zone));

  const createMutation = useCreateDeliveryZoneMutation();
  const updateMutation = useUpdateDeliveryZoneMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("يرجى إدخال اسم المنطقة");
      return;
    }
    if (!formData.delivery_fee || Number(formData.delivery_fee) < 0) {
      toast.error("يرجى إدخال رسوم توصيل صحيحة");
      return;
    }

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      delivery_fee: Number(formData.delivery_fee),
      is_active: formData.is_active,
    };

    if (formData.coverage_description.trim()) {
      payload.coverage_description = formData.coverage_description.trim();
    }

    try {
      if (isEditing && zone) {
        await updateMutation.mutateAsync({ id: zone.id, data: payload });
        toast.success("تم تحديث المنطقة بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("تم إضافة المنطقة بنجاح");
      }
      onClose();
    } catch {
      toast.error(
        isEditing ? "حدث خطأ أثناء تحديث المنطقة" : "حدث خطأ أثناء إضافة المنطقة"
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-[2rem] border-muted-foreground/10 bg-background/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </div>
            {isEditing ? "تعديل منطقة التوصيل" : "إضافة منطقة جديدة"}
          </DialogTitle>
          <DialogDescription className="text-right font-medium text-muted-foreground">
            {isEditing
              ? "قم بتعديل بيانات منطقة التوصيل"
              : "أدخل بيانات منطقة التوصيل الجديدة"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-bold">
              اسم المنطقة
            </Label>
            <Input
              id="name"
              placeholder="مثال: الرياض - شمال"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="h-12 rounded-2xl border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_fee" className="text-sm font-bold">
              رسوم التوصيل (ر.س)
            </Label>
            <Input
              id="delivery_fee"
              type="number"
              min="0"
              step="0.01"
              placeholder="مثال: 25"
              value={formData.delivery_fee}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, delivery_fee: e.target.value }))
              }
              className="h-12 rounded-2xl border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverage_description" className="text-sm font-bold">
              وصف التغطية
            </Label>
            <Textarea
              id="coverage_description"
              placeholder="صف الأحياء أو المناطق التي تشملها هذه المنطقة..."
              value={formData.coverage_description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  coverage_description: e.target.value,
                }))
              }
              className="h-24 resize-none rounded-2xl border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-muted-foreground/10 bg-muted/30 p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold">تفعيل المنطقة</Label>
              <p className="text-xs text-muted-foreground">
                سيتمكن المستخدمون من اختيار هذه المنطقة عند التفعيل
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          <DialogFooter className="flex-row-reverse gap-2 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 gap-2 rounded-2xl px-8 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isLoading
                ? "جاري الحفظ..."
                : isEditing
                  ? "تحديث المنطقة"
                  : "إضافة المنطقة"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 rounded-2xl border-muted-foreground/10 px-6 hover:bg-muted/50"
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
