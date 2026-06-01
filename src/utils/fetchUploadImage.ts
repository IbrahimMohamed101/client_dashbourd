import api from "@/lib/apis";

// ── §21 Upload Image ──
// POST /api/dashboard/uploads/image
// Content-Type: multipart/form-data
// Field: image

export interface UploadImageResponse {
  status: boolean;
  data: {
    url: string;
    secureUrl: string;
    publicId: string;
    resourceType: string;
  };
}

export const createImageUploadFormData = (file: File): FormData => {
  if (!(file instanceof File)) {
    throw new Error("Invalid file object");
  }

  const formData = new FormData();
  formData.append("image", file);
  return formData;
};

export const fetchUploadImage = async (
  file: File
): Promise<UploadImageResponse> => {
  const formData = createImageUploadFormData(file);

  const response = await api.post("/api/dashboard/uploads/image", formData);
  return response.data;
};
