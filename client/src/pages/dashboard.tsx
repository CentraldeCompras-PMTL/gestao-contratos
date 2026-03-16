import { useMemo, useState } from "react";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useContratos } from "@/hooks/use-contratos";
import { useNotificacoes } from "@/hooks/use-notificacoes";
import { useDepartamentos } from "@/hooks/use-departamentos";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, parseNumberString } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, AlertTriangle, CheckCircle2, TrendingUp, AlertCircle, Building2, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContratoWithRelations, DashboardStats as DashboardStatsType, Notificacao } from "@shared/schema";

type FilteredAggregate = {
  id: string;
  label: string;
  count: number;
  value: number;
};

function aggregateBy<T extends string>(
  contratos: ContratoWithRelations[],
  getKey: (contrato: ContratoWithRelations) => T | null,
  getLabel: (contrato: ContratoWithRelations) => string,
) {
  const map = new Map<T, FilteredAggregate>();

  contratos.forEach((contrato) => {
    const key = getKey(contrato);
    if (!key) return;

    const current = map.get(key) ?? {
      id: key,
      label: getLabel(contrato),
      count: 0,
      value: 0,
    };

    current.count += 1;
    current.value += parseNumberString(contrato.valorContrato);
    map.set(key, current);
  });

  return Array.from(map.values());
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: contratos = [], isLoading: contratosLoading } = useContratos();
  const { data: notificacoes = [], isLoading: notifLoading } = useNotificacoes();
  const { data: departamentos = [], isLoading: departamentosLoading } = useDepartamentos();

  const [filterFornecedor, setFilterFornecedor] = useState("");
  const [filterProcesso, setFilterProcesso] = useState("");
  const [filterDepartamento, setFilterDepartamento] = useState("");

  const filteredContratos = useMemo(() => {
    return contratos.filter((contrato) => {
      if (filterFornecedor && contrato.fornecedor.id !== filterFornecedor) return false;
      if (filterProcesso && contrato.processoDigital.id !== filterProcesso) return false;
      if (filterDepartamento && contrato.processoDigital.departamentoId !== filterDepartamento) return false;
      return true;
    });
  }, [contratos, filterFornecedor, filterProcesso, filterDepartamento]);

  const fornecedoresUnicos = useMemo(() => {
    const base = contratos.filter((contrato) => {
      if (filterProcesso && contrato.processoDigital.id !== filterProcesso) return false;
      if (filterDepartamento && contrato.processoDigital.departamentoId !== filterDepartamento) return false;
      return true;
    });
    return aggregateBy(base, (contrato) => contrato.fornecedor.id, (contrato) => contrato.fornecedor.nome);
  }, [contratos, filterProcesso, filterDepartamento]);

  const processosUnicos = useMemo(() => {
    const base = contratos.filter((contrato) => {
      if (filterFornecedor && contrato.fornecedor.id !== filterFornecedor) return false;
      if (filterDepartamento && contrato.processoDigital.departamentoId !== filterDepartamento) return false;
      return true;
    });
    return aggregateBy(base, (contrato) => contrato.processoDigital.id, (contrato) => contrato.processoDigital.numeroProcessoDigital);
  }, [contratos, filterFornecedor, filterDepartamento]);

  const departamentosUnicos = useMemo(() => {
    if (filterProcesso) {
      const processoSelecionado = contratos.find((contrato) => contrato.processoDigital.id === filterProcesso)?.processoDigital;
      if (!processoSelecionado?.departamentoId) return [];
      return [{
        id: processoSelecionado.departamentoId,
        label: processoSelecionado.departamento?.nome ?? "Sem departamento",
        count: 0,
        value: 0,
      }];
    }

    const departamentosBase = filterFornecedor
      ? departamentos.filter((departamento) =>
          contratos.some(
            (contrato) =>
              contrato.fornecedor.id === filterFornecedor &&
              contrato.processoDigital.departamentoId === departamento.id,
          ),
        )
      : departamentos;

    return departamentosBase
      .map((departamento) => ({
        id: departamento.id,
        label: departamento.nome,
        count: 0,
        value: 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [contratos, departamentos, filterFornecedor, filterProcesso]);

  const saldoFiltrado = useMemo(() => {
    let total = 0;
    let utilizado = 0;

    filteredContratos.forEach((contrato) => {
      total += parseNumberString(contrato.valorContrato);
      contrato.notasFiscais.forEach((nota) => {
        if (nota.statusPagamento === "aguardando_pagamento" || nota.statusPagamento === "pago") {
          utilizado += parseNumberString(nota.valorNota);
        }
      });
    });

    return { total, utilizado, saldo: total - utilizado };
  }, [filteredContratos]);

  const kpisCalculados = useMemo(() => {
    let totalValor = 0;
    let afsPendentes = 0;
    let afsEntregues = 0;

    filteredContratos.forEach((contrato) => {
      totalValor += parseNumberString(contrato.valorContrato);
      contrato.empenhos.forEach((empenho) => {
        empenho.afs.forEach((af) => {
          if (af.dataEntregaReal) {
            afsEntregues++;
          } else {
            afsPendentes++;
          }
        });
      });
    });

    return {
      totalContratos: filteredContratos.length,
      totalValor,
      afsPendentes,
      afsEntregues,
    };
  }, [filteredContratos]);

  if (statsLoading || notifLoading || contratosLoading || departamentosLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const alertasAtraso = notificacoes.filter((n) => n.isLate);
  const alertasAtencao = notificacoes.filter((n) => !n.isLate);
  const overview: DashboardStatsType | undefined = stats;

  const kpis = [
    {
      title: "Contratos Filtrados",
      value: kpisCalculados.totalContratos,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Valor Total Filtrado",
      value: formatCurrency(kpisCalculados.totalValor),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "AFs Pendentes",
      value: kpisCalculados.afsPendentes,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "AFs Entregues",
      value: kpisCalculados.afsEntregues,
      icon: CheckCircle2,
      color: "text-indigo-600",
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
    },
  ];

  const renderNotification = (notification: Notificacao, mode: "late" | "warning") => (
    <div
      key={notification.id}
      className={`p-4 flex items-start gap-4 ${mode === "late" ? "bg-red-50/50 dark:bg-red-900/10" : "bg-amber-50/50 dark:bg-amber-900/10"}`}
    >
      <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${mode === "late" ? "bg-red-500" : "bg-amber-500"}`} />
      <div>
        <h4 className={`font-semibold ${mode === "late" ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
          {mode === "late" ? "AF Atrasada" : "Prazo Proximo"}
        </h4>
        <p className="text-sm text-muted-foreground mt-1">
          Contrato <span className="font-medium text-foreground">{notification.contrato}</span> para{" "}
          <span className="font-medium text-foreground">{notification.fornecedor}</span>.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Visao Geral</h1>
        <p className="text-muted-foreground mt-2">Acompanhe os indicadores principais dos contratos e AFs.</p>
        {user?.role !== "admin" && (
          <p className="text-sm text-muted-foreground mt-2">Voce esta visualizando somente os dados vinculados ao seu ente.</p>
        )}
      </div>

      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Contratos</p><p className="text-2xl font-bold">{overview.totalContratos}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Processos</p><p className="text-2xl font-bold">{overview.totalProcessos}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Fornecedores</p><p className="text-2xl font-bold">{overview.totalFornecedores}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Saldo Geral</p><p className="text-2xl font-bold">{formatCurrency(overview.saldoTotal)}</p></CardContent></Card>
        </div>
      )}

      <div className="bg-white dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <h3 className="font-semibold mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Fornecedor</label>
            <Select value={filterFornecedor || "all"} onValueChange={(v) => setFilterFornecedor(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Todos os fornecedores" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fornecedores</SelectItem>
                {fornecedoresUnicos.map((f) => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Processo Digital</label>
            <Select value={filterProcesso || "all"} onValueChange={(v) => setFilterProcesso(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Todos os processos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os processos</SelectItem>
                {processosUnicos.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Departamento</label>
            <Select value={filterDepartamento || "all"} onValueChange={(v) => setFilterDepartamento(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Todos os departamentos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departamentosUnicos.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600"><DollarSign size={24} /></div>
            <div><p className="text-sm font-medium text-muted-foreground">Valor Total Filtrado</p><h3 className="text-2xl font-bold mt-1">{formatCurrency(saldoFiltrado.total)}</h3></div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600"><AlertTriangle size={24} /></div>
            <div><p className="text-sm font-medium text-muted-foreground">Valor Utilizado</p><h3 className="text-2xl font-bold mt-1">{formatCurrency(saldoFiltrado.utilizado)}</h3></div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"><TrendingUp size={24} /></div>
            <div><p className="text-sm font-medium text-muted-foreground">Saldo Disponivel</p><h3 className="text-2xl font-bold mt-1">{formatCurrency(saldoFiltrado.saldo)}</h3></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20"><CardTitle className="text-lg flex items-center gap-2"><Building2 size={20} />Contratos por Fornecedor</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-auto">
              {fornecedoresUnicos.length === 0 ? <div className="p-4 text-center text-muted-foreground">Nenhum fornecedor</div> : fornecedoresUnicos.map((f) => (
                <div key={f.id} className="p-4 flex justify-between items-start hover:bg-muted/30 transition-colors">
                  <div><p className="font-medium text-sm">{f.label}</p><p className="text-xs text-muted-foreground">{f.count} contrato{f.count !== 1 ? "s" : ""}</p></div>
                  <p className="font-semibold text-sm">{formatCurrency(f.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20"><CardTitle className="text-lg flex items-center gap-2"><FileText size={20} />Contratos por Processo</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-auto">
              {processosUnicos.length === 0 ? <div className="p-4 text-center text-muted-foreground">Nenhum processo</div> : processosUnicos.map((p) => (
                <div key={p.id} className="p-4 flex justify-between items-start hover:bg-muted/30 transition-colors">
                  <div><p className="font-medium text-sm">{p.label}</p><p className="text-xs text-muted-foreground">{p.count} contrato{p.count !== 1 ? "s" : ""}</p></div>
                  <p className="font-semibold text-sm">{formatCurrency(p.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20"><CardTitle className="text-lg flex items-center gap-2"><Building2 size={20} />Valor por Departamento</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-auto">
              {departamentosUnicos.length === 0 ? <div className="p-4 text-center text-muted-foreground">Nenhum departamento</div> : departamentosUnicos.map((d) => (
                <div key={d.id} className="p-4 flex justify-between items-start hover:bg-muted/30 transition-colors">
                  <div><p className="font-medium text-sm">{d.label}</p><p className="text-xs text-muted-foreground">{d.count} contrato{d.count !== 1 ? "s" : ""}</p></div>
                  <p className="font-semibold text-sm">{formatCurrency(d.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2"><AlertCircle className="text-red-500" />Atencao Requerida</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[400px] overflow-auto">
              {alertasAtraso.length === 0 && alertasAtencao.length === 0 && (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                  <CheckCircle2 size={40} className="text-emerald-500 mb-3 opacity-50" />
                  Nenhum alerta critico no momento.
                </div>
              )}
              {alertasAtraso.map((n) => renderNotification(n, "late"))}
              {alertasAtencao.map((n) => renderNotification(n, "warning"))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md flex items-center justify-center bg-muted/10 min-h-[300px]">
          <div className="text-center text-muted-foreground">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
            <p>Graficos de execucao em breve</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
