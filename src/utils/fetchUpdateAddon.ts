import api from "@/lib/apis";

export const fetchUpdateAddon = async (
  id: string,
  payload: FormData
): Promise<void> => {
  await api.put(`/api/dashboard/addon-items/${id}`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
