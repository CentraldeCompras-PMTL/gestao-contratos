import { useDashboardStats } from "@/hooks/use-dashboard";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificacoes } from "@/hooks/use-notificacoes";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: notificacoes, isLoading: notifLoading } = useNotificacoes();

  if (statsLoading || notifLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Contratos Ativos",
      value: stats?.totalContratos || 0,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      title: "Valor Total Contratado",
      value: formatCurrency(stats?.valorTotalContratado || 0),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30"
    },
    {
      title: "AFs Pendentes",
      value: stats?.afsPendentes || 0,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30"
    },
    {
      title: "AFs Entregues",
      value: stats?.afsEntregues || 0,
      icon: CheckCircle2,
      color: "text-indigo-600",
      bg: "bg-indigo-100 dark:bg-indigo-900/30"
    }
  ];

  const alertasAtraso = notificacoes?.filter((n: any) => n.status === 'atrasado') || [];
  const alertasAtencao = notificacoes?.filter((n: any) => n.status === 'atencao') || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
        <p className="text-muted-foreground mt-2">Acompanhe os indicadores principais dos contratos e AFs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-border/50 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-4 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <h3 className="text-2xl font-bold mt-1">{kpi.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas Card */}
        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="text-red-500" />
              Atenção Requerida
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-auto">
              {alertasAtraso.length === 0 && alertasAtencao.length === 0 && (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <CheckCircle2 size={40} className="text-emerald-500 mb-3 opacity-50" />
                  Nenhum alerta crítico no momento.
                </div>
              )}
              {alertasAtraso.map((n: any) => (
                <div key={n.af.id} className="p-4 bg-red-50/50 dark:bg-red-900/10 flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-red-700 dark:text-red-400">AF Atrasada</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      A Autorização de Fornecimento do contrato <span className="font-medium text-foreground">{n.contrato.numeroContrato}</span> passou da data limite.
                    </p>
                  </div>
                </div>
              ))}
              {alertasAtencao.map((n: any) => (
                <div key={n.af.id} className="p-4 bg-amber-50/50 dark:bg-amber-900/10 flex items-start gap-4">
                  <div className="w-2 h-2 mt-2 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-700 dark:text-amber-400">Prazo Próximo</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      AF do contrato <span className="font-medium text-foreground">{n.contrato.numeroContrato}</span> vence em breve.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Placeholder for future Chart */}
        <Card className="border-border/50 shadow-md flex items-center justify-center bg-muted/10 min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
            <p>Gráficos de execução em breve</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
