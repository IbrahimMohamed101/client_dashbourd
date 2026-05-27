import api from "@/lib/apis";

export const fetchCreateAddon = async (payload: FormData): Promise<void> => {
  await api.post("/api/dashboard/addon-items", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
