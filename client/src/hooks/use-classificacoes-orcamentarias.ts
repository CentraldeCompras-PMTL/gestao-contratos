import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import type { ClassificacaoOrcamentaria, InsertClassificacao } from "@shared/schema";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useClassificacoesOrcamentarias() {
  return useQuery<ClassificacaoOrcamentaria[]>({
    queryKey: [api.classificacoesOrcamentarias.list.path],
    queryFn: async () => {
      const res = await fetch(api.classificacoesOrcamentarias.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch classificações");
      return res.json();
    },
  });
}

export function useCreateClassificacaoOrcamentaria() {
  return useMutation({
    mutationFn: async (data: InsertClassificacao) => {
      const res = await fetch(api.classificacoesOrcamentarias.create.path, {
        method: api.classificacoesOrcamentarias.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar classificação"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classificacoesOrcamentarias.list.path] });
    },
  });
}

export function useUpdateClassificacaoOrcamentaria() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertClassificacao> }) => {
      const url = buildUrl(api.classificacoesOrcamentarias.update.path, { id });
      const res = await fetch(url, {
        method: api.classificacoesOrcamentarias.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar classificação"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classificacoesOrcamentarias.list.path] });
    },
  });
}

export function useDeleteClassificacaoOrcamentaria() {
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.classificacoesOrcamentarias.delete.path, { id });
      const res = await fetch(url, {
        method: api.classificacoesOrcamentarias.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir classificação"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.classificacoesOrcamentarias.list.path] });
    },
  });
}
