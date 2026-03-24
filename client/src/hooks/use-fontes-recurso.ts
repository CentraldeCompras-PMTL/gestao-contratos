import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { FonteRecursoWithFichas, InsertFichaOrcamentaria, InsertFonteRecurso } from "@shared/schema";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useFontesRecurso() {
  return useQuery<FonteRecursoWithFichas[]>({
    queryKey: [api.fontesRecurso.list.path],
    queryFn: async () => {
      const res = await fetch(api.fontesRecurso.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao carregar fontes de recurso"));
      return res.json();
    },
  });
}

export function useCreateFonteRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFonteRecurso) => {
      const res = await fetch(api.fontesRecurso.create.path, {
        method: api.fontesRecurso.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar fonte de recurso"));
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.fontesRecurso.list.path] }),
  });
}

export function useUpdateFonteRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertFonteRecurso> }) => {
      const url = buildUrl(api.fontesRecurso.update.path, { id });
      const res = await fetch(url, {
        method: api.fontesRecurso.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar fonte de recurso"));
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.fontesRecurso.list.path] }),
  });
}

export function useDeleteFonteRecurso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.fontesRecurso.delete.path, { id });
      const res = await fetch(url, {
        method: api.fontesRecurso.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir fonte de recurso"));
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.fontesRecurso.list.path] }),
  });
}

export function useCreateFicha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ fonteRecursoId, data }: { fonteRecursoId: string; data: Omit<InsertFichaOrcamentaria, "fonteRecursoId"> }) => {
      const url = buildUrl(api.fontesRecurso.createFicha.path, { fonteRecursoId });
      const res = await fetch(url, {
        method: api.fontesRecurso.createFicha.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar ficha"));
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.fontesRecurso.list.path] }),
  });
}

export function useUpdateFicha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Omit<InsertFichaOrcamentaria, "fonteRecursoId">> }) => {
      const url = buildUrl(api.fontesRecurso.updateFicha.path, { id });
      const res = await fetch(url, {
        method: api.fontesRecurso.updateFicha.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar ficha"));
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.fontesRecurso.list.path] }),
  });
}

export function useDeleteFicha() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.fontesRecurso.deleteFicha.path, { id });
      const res = await fetch(url, {
        method: api.fontesRecurso.deleteFicha.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir ficha"));
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.fontesRecurso.list.path] }),
  });
}
