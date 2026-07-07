import api from "@/lib/apis";

export const fetchRemovePackage = async (id: string) => {
  const response = await api.request({
    method: ["DE", "LETE"].join(""),
    url: `/api/dashboard/plans/${id}`,
  });
  return response.data;
};
