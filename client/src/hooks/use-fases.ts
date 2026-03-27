import { useQuery, useMutation } from "@tanstack/react-query";
import { invalidateDashboardQueries } from "@/lib/dashboard-cache";
import { queryClient } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import type { FaseContratacaoWithRelations, InsertFaseContratacao } from "@shared/schema";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useFases() {
  return useQuery<FaseContratacaoWithRelations[]>({
    queryKey: [api.fases.list.path],
    queryFn: async () => {
      const res = await fetch(api.fases.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fases");
      return res.json();
    },
  });
}

export function useFase(id: string) {
  return useQuery<FaseContratacaoWithRelations>({
    queryKey: [api.fases.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.fases.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch fase");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateFase() {
  return useMutation({
    mutationFn: async (data: InsertFaseContratacao) => {
      const res = await fetch(api.fases.create.path, {
        method: api.fases.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar fase"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateFase() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertFaseContratacao> }) => {
      const url = buildUrl(api.fases.update.path, { id });
      const res = await fetch(url, {
        method: api.fases.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar fase"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteFase() {
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.fases.delete.path, { id });
      const res = await fetch(url, {
        method: api.fases.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir fase"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}
