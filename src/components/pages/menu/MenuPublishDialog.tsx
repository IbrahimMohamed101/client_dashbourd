import { useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

import { usePublishMenuMutation } from "@/hooks/useMenuQuery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { MenuPublishResult } from "@/types/menuTypes";

export function MenuPublishDialog() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<MenuPublishResult | null>(null);
  const mutation = usePublishMenuMutation();

  const handlePublish = async () => {
    setResult(null);
    const res = await mutation.mutateAsync(notes || undefined);
    setResult(res.data);
    setNotes("");
  };

  const formatDate = (date: string) => {
    try {
      return new Intl.DateTimeFormat("ar-SA", {
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date(date));
    } catch {
      return date;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="size-4" />
          نشر القائمة
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>نشر القائمة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!result ? (
            <>
              <p className="text-sm text-muted-foreground">
                سيتم نشر القائمة الحالية للمستخدمين. تأكد من تشغيل التحقق أولا.
              </p>
              <Textarea
                placeholder="ملاحظات النشر (اختياري)..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="resize-none"
                rows={3}
              />
              <Button
                onClick={handlePublish}
                disabled={mutation.isPending}
                className="w-full gap-2"
              >
                {mutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                {mutation.isPending ? "جار النشر..." : "نشر الآن"}
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <span className="font-semibold">تم النشر بنجاح</span>
              </div>
              <div className="space-y-2 rounded-lg border p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span>رقم النسخة:</span>
                  <span className="font-mono font-semibold">
                    {result.versionId}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>الحالة:</span>
                  <span className="font-semibold">{result.status}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>تاريخ النشر:</span>
                  <span>{formatDate(result.publishedAt)}</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="w-full"
              >
                إغلاق
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
