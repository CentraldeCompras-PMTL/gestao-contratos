import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertProcessoDigital, InsertFaseContratacao, ProcessoDigitalWithRelations } from "@shared/schema";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useProcessos() {
  return useQuery<ProcessoDigitalWithRelations[]>({
    queryKey: [api.processos.list.path],
    queryFn: async () => {
      const res = await fetch(api.processos.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });
}

export function useProcesso(id: string) {
  return useQuery<ProcessoDigitalWithRelations>({
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
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar processo"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
    }
  });
}

export function useUpdateProcesso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProcessoDigital> }) => {
      const url = buildUrl(api.processos.update.path, { id });
      const res = await fetch(url, {
        method: api.processos.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar processo"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
    }
  });
}

export function useDeleteProcesso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.processos.delete.path, { id });
      const res = await fetch(url, {
        method: api.processos.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir processo"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
    },
  });
}

export function useCreateFase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ processoId, ...data }: Omit<InsertFaseContratacao, 'processoDigitalId'> & { processoId: string }) => {
      const url = api.fases.create.path;
      const res = await fetch(url, {
        method: api.fases.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, processoDigitalId: processoId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar fase"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.processoId] });
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
    }
  });
}
