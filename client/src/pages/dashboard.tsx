import { useMemo, useState } from "react";
import { useDashboardStats } from "@/hooks/use-dashboard";
import { useContratos } from "@/hooks/use-contratos";
import { useNotificacoes } from "@/hooks/use-notificacoes";
import { useDepartamentos } from "@/hooks/use-departamentos";
import { useEntes } from "@/hooks/use-entes";
import { useAuth } from "@/hooks/use-auth";
import { useAtasRegistroPreco } from "@/hooks/use-atas-registro-preco";
import { useAtaContratos } from "@/hooks/use-ata-contratos";
import { formatCurrency, parseNumberString } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, AlertTriangle, CheckCircle2, TrendingUp, AlertCircle, Building2, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AtaContratoWithRelations, AtaRegistroPrecoWithRelations, ContratoWithRelations, DashboardStats as DashboardStatsType, Notificacao } from "@shared/schema";

type FilteredAggregate = {
  id: string;
  label: string;
  count: number;
  value: number;
};

type EmpenhoAggregate = {
  id: string;
  label: string;
  valor: number;
  execucao: number;
};

type MonthlyExecutionPoint = {
  id: string;
  label: string;
  empenhado: number;
  executado: number;
  pago: number;
};

type ArpDepartmentAggregate = {
  id: string;
  label: string;
  previsto: number;
  contratado: number;
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

function getContratoDepartamentoId(contrato: ContratoWithRelations) {
  return contrato.departamentoId ?? contrato.processoDigital.departamentoId ?? null;
}

function getContratoDepartamentoNome(contrato: ContratoWithRelations) {
  return contrato.departamento?.nome ?? contrato.processoDigital.departamento?.nome ?? "Sem departamento";
}

function aggregateEmpenhos(
  contratos: ContratoWithRelations[],
  getKey: (contrato: ContratoWithRelations, empenho: ContratoWithRelations["empenhos"][number]) => string,
  getLabel: (contrato: ContratoWithRelations, empenho: ContratoWithRelations["empenhos"][number]) => string,
) {
  const map = new Map<string, EmpenhoAggregate>();

  contratos.forEach((contrato) => {
    contrato.empenhos.forEach((empenho) => {
      const key = getKey(contrato, empenho);
      const current = map.get(key) ?? { id: key, label: getLabel(contrato, empenho), valor: 0, execucao: 0 };
      current.valor += parseNumberString(empenho.valorEmpenho) - parseNumberString(empenho.valorAnulado);
      current.execucao += empenho.afs.reduce((acc, af) => acc + parseNumberString(af.valorAf), 0);
      map.set(key, current);
    });
  });

  return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
}

function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
}

