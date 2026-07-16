import { queryOptions, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAdminCustomer,
  fetchAllAdminCustomers,
  fetchUserDetails,
  fetchUserSubscriptions,
  fetchUsersList,
  resetAdminCustomerPassword,
  updateUser,
} from "@/utils/fetchUsersData";
import type {
  CreateAdminCustomerPayload,
  ResetAdminCustomerPasswordPayload,
} from "@/types/userTypes";

export const usersQueryOptions = (page: number, limit: number) =>
  queryOptions({
    queryKey: ["users", "list", page, limit],
    queryFn: ({ signal }) => fetchUsersList({ page, limit, signal }),
  });

export const allUsersQueryOptions = () =>
  queryOptions({
    queryKey: ["users", "all"],
    queryFn: ({ signal }) => fetchAllAdminCustomers({ signal }),
    staleTime: 1000 * 60 * 5,
  });

export const filteredUsersCatalogQueryOptions = () =>
  queryOptions({
    queryKey: ["users", "filtered-catalog"],
    queryFn: ({ signal }) => fetchAllAdminCustomers({ signal }),
    staleTime: 1000 * 60 * 2,
  });

export const useUsersListQuery = (
  page: number,
  limit: number,
  enabled = true
) => {
  return useQuery({
    ...usersQueryOptions(page, limit),
    enabled,
  });
};

export const useFilteredUsersCatalogQuery = (enabled: boolean) =>
  useQuery({
    ...filteredUsersCatalogQueryOptions(),
    enabled,
  });

export const useAllUsersQuery = () => {
  return useQuery(allUsersQueryOptions());
};

export const userDetailsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["user-details", userId],
    queryFn: () => fetchUserDetails(userId),
    staleTime: 1000 * 60 * 5,
  });

export const useUserDetailsQuery = (userId: string) => {
  return useQuery(userDetailsQueryOptions(userId));
};

export const userSubscriptionsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["user-subscriptions", userId],
    queryFn: () => fetchUserSubscriptions(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });

export const useUserSubscriptionsQuery = (userId: string) =>
  useQuery(userSubscriptionsQueryOptions(userId));

export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useCreateAdminCustomerMutation = () => {
  return useMutation({
    mutationFn: (payload: CreateAdminCustomerPayload) =>
      createAdminCustomer(payload),
    retry: false,
    gcTime: 0,
  });
};

export const useResetAdminCustomerPasswordMutation = () => {
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: ResetAdminCustomerPasswordPayload;
    }) => resetAdminCustomerPassword({ userId, payload }),
    retry: false,
    gcTime: 0,
  });
};
