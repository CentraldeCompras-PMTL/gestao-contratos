import { useMemo, useState } from "react";
import { useAtaPrePedidos, useAtaPrePedidosDisponiveis, useCreateAtaPrePedidoEmpenho, useCreateAtaPrePedidos, useDeleteAtaPrePedido } from "@/hooks/use-ata-pre-pedidos";
import { useAuth } from "@/hooks/use-auth";
import { useEntes } from "@/hooks/use-entes";
import { useFontesRecurso } from "@/hooks/use-fontes-recurso";
import {
  useCreateAtaAf,
  useCreateAtaNotaFiscal,
  useRegisterAtaNotaFiscalPayment,
  useSendAtaNotaFiscalToPayment,
} from "@/hooks/use-ata-contratos";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, parseNumberString } from "@/lib/formatters";
import { exportRowsToExcel, exportRowsToPdf, type ReportColumn } from "@/lib/report-export";
import { Download, FileText, Plus, Trash2 } from "lucide-react";
import type { AtaAf, AtaEmpenho, AtaNotaFiscal, AtaPrePedidoDisponivel, AtaPrePedidoWithRelations, FonteRecursoWithFichas } from "@shared/schema";

type PrePedidoLine = {
  id: string;
  itemId: string;
  fonteRecursoId: string;
  fichaId: string;
  quantidadeSolicitada: string;
  observacao: string;
};

type AtaAfWithNotasLike = AtaAf & { notasFiscais?: AtaNotaFiscal[] };
type AtaEmpenhoWithRelationsLike = AtaEmpenho & { afs?: AtaAfWithNotasLike[] };

function makeLine(): PrePedidoLine {
  return {
    id: Math.random().toString(36).slice(2),
    itemId: "",
    fonteRecursoId: "",
    fichaId: "",
    quantidadeSolicitada: "",
    observacao: "",
  };
}

const prePedidoExportColumns: ReportColumn[] = [
  { key: "ata", label: "Ata" },
  { key: "ente", label: "Ente" },
  { key: "item", label: "Item" },
  { key: "fornecedor", label: "Fornecedor" },
  { key: "fonte", label: "Fonte de Recurso" },
  { key: "ficha", label: "Ficha" },
  { key: "classificacao", label: "Classificacao" },
  { key: "quantidade", label: "Quantidade" },
  { key: "status", label: "Status" },
  { key: "contrato", label: "Contrato ARP" },
  { key: "observacao", label: "Observacao" },
];

const defaultEmpenhoForm = {
  dataEmpenho: "",
  numeroEmpenho: "",
  quantidadeEmpenhada: "",
  valorEmpenho: "",
};

const defaultAfForm = {
  dataPedidoAf: "",
  quantidadeAf: "",
  valorAf: "",
  dataEstimadaEntrega: "",
};

const defaultNotaForm = {
  numeroNota: "",
  quantidadeNota: "",
  valorNota: "",
  dataNota: "",
};

const defaultEnviarPagamentoForm = {
  numeroProcessoPagamento: "",
  dataEnvioPagamento: "",
};

const defaultRegistrarPagamentoForm = {
  dataPagamento: "",
};

