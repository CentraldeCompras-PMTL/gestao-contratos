import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { DashboardStats } from "@shared/schema";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: [api.dashboard.stats.path],
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(api.dashboard.stats.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    }
  });
}
