import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertAf } from "@shared/schema";

export function useCreateAf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ empenhoId, ...data }: Omit<InsertAf, 'empenhoId'> & { empenhoId: string }) => {
      const url = buildUrl(api.afs.create.path, { empenhoId });
      const res = await fetch(url, {
        method: api.afs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao criar AF");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    }
  });
}

export function useNotifyAf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.afs.notify.path, { id });
      const res = await fetch(url, {
        method: api.afs.notify.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao notificar empresa");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notificacoes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path] });
    }
  });
}

export function useUpdateEntregaAf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dataEntregaReal }: { id: string; dataEntregaReal: string }) => {
      const url = buildUrl(api.afs.updateEntrega.path, { id });
      const res = await fetch(url, {
        method: api.afs.updateEntrega.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataEntregaReal }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao registrar entrega");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notificacoes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path] });
    }
  });
}
