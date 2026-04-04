import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { AfWithRelations, InsertAf } from "@shared/schema";
import { invalidateDashboardQueries } from "@/lib/dashboard-cache";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

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
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar AF"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.afs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path] });
      invalidateDashboardQueries(queryClient);
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
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao notificar empresa"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.afs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path] });
      invalidateDashboardQueries(queryClient);
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
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao registrar entrega"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.afs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path] });
      invalidateDashboardQueries(queryClient);
    }
  });
}

export function useAfs() {
  return useQuery<AfWithRelations[]>({
    queryKey: [api.afs.list.path],
    queryFn: async () => {
      const res = await fetch(api.afs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao consultar AFs"));
      return res.json();
    },
  });
}

export function useExtendAf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dataExtensao }: { id: string; dataExtensao: string }) => {
      const url = buildUrl(api.afs.extend.path, { id });
      const res = await fetch(url, {
        method: api.afs.extend.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataExtensao }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao prorrogar AF"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.afs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteAf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.afs.delete.path, { id });
      const res = await fetch(url, {
        method: api.afs.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir AF"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.afs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateAf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertAf> & { id: string }) => {
      const url = buildUrl(api.afs.update.path, { id });
      const res = await fetch(url, {
        method: api.afs.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar AF"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.afs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path] });
      invalidateDashboardQueries(queryClient);
    }
  });
}
