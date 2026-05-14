import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchUploadImage } from "@/utils/fetchUploadImage";

// ── §21 Image Upload Mutation ──
// Returns the uploaded image URL on success.

export const useUploadImageMutation = () =>
  useMutation({
    mutationFn: (file: File) => fetchUploadImage(file),
    onSuccess: () => {
      toast.success("تم رفع الصورة بنجاح");
    },
    onError: (err: Error & { response?: { data?: { message?: string } } }) => {
      toast.error(
        err?.response?.data?.message || "حدث خطأ أثناء رفع الصورة"
      );
    },
  });