function normalizeEnteName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function PrePedidosArpPage() {
  const { user } = useAuth();
  const { data: entes = [] } = useEntes();
  const { data: disponiveis = [], isLoading } = useAtaPrePedidosDisponiveis();
  const { data: prePedidos = [] } = useAtaPrePedidos();
  const { data: fontes = [] } = useFontesRecurso();
  const createPrePedidos = useCreateAtaPrePedidos();
  const createEmpenhoDireto = useCreateAtaPrePedidoEmpenho();
  const createAf = useCreateAtaAf();
  const createNotaFiscal = useCreateAtaNotaFiscal();
  const sendAtaNotaFiscalToPayment = useSendAtaNotaFiscalToPayment();
  const registerAtaNotaFiscalPayment = useRegisterAtaNotaFiscalPayment();
  const deletePrePedido = useDeleteAtaPrePedido();
  const { toast } = useToast();

  const [selectedDisponivel, setSelectedDisponivel] = useState<AtaPrePedidoDisponivel | null>(null);
  const [lines, setLines] = useState<PrePedidoLine[]>([makeLine()]);
  const [selectedPrePedidoEmpenho, setSelectedPrePedidoEmpenho] = useState<AtaPrePedidoWithRelations | null>(null);
  const [selectedAtaEmpenho, setSelectedAtaEmpenho] = useState<AtaEmpenho | null>(null);
  const [selectedAtaAf, setSelectedAtaAf] = useState<AtaAf | null>(null);
  const [selectedAtaNota, setSelectedAtaNota] = useState<AtaNotaFiscal | null>(null);
  const [selectedAtaNotaPagamento, setSelectedAtaNotaPagamento] = useState<AtaNotaFiscal | null>(null);
  const [empenhoForm, setEmpenhoForm] = useState(defaultEmpenhoForm);
  const [afForm, setAfForm] = useState(defaultAfForm);
  const [notaForm, setNotaForm] = useState(defaultNotaForm);
  const [enviarPagamentoForm, setEnviarPagamentoForm] = useState(defaultEnviarPagamentoForm);
  const [registrarPagamentoForm, setRegistrarPagamentoForm] = useState(defaultRegistrarPagamentoForm);
  const [selectedAtaId, setSelectedAtaId] = useState("");

  const canManageArp = useMemo(() => {
    if (user?.role === "admin") return true;
    if (!user?.canAccessAtaModule) return false;
    const accessible = new Set(user.accessibleEnteIds ?? []);
    return entes.some((ente) => {
      if (!accessible.has(ente.id)) return false;
      const nome = normalizeEnteName(ente.nome);
      const sigla = normalizeEnteName(ente.sigla);
      return nome.includes("fazenda") || sigla.includes("fazenda") || sigla === "sefaz";
    });
  }, [entes, user]);

  const groupedPrePedidos = useMemo(() => {
    return prePedidos.reduce<Record<string, typeof prePedidos>>((acc, current) => {
      const key = `${current.ataId}:${current.enteId}`;
      acc[key] = [...(acc[key] ?? []), current];
      return acc;
    }, {});
  }, [prePedidos]);

  const groupedPrePedidosAbertos = useMemo(
    () => Object.fromEntries(Object.entries(groupedPrePedidos).map(([key, items]) => [key, items.filter((item) => item.status === "aberto")])),
    [groupedPrePedidos],
  );

  const groupedPrePedidosConcluidos = useMemo(
    () => Object.fromEntries(Object.entries(groupedPrePedidos).map(([key, items]) => [key, items.filter((item) => item.status === "concluido" || Boolean(item.ataContratoId))])),
    [groupedPrePedidos],
  );

  const atasFiltro = useMemo(() => {
    const map = new Map<string, { id: string; numeroAta: string }>();

    disponiveis.forEach((ata) => {
      map.set(ata.id, { id: ata.id, numeroAta: ata.numeroAta });
    });

    prePedidos.forEach((prePedido) => {
      map.set(prePedido.ataId, { id: prePedido.ataId, numeroAta: prePedido.ata.numeroAta });
    });

    return Array.from(map.values()).sort((a, b) => a.numeroAta.localeCompare(b.numeroAta));
  }, [disponiveis, prePedidos]);

  const filteredDisponiveis = useMemo(
    () => disponiveis.filter((ata) => selectedAtaId && ata.id === selectedAtaId),
    [disponiveis, selectedAtaId],
  );

  const getFornecedorNome = (prePedido: AtaPrePedidoWithRelations) =>
    prePedido.item.resultado?.fornecedor?.nome ?? "-";

  const buildExportRows = (ata: AtaPrePedidoDisponivel) => {
    const rows = groupedPrePedidos[`${ata.id}:${ata.ente.id}`] ?? [];
    return rows.map((prePedido) => ({
      ata: prePedido.ata.numeroAta,
      ente: `${prePedido.ente.sigla} - ${prePedido.ente.nome}`,
      item: `${prePedido.item.codigoInterno} - ${prePedido.item.descricao}`,
      fornecedor: getFornecedorNome(prePedido),
      fonte: `${prePedido.fonteRecurso.codigo} - ${prePedido.fonteRecurso.nome}`,
      ficha: prePedido.ficha.codigo,
      classificacao: prePedido.ficha.classificacao,
      quantidade: prePedido.quantidadeSolicitada,
      status: prePedido.status,
      contrato: prePedido.ataContrato?.numeroContrato ?? "",
      observacao: prePedido.observacao ?? "",
    }));
  };

  const buildSinglePrePedidoRow = (prePedido: (typeof prePedidos)[number]) => ({
    ata: prePedido.ata.numeroAta,
    ente: `${prePedido.ente.sigla} - ${prePedido.ente.nome}`,
    item: `${prePedido.item.codigoInterno} - ${prePedido.item.descricao}`,
    fornecedor: getFornecedorNome(prePedido),
    fonte: `${prePedido.fonteRecurso.codigo} - ${prePedido.fonteRecurso.nome}`,
    ficha: prePedido.ficha.codigo,
    classificacao: prePedido.ficha.classificacao,
    quantidade: prePedido.quantidadeSolicitada,
    status: prePedido.status,
    contrato: prePedido.ataContrato?.numeroContrato ?? "",
    observacao: prePedido.observacao ?? "",
  });

  const exportPrePedidosExcel = (ata: AtaPrePedidoDisponivel) => {
    exportRowsToExcel(
      `pre_pedidos_arp_${ata.numeroAta}_${ata.ente.sigla}`.toLowerCase(),
      prePedidoExportColumns,
      buildExportRows(ata),
    );
  };

  const exportSinglePrePedidoExcel = (prePedido: (typeof prePedidos)[number]) => {
    exportRowsToExcel(
      `pre_pedido_${prePedido.id}`.toLowerCase(),
      prePedidoExportColumns,
      [buildSinglePrePedidoRow(prePedido)],
    );
  };

  const exportSinglePrePedidoPdf = (prePedido: (typeof prePedidos)[number]) => {
    exportRowsToPdf(
      `Pre-pedido ${prePedido.id} - ${prePedido.ente.sigla}`,
      `pre_pedido_${prePedido.id}`.toLowerCase(),
      prePedidoExportColumns,
      [buildSinglePrePedidoRow(prePedido)],
    );
  };

  const exportPrePedidosPdf = (ata: AtaPrePedidoDisponivel) => {
    exportRowsToPdf(
      `Pre-pedidos ARP - ${ata.numeroAta} - ${ata.ente.sigla}`,
      `pre_pedidos_arp_${ata.numeroAta}_${ata.ente.sigla}`.toLowerCase(),
      prePedidoExportColumns,
      buildExportRows(ata),
    );
  };

  const openDialog = (disponivel: AtaPrePedidoDisponivel) => {
    setSelectedDisponivel(disponivel);
    setLines([makeLine()]);
  };

  const getFonte = (id: string): FonteRecursoWithFichas | undefined => fontes.find((fonte) => fonte.id === id);

  const getQuantidadeEmpenhada = (prePedido: AtaPrePedidoWithRelations) =>
    (prePedido.empenhos ?? []).reduce((sum, empenho) => sum + parseNumberString(empenho.quantidadeEmpenhada), 0);

  const getSaldoEmpenho = (prePedido: AtaPrePedidoWithRelations) =>
    Math.max(parseNumberString(prePedido.quantidadeSolicitada) - getQuantidadeEmpenhada(prePedido), 0);

  const getQuantidadeAf = (empenho: AtaEmpenhoWithRelationsLike) =>
    (empenho.afs ?? []).reduce((sum, af) => sum + parseNumberString(af.quantidadeAf), 0);

  const getSaldoAf = (empenho: AtaEmpenhoWithRelationsLike) =>
    Math.max(parseNumberString(empenho.quantidadeEmpenhada) - getQuantidadeAf(empenho), 0);

  const getQuantidadeNota = (af: AtaAfWithNotasLike) =>
    (af.notasFiscais ?? []).reduce((sum, nota) => sum + parseNumberString(nota.quantidadeNota), 0);

  const getSaldoNota = (af: AtaAfWithNotasLike) =>
    Math.max(parseNumberString(af.quantidadeAf) - getQuantidadeNota(af), 0);

  const getSaldoDisponivel = (itemId: string) => {
    if (!selectedDisponivel) return 0;
    const item = selectedDisponivel.itens.find((entry) => entry.id === itemId);
    if (!item) return 0;
    const currentLines = lines
      .filter((line) => line.itemId === itemId)
      .reduce((sum, line) => sum + parseNumberString(line.quantidadeSolicitada || "0"), 0);
    return Math.max(item.quantidadeDisponivel - currentLines, 0);
  };

  const handleCreateEmpenhoDireto = () => {
    if (!selectedPrePedidoEmpenho) return;
    createEmpenhoDireto.mutate(
      {
        id: selectedPrePedidoEmpenho.id,
        data: empenhoForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setSelectedPrePedidoEmpenho(null);
          setEmpenhoForm(defaultEmpenhoForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar empenho direto da ARP" });
        },
      },
    );
  };

  const handleCreateAf = () => {
    if (!selectedAtaEmpenho) return;
    createAf.mutate(
      {
        ataEmpenhoId: selectedAtaEmpenho.id,
        data: afForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setSelectedAtaEmpenho(null);
          setAfForm(defaultAfForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar AF da ARP" });
        },
      },
    );
  };

  const handleCreateNota = () => {
    if (!selectedAtaAf) return;
    createNotaFiscal.mutate(
      {
        ataAfId: selectedAtaAf.id,
        data: notaForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setSelectedAtaAf(null);
          setNotaForm(defaultNotaForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar nota da ARP" });
        },
      },
    );
  };

  const handleEnviarPagamento = () => {
    if (!selectedAtaNota) return;
    sendAtaNotaFiscalToPayment.mutate(
      {
        ataNotaFiscalId: selectedAtaNota.id,
        data: enviarPagamentoForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          setSelectedAtaNota(null);
          setEnviarPagamentoForm(defaultEnviarPagamentoForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao enviar nota para pagamento" });
        },
      },
    );
  };

  const handleRegistrarPagamento = () => {
    if (!selectedAtaNotaPagamento) return;
    registerAtaNotaFiscalPayment.mutate(
      {
        ataNotaFiscalId: selectedAtaNotaPagamento.id,
        data: registrarPagamentoForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          setSelectedAtaNotaPagamento(null);
          setRegistrarPagamentoForm(defaultRegistrarPagamentoForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao registrar pagamento da nota" });
        },
      },
    );
  };

  const handleSubmit = () => {
    if (!selectedDisponivel) return;
    const pedidos = lines.filter((line) => line.itemId && line.fonteRecursoId && line.fichaId && parseNumberString(line.quantidadeSolicitada || "0") > 0);
    if (pedidos.length === 0) {
      toast({ variant: "destructive", title: "Erro", description: "Adicione pelo menos uma linha valida de pre-pedido." });
      return;
    }

    createPrePedidos.mutate(
      {
        ataId: selectedDisponivel.id,
        enteId: selectedDisponivel.ente.id,
        pedidos: pedidos.map((line) => ({
          itemId: line.itemId,
          fonteRecursoId: line.fonteRecursoId,
          fichaId: line.fichaId,
          quantidadeSolicitada: line.quantidadeSolicitada,
          observacao: line.observacao || null,
        })),
      },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setSelectedDisponivel(null);
          setLines([makeLine()]);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar pre-pedidos" });
        },
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pre-pedidos de ARP</h1>
        <p className="text-muted-foreground mt-1">Solicite itens da ata por fonte de recurso e ficha, respeitando o saldo licitado do seu ente.</p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ata de Registro de Preco</Label>
              <Select value={selectedAtaId || "none"} onValueChange={(value) => setSelectedAtaId(value === "none" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma ata" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione uma ata</SelectItem>
                  {atasFiltro.map((ata) => (
                    <SelectItem key={ata.id} value={ata.id}>
                      {ata.numeroAta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Carregando saldos disponiveis...</CardContent></Card>
      ) : !selectedAtaId ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Selecione uma ata para visualizar os pre-pedidos.</CardContent></Card>
      ) : filteredDisponiveis.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhuma ata disponivel para pre-pedido.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredDisponiveis.map((ata) => (
            <Card key={`${ata.id}:${ata.ente.id}`} className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>{ata.numeroAta}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{ata.processoDigital.numeroProcessoDigital}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">{ata.status}</Badge>
                    <Badge variant="outline">{ata.ente.sigla}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportPrePedidosExcel(ata)}>
                    <Download className="mr-2" size={16} />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportPrePedidosPdf(ata)}>
                    <FileText className="mr-2" size={16} />
                    PDF
                  </Button>
                  <Button onClick={() => openDialog(ata)}>Novo Pre-pedido</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{ata.objeto}</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Cotado</TableHead>
                      <TableHead>Licitado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ata.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.codigoInterno} - {item.descricao}</TableCell>
                        <TableCell>{item.quantidadeDisponivel}</TableCell>
                        <TableCell>{item.cotacao?.valorUnitarioCotado ? formatCurrency(item.cotacao.valorUnitarioCotado) : "-"}</TableCell>
                        <TableCell>{item.resultado?.itemFracassado ? "Fracassado" : item.resultado?.valorUnitarioLicitado ? formatCurrency(item.resultado.valorUnitarioLicitado) : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Pre-pedidos cadastrados</p>
                  <Tabs defaultValue="abertos" className="space-y-3">
                    <TabsList>
                      <TabsTrigger value="abertos">Em aberto</TabsTrigger>
                      <TabsTrigger value="concluidos">Concluidos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="abertos">
                      {(groupedPrePedidosAbertos[`${ata.id}:${ata.ente.id}`] ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum pre-pedido em aberto.</p>
                      ) : (
                        <div className="space-y-2">
                          {(groupedPrePedidosAbertos[`${ata.id}:${ata.ente.id}`] ?? []).map((prePedido) => (
                            <div key={prePedido.id} className="rounded-lg border p-3 text-sm space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-muted-foreground">Pre-pedido {prePedido.id}</p>
                                  <p className="font-medium">{prePedido.item.codigoInterno} - {prePedido.item.descricao}</p>
                                  <p className="text-muted-foreground">
                                    {prePedido.fonteRecurso.codigo} / {prePedido.ficha.codigo} / Qtd. {prePedido.quantidadeSolicitada}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Saldo para empenho: {getSaldoEmpenho(prePedido)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => exportSinglePrePedidoExcel(prePedido)}>
                                    <Download size={16} />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => exportSinglePrePedidoPdf(prePedido)}>
                                    <FileText size={16} />
                                  </Button>
                                  {canManageArp && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedPrePedidoEmpenho(prePedido);
                                        setEmpenhoForm(defaultEmpenhoForm);
                                      }}
                                      disabled={getSaldoEmpenho(prePedido) <= 0}
                                    >
                                      Empenhar
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (!window.confirm(`Deseja realmente excluir o pre-pedido ${prePedido.id}?`)) return;
                                      deletePrePedido.mutate(prePedido.id, {
                                        onSuccess: () => toast({ title: "Registro excluido com sucesso!" }),
                                        onError: (error) => toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao excluir pre-pedido" }),
                                      });
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              </div>

                              {(prePedido.empenhos?.length ?? 0) > 0 && (
                                <div className="space-y-2 border-t pt-3">
                                  {prePedido.empenhos!.map((empenho) => (
                                    <div key={empenho.id} className="rounded-md bg-muted/20 p-3 space-y-2">
                                      <div className="flex items-center justify-between gap-3">
                                        <div>
                                          <p className="font-medium">Empenho {empenho.numeroEmpenho}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Qtd. {empenho.quantidadeEmpenhada} | Valor {formatCurrency(empenho.valorEmpenho)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">Saldo para AF: {getSaldoAf(empenho)}</p>
                                        </div>
                                        {canManageArp && (
                                          <Button variant="outline" size="sm" onClick={() => { setSelectedAtaEmpenho(empenho); setAfForm(defaultAfForm); }}>
                                            Nova AF
                                          </Button>
                                        )}
                                      </div>
                                      {(empenho.afs?.length ?? 0) > 0 && (
                                        <div className="space-y-2">
                                          {empenho.afs!.map((af) => (
                                            <div key={af.id} className="rounded-md border p-3 space-y-2">
                                              <div className="flex items-center justify-between gap-3">
                                                <div>
                                                  <p className="font-medium">AF {new Date(`${af.dataPedidoAf}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    Qtd. {af.quantidadeAf} | Valor {formatCurrency(af.valorAf)} | Saldo nota: {getSaldoNota(af)}
                                                  </p>
                                                </div>
                                                {canManageArp && (
                                                  <Button variant="outline" size="sm" onClick={() => { setSelectedAtaAf(af); setNotaForm(defaultNotaForm); }}>
                                                    Nova Nota
                                                  </Button>
                                                )}
                                              </div>
                                              {(af.notasFiscais?.length ?? 0) > 0 && (
                                                <div className="space-y-1">
                                                  {af.notasFiscais!.map((nota) => (
                                                    <div key={nota.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                                                      <div>
                                                        <p className="text-sm font-medium">{nota.numeroNota}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                          Qtd. {nota.quantidadeNota} | Valor {formatCurrency(nota.valorNota)} | {nota.statusPagamento}
                                                        </p>
                                                      </div>
                                                      {canManageArp && (
                                                        <div className="flex items-center gap-2">
                                                          {nota.statusPagamento === "nota_recebida" && (
                                                            <Button variant="outline" size="sm" onClick={() => { setSelectedAtaNota(nota); setEnviarPagamentoForm(defaultEnviarPagamentoForm); }}>
                                                              Enviar
                                                            </Button>
                                                          )}
                                                          {nota.statusPagamento === "aguardando_pagamento" && (
                                                            <Button variant="outline" size="sm" onClick={() => { setSelectedAtaNotaPagamento(nota); setRegistrarPagamentoForm(defaultRegistrarPagamentoForm); }}>
                                                              Pagar
                                                            </Button>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="concluidos">
                      {(groupedPrePedidosConcluidos[`${ata.id}:${ata.ente.id}`] ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum pre-pedido concluido.</p>
                      ) : (
                        <div className="space-y-2">
                          {(groupedPrePedidosConcluidos[`${ata.id}:${ata.ente.id}`] ?? []).map((prePedido) => (
                            <div key={prePedido.id} className="rounded-lg border p-3 text-sm space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Pre-pedido {prePedido.id}</p>
                                  <p className="font-medium">{prePedido.item.codigoInterno} - {prePedido.item.descricao}</p>
                                  <p className="text-muted-foreground">
                                    {prePedido.fonteRecurso.codigo} / {prePedido.ficha.codigo} / Qtd. {prePedido.quantidadeSolicitada}
                                  </p>
                                  {prePedido.ataContrato && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Vinculado ao contrato {prePedido.ataContrato.numeroContrato}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="sm" onClick={() => exportSinglePrePedidoExcel(prePedido)}>
                                    <Download size={16} />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => exportSinglePrePedidoPdf(prePedido)}>
                                    <FileText size={16} />
                                  </Button>
                                </div>
                              </div>

                              {(prePedido.empenhos?.length ?? 0) > 0 && (
                                <div className="space-y-2 border-t pt-3">
                                  {prePedido.empenhos!.map((empenho) => (
                                    <div key={empenho.id} className="rounded-md bg-muted/20 p-3 space-y-2">
                                      <div className="flex items-center justify-between gap-3">
                                        <div>
                                          <p className="font-medium">Empenho {empenho.numeroEmpenho}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Qtd. {empenho.quantidadeEmpenhada} | Valor {formatCurrency(empenho.valorEmpenho)}
                                          </p>
                                        </div>
                                        {canManageArp && (
                                          <Button variant="outline" size="sm" onClick={() => { setSelectedAtaEmpenho(empenho); setAfForm(defaultAfForm); }}>
                                            Nova AF
                                          </Button>
                                        )}
                                      </div>
                                      {(empenho.afs?.length ?? 0) > 0 && (
                                        <div className="space-y-2">
                                          {empenho.afs!.map((af) => (
                                            <div key={af.id} className="rounded-md border p-3 space-y-2">
                                              <div className="flex items-center justify-between gap-3">
                                                <div>
                                                  <p className="font-medium">AF {new Date(`${af.dataPedidoAf}T00:00:00`).toLocaleDateString("pt-BR")}</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    Qtd. {af.quantidadeAf} | Valor {formatCurrency(af.valorAf)} | Saldo nota: {getSaldoNota(af)}
                                                  </p>
                                                </div>
                                                {canManageArp && (
                                                  <Button variant="outline" size="sm" onClick={() => { setSelectedAtaAf(af); setNotaForm(defaultNotaForm); }}>
                                                    Nova Nota
                                                  </Button>
                                                )}
                                              </div>
                                              {(af.notasFiscais?.length ?? 0) > 0 && (
                                                <div className="space-y-1">
                                                  {af.notasFiscais!.map((nota) => (
                                                    <div key={nota.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                                                      <div>
                                                        <p className="text-sm font-medium">{nota.numeroNota}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                          Qtd. {nota.quantidadeNota} | Valor {formatCurrency(nota.valorNota)} | {nota.statusPagamento}
                                                        </p>
                                                      </div>
                                                      {canManageArp && (
                                                        <div className="flex items-center gap-2">
                                                          {nota.statusPagamento === "nota_recebida" && (
                                                            <Button variant="outline" size="sm" onClick={() => { setSelectedAtaNota(nota); setEnviarPagamentoForm(defaultEnviarPagamentoForm); }}>
                                                              Enviar
                                                            </Button>
                                                          )}
                                                          {nota.statusPagamento === "aguardando_pagamento" && (
                                                            <Button variant="outline" size="sm" onClick={() => { setSelectedAtaNotaPagamento(nota); setRegistrarPagamentoForm(defaultRegistrarPagamentoForm); }}>
                                                              Pagar
                                                            </Button>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedDisponivel} onOpenChange={(open) => { if (!open) setSelectedDisponivel(null); }}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Pre-pedido da Ata {selectedDisponivel?.numeroAta}</DialogTitle>
          </DialogHeader>
          {selectedDisponivel && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Participante</p>
                  <p className="font-medium">{selectedDisponivel.ente.sigla} - {selectedDisponivel.ente.nome}</p>
                </div>
                <Button variant="outline" onClick={() => setLines((current) => [...current, makeLine()])}>
                  <Plus className="mr-2" size={16} /> Inserir mais fontes e fichas
                </Button>
              </div>

              <div className="space-y-4">
                {lines.map((line, index) => {
                  const selectedItem = selectedDisponivel.itens.find((item) => item.id === line.itemId);
                  const fonte = getFonte(line.fonteRecursoId);
                  const fichas = fonte?.fichas ?? [];
                  return (
                    <div key={line.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Linha {index + 1}</p>
                        {lines.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setLines((current) => current.filter((entry) => entry.id !== line.id))}>
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                        <div className="space-y-2 xl:col-span-2">
                          <Label>Item</Label>
                          <Select value={line.itemId} onValueChange={(value) => setLines((current) => current.map((entry) => entry.id === line.id ? { ...entry, itemId: value } : entry))}>
                            <SelectTrigger><SelectValue placeholder="Selecione o item" /></SelectTrigger>
                            <SelectContent>
                              {selectedDisponivel.itens.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.codigoInterno} - {item.descricao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedItem && (
                            <p className="text-xs text-muted-foreground">
                              Disponivel para o ente: {getSaldoDisponivel(line.itemId) + parseNumberString(line.quantidadeSolicitada || "0")}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Fonte</Label>
                          <Select value={line.fonteRecursoId} onValueChange={(value) => setLines((current) => current.map((entry) => entry.id === line.id ? { ...entry, fonteRecursoId: value, fichaId: "" } : entry))}>
                            <SelectTrigger><SelectValue placeholder="Fonte" /></SelectTrigger>
                            <SelectContent>
                              {fontes.map((fonteEntry) => (
                                <SelectItem key={fonteEntry.id} value={fonteEntry.id}>{fonteEntry.codigo} - {fonteEntry.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ficha</Label>
                          <Select value={line.fichaId} onValueChange={(value) => setLines((current) => current.map((entry) => entry.id === line.id ? { ...entry, fichaId: value } : entry))}>
                            <SelectTrigger><SelectValue placeholder="Ficha" /></SelectTrigger>
                            <SelectContent>
                              {fichas.map((ficha) => (
                                <SelectItem key={ficha.id} value={ficha.id}>{ficha.codigo} - {ficha.classificacao}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Quantidade</Label>
                          <Input
                            value={line.quantidadeSolicitada}
                            onChange={(e) => setLines((current) => current.map((entry) => entry.id === line.id ? { ...entry, quantidadeSolicitada: e.target.value } : entry))}
                            placeholder="0,00"
                          />
                          {line.itemId && (
                            <p className="text-xs text-muted-foreground">Saldo restante: {getSaldoDisponivel(line.itemId)}</p>
                          )}
                        </div>
                        <div className="space-y-2 md:col-span-2 xl:col-span-5">
                          <Label>Observacao</Label>
                          <Textarea
                            value={line.observacao}
                            onChange={(e) => setLines((current) => current.map((entry) => entry.id === line.id ? { ...entry, observacao: e.target.value } : entry))}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button className="w-full" onClick={handleSubmit} disabled={createPrePedidos.isPending}>
                {createPrePedidos.isPending ? "Salvando..." : "Salvar Pre-pedidos"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPrePedidoEmpenho} onOpenChange={(open) => { if (!open) setSelectedPrePedidoEmpenho(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Empenho Direto do Pre-pedido</DialogTitle>
          </DialogHeader>
          {selectedPrePedidoEmpenho && (
            <div className="space-y-4">
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                Saldo disponivel para empenho: {getSaldoEmpenho(selectedPrePedidoEmpenho)}
              </div>
              <div className="space-y-2">
                <Label>Numero do Empenho</Label>
                <Input value={empenhoForm.numeroEmpenho} onChange={(e) => setEmpenhoForm((current) => ({ ...current, numeroEmpenho: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data do Empenho</Label>
                <Input type="date" value={empenhoForm.dataEmpenho} onChange={(e) => setEmpenhoForm((current) => ({ ...current, dataEmpenho: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Quantidade Empenhada</Label>
                <Input value={empenhoForm.quantidadeEmpenhada} onChange={(e) => setEmpenhoForm((current) => ({ ...current, quantidadeEmpenhada: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor do Empenho</Label>
                <Input value={empenhoForm.valorEmpenho} onChange={(e) => setEmpenhoForm((current) => ({ ...current, valorEmpenho: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreateEmpenhoDireto} disabled={createEmpenhoDireto.isPending}>
                {createEmpenhoDireto.isPending ? "Salvando..." : "Salvar Empenho"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAtaEmpenho} onOpenChange={(open) => { if (!open) setSelectedAtaEmpenho(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar AF da ARP</DialogTitle>
          </DialogHeader>
          {selectedAtaEmpenho && (
            <div className="space-y-4">
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                Saldo disponivel para AF: {getSaldoAf(selectedAtaEmpenho as AtaEmpenhoWithRelationsLike)}
              </div>
              <div className="space-y-2">
                <Label>Data do Pedido</Label>
                <Input type="date" value={afForm.dataPedidoAf} onChange={(e) => setAfForm((current) => ({ ...current, dataPedidoAf: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Quantidade da AF</Label>
                <Input value={afForm.quantidadeAf} onChange={(e) => setAfForm((current) => ({ ...current, quantidadeAf: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor da AF</Label>
                <Input value={afForm.valorAf} onChange={(e) => setAfForm((current) => ({ ...current, valorAf: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data Estimada de Entrega</Label>
                <Input type="date" value={afForm.dataEstimadaEntrega} onChange={(e) => setAfForm((current) => ({ ...current, dataEstimadaEntrega: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreateAf} disabled={createAf.isPending}>
                {createAf.isPending ? "Salvando..." : "Salvar AF"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAtaAf} onOpenChange={(open) => { if (!open) setSelectedAtaAf(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nota Fiscal da ARP</DialogTitle>
          </DialogHeader>
          {selectedAtaAf && (
            <div className="space-y-4">
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                Saldo disponivel para nota: {getSaldoNota(selectedAtaAf as AtaAfWithNotasLike)}
              </div>
              <div className="space-y-2">
                <Label>Numero da Nota</Label>
                <Input value={notaForm.numeroNota} onChange={(e) => setNotaForm((current) => ({ ...current, numeroNota: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Quantidade da Nota</Label>
                <Input value={notaForm.quantidadeNota} onChange={(e) => setNotaForm((current) => ({ ...current, quantidadeNota: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Valor da Nota</Label>
                <Input value={notaForm.valorNota} onChange={(e) => setNotaForm((current) => ({ ...current, valorNota: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data da Nota</Label>
                <Input type="date" value={notaForm.dataNota} onChange={(e) => setNotaForm((current) => ({ ...current, dataNota: e.target.value }))} />
              </div>
              <Button className="w-full" onClick={handleCreateNota} disabled={createNotaFiscal.isPending}>
                {createNotaFiscal.isPending ? "Salvando..." : "Salvar Nota"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAtaNota} onOpenChange={(open) => { if (!open) setSelectedAtaNota(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Nota para Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Numero do Processo</Label>
              <Input value={enviarPagamentoForm.numeroProcessoPagamento} onChange={(e) => setEnviarPagamentoForm((current) => ({ ...current, numeroProcessoPagamento: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data do Envio</Label>
              <Input type="date" value={enviarPagamentoForm.dataEnvioPagamento} onChange={(e) => setEnviarPagamentoForm((current) => ({ ...current, dataEnvioPagamento: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleEnviarPagamento} disabled={sendAtaNotaFiscalToPayment.isPending}>
              {sendAtaNotaFiscalToPayment.isPending ? "Salvando..." : "Enviar para Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAtaNotaPagamento} onOpenChange={(open) => { if (!open) setSelectedAtaNotaPagamento(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input type="date" value={registrarPagamentoForm.dataPagamento} onChange={(e) => setRegistrarPagamentoForm((current) => ({ ...current, dataPagamento: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleRegistrarPagamento} disabled={registerAtaNotaFiscalPayment.isPending}>
              {registerAtaNotaFiscalPayment.isPending ? "Salvando..." : "Registrar Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
