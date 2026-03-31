import type { QueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

const dashboardQueryKeys = [
  [api.dashboard.stats.path],
  [api.contratos.list.path],
  [api.notificacoes.list.path],
  [api.departamentos.list.path],
  [api.entes.list.path],
  [api.fontesRecurso.list.path],
  [api.atasRegistroPreco.list.path],
  [api.ataContratos.list.path],
] as const;

export function invalidateDashboardQueries(queryClient: QueryClient) {
  dashboardQueryKeys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey: [...queryKey] });
  });
}
