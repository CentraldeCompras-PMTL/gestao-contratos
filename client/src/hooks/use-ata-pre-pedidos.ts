import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { AtaEmpenhoWithRelations, AtaPrePedidoDisponivel, AtaPrePedidoWithRelations } from "@shared/schema";
import { invalidateDashboardQueries } from "@/lib/dashboard-cache";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useAtaPrePedidosDisponiveis() {
  return useQuery<AtaPrePedidoDisponivel[]>({
    queryKey: [api.ataPrePedidos.disponiveis.path],
    queryFn: async () => {
      const res = await fetch(api.ataPrePedidos.disponiveis.path, { credentials: "include" });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao carregar saldos da ARP"));
      return res.json();
    },
  });
}

export function useAtaPrePedidos() {
  return useQuery<AtaPrePedidoWithRelations[]>({
    queryKey: [api.ataPrePedidos.list.path],
    queryFn: async () => {
      const res = await fetch(api.ataPrePedidos.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao carregar pre-pedidos"));
      return res.json();
    },
  });
}

export function useCreateAtaPrePedidos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      ataId: string;
      enteId: string;
      pedidos: Array<{
        itemId: string;
        fonteRecursoId: string;
        fichaId: string;
        quantidadeSolicitada: string;
        observacao?: string | null;
      }>;
    }) => {
      const res = await fetch(api.ataPrePedidos.createBatch.path, {
        method: api.ataPrePedidos.createBatch.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar pre-pedidos"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.disponiveis.path] });
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.atasRegistroPreco.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateAtaPrePedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        fonteRecursoId: string;
        fichaId: string;
        quantidadeSolicitada: string;
        observacao?: string | null;
        status: "aberto" | "concluido";
      };
    }) => {
      const url = buildUrl(api.ataPrePedidos.update.path, { id });
      const res = await fetch(url, {
        method: api.ataPrePedidos.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar pre-pedido"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.disponiveis.path] });
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useDeleteAtaPrePedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.ataPrePedidos.delete.path, { id });
      const res = await fetch(url, {
        method: api.ataPrePedidos.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir pre-pedido"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.disponiveis.path] });
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useCreateAtaPrePedidoEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        dataEmpenho: string;
        numeroEmpenho: string;
        quantidadeEmpenhada: string;
        valorEmpenho: string;
      };
    }): Promise<AtaEmpenhoWithRelations> => {
      const url = buildUrl(api.ataPrePedidos.createEmpenho.path, { id });
      const res = await fetch(url, {
        method: api.ataPrePedidos.createEmpenho.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar empenho direto da ARP"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.disponiveis.path] });
      queryClient.invalidateQueries({ queryKey: [api.ataContratos.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}
