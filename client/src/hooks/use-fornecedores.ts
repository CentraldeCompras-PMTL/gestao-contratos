import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertFornecedor } from "@shared/schema";

export function useFornecedores() {
  return useQuery({
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
      if (!res.ok) throw new Error("Erro ao criar fornecedor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fornecedores.list.path] });
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
      if (!res.ok) throw new Error("Erro ao atualizar fornecedor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fornecedores.list.path] });
    }
  });
}
