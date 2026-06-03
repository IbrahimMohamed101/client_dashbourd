import api from "@/lib/apis";

// ── §21 Upload Image ──
// POST /api/dashboard/uploads/image
// Content-Type: multipart/form-data
// Field: image

export interface UploadImageResponse {
  status: boolean;
  data: {
    imageUrl?: string;
    url?: string;
    secureUrl?: string;
    secure_url?: string;
    publicId?: string;
    resourceType?: string;
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

export const resolveUploadedImageUrl = (upload: UploadImageResponse): string => {
  const url =
    upload.data.imageUrl ||
    upload.data.secureUrl ||
    upload.data.secure_url ||
    upload.data.url ||
    "";

  if (!url) {
    throw new Error("Image upload response did not include an image URL");
  }

  return url;
};
