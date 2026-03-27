import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateDashboardQueries } from "@/lib/dashboard-cache";
import { api, buildUrl } from "@shared/routes";
import type { Fornecedor, InsertFornecedor } from "@shared/schema";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useFornecedores() {
  return useQuery<Fornecedor[]>({
    queryKey: [api.fornecedores.list.path],
    queryFn: async () => {
      const res = await fetch(api.fornecedores.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFornecedor) => {
      const res = await fetch(api.fornecedores.create.path, {
        method: api.fornecedores.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar fornecedor"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fornecedores.list.path] });
      invalidateDashboardQueries(queryClient);
    }
  });
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertFornecedor> & { id: string }) => {
      const url = buildUrl(api.fornecedores.update.path, { id });
      const res = await fetch(url, {
        method: api.fornecedores.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar fornecedor"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fornecedores.list.path] });
      invalidateDashboardQueries(queryClient);
    }
  });
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.fornecedores.delete.path, { id });
      const res = await fetch(url, {
        method: api.fornecedores.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir fornecedor"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fornecedores.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export type CnpjLookupResult = Omit<InsertFornecedor, "cnpj"> & { cnpj: string };

export function useLookupFornecedorCnpj() {
  return useMutation({
    mutationFn: async (cnpj: string): Promise<CnpjLookupResult> => {
      const url = buildUrl(api.fornecedores.lookupCnpj.path, { cnpj });
      const res = await fetch(url, {
        method: api.fornecedores.lookupCnpj.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao consultar CNPJ"));
      return res.json();
    },
  });
}
