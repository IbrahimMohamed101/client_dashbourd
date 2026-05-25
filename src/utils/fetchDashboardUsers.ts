import api from "@/lib/apis";
import {
  dashboardStaffResetPasswordUrl,
  dashboardStaffUserUrl,
  dashboardStaffUsersUrl,
} from "@/utils/dashboardApiContract";
import type { UserRole } from "@/types/auth";

export interface DashboardStaffUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  passwordChangedAt?: string;
}

export interface DashboardStaffUserCreatePayload {
  email: string;
  role: UserRole;
  password: string;
  isActive?: boolean;
}

export interface DashboardStaffUserUpdatePayload {
  role?: UserRole;
  isActive?: boolean;
}

export const fetchDashboardStaffUsers = async (
  params: { page?: number; limit?: number } = {}
): Promise<unknown> => {
  const response = await api.get(dashboardStaffUsersUrl(params));
  return response.data;
};

export const createDashboardStaffUser = async (
  data: DashboardStaffUserCreatePayload
): Promise<unknown> => {
  const response = await api.post(dashboardStaffUsersUrl(), data);
  return response.data;
};

export const fetchDashboardStaffUser = async (
  id: string
): Promise<unknown> => {
  const response = await api.get(dashboardStaffUserUrl(id));
  return response.data;
};

export const updateDashboardStaffUser = async ({
  id,
  data,
}: {
  id: string;
  data: DashboardStaffUserUpdatePayload;
}): Promise<unknown> => {
  const response = await api.put(dashboardStaffUserUrl(id), data);
  return response.data;
};

export const deleteDashboardStaffUser = async (
  id: string
): Promise<unknown> => {
  const response = await api.delete(dashboardStaffUserUrl(id));
  return response.data;
};

export const resetDashboardStaffUserPassword = async ({
  id,
  password,
}: {
  id: string;
  password: string;
}): Promise<unknown> => {
  const response = await api.post(dashboardStaffResetPasswordUrl(id), {
    password,
  });
  return response.data;
};
