import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertProcessoItemSchema, type ProcessoDigitalWithRelations } from "@shared/schema";
import type { z } from "zod";

type InsertProcessoItem = z.infer<typeof insertProcessoItemSchema>;
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useCreateProcessoItem(processoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertProcessoItem) => {
      const res = await apiRequest("POST", `/api/processos/${processoId}/itens`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processos/:id", { id: processoId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/processos"] });
      toast({ title: "Item criado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar item", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateProcessoItem(processoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<InsertProcessoItem> & { id: string }) => {
      const res = await apiRequest("PUT", `/api/processo-itens/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processos/:id", { id: processoId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/processos"] });
      toast({ title: "Item atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar item", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteProcessoItem(processoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/processo-itens/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processos/:id", { id: processoId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/processos"] });
      toast({ title: "Item excluído com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir item", description: error.message, variant: "destructive" });
    },
  });
}

export function useSaveProcessoQuantidades(processoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quantidades: any[]) => {
      const res = await apiRequest("PUT", `/api/processos/${processoId}/quantidades`, { quantidades });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processos/:id", { id: processoId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/processos"] });
      toast({ title: "Orçamento planejado com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao planejar orçamento", description: error.message, variant: "destructive" });
    },
  });
}

export function useSaveProcessoCotacoes(processoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cotacoes: any[]) => {
      const res = await apiRequest("PUT", `/api/processos/${processoId}/cotacoes`, { cotacoes });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processos/:id", { id: processoId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/processos"] });
      toast({ title: "Cotações salvas com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar cotações", description: error.message, variant: "destructive" });
    },
  });
}

export function useSaveProcessoResultados(processoId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultados: any[]) => {
      const res = await apiRequest("PUT", `/api/processos/${processoId}/resultados`, { resultados });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processos/:id", { id: processoId }] });
      queryClient.invalidateQueries({ queryKey: ["/api/processos"] });
      toast({ title: "Resultados da licitação salvos com sucesso" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar resultados", description: error.message, variant: "destructive" });
    },
  });
}
