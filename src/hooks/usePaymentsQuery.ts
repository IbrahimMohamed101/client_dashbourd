import { queryOptions, useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchPaymentsList, fetchPaymentDetails } from "@/utils/fetchPaymentsData";

export const paymentsListQueryOptions = (
  page: number = 1,
  limit: number = 20,
  status: string = "",
  type: string = "",
  q: string = ""
) =>
  queryOptions({
    queryKey: ["payments-list", { page, limit, status, type, q }],
    queryFn: () => fetchPaymentsList({ page, limit, status, type, q }),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
  });

export const usePaymentsListQuery = (
  page: number = 1,
  limit: number = 20,
  status: string = "",
  type: string = "",
  q: string = ""
) => {
  return useQuery(paymentsListQueryOptions(page, limit, status, type, q));
};

export const paymentDetailsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["payment-details", id],
    queryFn: () => fetchPaymentDetails(id),
    staleTime: 1000 * 60 * 5,
  });

export const usePaymentDetailsQuery = (id: string) => {
  return useQuery(paymentDetailsQueryOptions(id));
};
