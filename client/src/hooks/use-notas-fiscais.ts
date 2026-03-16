import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import type { InsertNotaFiscal, NotaFiscalWithRelations } from "@shared/schema";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useNotasFiscais() {
  return useQuery<NotaFiscalWithRelations[]>({
    queryKey: [api.notasFiscais.list.path],
    queryFn: async () => {
      const res = await fetch(api.notasFiscais.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch notas");
      return res.json();
    },
  });
}

export function useCreateNotaFiscal() {
  return useMutation({
    mutationFn: async (data: InsertNotaFiscal) => {
      const res = await fetch(api.notasFiscais.create.path, {
        method: api.notasFiscais.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar nota fiscal"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notasFiscais.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    },
  });
}

export function useUpdateNotaFiscalPagamento() {
  return useMutation({
    mutationFn: async ({ id, statusPagamento, dataPagamento }: { id: string; statusPagamento: "pendente" | "pago"; dataPagamento?: string }) => {
      const url = buildUrl(api.notasFiscais.paymentStatus.path, { id });
      const res = await fetch(url, {
        method: api.notasFiscais.paymentStatus.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusPagamento, dataPagamento }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar nota fiscal"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notasFiscais.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    },
  });
}

export function useDeleteNotaFiscal() {
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.notasFiscais.delete.path, { id });
      const res = await fetch(url, {
        method: api.notasFiscais.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir nota fiscal"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notasFiscais.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}
