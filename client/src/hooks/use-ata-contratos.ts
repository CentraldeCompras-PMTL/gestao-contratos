import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { AtaContratoWithRelations, AtaEmpenhoWithRelations } from "@shared/schema";
import { invalidateDashboardQueries } from "@/lib/dashboard-cache";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useAtaContratos(options?: { enabled?: boolean }) {
  return useQuery<AtaContratoWithRelations[]>({
    queryKey: [api.ataContratos.list.path],
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const res = await fetch(api.ataContratos.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao carregar contratos da ARP"));
      return res.json();
    },
  });
}

export function useCreateAtaContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      ataId: string;
      numeroContrato: string;
      objeto: string;
      vigenciaInicial: string;
      vigenciaFinal: string;
      prePedidoIds: string[];
    }) => {
      const res = await fetch(api.ataContratos.create.path, {
        method: api.ataContratos.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar contrato da ARP"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.ataPrePedidos.disponiveis.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useCreateAtaEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ataContratoId,
      data,
    }: {
      ataContratoId: string;
      data: {
        ataPrePedidoId: string;
        dataEmpenho: string;
        numeroEmpenho: string;
        quantidadeEmpenhada: string;
        valorEmpenho: string;
      };
    }): Promise<AtaEmpenhoWithRelations> => {
      const url = buildUrl(api.ataContratos.createEmpenho.path, { id: ataContratoId });
      const res = await fetch(url, {
        method: api.ataContratos.createEmpenho.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar empenho da ARP"));
      return res.json();
    },
    onSuccess: () => {
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useCreateAtaAf() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ataEmpenhoId,
      data,
    }: {
      ataEmpenhoId: string;
      data: {
        dataPedidoAf: string;
        quantidadeAf: string;
        valorAf: string;
        dataEstimadaEntrega?: string;
      };
    }) => {
      const url = buildUrl(api.ataContratos.createAf.path, { id: ataEmpenhoId });
      const res = await fetch(url, {
        method: api.ataContratos.createAf.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar AF da ARP"));
      return res.json();
    },
    onSuccess: () => {
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useCreateAtaNotaFiscal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ataAfId,
      data,
    }: {
      ataAfId: string;
      data: {
        numeroNota: string;
        quantidadeNota: string;
        valorNota: string;
        dataNota: string;
      };
    }) => {
      const url = buildUrl(api.ataNotasFiscais.create.path, { id: ataAfId });
      const res = await fetch(url, {
        method: api.ataNotasFiscais.create.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar nota fiscal da ARP"));
      return res.json();
    },
    onSuccess: () => {
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useSendAtaNotaFiscalToPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ataNotaFiscalId,
      data,
    }: {
      ataNotaFiscalId: string;
      data: {
        numeroProcessoPagamento: string;
        dataEnvioPagamento: string;
      };
    }) => {
      const url = buildUrl(api.ataNotasFiscais.sendToPayment.path, { id: ataNotaFiscalId });
      const res = await fetch(url, {
        method: api.ataNotasFiscais.sendToPayment.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao enviar nota da ARP para pagamento"));
      return res.json();
    },
    onSuccess: () => {
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useRegisterAtaNotaFiscalPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ataNotaFiscalId,
      data,
    }: {
      ataNotaFiscalId: string;
      data: {
        dataPagamento: string;
      };
    }) => {
      const url = buildUrl(api.ataNotasFiscais.registerPayment.path, { id: ataNotaFiscalId });
      const res = await fetch(url, {
        method: api.ataNotasFiscais.registerPayment.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao registrar pagamento da nota da ARP"));
      return res.json();
    },
    onSuccess: () => {
      invalidateDashboardQueries(queryClient);
    },
  });
}
