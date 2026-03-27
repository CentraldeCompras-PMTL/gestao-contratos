import { useMutation, useQuery } from "@tanstack/react-query";
import { invalidateDashboardQueries } from "@/lib/dashboard-cache";
import { queryClient } from "@/lib/queryClient";
import { api, buildUrl } from "@shared/routes";
import type { Ente, InsertEnte } from "@shared/schema";

async function readErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function useEntes() {
  return useQuery<Ente[]>({
    queryKey: [api.entes.list.path],
    queryFn: async () => {
      const res = await fetch(api.entes.list.path, { credentials: "include" });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao consultar entes"));
      return res.json();
    },
  });
}

export function useCreateEnte() {
  return useMutation({
    mutationFn: async (data: InsertEnte) => {
      const res = await fetch(api.entes.create.path, {
        method: api.entes.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao criar ente"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.entes.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}

export function useUpdateEnte() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertEnte> }) => {
      const url = buildUrl(api.entes.update.path, { id });
      const res = await fetch(url, {
        method: api.entes.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, "Erro ao atualizar ente"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.entes.list.path] });
      invalidateDashboardQueries(queryClient);
    },
  });
}
