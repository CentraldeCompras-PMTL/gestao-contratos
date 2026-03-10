import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertProcessoDigital, InsertFaseContratacao } from "@shared/schema";

export function useProcessos() {
  return useQuery({
    queryKey: [api.processos.list.path],
    queryFn: async () => {
      const res = await fetch(api.processos.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });
}

export function useProcesso(id: string) {
  return useQuery({
    queryKey: [api.processos.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.processos.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateProcesso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertProcessoDigital) => {
      const res = await fetch(api.processos.create.path, {
        method: api.processos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao criar processo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
    }
  });
}

export function useCreateFase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ processoId, ...data }: Omit<InsertFaseContratacao, 'processoDigitalId'> & { processoId: string }) => {
      const url = buildUrl(api.fases.create.path, { processoId });
      const res = await fetch(url, {
        method: api.fases.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao criar fase");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.processoId] });
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
    }
  });
}
