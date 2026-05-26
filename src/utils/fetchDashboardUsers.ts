import api from "@/lib/apis";
import type {
  DashboardStaffResetPasswordResponse,
  DashboardStaffUserCreatePayload,
  DashboardStaffUserCreateResponse,
  DashboardStaffUserResponse,
  DashboardStaffUsersListResponse,
  DashboardStaffUserUpdatePayload,
} from "@/types/dashboardAdminTypes";
import {
  dashboardStaffResetPasswordUrl,
  dashboardStaffUserUrl,
  dashboardStaffUsersUrl,
} from "@/utils/dashboardApiContract";

export const fetchDashboardStaffUsers = async (
  params: { page?: number; limit?: number } = {}
): Promise<DashboardStaffUsersListResponse> => {
  const response = await api.get<DashboardStaffUsersListResponse>(
    dashboardStaffUsersUrl(params)
  );
  return response.data;
};

export const createDashboardStaffUser = async (
  data: DashboardStaffUserCreatePayload
): Promise<DashboardStaffUserCreateResponse> => {
  const response = await api.post<DashboardStaffUserCreateResponse>(
    dashboardStaffUsersUrl(),
    data
  );
  return response.data;
};

export const fetchDashboardStaffUser = async (
  id: string
): Promise<DashboardStaffUserResponse> => {
  const response = await api.get<DashboardStaffUserResponse>(
    dashboardStaffUserUrl(id)
  );
  return response.data;
};

export const updateDashboardStaffUser = async ({
  id,
  data,
}: {
  id: string;
  data: DashboardStaffUserUpdatePayload;
}): Promise<DashboardStaffUserResponse> => {
  const response = await api.put<DashboardStaffUserResponse>(
    dashboardStaffUserUrl(id),
    data
  );
  return response.data;
};

export const deleteDashboardStaffUser = async (
  id: string
): Promise<{ status: boolean }> => {
  const response = await api.delete(dashboardStaffUserUrl(id));
  return response.data;
};

export const resetDashboardStaffUserPassword = async ({
  id,
  password,
}: {
  id: string;
  password: string;
}): Promise<DashboardStaffResetPasswordResponse> => {
  const response = await api.post<DashboardStaffResetPasswordResponse>(
    dashboardStaffResetPasswordUrl(id),
    { password }
  );
  return response.data;
};
