import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";

export function useFases() {
  return useQuery({
    queryKey: [api.fases.list.path],
    queryFn: async () => {
      const res = await fetch(api.fases.list.path);
      if (!res.ok) throw new Error("Failed to fetch fases");
      return res.json();
    },
  });
}

export function useFase(id: string) {
  return useQuery({
    queryKey: [api.fases.get.path, id],
    queryFn: async () => {
      const res = await fetch(`/api/fases/${id}`);
      if (!res.ok) throw new Error("Failed to fetch fase");
      return res.json();
    },
  });
}

export function useCreateFase() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.fases.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create fase");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fases.list.path] });
    },
  });
}

export function useUpdateFase() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/fases/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update fase");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.fases.list.path] });
    },
  });
}
