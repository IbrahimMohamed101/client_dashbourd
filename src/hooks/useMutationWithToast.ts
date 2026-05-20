import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ApiError extends Error {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export interface UseMutationWithToastOptions<TData, TError, TVariables, TContext> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string | ((error: TError, variables: TVariables) => string);
  invalidateKeys?: string[][];
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void | Promise<unknown>;
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void | Promise<unknown>;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => void | Promise<unknown>;
}

export function useMutationWithToast<TData = unknown, TError = ApiError, TVariables = void, TContext = unknown>(
  options: UseMutationWithToastOptions<TData, TError, TVariables, TContext>
) {
  const queryClient = useQueryClient();

  const {
    mutationFn,
    successMessage,
    errorMessage = "حدث خطأ أثناء تنفيذ العملية",
    invalidateKeys = [],
    onSuccess: userOnSuccess,
    onError: userOnError,
    onSettled: userOnSettled,
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    onSuccess: (data, variables, context) => {
      const msg = typeof successMessage === "function"
        ? successMessage(data, variables)
        : successMessage;
      toast.success(msg);

      // Invalidate all specified query keys
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      if (userOnSuccess) {
        userOnSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      const err = error as ApiError;
      const msg = typeof errorMessage === "function"
        ? errorMessage(error, variables)
        : err?.response?.data?.message || errorMessage;
      toast.error(msg);

      if (userOnError) {
        userOnError(error, variables, context);
      }
    },
    onSettled: userOnSettled,
  });
}
