import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useNotificacoes() {
  return useQuery({
    queryKey: [api.notificacoes.list.path],
    queryFn: async () => {
      const res = await fetch(api.notificacoes.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notificacoes");
      return res.json();
    }
  });
}
