import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { AuditLogResponse } from "@shared/schema";

export function useAuditLogs(enabled: boolean) {
  return useQuery<AuditLogResponse[]>({
    queryKey: [api.auditLogs.list.path],
    queryFn: async () => {
      const res = await fetch(api.auditLogs.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao consultar auditoria");
      return res.json();
    },
    enabled,
  });
}
