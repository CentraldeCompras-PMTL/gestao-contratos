import { useState, useMemo } from "react";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useContratos } from "@/hooks/use-contratos";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, AlertTriangle, CheckCircle2, TrendingUp, AlertCircle, Building2, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificacoes } from "@/hooks/use-notificacoes";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: contratos = [], isLoading: contratosLoading } = useContratos();
  const { data: notificacoes, isLoading: notifLoading } = useNotificacoes();
  
  const [filterFornecedor, setFilterFornecedor] = useState("");
  const [filterProcesso, setFilterProcesso] = useState("");
  const [filterDepartamento, setFilterDepartamento] = useState("");

  const filteredContratos = useMemo(() => {
    return contratos.filter((c: any) => {
      if (filterFornecedor && c.fornecedor.id !== filterFornecedor) return false;
      if (filterProcesso && c.processoDigital.id !== filterProcesso) return false;
      if (filterDepartamento && c.processoDigital.departamentoId !== filterDepartamento) return false;
      return true;
    });
  }, [contratos, filterFornecedor, filterProcesso, filterDepartamento]);

  const fornecedoresUnicos = useMemo(() => {
    const map = new Map();
    // Filtrar contratos baseado em processo e departamento
    const base = contratos.filter((c: any) => {
      if (filterProcesso && c.processoDigital.id !== filterProcesso) return false;
      if (filterDepartamento && c.processoDigital.departamentoId !== filterDepartamento) return false;
      return true;
    });
    base.forEach((c: any) => {
      if (!map.has(c.fornecedor.id)) {
        map.set(c.fornecedor.id, { id: c.fornecedor.id, nome: c.fornecedor.nome, count: 0, valor: 0 });
      }
      const item = map.get(c.fornecedor.id);
      item.count++;
      item.valor += parseFloat(c.valorContrato || 0);
    });
    return Array.from(map.values());
  }, [contratos, filterProcesso, filterDepartamento]);

  const processosUnicos = useMemo(() => {
    const map = new Map();
    // Filtrar contratos baseado em fornecedor e departamento
    const base = contratos.filter((c: any) => {
      if (filterFornecedor && c.fornecedor.id !== filterFornecedor) return false;
      if (filterDepartamento && c.processoDigital.departamentoId !== filterDepartamento) return false;
      return true;
    });
    base.forEach((c: any) => {
      if (!map.has(c.processoDigital.id)) {
        map.set(c.processoDigital.id, { id: c.processoDigital.id, numero: c.processoDigital.numeroProcessoDigital, count: 0, valor: 0 });
      }
      const item = map.get(c.processoDigital.id);
      item.count++;
      item.valor += parseFloat(c.valorContrato || 0);
    });
    return Array.from(map.values());
  }, [contratos, filterFornecedor, filterDepartamento]);

  const departamentosUnicos = useMemo(() => {
    const map = new Map();
    // Filtrar contratos baseado em fornecedor e processo
    const base = contratos.filter((c: any) => {
      if (filterFornecedor && c.fornecedor.id !== filterFornecedor) return false;
      if (filterProcesso && c.processoDigital.id !== filterProcesso) return false;
      return true;
    });
    base.forEach((c: any) => {
      if (c.processoDigital.departamentoId) {
        const deptId = c.processoDigital.departamentoId;
        if (!map.has(deptId)) {
          map.set(deptId, { id: deptId, count: 0, valor: 0 });
        }
        const item = map.get(deptId);
        item.count++;
        item.valor += parseFloat(c.valorContrato || 0);
      }
    });
    return Array.from(map.values());
  }, [contratos, filterFornecedor, filterProcesso]);

  const saldoFiltrado = useMemo(() => {
    let total = 0;
    let utilizado = 0;
    filteredContratos.forEach((c: any) => {
      total += parseFloat(c.valorContrato || 0);
      c.notasFiscais?.forEach((nf: any) => {
        if (nf.statusPagamento === 'pago') {
          utilizado += parseFloat(nf.valorNota || 0);
        }
      });
    });
    return { total, utilizado, saldo: total - utilizado };
  }, [filteredContratos]);

  const kpisCalculados = useMemo(() => {
    let totalContratos = filteredContratos.length;
    let totalValor = 0;
    let afsPendentes = 0;
    let afsEntregues = 0;

    filteredContratos.forEach((c: any) => {
      totalValor += parseFloat(c.valorContrato || 0);
      c.empenhos?.forEach((e: any) => {
        e.afs?.forEach((af: any) => {
          if (af.dataEntregaReal) {
            afsEntregues++;
          } else {
            afsPendentes++;
          }
        });
      });
    });

    return { totalContratos, totalValor, afsPendentes, afsEntregues };
  }, [filteredContratos]);

  if (statsLoading || notifLoading || contratosLoading) {
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
      title: "Contratos Filtrados",
      value: kpisCalculados.totalContratos,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      title: "Valor Total Filtrado",
      value: formatCurrency(kpisCalculados.totalValor),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30"
    },
    {
      title: "AFs Pendentes",
      value: kpisCalculados.afsPendentes,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30"
    },
    {
      title: "AFs Entregues",
      value: kpisCalculados.afsEntregues,
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

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Fornecedor</label>
            <Select value={filterFornecedor || "all"} onValueChange={(v) => setFilterFornecedor(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os fornecedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {fornecedoresUnicos.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Processo Digital</label>
            <Select value={filterProcesso || "all"} onValueChange={(v) => setFilterProcesso(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os processos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os processos</SelectItem>
                {processosUnicos.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.numero}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Departamento</label>
            <Select value={filterDepartamento || "all"} onValueChange={(v) => setFilterDepartamento(v === "all" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departamentosUnicos.map(d => (
                  <SelectItem key={d.id} value={d.id}>Depto. {d.id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPIs Filtrados */}
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

      {/* Saldo Filtrado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Total Filtrado</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(saldoFiltrado.total)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valor Utilizado</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(saldoFiltrado.utilizado)}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo Disponível</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(saldoFiltrado.saldo)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agregações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Por Fornecedor */}
        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 size={20} />
              Contratos por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-auto">
              {fornecedoresUnicos.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Nenhum fornecedor</div>
              ) : (
                fornecedoresUnicos.map(f => (
                  <div key={f.id} className="p-4 flex justify-between items-start hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{f.nome}</p>
                      <p className="text-xs text-muted-foreground">{f.count} contrato{f.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-semibold text-sm">{formatCurrency(f.valor)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Por Processo Digital */}
        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText size={20} />
              Contratos por Processo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-auto">
              {processosUnicos.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Nenhum processo</div>
              ) : (
                processosUnicos.map(p => (
                  <div key={p.id} className="p-4 flex justify-between items-start hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">{p.numero}</p>
                      <p className="text-xs text-muted-foreground">{p.count} contrato{p.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-semibold text-sm">{formatCurrency(p.valor)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Por Departamento */}
        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 size={20} />
              Valor por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-auto">
              {departamentosUnicos.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Nenhum departamento</div>
              ) : (
                departamentosUnicos.map(d => (
                  <div key={d.id} className="p-4 flex justify-between items-start hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">Departamento</p>
                      <p className="text-xs text-muted-foreground">{d.count} contrato{d.count !== 1 ? 's' : ''}</p>
                    </div>
                    <p className="font-semibold text-sm">{formatCurrency(d.valor)}</p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
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
