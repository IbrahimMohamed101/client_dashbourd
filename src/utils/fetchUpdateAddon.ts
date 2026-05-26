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

/** PATCH /api/dashboard/addon-items/:id/toggle */
export const toggleAddonItem = async (id: string): Promise<unknown> => {
  const response = await api.patch(`/api/dashboard/addon-items/${id}/toggle`);
  return response.data;
};
