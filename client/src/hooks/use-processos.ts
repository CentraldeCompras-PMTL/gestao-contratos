import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateDashboardQueries } from "@/lib/dashboard-cache";
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
      invalidateDashboardQueries(queryClient);
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
      invalidateDashboardQueries(queryClient);
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
      invalidateDashboardQueries(queryClient);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fases.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useAddParticipante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enteId }: { id: string; enteId: string }) => {
      const url = buildUrl(api.processos.addParticipante.path, { id });
      const res = await fetch(url, {
        method: api.processos.addParticipante.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enteId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao adicionar participante"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.id] });
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
    },
  });
}

export function useRemoveParticipante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enteId }: { id: string; enteId: string }) => {
      const url = buildUrl(api.processos.removeParticipante.path, { id, enteId });
      const res = await fetch(url, {
        method: api.processos.removeParticipante.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao remover participante"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.id] });
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
    },
  });
}

export function useAddDotacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fichaOrcamentariaId, anoDotacao, valorEstimado }: { id: string; fichaOrcamentariaId: string; anoDotacao: string; valorEstimado?: string }) => {
      const url = buildUrl(api.processos.addDotacao.path, { id });
      const res = await fetch(url, {
        method: api.processos.addDotacao.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fichaOrcamentariaId, anoDotacao, valorEstimado }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao adicionar dotação"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.id] });
    },
  });
}

export function useRemoveDotacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dotacaoId }: { id: string; dotacaoId: string }) => {
      const url = buildUrl(api.processos.removeDotacao.path, { id, dotacaoId });
      const res = await fetch(url, {
        method: api.processos.removeDotacao.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao remover dotação"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.id] });
    },
  });
}

export function useCreateProcessoItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const url = buildUrl(api.processos.createItem.path, { id });
      const res = await fetch(url, {
        method: api.processos.createItem.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar item"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.id] });
    },
  });
}

export function useUpdateProcessoItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: any }) => {
      const url = buildUrl(api.processos.updateItem.path, { itemId });
      const res = await fetch(url, {
        method: api.processos.updateItem.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar item"));
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, data.processoId] });
    },
  });
}

export function useDeleteProcessoItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, itemId }: { id: string; itemId: string }) => {
      const url = buildUrl(api.processos.deleteItem.path, { itemId });
      const res = await fetch(url, {
        method: api.processos.deleteItem.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir item"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.id] });
    },
  });
}

export function useSaveProcessoQuantidades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantidades }: { id: string; quantidades: { itemId: string; enteId: string; quantidade: string }[] }) => {
      const url = buildUrl(api.processos.saveQuantidades.path, { id });
      const res = await fetch(url, {
        method: api.processos.saveQuantidades.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantidades }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao salvar quantidades"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.id] });
    },
  });
}

export function useSaveProcessoCotacoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cotacoes }: { id: string; cotacoes: any[] }) => {
      const url = buildUrl(api.processos.saveCotacoes.path, { id });
      const res = await fetch(url, {
        method: api.processos.saveCotacoes.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cotacoes }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao salvar cotações"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.id] });
    },
  });
}

export function useSaveProcessoResultados() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, resultados }: { id: string; resultados: any[] }) => {
      const url = buildUrl(api.processos.saveResultados.path, { id });
      const res = await fetch(url, {
        method: api.processos.saveResultados.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultados }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao salvar resultados"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.processos.get.path, variables.id] });
    },
  });
}