function getMonthKey(dateString?: string | null) {
  if (!dateString) return null;
  const date = new Date(`${dateString}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function getAtaItemQuantidadeTotal(item: AtaRegistroPrecoWithRelations["itens"][number], participanteId?: string) {
  return item.quantidades.reduce((sum, quantidade) => {
    if (participanteId && quantidade.enteId !== participanteId) return sum;
    return sum + parseNumberString(quantidade.quantidade);
  }, 0);
}

function getAtaItemTotalLicitado(item: AtaRegistroPrecoWithRelations["itens"][number], participanteId?: string) {
  if (!item.resultado || item.resultado.itemFracassado || item.resultado.valorUnitarioLicitado == null) return 0;
  const quantidadeTotal = getAtaItemQuantidadeTotal(item, participanteId);
  return quantidadeTotal * parseNumberString(item.resultado.valorUnitarioLicitado);
}

function getAtaItemTotalCotado(item: AtaRegistroPrecoWithRelations["itens"][number], participanteId?: string) {
  if (!item.cotacao?.valorUnitarioCotado) return 0;
  const quantidadeTotal = getAtaItemQuantidadeTotal(item, participanteId);
  return quantidadeTotal * parseNumberString(item.cotacao.valorUnitarioCotado);
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: contratos = [], isLoading: contratosLoading } = useContratos();
  const { data: notificacoes = [], isLoading: notifLoading } = useNotificacoes();
  const { data: departamentos = [], isLoading: departamentosLoading } = useDepartamentos();
  const { data: entes = [], isLoading: entesLoading } = useEntes();

  const [filterFornecedor, setFilterFornecedor] = useState("");
  const [filterProcesso, setFilterProcesso] = useState("");
  const [filterDepartamento, setFilterDepartamento] = useState("");
  const [filterEnte, setFilterEnte] = useState("");
  const [filterFonteRecurso, setFilterFonteRecurso] = useState("");
  const [filterFicha, setFilterFicha] = useState("");
  const [filterAtaRegistroPreco, setFilterAtaRegistroPreco] = useState("");
  const [filterAtaProcesso, setFilterAtaProcesso] = useState("");
  const [filterAtaFornecedor, setFilterAtaFornecedor] = useState("");
  const [filterAtaParticipante, setFilterAtaParticipante] = useState("");

  const accessibleEnteIds = user?.accessibleEnteIds ?? (user?.enteId ? [user.enteId] : []);
  const showEnteFilter = user?.role === "operacional" && accessibleEnteIds.length > 1;
  const canManageArp = useMemo(() => {
    if (user?.role === "admin") return true;
    if (!user?.canAccessAtaModule) return false;
    return entes.some((ente) => {
      if (!accessibleEnteIds.includes(ente.id)) return false;
      const nome = ente.nome.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const sigla = ente.sigla.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return nome.includes("fazenda") || sigla.includes("fazenda") || sigla === "sefaz";
    });
  }, [accessibleEnteIds, entes, user?.canAccessAtaModule, user?.role]);

  const { data: atasRegistroPreco = [], isLoading: atasLoading } = useAtasRegistroPreco({ enabled: canManageArp });
  const { data: ataContratos = [], isLoading: ataContratosLoading } = useAtaContratos({ enabled: canManageArp });

  const atasArpDisponiveis = useMemo(
    () => atasRegistroPreco.map((ata) => ({ id: ata.id, label: ata.numeroAta })).sort((a, b) => a.label.localeCompare(b.label)),
    [atasRegistroPreco],
  );

  const processosArpDisponiveis = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    atasRegistroPreco.forEach((ata) => {
      map.set(ata.processoDigital.id, {
        id: ata.processoDigital.id,
        label: ata.processoDigital.numeroProcessoDigital,
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [atasRegistroPreco]);

  const participantesArpDisponiveis = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    atasRegistroPreco.forEach((ata) => {
      ata.participantes.forEach((participante) => {
        map.set(participante.ente.id, {
          id: participante.ente.id,
          label: `${participante.ente.sigla} - ${participante.ente.nome}`,
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [atasRegistroPreco]);

  const fornecedoresArpDisponiveis = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();

    atasRegistroPreco.forEach((ata) => {
      ata.fornecedores.forEach((fornecedor) => {
        map.set(fornecedor.fornecedor.id, {
          id: fornecedor.fornecedor.id,
          label: fornecedor.fornecedor.nome,
        });
      });

      ata.itens.forEach((item) => {
        const fornecedor = item.resultado?.fornecedor;
        if (!fornecedor) return;
        map.set(fornecedor.id, {
          id: fornecedor.id,
          label: fornecedor.nome,
        });
      });
    });

    ataContratos.forEach((contrato) => {
      map.set(contrato.fornecedor.id, {
        id: contrato.fornecedor.id,
        label: contrato.fornecedor.nome,
      });
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [ataContratos, atasRegistroPreco]);

  const filteredAtasRegistroPreco = useMemo(() => {
    return atasRegistroPreco.filter((ata) => {
      if (filterAtaRegistroPreco && ata.id !== filterAtaRegistroPreco) return false;
      if (filterAtaProcesso && ata.processoDigital.id !== filterAtaProcesso) return false;
      if (filterAtaParticipante && !ata.participantes.some((participante) => participante.ente.id === filterAtaParticipante)) return false;
      if (
        filterAtaFornecedor &&
        !ata.fornecedores.some((fornecedor) => fornecedor.fornecedor.id === filterAtaFornecedor) &&
        !ata.itens.some((item) => item.resultado?.fornecedor?.id === filterAtaFornecedor)
      ) {
        return false;
      }
      return true;
    });
  }, [atasRegistroPreco, filterAtaFornecedor, filterAtaParticipante, filterAtaProcesso, filterAtaRegistroPreco]);

  const filteredAtaContratos = useMemo(() => {
    return ataContratos.filter((contrato) => {
      if (filterAtaRegistroPreco && contrato.ataId !== filterAtaRegistroPreco) return false;
      if (filterAtaProcesso && contrato.ata.processoDigital.id !== filterAtaProcesso) return false;
      if (filterAtaFornecedor && contrato.fornecedor.id !== filterAtaFornecedor) return false;
      if (filterAtaParticipante && !contrato.prePedidos.some((prePedido) => prePedido.ente.id === filterAtaParticipante)) return false;
      return true;
    });
  }, [ataContratos, filterAtaFornecedor, filterAtaParticipante, filterAtaProcesso, filterAtaRegistroPreco]);

  const filteredContratos = useMemo(() => {
    return contratos.filter((contrato) => {
      const matchesFonte = !filterFonteRecurso || contrato.empenhos.some((empenho) => empenho.fonteRecursoId === filterFonteRecurso);
      const matchesFicha = !filterFicha || contrato.empenhos.some((empenho) => empenho.fichaId === filterFicha);
      if (showEnteFilter && filterEnte && contrato.processoDigital.departamento?.enteId !== filterEnte) return false;
      if (filterFornecedor && contrato.fornecedor.id !== filterFornecedor) return false;
      if (filterProcesso && contrato.processoDigital.id !== filterProcesso) return false;
      if (filterDepartamento && getContratoDepartamentoId(contrato) !== filterDepartamento) return false;
      if (!matchesFonte || !matchesFicha) return false;
      return true;
    });
  }, [contratos, filterDepartamento, filterEnte, filterFicha, filterFonteRecurso, filterFornecedor, filterProcesso, showEnteFilter]);

  const fornecedoresUnicos = useMemo(() => {
    const base = contratos.filter((contrato) => {
      if (filterFonteRecurso && !contrato.empenhos.some((empenho) => empenho.fonteRecursoId === filterFonteRecurso)) return false;
      if (filterFicha && !contrato.empenhos.some((empenho) => empenho.fichaId === filterFicha)) return false;
      if (showEnteFilter && filterEnte && contrato.processoDigital.departamento?.enteId !== filterEnte) return false;
      if (filterProcesso && contrato.processoDigital.id !== filterProcesso) return false;
      if (filterDepartamento && getContratoDepartamentoId(contrato) !== filterDepartamento) return false;
      return true;
    });
    return aggregateBy(base, (contrato) => contrato.fornecedor.id, (contrato) => contrato.fornecedor.nome);
  }, [contratos, filterDepartamento, filterEnte, filterFicha, filterFonteRecurso, filterProcesso, showEnteFilter]);

  const processosUnicos = useMemo(() => {
    const base = contratos.filter((contrato) => {
      if (filterFonteRecurso && !contrato.empenhos.some((empenho) => empenho.fonteRecursoId === filterFonteRecurso)) return false;
      if (filterFicha && !contrato.empenhos.some((empenho) => empenho.fichaId === filterFicha)) return false;
      if (showEnteFilter && filterEnte && contrato.processoDigital.departamento?.enteId !== filterEnte) return false;
      if (filterFornecedor && contrato.fornecedor.id !== filterFornecedor) return false;
      if (filterDepartamento && getContratoDepartamentoId(contrato) !== filterDepartamento) return false;
      return true;
    });
    return aggregateBy(base, (contrato) => contrato.processoDigital.id, (contrato) => contrato.processoDigital.numeroProcessoDigital);
  }, [contratos, filterDepartamento, filterEnte, filterFicha, filterFonteRecurso, filterFornecedor, showEnteFilter]);

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

    const departamentosFiltradosPorEnte = showEnteFilter && filterEnte
      ? departamentos.filter((departamento) => departamento.enteId === filterEnte)
      : departamentos;

    const departamentosBase = filterFornecedor
      ? departamentosFiltradosPorEnte.filter((departamento) =>
          contratos.some(
            (contrato) =>
              (!showEnteFilter || !filterEnte || contrato.processoDigital.departamento?.enteId === filterEnte) &&
              (!filterFonteRecurso || contrato.empenhos.some((empenho) => empenho.fonteRecursoId === filterFonteRecurso)) &&
              (!filterFicha || contrato.empenhos.some((empenho) => empenho.fichaId === filterFicha)) &&
              contrato.fornecedor.id === filterFornecedor &&
              getContratoDepartamentoId(contrato) === departamento.id,
          ),
        )
      : departamentosFiltradosPorEnte;

    return aggregateBy(
      contratos.filter((contrato) => {
        if (showEnteFilter && filterEnte && contrato.processoDigital.departamento?.enteId !== filterEnte) return false;
        if (filterFornecedor && contrato.fornecedor.id !== filterFornecedor) return false;
        if (filterProcesso && contrato.processoDigital.id !== filterProcesso) return false;
        if (filterFonteRecurso && !contrato.empenhos.some((empenho) => empenho.fonteRecursoId === filterFonteRecurso)) return false;
        if (filterFicha && !contrato.empenhos.some((empenho) => empenho.fichaId === filterFicha)) return false;
        const departamentoId = getContratoDepartamentoId(contrato);
        return !!departamentoId && departamentosBase.some((departamento) => departamento.id === departamentoId);
      }),
      (contrato) => getContratoDepartamentoId(contrato),
      (contrato) => getContratoDepartamentoNome(contrato),
    ).sort((a, b) => a.label.localeCompare(b.label));
  }, [contratos, departamentos, filterEnte, filterFicha, filterFonteRecurso, filterFornecedor, filterProcesso, showEnteFilter]);

  const entesDisponiveis = useMemo(() => {
    if (!showEnteFilter) return [];
    return entes.filter((ente) => accessibleEnteIds.includes(ente.id));
  }, [accessibleEnteIds, entes, showEnteFilter]);

  const fontesDisponiveis = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    contratos.forEach((contrato) => {
      if (showEnteFilter && filterEnte && contrato.processoDigital.departamento?.enteId !== filterEnte) return;
      if (filterFornecedor && contrato.fornecedor.id !== filterFornecedor) return;
      if (filterProcesso && contrato.processoDigital.id !== filterProcesso) return;
      if (filterDepartamento && getContratoDepartamentoId(contrato) !== filterDepartamento) return;
      contrato.empenhos.forEach((empenho) => {
        map.set(empenho.fonteRecursoId, {
          id: empenho.fonteRecursoId,
          label: `${empenho.fonteRecurso.codigo} - ${empenho.fonteRecurso.nome}`,
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [contratos, filterDepartamento, filterEnte, filterFornecedor, filterProcesso, showEnteFilter]);

  const fichasDisponiveis = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    contratos.forEach((contrato) => {
      if (showEnteFilter && filterEnte && contrato.processoDigital.departamento?.enteId !== filterEnte) return;
      if (filterFornecedor && contrato.fornecedor.id !== filterFornecedor) return;
      if (filterProcesso && contrato.processoDigital.id !== filterProcesso) return;
      if (filterDepartamento && getContratoDepartamentoId(contrato) !== filterDepartamento) return;
      contrato.empenhos.forEach((empenho) => {
        if (filterFonteRecurso && empenho.fonteRecursoId !== filterFonteRecurso) return;
        map.set(empenho.fichaId, {
          id: empenho.fichaId,
          label: `${empenho.ficha.codigo} - ${empenho.ficha.classificacao}`,
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [contratos, filterDepartamento, filterEnte, filterFonteRecurso, filterFornecedor, filterProcesso, showEnteFilter]);

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

  const fontesResumo = useMemo(
    () => aggregateEmpenhos(filteredContratos, (_contrato, empenho) => empenho.fonteRecursoId, (_contrato, empenho) => `${empenho.fonteRecurso.codigo} - ${empenho.fonteRecurso.nome}`),
    [filteredContratos],
  );

  const fichasResumo = useMemo(
    () => aggregateEmpenhos(filteredContratos, (_contrato, empenho) => empenho.fichaId, (_contrato, empenho) => `${empenho.ficha.codigo} - ${empenho.ficha.classificacao}`),
    [filteredContratos],
  );

  const evolucaoMensal = useMemo<MonthlyExecutionPoint[]>(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_value, index) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - index), 1));
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const id = `${year}-${String(month + 1).padStart(2, "0")}`;
      return {
        id,
        label: formatMonthLabel(year, month),
        empenhado: 0,
        executado: 0,
        pago: 0,
      };
    });

    const map = new Map(months.map((month) => [month.id, month]));

    filteredContratos.forEach((contrato) => {
      contrato.empenhos.forEach((empenho) => {
        const key = getMonthKey(empenho.dataEmpenho);
        if (!key || !map.has(key)) return;
        map.get(key)!.empenhado += parseNumberString(empenho.valorEmpenho) - parseNumberString(empenho.valorAnulado);
      });

      contrato.notasFiscais.forEach((nota) => {
        const executionKey = getMonthKey(nota.dataEnvioPagamento ?? nota.dataNota);
        if ((nota.statusPagamento === "aguardando_pagamento" || nota.statusPagamento === "pago") && executionKey && map.has(executionKey)) {
          map.get(executionKey)!.executado += parseNumberString(nota.valorNota);
        }

        const paymentKey = getMonthKey(nota.dataPagamento ?? nota.dataNota);
        if (nota.statusPagamento === "pago" && paymentKey && map.has(paymentKey)) {
          map.get(paymentKey)!.pago += parseNumberString(nota.valorNota);
        }
      });
    });

    return months;
  }, [filteredContratos]);

  const evolucaoMensalMax = useMemo(
    () => Math.max(1, ...evolucaoMensal.flatMap((item) => [item.empenhado, item.executado, item.pago])),
    [evolucaoMensal],
  );

  const arpMetrics = useMemo(() => {
    const previstoCotado = filteredAtasRegistroPreco.reduce(
      (sum, ata) => sum + ata.itens.reduce((itemSum, item) => itemSum + getAtaItemTotalCotado(item, filterAtaParticipante || undefined), 0),
      0,
    );
    const previstoLicitado = filteredAtasRegistroPreco.reduce(
      (sum, ata) => sum + ata.itens.reduce((itemSum, item) => itemSum + getAtaItemTotalLicitado(item, filterAtaParticipante || undefined), 0),
      0,
    );
    const contratado = filteredAtaContratos.reduce(
      (sum, contrato) =>
        sum +
        contrato.prePedidos.reduce((prePedidoSum, prePedido) => {
          const valorUnitario = parseNumberString(prePedido.item.resultado?.valorUnitarioLicitado ?? 0);
          return prePedidoSum + parseNumberString(prePedido.quantidadeSolicitada) * valorUnitario;
        }, 0),
      0,
    );
    const empenhado = filteredAtaContratos.reduce(
      (sum, contrato) => sum + contrato.empenhos.reduce((empenhoSum, empenho) => empenhoSum + parseNumberString(empenho.valorEmpenho), 0),
      0,
    );
    const emAf = filteredAtaContratos.reduce(
      (sum, contrato) => sum + contrato.empenhos.reduce((empenhoSum, empenho) => empenhoSum + empenho.afs.reduce((afSum, af) => afSum + parseNumberString(af.valorAf), 0), 0),
      0,
    );
    const faturado = filteredAtaContratos.reduce(
      (sum, contrato) =>
        sum +
        contrato.empenhos.reduce(
          (empenhoSum, empenho) => empenhoSum + empenho.afs.reduce((afSum, af) => afSum + (af.notasFiscais?.reduce((notaSum, nota) => notaSum + parseNumberString(nota.valorNota), 0) ?? 0), 0),
          0,
        ),
      0,
    );
    const pago = filteredAtaContratos.reduce(
      (sum, contrato) =>
        sum +
        contrato.empenhos.reduce(
          (empenhoSum, empenho) =>
            empenhoSum +
            empenho.afs.reduce(
              (afSum, af) =>
                afSum +
                (af.notasFiscais?.reduce((notaSum, nota) => {
                  if (nota.statusPagamento !== "pago") return notaSum;
                  return notaSum + parseNumberString(nota.valorNota);
                }, 0) ?? 0),
              0,
            ),
          0,
        ),
      0,
    );
    return { previstoCotado, previstoLicitado, contratado, empenhado, emAf, faturado, pago };
  }, [filterAtaParticipante, filteredAtaContratos, filteredAtasRegistroPreco]);

  const arpResumoDepartamentos = useMemo<ArpDepartmentAggregate[]>(() => {
    const map = new Map<string, ArpDepartmentAggregate>();

    filteredAtasRegistroPreco.forEach((ata) => {
      const departamento = ata.processoDigital.departamento;
      if (!departamento) return;
      const current = map.get(departamento.id) ?? {
        id: departamento.id,
        label: departamento.nome,
        previsto: 0,
        contratado: 0,
      };
      current.previsto += ata.itens.reduce((sum, item) => sum + getAtaItemTotalLicitado(item, filterAtaParticipante || undefined), 0);
      map.set(departamento.id, current);
    });

    filteredAtaContratos.forEach((contrato: AtaContratoWithRelations) => {
      const departamento = contrato.ata.processoDigital.departamento;
      if (!departamento) return;
      const current = map.get(departamento.id) ?? {
        id: departamento.id,
        label: departamento.nome,
        previsto: 0,
        contratado: 0,
      };
      current.contratado += contrato.prePedidos.reduce((sum, prePedido) => {
        const valorUnitario = parseNumberString(prePedido.item.resultado?.valorUnitarioLicitado ?? 0);
        return sum + parseNumberString(prePedido.quantidadeSolicitada) * valorUnitario;
      }, 0);
      map.set(departamento.id, current);
    });

    return Array.from(map.values()).sort((a, b) => b.contratado - a.contratado);
  }, [filterAtaParticipante, filteredAtaContratos, filteredAtasRegistroPreco]);

  const arpResumoFornecedores = useMemo(() => {
    const map = new Map<string, { id: string; label: string; value: number; count: number }>();
    filteredAtaContratos.forEach((contrato) => {
      const current = map.get(contrato.fornecedor.id) ?? {
        id: contrato.fornecedor.id,
        label: contrato.fornecedor.nome,
        value: 0,
        count: 0,
      };
      current.count += 1;
      current.value += contrato.prePedidos.reduce((sum, prePedido) => {
        const valorUnitario = parseNumberString(prePedido.item.resultado?.valorUnitarioLicitado ?? 0);
        return sum + parseNumberString(prePedido.quantidadeSolicitada) * valorUnitario;
      }, 0);
      map.set(contrato.fornecedor.id, current);
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [filteredAtaContratos]);

  if (statsLoading || notifLoading || contratosLoading || departamentosLoading || entesLoading || (canManageArp && (atasLoading || ataContratosLoading))) {
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
          <p className="text-sm text-muted-foreground mt-2">
            {showEnteFilter
              ? "Voce esta visualizando os dados dos entes vinculados ao seu usuario e pode filtrar por ente."
              : "Voce esta visualizando somente os dados vinculados ao seu ente."}
          </p>
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
        <div className={`grid grid-cols-1 ${showEnteFilter ? "md:grid-cols-3 lg:grid-cols-6" : "md:grid-cols-3 lg:grid-cols-5"} gap-4`}>
          {showEnteFilter && (
            <div>
              <label className="text-sm font-medium mb-2 block">Ente</label>
              <Select value={filterEnte || "all"} onValueChange={(v) => setFilterEnte(v === "all" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todos os entes vinculados" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os entes vinculados</SelectItem>
                  {entesDisponiveis.map((ente) => <SelectItem key={ente.id} value={ente.id}>{ente.sigla}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
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
          <div>
            <label className="text-sm font-medium mb-2 block">Fonte de Recurso</label>
            <Select value={filterFonteRecurso || "all"} onValueChange={(v) => {
              const nextFonte = v === "all" ? "" : v;
              setFilterFonteRecurso(nextFonte);
              setFilterFicha("");
            }}>
              <SelectTrigger><SelectValue placeholder="Todas as fontes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fontes</SelectItem>
                {fontesDisponiveis.map((fonte) => <SelectItem key={fonte.id} value={fonte.id}>{fonte.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Ficha</label>
            <Select value={filterFicha || "all"} onValueChange={(v) => setFilterFicha(v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Todas as fichas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fichas</SelectItem>
                {fichasDisponiveis.map((ficha) => <SelectItem key={ficha.id} value={ficha.id}>{ficha.label}</SelectItem>)}
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

      {canManageArp && (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Execucao da ARP</h2>
          <p className="text-sm text-muted-foreground">Acompanhe previsto, contratado, empenhado, faturado e pago das atas de registro de preco.</p>
        </div>
        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg">Filtros da ARP</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ata de RP</label>
                <Select value={filterAtaRegistroPreco || "all"} onValueChange={(v) => setFilterAtaRegistroPreco(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Todas as atas" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as atas</SelectItem>
                    {atasArpDisponiveis.map((ata) => <SelectItem key={ata.id} value={ata.id}>{ata.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Processo da ARP</label>
                <Select value={filterAtaProcesso || "all"} onValueChange={(v) => setFilterAtaProcesso(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos os processos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os processos</SelectItem>
                    {processosArpDisponiveis.map((processo) => <SelectItem key={processo.id} value={processo.id}>{processo.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Participante</label>
                <Select value={filterAtaParticipante || "all"} onValueChange={(v) => setFilterAtaParticipante(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos os participantes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os participantes</SelectItem>
                    {participantesArpDisponiveis.map((participante) => <SelectItem key={participante.id} value={participante.id}>{participante.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Fornecedor da ARP</label>
                <Select value={filterAtaFornecedor || "all"} onValueChange={(v) => setFilterAtaFornecedor(v === "all" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Todos os fornecedores" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os fornecedores</SelectItem>
                    {fornecedoresArpDisponiveis.map((fornecedor) => <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="border-border/50 shadow-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Previsto Cotado</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(arpMetrics.previstoCotado)}</h3>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Previsto Licitado</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(arpMetrics.previstoLicitado)}</h3>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Contratado / Empenhado</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(arpMetrics.contratado)}</h3>
              <p className="text-xs text-muted-foreground mt-2">Empenhado: {formatCurrency(arpMetrics.empenhado)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-md">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Em AF / Faturado / Pago</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(arpMetrics.emAf)}</h3>
              <p className="text-xs text-muted-foreground mt-2">Faturado: {formatCurrency(arpMetrics.faturado)} | Pago: {formatCurrency(arpMetrics.pago)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50 shadow-md">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg">ARP por Departamento</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 max-h-[320px] overflow-auto">
                {arpResumoDepartamentos.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">Nenhuma ARP cadastrada</div>
                ) : (
                  arpResumoDepartamentos.map((departamento) => (
                    <div key={departamento.id} className="p-4 flex justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{departamento.label}</p>
                        <p className="text-xs text-muted-foreground">Previsto: {formatCurrency(departamento.previsto)}</p>
                      </div>
                      <p className="font-semibold text-sm">{formatCurrency(departamento.contratado)}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-md">
            <CardHeader className="border-b border-border/50 bg-muted/20">
              <CardTitle className="text-lg">Contratos ARP por Fornecedor</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50 max-h-[320px] overflow-auto">
                {arpResumoFornecedores.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">Nenhum contrato ARP cadastrado</div>
                ) : (
                  arpResumoFornecedores.map((fornecedor) => (
                    <div key={fornecedor.id} className="p-4 flex justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm">{fornecedor.label}</p>
                        <p className="text-xs text-muted-foreground">{fornecedor.count} contrato(s) ARP</p>
                      </div>
                      <p className="font-semibold text-sm">{formatCurrency(fornecedor.value)}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      )}

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
          <CardHeader className="border-b border-border/50 bg-muted/20"><CardTitle className="text-lg">Valor e Execucao por Fonte</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[360px] overflow-auto">
              {fontesResumo.length === 0 ? <div className="p-4 text-center text-muted-foreground">Nenhum empenho com fonte cadastrada</div> : fontesResumo.map((fonte) => (
                <div key={fonte.id} className="p-4 flex justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{fonte.label}</p>
                    <p className="text-xs text-muted-foreground">Execucao: {formatCurrency(fonte.execucao)}</p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(fonte.valor)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20"><CardTitle className="text-lg">Valor e Execucao por Ficha</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[360px] overflow-auto">
              {fichasResumo.length === 0 ? <div className="p-4 text-center text-muted-foreground">Nenhum empenho com ficha cadastrada</div> : fichasResumo.map((ficha) => (
                <div key={ficha.id} className="p-4 flex justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{ficha.label}</p>
                    <p className="text-xs text-muted-foreground">Execucao: {formatCurrency(ficha.execucao)}</p>
                  </div>
                  <p className="font-semibold text-sm">{formatCurrency(ficha.valor)}</p>
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

        <Card className="border-border/50 shadow-md">
          <CardHeader className="border-b border-border/50 bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={20} />Evolucao Mensal</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-blue-500" />
                Empenhado
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-500" />
                Executado
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                Pago
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 items-end min-h-[260px]">
              {evolucaoMensal.map((item) => (
                <div key={item.id} className="flex flex-col items-center gap-3">
                  <div className="w-full h-[180px] flex items-end justify-center gap-2 rounded-lg bg-muted/20 px-2 py-3">
                    <div
                      className="w-4 rounded-t bg-blue-500"
                      style={{ height: `${Math.max((item.empenhado / evolucaoMensalMax) * 100, item.empenhado > 0 ? 6 : 0)}%` }}
                      title={`Empenhado: ${formatCurrency(item.empenhado)}`}
                    />
                    <div
                      className="w-4 rounded-t bg-amber-500"
                      style={{ height: `${Math.max((item.executado / evolucaoMensalMax) * 100, item.executado > 0 ? 6 : 0)}%` }}
                      title={`Executado: ${formatCurrency(item.executado)}`}
                    />
                    <div
                      className="w-4 rounded-t bg-emerald-500"
                      style={{ height: `${Math.max((item.pago / evolucaoMensalMax) * 100, item.pago > 0 ? 6 : 0)}%` }}
                      title={`Pago: ${formatCurrency(item.pago)}`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">Pg. {formatCurrency(item.pago)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
