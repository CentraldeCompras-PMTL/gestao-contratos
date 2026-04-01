import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { ContratoWithRelations, InsertContrato, InsertContratoAditivo, InsertContratoAnexo, InsertEmpenho } from "@shared/schema";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useContratos() {
  return useQuery<ContratoWithRelations[]>({
    queryKey: [api.contratos.list.path],
    queryFn: async () => {
      const res = await fetch(api.contratos.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });
}

export function useContratosFull() {
  return useQuery<ContratoWithRelations[]>({
    queryKey: [api.contratos.listFull.path],
    queryFn: async () => {
      const res = await fetch(api.contratos.listFull.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    }
  });
}

export function useContrato(id: string) {
  return useQuery<ContratoWithRelations>({
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
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar contrato"));
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
      const url = buildUrl(api.contratos.update.path, { id });
      const res = await fetch(url, {
        method: api.contratos.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar contrato"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.id] });
    }
  });
}

export function useCloseContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivoEncerramento }: { id: string; motivoEncerramento?: string }) => {
      const url = buildUrl(api.contratos.close.path, { id });
      const res = await fetch(url, {
        method: api.contratos.close.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivoEncerramento }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao encerrar contrato"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.id] });
      queryClient.invalidateQueries({ queryKey: [api.notasFiscais.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

export function useDeleteContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const url = buildUrl(api.contratos.delete.path, { id });
      const res = await fetch(url, {
        method: api.contratos.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir contrato"));
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, id] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
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
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar empenho"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.contratoId] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    }
  });
}

export function useDeleteEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, contratoId }: { id: string; contratoId: string }) => {
      const url = buildUrl(api.empenhos.delete.path, { id });
      const res = await fetch(url, {
        method: api.empenhos.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir empenho"));
      return { ...(await res.json()), contratoId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.contratoId] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

export function useAnnulEmpenho() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      contratoId,
      valorAnulado,
      dataAnulacao,
      motivoAnulacao,
    }: {
      id: string;
      contratoId: string;
      valorAnulado: string;
      dataAnulacao: string;
      motivoAnulacao: string;
    }) => {
      const url = buildUrl(api.empenhos.annul.path, { id });
      const res = await fetch(url, {
        method: api.empenhos.annul.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorAnulado, dataAnulacao, motivoAnulacao }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao anular empenho"));
      return { ...(await res.json()), contratoId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.contratoId] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
    },
  });
}

export function useCreateContratoAditivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratoId, ...data }: InsertContratoAditivo & { contratoId: string }) => {
      const url = buildUrl(api.contratos.createAditivo.path, { id: contratoId });
      const res = await fetch(url, {
        method: api.contratos.createAditivo.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar aditivo"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.contratoId] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    },
  });
}

export function useDeleteContratoAditivo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ aditivoId, contratoId }: { aditivoId: string; contratoId: string }) => {
      const url = buildUrl(api.contratos.deleteAditivo.path, { aditivoId });
      const res = await fetch(url, {
        method: api.contratos.deleteAditivo.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir aditivo"));
      return { ...(await res.json()), contratoId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.contratoId] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    },
  });
}

export function useCreateContratoAnexo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contratoId, ...data }: InsertContratoAnexo & { contratoId: string }) => {
      const url = buildUrl(api.contratos.createAnexo.path, { id: contratoId });
      const res = await fetch(url, {
        method: api.contratos.createAnexo.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar anexo"));
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.contratoId] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    },
  });
}

export function useDeleteContratoAnexo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ anexoId, contratoId }: { anexoId: string; contratoId: string }) => {
      const url = buildUrl(api.contratos.deleteAnexo.path, { anexoId });
      const res = await fetch(url, {
        method: api.contratos.deleteAnexo.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao excluir anexo"));
      return { ...(await res.json()), contratoId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.contratos.get.path, variables.contratoId] });
      queryClient.invalidateQueries({ queryKey: [api.contratos.list.path] });
    },
  });
}
