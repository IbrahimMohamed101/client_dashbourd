import api from "@/lib/apis";

// ── §21 Upload Image ──
// POST /api/dashboard/uploads/image
// Content-Type: multipart/form-data
// Field: image

export interface UploadImageResponse {
  status: boolean;
  data: {
    url: string;
  };
}

export const fetchUploadImage = async (
  file: File
): Promise<UploadImageResponse> => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post("/api/dashboard/uploads/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
