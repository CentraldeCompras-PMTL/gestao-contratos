import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { PublicUser } from "@shared/schema";
import { z } from "zod";

export function useAuth() {
  const queryClient = useQueryClient();

  async function readErrorMessage(res: Response, fallback: string) {
    try {
      const body = await res.json();
      return body.message ?? fallback;
    } catch {
      return fallback;
    }
  }

  const { data: user, isLoading, error } = useQuery<PublicUser | null>({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof api.auth.login.input>) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Credenciais invalidas");
        throw new Error(await readErrorMessage(res, "Erro ao fazer login"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: api.auth.logout.method, credentials: "include" });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
      window.location.href = "/login";
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(api.auth.forgotPassword.path, {
        method: api.auth.forgotPassword.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao solicitar recuperacao"));
      return res.json();
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof api.auth.resetPassword.input>) => {
      const res = await fetch(api.auth.resetPassword.path, {
        method: api.auth.resetPassword.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao redefinir senha"));
      return res.json();
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof api.auth.changePassword.input>) => {
      const res = await fetch(api.auth.changePassword.path, {
        method: api.auth.changePassword.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao alterar senha"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.setQueryData<PublicUser | null>([api.auth.me.path], (currentUser) =>
        currentUser
          ? {
              ...currentUser,
              forcePasswordChange: false,
            }
          : currentUser,
      );
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
    },
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation,
    forgotPassword: forgotPasswordMutation,
    resetPassword: resetPasswordMutation,
    changePassword: changePasswordMutation,
    logout: logoutMutation,
  };
}
