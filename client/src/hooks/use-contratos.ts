import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertContrato, InsertEmpenho } from "@shared/schema";

export function useContratos() {
  return useQuery({
    queryKey: [api.contratos.list.path],
    queryFn: async () => {
      const res = await fetch(api.contratos.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });
}

export function useContrato(id: string) {
  return useQuery({
    queryKey: [api.contratos.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.contratos.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertContrato) => {
      const res = await fetch(api.contratos.create.path, {
        method: api.contratos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao criar contrato");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    }
  });
}

export function useUpdateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertContrato> }) => {
      const res = await fetch(`${api.contratos.list.path}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao atualizar contrato");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    }
  });
}

export function useCreateEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratoId, ...data }: Omit<InsertEmpenho, 'contratoId'> & { contratoId: string }) => {
      const url = buildUrl(api.empenhos.create.path, { contratoId });
      const res = await fetch(url, {
        method: api.empenhos.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Erro ao criar empenho");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.contratoId] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    }
  });
}
