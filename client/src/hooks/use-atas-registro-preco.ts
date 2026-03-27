import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  AtaRegistroPrecoWithRelations,
  InsertAtaItem,
} from "@shared/schema";
import { invalidateDashboardQueries } from "@/lib/dashboard-cache";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export type AtaFormPayload = {
  numeroAta: string;
  processoDigitalId: string;
  objeto: string;
  vigenciaInicial: string;
  vigenciaFinal: string;
  status: "planejamento" | "cotacao" | "licitada" | "vigente" | "encerrada";
  participanteEnteIds: string[];
  fornecedorIds: string[];
};

export function useAtasRegistroPreco(options?: { enabled?: boolean }) {
  return useQuery<AtaRegistroPrecoWithRelations[]>({
    queryKey: [api.atasRegistroPreco.list.path],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await fetch(api.atasRegistroPreco.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao carregar atas"));
      return res.json();
    },
  });
}

export function useCreateAtaRegistroPreco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: AtaFormPayload) => {
      const res = await fetch(api.atasRegistroPreco.create.path, {
        method: api.atasRegistroPreco.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar ata"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateAtaRegistroPreco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AtaFormPayload }) => {
      const url = buildUrl(api.atasRegistroPreco.update.path, { id });
      const res = await fetch(url, {
        method: api.atasRegistroPreco.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar ata"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteAtaRegistroPreco() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.atasRegistroPreco.delete.path, { id });
      const res = await fetch(url, {
        method: api.atasRegistroPreco.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir ata"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useCreateAtaItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ataId, data }: { ataId: string; data: InsertAtaItem }) => {
      const url = buildUrl(api.atasRegistroPreco.createItem.path, { id: ataId });
      const res = await fetch(url, {
        method: api.atasRegistroPreco.createItem.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar item"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useImportAtaItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ataId, items }: { ataId: string; items: InsertAtaItem[] }) => {
      const url = buildUrl(api.atasRegistroPreco.importItems.path, { id: ataId });
      const res = await fetch(url, {
        method: api.atasRegistroPreco.importItems.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao importar itens"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateAtaItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, data }: { itemId: string; data: Partial<InsertAtaItem> }) => {
      const url = buildUrl(api.atasRegistroPreco.updateItem.path, { itemId });
      const res = await fetch(url, {
        method: api.atasRegistroPreco.updateItem.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar item"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteAtaItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const url = buildUrl(api.atasRegistroPreco.deleteItem.path, { itemId });
      const res = await fetch(url, {
        method: api.atasRegistroPreco.deleteItem.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir item"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useSaveAtaQuantidades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ataId, quantidades }: { ataId: string; quantidades: Array<{ itemId: string; enteId: string; quantidade: string }> }) => {
      const url = buildUrl(api.atasRegistroPreco.saveQuantidades.path, { id: ataId });
      const res = await fetch(url, {
        method: api.atasRegistroPreco.saveQuantidades.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantidades }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao salvar quantidades"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useSaveAtaCotacoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ataId, cotacoes }: { ataId: string; cotacoes: Array<{ itemId: string; valorUnitarioCotado: string }> }) => {
      const url = buildUrl(api.atasRegistroPreco.saveCotacoes.path, { id: ataId });
      const res = await fetch(url, {
        method: api.atasRegistroPreco.saveCotacoes.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ cotacoes }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao salvar cotacoes"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useSaveAtaResultados() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ataId,
      resultados,
    }: {
      ataId: string;
      resultados: Array<{ itemId: string; fornecedorId: string | null; valorUnitarioLicitado: string | null; itemFracassado: boolean }>;
    }) => {
      const url = buildUrl(api.atasRegistroPreco.saveResultados.path, { id: ataId });
      const res = await fetch(url, {
        method: api.atasRegistroPreco.saveResultados.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resultados }),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao salvar resultados"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}
