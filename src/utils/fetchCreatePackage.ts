import api from "@/lib/apis";

export const fetchCreatePackage = async (data: unknown) => {
  const response = await api.post("/api/dashboard/plans", data);
  return response.data;
};
