import { useEffect, useState } from "react";
import { toast } from "sonner";

import api from "@/lib/apis";
import { resolveUploadedImageUrl, fetchUploadImage } from "@/utils/fetchUploadImage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AppAdSettings = {
  imageUrl: string;
  linkUrl: string | null;
  altText: string;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function AppAdEditor() {
  const [settings, setSettings] = useState<AppAdSettings | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    api
      .get("/api/admin/content/app-ad")
      .then((response) => {
        const content = response.data?.data?.content;
        if (!mounted) return;
        setSettings({
          imageUrl: String(content?.imageUrl || ""),
          linkUrl: content?.linkUrl ? String(content.linkUrl) : null,
          altText: String(content?.altText || "إعلان BasicDiet"),
        });
      })
      .catch(() => {
        if (mounted) {
          toast.error("تعذر تحميل إعلان التطبيق");
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast.error("اختر صورة بصيغة JPG أو PNG أو WebP");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("حجم الصورة يجب ألا يتجاوز 5 ميجابايت");
      return;
    }
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!settings || !selectedFile) return;

    setIsSaving(true);
    try {
      const upload = await fetchUploadImage(selectedFile);
      const imageUrl = resolveUploadedImageUrl(upload);

      await api.put("/api/admin/content/app-ad", {
        title: "إعلان التطبيق",
        locale: "ar",
        content: {
          imageUrl,
          linkUrl: settings.linkUrl,
          altText: settings.altText || "إعلان BasicDiet",
        },
      });

      setSettings((current) => current ? { ...current, imageUrl } : current);
      setSelectedFile(null);
      toast.success("تم تحديث صورة التطبيق");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "تعذر تحديث صورة التطبيق");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-sm" dir="rtl">
      <CardHeader>
        <CardTitle>إعلان التطبيق عند الفتح</CardTitle>
        <CardDescription>
          غيّر الصورة التي تظهر للعملاء عند فتح تطبيق Basic Diet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">جارٍ تحميل الإعلان…</p>
        ) : settings?.imageUrl ? (
          <img
            src={previewUrl || settings.imageUrl}
            alt={settings.altText}
            className="max-h-[420px] w-full rounded-xl border object-contain"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            لا توجد صورة إعلان مهيأة حاليًا.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted">
            {selectedFile ? "اختيار صورة أخرى" : "اختيار صورة جديدة"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {\n                handleFileChange(event.currentTarget.files?.[0]);\n                event.currentTarget.value = "";\n              }}
            />
          </label>
          {selectedFile ? (
            <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
          ) : null}
          <button
            type="button"
            onClick={handleSave}
            disabled={!settings || !selectedFile || isLoading || isSaving}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "جارٍ الرفع والحفظ…" : "حفظ صورة التطبيق"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
