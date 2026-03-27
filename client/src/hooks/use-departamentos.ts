import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { invalidateDashboardQueries } from "@/lib/dashboard-cache";
import { api, buildUrl } from "@shared/routes";
import type { Departamento, InsertDepartamento } from "@shared/schema";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useDepartamentos() {
  return useQuery<Departamento[]>({
    queryKey: [api.departamentos.list.path],
    queryFn: async () => {
      const res = await fetch(api.departamentos.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch departamentos");
      return res.json();
    },
  });
}

export function useCreateDepartamento() {
  return useMutation({
    mutationFn: async (data: InsertDepartamento) => {
      const res = await fetch(api.departamentos.create.path, {
        method: api.departamentos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar departamento"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.departamentos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateDepartamento() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertDepartamento> }) => {
      const url = buildUrl(api.departamentos.update.path, { id });
      const res = await fetch(url, {
        method: api.departamentos.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar departamento"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.departamentos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteDepartamento() {
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.departamentos.delete.path, { id });
      const res = await fetch(url, {
        method: api.departamentos.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir departamento"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.departamentos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.processos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}
