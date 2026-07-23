import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { login, logout, sessionQueryOptions } from "@/lib/authApi";
import { isUserRole, type LoginCredentials, type AuthResponse } from "@/types/auth";
import { useRouter } from "@tanstack/react-router";
import { ROLE_DEFAULTS } from "@/constants/routes";
import { ToastMessage } from "@/components/global/ToastMessage";
import Cookies from "js-cookie";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: session, isLoading, isError } = useQuery(sessionQueryOptions);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onSuccess: (data: AuthResponse) => {
      Cookies.set("dashboardToken", data.token, {
        expires: 7,
        secure: window.location.protocol === "https:",
        sameSite: "strict",
      });

      queryClient.setQueryData(sessionQueryOptions.queryKey, data);

      ToastMessage("تم تسجيل الدخول بنجاح", "success");

      // Read ?redirect= param, fall back to role's default route
      const search = router.state.location.search as { redirect?: string };
      const defaultRoute = isUserRole(data.user?.role)
        ? ROLE_DEFAULTS[data.user.role]
        : "/";
      const returnTo =
        search.redirect ?? defaultRoute;

      router.navigate({ to: returnTo });
    },
    onError: () => {
      ToastMessage("فشل تسجيل الدخول، تحقق من بياناتك", "error");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await logout();
      } catch {
        // Even if backend logout fails, clear local session
      }
      Cookies.remove("dashboardToken");
    },
    onSuccess: () => {
      queryClient.setQueryData(sessionQueryOptions.queryKey, undefined);
      queryClient.removeQueries({ queryKey: sessionQueryOptions.queryKey });

      ToastMessage("تم تسجيل الخروج بنجاح", "success");

      router.navigate({ to: "/" });
    },
    onError: () => {
      ToastMessage("حدث خطأ أثناء تسجيل الخروج", "error");
    },
  });

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading,
    isError,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
};
