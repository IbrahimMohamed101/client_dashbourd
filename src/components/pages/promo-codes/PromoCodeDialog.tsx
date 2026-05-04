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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  useCreatePromoCodeMutation,
  useUpdatePromoCodeMutation,
} from "@/hooks/usePromoCodesQuery";
import type { PromoCodeDTO } from "@/types/financeTypes";

interface PromoCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: PromoCodeDTO;
}

function getInitialFormData(editData?: PromoCodeDTO) {
  if (editData) {
    return {
      code: editData.code,
      type: editData.type as "percentage" | "fixed",
      value: editData.value.toString(),
      maxUsage: editData.maxUsage?.toString() || "",
      expiryDate: editData.expiryDate
        ? new Date(editData.expiryDate).toISOString().split("T")[0]
        : "",
      status: editData.status as "active" | "expired" | "disabled",
    };
  }
  return {
    code: "",
    type: "percentage" as const,
    value: "",
    maxUsage: "",
    expiryDate: "",
    status: "active" as const,
  };
}

interface FormData {
  code: string;
  type: "percentage" | "fixed";
  value: string;
  maxUsage: string;
  expiryDate: string;
  status: "active" | "expired" | "disabled";
}

export function PromoCodeDialog({ isOpen, onClose, editData }: PromoCodeDialogProps) {
  const isEditing = !!editData;

  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(editData));

  const createMutation = useCreatePromoCodeMutation();
  const updateMutation = useUpdatePromoCodeMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error("يرجى إدخال كود الخصم");
      return;
    }
    if (!formData.value || Number(formData.value) <= 0) {
      toast.error("يرجى إدخال قيمة صحيحة");
      return;
    }
    if (!formData.expiryDate) {
      toast.error("يرجى تحديد تاريخ الانتهاء");
      return;
    }

    const payload: Record<string, unknown> = {
      code: formData.code.trim().toUpperCase(),
      type: formData.type,
      value: Number(formData.value),
      expiryDate: formData.expiryDate,
      status: formData.status,
    };

    if (formData.maxUsage) {
      payload.maxUsage = Number(formData.maxUsage);
    }

    try {
      if (isEditing && editData) {
        await updateMutation.mutateAsync({ id: editData.id, data: payload });
        toast.success("تم تحديث الكوبون بنجاح");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("تم إنشاء الكوبون بنجاح");
      }
      onClose();
    } catch {
      toast.error(
        isEditing ? "حدث خطأ أثناء تحديث الكوبون" : "حدث خطأ أثناء إنشاء الكوبون"
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
              <Ticket className="size-5" />
            </div>
            {isEditing ? "تعديل كوبون الخصم" : "إضافة كوبون جديد"}
          </DialogTitle>
          <DialogDescription className="text-right font-medium text-muted-foreground">
            {isEditing
              ? "قم بتعديل بيانات كوبون الخصم"
              : "أدخل بيانات كوبون الخصم الجديد"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-bold">
              كود الخصم
            </Label>
            <Input
              id="code"
              placeholder="مثال: SUMMER2024"
              value={formData.code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, code: e.target.value }))
              }
              className="h-12 rounded-2xl border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">نوع الخصم</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "percentage" | "fixed") =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="h-12 w-full rounded-2xl border-muted-foreground/10 bg-muted/30 transition-all focus:bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-muted-foreground/10">
                  <SelectItem value="percentage" className="rounded-xl">
                    خصم مئوي %
                  </SelectItem>
                  <SelectItem value="fixed" className="rounded-xl">
                    مبلغ ثابت ر.س
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value" className="text-sm font-bold">
                القيمة
              </Label>
              <Input
                id="value"
                type="number"
                min="0"
                step={formData.type === "percentage" ? "1" : "0.01"}
                placeholder={formData.type === "percentage" ? "مثال: 20" : "مثال: 50"}
                value={formData.value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, value: e.target.value }))
                }
                className="h-12 rounded-2xl border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxUsage" className="text-sm font-bold">
                الحد الأقصى للاستخدام
              </Label>
              <Input
                id="maxUsage"
                type="number"
                min="0"
                placeholder="اتركه فارغاً = بلا حد"
                value={formData.maxUsage}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, maxUsage: e.target.value }))
                }
                className="h-12 rounded-2xl border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="text-sm font-bold">
                تاريخ الانتهاء
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))
                }
                className="h-12 rounded-2xl border-muted-foreground/10 bg-muted/30 pr-4 ring-offset-background transition-all focus:bg-background"
                dir="ltr"
              />
            </div>
          </div>

          {isEditing && (
            <div className="space-y-2">
              <Label className="text-sm font-bold">الحالة</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "expired" | "disabled") =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="h-12 w-full rounded-2xl border-muted-foreground/10 bg-muted/30 transition-all focus:bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-muted-foreground/10">
                  <SelectItem value="active" className="rounded-xl">
                    نشط
                  </SelectItem>
                  <SelectItem value="expired" className="rounded-xl">
                    منتهي
                  </SelectItem>
                  <SelectItem value="disabled" className="rounded-xl">
                    معطل
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="flex-row-reverse gap-2 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 gap-2 rounded-2xl px-8 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              {isLoading
                ? "جاري الحفظ..."
                : isEditing
                  ? "تحديث الكوبون"
                  : "إنشاء الكوبون"}
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
