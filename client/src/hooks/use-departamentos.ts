import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { api } from "@shared/routes";

export function useDepartamentos() {
  return useQuery({
    queryKey: [api.departamentos.list.path],
    queryFn: async () => {
      const res = await fetch(api.departamentos.list.path);
      if (!res.ok) throw new Error("Failed to fetch departamentos");
      return res.json();
    },
  });
}

export function useCreateDepartamento() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.departamentos.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create departamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.departamentos.list.path] });
    },
  });
}

export function useUpdateDepartamento() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/departamentos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update departamento");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.departamentos.list.path] });
    },
  });
}
