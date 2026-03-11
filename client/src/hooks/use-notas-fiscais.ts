import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";

export function useNotasFiscais() {
  return useQuery({
    queryKey: [api.notasFiscais.list.path],
    queryFn: async () => {
      const res = await fetch(api.notasFiscais.list.path);
      if (!res.ok) throw new Error("Failed to fetch notas");
      return res.json();
    },
  });
}

export function useCreateNotaFiscal() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.notasFiscais.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create nota");
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
    mutationFn: async ({ id, statusPagamento, dataPagamento }: { id: string; statusPagamento: string; dataPagamento?: string }) => {
      const res = await fetch(`/api/notas-fiscais/${id}/pagamento`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusPagamento, dataPagamento }),
      });
      if (!res.ok) throw new Error("Failed to update nota");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.notasFiscais.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    },
  });
}
