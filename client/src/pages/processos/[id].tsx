import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import {
  useProcesso,
  useAddParticipante,
  useRemoveParticipante,
  useAddDotacao,
  useRemoveDotacao,
  useCreateProcessoItem,
  useUpdateProcessoItem,
  useDeleteProcessoItem,
  useSaveProcessoQuantidades,
  useSaveProcessoCotacoes,
  useSaveProcessoResultados,
} from "@/hooks/use-processos";
import { useEntes } from "@/hooks/use-entes";
import { useFontesRecurso } from "@/hooks/use-fontes-recurso";
import { useFornecedores } from "@/hooks/use-fornecedores";
import {
  ArrowLeft, Package, DollarSign, Trophy, Settings, Plus, Trash2,
  Users, BookOpen, FileText, BarChart3, Building2, Calendar,
  Edit2, Save, X, AlertTriangle, CheckCircle2, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planejamento: { label: "Planejamento", color: "bg-blue-500/15 text-blue-600 border-blue-200" },
  cotacao: { label: "Cotação", color: "bg-amber-500/15 text-amber-600 border-amber-200" },
  licitada: { label: "Licitada", color: "bg-violet-500/15 text-violet-600 border-violet-200" },
  aguardando_contrato: { label: "Aguardando Contrato", color: "bg-orange-500/15 text-orange-600 border-orange-200" },
  finalizado: { label: "Finalizado", color: "bg-emerald-500/15 text-emerald-600 border-emerald-200" },
  cancelado: { label: "Cancelado", color: "bg-red-500/15 text-red-600 border-red-200" },
};

function normalizeDecimalInput(value: string) {
  return value.replace(/[^\d.,]/g, "").replace(/\./g, ",");
}

function toStorageDecimal(value: string) {
  return value.replace(",", ".");
}

function toDisplayDecimal(value: string | number | null | undefined) {
  if (value == null) return "";
  return String(value).replace(".", ",");
}

function getFichaClassificacaoLabel(classificacao: any) {
  if (!classificacao) return "-";
  return typeof classificacao === "string" ? classificacao : classificacao.nome ?? "-";
}

export default function ProcessoDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: processo, isLoading } = useProcesso(id ?? "");
  const { data: entes = [] } = useEntes();
  const { data: fontes = [] } = useFontesRecurso();
  const { data: fornecedores = [] } = useFornecedores();
  const { toast } = useToast();

  // Hooks
  const addParticipante = useAddParticipante();
  const removeParticipante = useRemoveParticipante();
  const addDotacao = useAddDotacao();
  const removeDotacao = useRemoveDotacao();
  const createItem = useCreateProcessoItem();
  const updateItem = useUpdateProcessoItem();
  const deleteItem = useDeleteProcessoItem();
  const saveQuantidades = useSaveProcessoQuantidades();
  const saveCotacoes = useSaveProcessoCotacoes();
  const saveResultados = useSaveProcessoResultados();

  // States
  const [participanteDialog, setParticipanteDialog] = useState(false);
  const [selectedEnte, setSelectedEnte] = useState("");

  const [dotacaoDialog, setDotacaoDialog] = useState(false);
  const [dotacaoForm, setDotacaoForm] = useState({ fichaId: "", ano: "", valor: "" });
  const [selectedFonte, setSelectedFonte] = useState("");

  const [itemDialog, setItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState({ codigoInterno: "", descricao: "", unidadeMedida: "" });

  const [qtdDialog, setQtdDialog] = useState(false);
  const [activeItemForQtd, setActiveItemForQtd] = useState<any>(null);
  const [quantidadesForm, setQuantidadesForm] = useState<Record<string, string>>({});

  const [cotacoesForm, setCotacoesForm] = useState<Record<string, string>>({});
  const [resultadosForm, setResultadosForm] = useState<Record<string, { valor: string; fracassado: boolean; fornecedorId: string }>>({});

  // Computed
  const itens = (processo as any)?.itens ?? [];
  const dotacoes = (processo as any)?.dotacoes ?? [];
  const participantes = processo?.participantes ?? [];
  
  const allParticipantes = useMemo(() => {
    if (!processo) return [];
    // O gestor tambem e participante implicito
    const gestor = processo.ente;
    const parts = participantes.map((p: any) => p.ente);
    if (gestor && !parts.find((p: any) => p.id === gestor.id)) {
      return [gestor, ...parts];
    }
    return parts;
  }, [processo, participantes]);

  const participantesIds = new Set(participantes.map((p: any) => p.enteId));
  const availableEntes = entes
    .filter((e) => typeof e.nome === "string" && typeof e.sigla === "string")
    .filter((e) => !participantesIds.has(e.id) && e.id !== processo?.enteId)
    .sort((a, b) => a.nome.localeCompare(b.nome));
  const selectedFonteData = fontes.find((f) => f.id === selectedFonte);

  const valorEstimado = useMemo(() => itens.reduce((acc: number, item: any) => {
    const qtd = (item.quantidades ?? []).reduce((s: number, q: any) => s + Number(q.quantidade || 0), 0);
    return acc + (qtd * Number(item.cotacao?.valorUnitarioCotado || 0));
  }, 0), [itens]);

  const valorExecutado = useMemo(() => itens.reduce((acc: number, item: any) => {
    if (item.resultado?.itemFracassado) return acc;
    const qtd = (item.quantidades ?? []).reduce((s: number, q: any) => s + Number(q.quantidade || 0), 0);
    return acc + (qtd * Number(item.resultado?.valorUnitarioLicitado || 0));
  }, 0), [itens]);

  // Handlers
  const handleAddParticipante = () => {
    if (!selectedEnte || !id) return;
    addParticipante.mutate({ id, enteId: selectedEnte }, {
      onSuccess: () => { toast({ title: "Secretaria adicionada!" }); setParticipanteDialog(false); setSelectedEnte(""); },
      onError: (e) => toast({ variant: "destructive", title: "Erro", description: e instanceof Error ? e.message : "Erro" }),
    });
  };

  const handleRemoveParticipante = (enteId: string) => {
    if (!id) return;
    removeParticipante.mutate({ id, enteId }, {
      onSuccess: () => toast({ title: "Secretaria removida!" }),
      onError: (e) => toast({ variant: "destructive", title: "Erro", description: e instanceof Error ? e.message : "Erro" }),
    });
  };

  const handleAddDotacao = () => {
    if (!dotacaoForm.fichaId || !dotacaoForm.ano || !id) return;
    addDotacao.mutate({ id, fichaOrcamentariaId: dotacaoForm.fichaId, anoDotacao: dotacaoForm.ano, valorEstimado: dotacaoForm.valor || undefined }, {
      onSuccess: () => { toast({ title: "Dotação adicionada!" }); setDotacaoDialog(false); setDotacaoForm({ fichaId: "", ano: "", valor: "" }); setSelectedFonte(""); },
      onError: (e) => toast({ variant: "destructive", title: "Erro", description: e instanceof Error ? e.message : "Erro" }),
    });
  };

  const handleRemoveDotacao = (dotacaoId: string) => {
    if (!id) return;
    removeDotacao.mutate({ id, dotacaoId }, {
      onSuccess: () => toast({ title: "Dotação removida!" }),
      onError: (e) => toast({ variant: "destructive", title: "Erro", description: e instanceof Error ? e.message : "Erro" }),
    });
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (editingItem) {
      updateItem.mutate({ itemId: editingItem.id, data: itemForm }, {
        onSuccess: () => { toast({ title: "Item atualizado!" }); setItemDialog(false); setEditingItem(null); },
        onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
      });
    } else {
      createItem.mutate({ id, data: itemForm }, {
        onSuccess: () => { toast({ title: "Item criado!" }); setItemDialog(false); setItemForm({ codigoInterno: "", descricao: "", unidadeMedida: "" }); },
        onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
      });
    }
  };

  const openQtdDialog = (item: any) => {
    const form: Record<string, string> = {};
    item.quantidades?.forEach((q: any) => {
      form[q.enteId] = toDisplayDecimal(q.quantidade);
    });
    setQuantidadesForm(form);
    setActiveItemForQtd(item);
    setQtdDialog(true);
  };

  const handleSaveQtd = () => {
    if (!id || !activeItemForQtd) return;
    const quantidades = allParticipantes.map(p => ({
      itemId: activeItemForQtd.id,
      enteId: p.id,
      quantidade: toStorageDecimal(quantidadesForm[p.id] || "0"),
    })).filter(q => Number(q.quantidade) > 0);

    saveQuantidades.mutate({ id, quantidades }, {
      onSuccess: () => { toast({ title: "Quantidades salvas!" }); setQtdDialog(false); },
      onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
    });
  };

  const initCotacoesForm = () => {
    const form: Record<string, string> = {};
    itens.forEach((item: any) => {
      form[item.id] = toDisplayDecimal(item.cotacao?.valorUnitarioCotado);
    });
    setCotacoesForm(form);
  };

  const handleSaveCotacoes = () => {
    if (!id) return;
    const cotacoes = Object.entries(cotacoesForm).map(([itemId, val]) => ({
      itemId,
      valorUnitarioCotado: toStorageDecimal(val || "0"),
    })).filter(c => Number(c.valorUnitarioCotado) > 0);

    saveCotacoes.mutate({ id, cotacoes }, {
      onSuccess: () => toast({ title: "Cotações salvas!" }),
      onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
    });
  };

  const initResultadosForm = () => {
    const form: Record<string, { valor: string; fracassado: boolean; fornecedorId: string }> = {};
    itens.forEach((item: any) => {
      form[item.id] = {
        valor: toDisplayDecimal(item.resultado?.valorUnitarioLicitado),
        fracassado: item.resultado?.itemFracassado ?? false,
        fornecedorId: item.resultado?.fornecedorId ?? "",
      };
    });
    setResultadosForm(form);
  };

  const handleSaveResultados = () => {
    if (!id) return;
    const resultados = Object.entries(resultadosForm).map(([itemId, data]) => ({
      itemId,
      valorUnitarioLicitado: data.fracassado ? null : toStorageDecimal(data.valor || "0"),
      fornecedorId: data.fracassado ? null : (data.fornecedorId || null),
      itemFracassado: data.fracassado,
    }));

    saveResultados.mutate({ id, resultados }, {
      onSuccess: () => toast({ title: "Resultados salvos!" }),
      onError: (e) => toast({ variant: "destructive", title: "Erro", description: e.message }),
    });
  };

  const statusInfo = STATUS_LABELS[(processo as any)?.status ?? "planejamento"] ?? STATUS_LABELS.planejamento;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-8 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/4"></div>
        <div className="h-64 bg-muted rounded w-full"></div>
      </div>
    );
  }

  if (!processo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold tracking-tight">Processo não encontrado</h2>
        <Button variant="outline" asChild><Link href="/processos">Voltar para Processos</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto pb-12 fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-card/90 via-card/70 to-primary/5 backdrop-blur border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/processos"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Badge variant="outline" className="px-3 py-1 font-bold bg-primary/5 text-primary border-primary/30">
              {processo.numeroProcessoDigital}
            </Badge>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {processo.objetoResumido || "Objeto não informado"}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Building2 className="w-4 h-4" />
            Secretaria Gestora: <strong>{processo.ente?.nome || "Não vinculada"}</strong>
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-muted/50 bg-card/80 backdrop-blur shadow-sm overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-1 bg-blue-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Itens Planejados</p>
                <p className="text-2xl font-bold mt-0.5">{itens.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10"><Package className="w-4 h-4 text-blue-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-muted/50 bg-card/80 backdrop-blur shadow-sm overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-1 bg-violet-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Secretarias</p>
                <p className="text-2xl font-bold mt-0.5">{allParticipantes.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-violet-500/10"><Users className="w-4 h-4 text-violet-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-muted/50 bg-card/80 backdrop-blur shadow-sm overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-1 bg-amber-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Valor Estimado</p>
                <p className="text-2xl font-bold mt-0.5 text-amber-600 dark:text-amber-400">
                  {valorEstimado > 0 ? `R$ ${valorEstimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10"><DollarSign className="w-4 h-4 text-amber-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-muted/50 bg-card/80 backdrop-blur shadow-sm overflow-hidden group">
          <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="pt-5 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Valor Executado</p>
                <p className="text-2xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
                  {valorExecutado > 0 ? `R$ ${valorExecutado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10"><Trophy className="w-4 h-4 text-emerald-500" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="configuracoes" className="w-full" onValueChange={(v) => { if (v === "cotacoes") initCotacoesForm(); if (v === "resultado") initResultadosForm(); }}>
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-muted/60 p-1 h-12 rounded-xl">
          <TabsTrigger value="configuracoes" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
          <TabsTrigger value="itens" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Itens</span>
          </TabsTrigger>
          <TabsTrigger value="cotacoes" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Cotações</span>
          </TabsTrigger>
          <TabsTrigger value="resultado" className="text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg transition-all gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Resultado</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: CONFIGURAÇÕES */}
        <TabsContent value="configuracoes" className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          {/* Participantes */}
          <Card className="shadow-sm border-muted/50 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 font-bold">
                    <Users className="w-4 h-4 text-violet-500" />
                    Secretarias Participantes
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Gerencie quais secretarias participam deste processo de compra
                  </CardDescription>
                </div>
                <Dialog open={participanteDialog} onOpenChange={(o) => { setParticipanteDialog(o); if (!o) setSelectedEnte(""); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2 bg-background hover:bg-violet-50 hover:text-violet-600 transition-colors">
                      <Plus className="w-4 h-4" /> Adicionar Secretaria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Secretaria Participante</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Secretaria</Label>
                        <Select value={selectedEnte} onValueChange={setSelectedEnte}>
                          <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {availableEntes.map((e: any) => (
                              <SelectItem key={e.id} value={e.id}>{e.sigla} - {e.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setParticipanteDialog(false)}>Cancelar</Button>
                      <Button onClick={handleAddParticipante} disabled={!selectedEnte || addParticipante.isPending}>
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex items-center justify-between px-6 py-4 border-b bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{processo.ente?.nome || "Órgão gestor"}</p>
                      <p className="text-xs text-muted-foreground">Órgão Gestor do Processo</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold uppercase tracking-wider px-3 py-1">Gestor</Badge>
                </div>
                {participantes.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Nenhuma secretaria participante adicional.</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-3 p-6">
                    {allParticipantes.map((ente: any, idx: number) => (
                      <div key={ente.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50 hover:bg-background transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{ente.nome}</p>
                            <p className="text-xs text-muted-foreground">{ente.id === processo.enteId ? "Órgão Gestor" : "Participante"}</p>
                          </div>
                        </div>
                        {ente.id !== processo.enteId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveParticipante(ente.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Dotações Orçamentárias */}
          <Card className="shadow-sm border-muted/50 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 font-bold">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    Dotações Orçamentárias
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Vincule as fichas orçamentárias e informe o ano da dotação para este processo
                  </CardDescription>
                </div>
                <Dialog open={dotacaoDialog} onOpenChange={(o) => { setDotacaoDialog(o); if (!o) { setDotacaoForm({ fichaId: "", ano: "", valor: "" }); setSelectedFonte(""); } }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-2 bg-background hover:bg-amber-50 hover:text-amber-600 transition-colors">
                      <Plus className="w-4 h-4" /> Adicionar Dotação
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Adicionar Dotação Orçamentária</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Ano da Dotação</Label>
                        <Input
                          placeholder="Ex: 2025"
                          maxLength={4}
                          value={dotacaoForm.ano}
                          onChange={(e) => setDotacaoForm((f) => ({ ...f, ano: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fonte de Recurso</Label>
                        <Select value={selectedFonte} onValueChange={(v) => { setSelectedFonte(v); setDotacaoForm((f) => ({ ...f, fichaId: "" })); }}>
                          <SelectTrigger><SelectValue placeholder="Selecione a fonte..." /></SelectTrigger>
                          <SelectContent>
                            {fontes.map((f: any) => (
                              <SelectItem key={f.id} value={f.id}>{f.codigo} - {f.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedFonteData && (
                        <div className="space-y-2">
                          <Label>Ficha Orçamentária</Label>
                          <Select value={dotacaoForm.fichaId} onValueChange={(v) => setDotacaoForm((f) => ({ ...f, fichaId: v }))}>
                            <SelectTrigger><SelectValue placeholder="Selecione a ficha..." /></SelectTrigger>
                            <SelectContent>
                              {selectedFonteData.fichas.map((fi: any) => (
                                <SelectItem key={fi.id} value={fi.id}>Ficha {fi.codigo} ({fi.ano}) — {fi.classificacao}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Valor Estimado (opcional)</Label>
                        <Input
                          placeholder="Ex: 50.000,00"
                          value={toDisplayDecimal(dotacaoForm.valor)}
                          onChange={(e) => setDotacaoForm((f) => ({ ...f, valor: toStorageDecimal(normalizeDecimalInput(e.target.value)) }))}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleAddDotacao}
                        disabled={!dotacaoForm.fichaId || !dotacaoForm.ano || addDotacao.isPending}
                      >
                        {addDotacao.isPending ? "Adicionando..." : "Confirmar Dotação"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {dotacoes.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-2">
                  <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Nenhuma dotação orçamentária vinculada.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/10">
                      <TableHead className="pl-6">Ano</TableHead>
                      <TableHead>Ficha</TableHead>
                      <TableHead>Classificação</TableHead>
                      <TableHead className="text-right">Valor Estimado</TableHead>
                      <TableHead className="text-right pr-6 w-12">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dotacoes.map((d: any) => (
                      <TableRow key={d.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            <span className="font-bold">{d.anoDotacao}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs bg-muted/20 rounded px-2 py-1 mx-2">{d.fichaOrcamentaria?.codigo}</TableCell>
                        <TableCell className="capitalize text-xs text-muted-foreground max-w-[250px] truncate">
                          {d.fichaOrcamentaria?.classificacao || "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {d.valorEstimado
                            ? `R$ ${Number(d.valorEstimado).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            onClick={() => handleRemoveDotacao(d.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: ITENS */}
        <TabsContent value="itens" className="animate-in slide-in-from-bottom-2 duration-300">
          <Card className="shadow-sm border-muted/50 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 font-bold">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Itens do Processo
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Cadastre os itens e distribua as quantidades entre as secretarias participantes.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-2" onClick={() => { setEditingItem(null); setItemForm({ codigoInterno: "", descricao: "", unidadeMedida: "" }); setItemDialog(true); }}>
                    <Plus className="w-4 h-4" /> Novo Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {itens.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <Package className="w-12 h-12 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">Nenhum item cadastrado ainda.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="pl-6">Cód. Interno</TableHead>
                      <TableHead>Descrição do Item</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Qtd. Total</TableHead>
                      <TableHead className="text-right pr-6 w-32">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item: any) => {
                      const qtdTotal = (item.quantidades ?? []).reduce((s: number, q: any) => s + Number(q.quantidade || 0), 0);
                      return (
                        <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-6 font-mono text-xs">{item.codigoInterno}</TableCell>
                          <TableCell className="font-semibold">{item.descricao}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">{item.unidadeMedida}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" className="h-8 px-2 font-bold text-primary hover:bg-primary/10" onClick={() => openQtdDialog(item)}>
                              {qtdTotal}
                              <Edit2 className="w-3 h-3 ml-1.5 opacity-50" />
                            </Button>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingItem(item); setItemForm({ codigoInterno: item.codigoInterno, descricao: item.descricao, unidadeMedida: item.unidadeMedida }); setItemDialog(true); }}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0" onClick={() => { if (window.confirm("Excluir este item?")) deleteItem.mutate({ id: id!, itemId: item.id }); }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Dialog de Item */}
          <Dialog open={itemDialog} onOpenChange={setItemDialog}>
            <DialogContent>
              <form onSubmit={handleItemSubmit}>
                <DialogHeader><DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cód. Interno</Label>
                      <Input value={itemForm.codigoInterno} onChange={(e) => setItemForm(f => ({ ...f, codigoInterno: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Unidade de Medida</Label>
                      <Input placeholder="Ex: UN, KG, LT" value={itemForm.unidadeMedida} onChange={(e) => setItemForm(f => ({ ...f, unidadeMedida: e.target.value }))} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição Completa</Label>
                    <Textarea rows={4} value={itemForm.descricao} onChange={(e) => setItemForm(f => ({ ...f, descricao: e.target.value }))} required />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
                    {editingItem ? "Salvar Alterações" : "Criar Item"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog de Quantidade */}
          <Dialog open={qtdDialog} onOpenChange={setQtdDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Distribuição de Quantitativos</DialogTitle>
                <CardDescription>{activeItemForQtd?.descricao}</CardDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Secretaria Participante</TableHead>
                        <TableHead className="text-right w-32">Quantidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allParticipantes.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            <span className={p.id === processo.enteId ? "text-primary font-bold" : ""}>
                              {p.nome}
                              {p.id === processo.enteId && <Badge variant="outline" className="ml-2 text-[10px] h-4">Gestor</Badge>}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Input
                              className="text-right"
                              placeholder="0,00"
                              value={quantidadesForm[p.id] || ""}
                              onChange={(e) => setQuantidadesForm(f => ({ ...f, [p.id]: normalizeDecimalInput(e.target.value) }))}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <span className="text-sm font-bold text-primary">Quantidade Total Programada:</span>
                  <span className="text-xl font-black text-primary">
                    {Object.values(quantidadesForm).reduce((acc, val) => acc + Number(toStorageDecimal(val) || 0), 0).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setQtdDialog(false)}>Cancelar</Button>
                <Button onClick={handleSaveQtd} disabled={saveQuantidades.isPending}>
                  {saveQuantidades.isPending ? "Salvando..." : "Salvar Quantidades"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ABA 3: COTAÇÕES */}
        <TabsContent value="cotacoes" className="animate-in slide-in-from-bottom-2 duration-300">
          <Card className="shadow-sm border-muted/50 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 font-bold">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    Mapa de Preços — Cotações de Mercado
                  </CardTitle>
                  <CardDescription>
                    Insira as médias de preço praticadas no mercado para cada item.
                  </CardDescription>
                </div>
                <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={handleSaveCotacoes} disabled={itens.length === 0 || saveCotacoes.isPending}>
                  <Save className="w-4 h-4" /> {saveCotacoes.isPending ? "Salvando..." : "Salvar Cotações"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {itens.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <AlertTriangle className="w-12 h-12 text-amber-500/20" />
                  <p className="text-sm text-muted-foreground">Cadastre itens para preencher o mapa de preços.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="pl-6">Cód.</TableHead>
                      <TableHead>Descrição do Item</TableHead>
                      <TableHead className="text-right">Qtd. Total</TableHead>
                      <TableHead className="text-right w-44">Vlr. Unit. Cotado</TableHead>
                      <TableHead className="text-right pr-6">Subtotal Estimado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item: any) => {
                      const qtdTotal = (item.quantidades ?? []).reduce((s: number, q: any) => s + Number(q.quantidade || 0), 0);
                      const currentVal = toStorageDecimal(cotacoesForm[item.id] || "0");
                      const subtotal = qtdTotal * Number(currentVal);
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="pl-6 font-mono text-xs">{item.codigoInterno}</TableCell>
                          <TableCell className="font-medium text-sm line-clamp-1">{item.descricao}</TableCell>
                          <TableCell className="text-right font-bold text-muted-foreground">{qtdTotal}</TableCell>
                          <TableCell className="text-right">
                            <div className="relative ml-auto max-w-[150px]">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">R$</span>
                              <Input
                                className="pl-8 text-right font-bold focus:ring-amber-500/30"
                                placeholder="0,00"
                                value={cotacoesForm[item.id] || ""}
                                onChange={(e) => setCotacoesForm(f => ({ ...f, [item.id]: normalizeDecimalInput(e.target.value) }))}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6 font-black text-amber-600">
                             {subtotal > 0 ? `R$ ${subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4: RESULTADO */}
        <TabsContent value="resultado" className="animate-in slide-in-from-bottom-2 duration-300">
          <Card className="shadow-sm border-muted/50 overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 font-bold">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                    Resultado Final e Homologação
                  </CardTitle>
                  <CardDescription>
                    Registre os vencedores e os valores finais obtidos na licitação.
                  </CardDescription>
                </div>
                <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveResultados} disabled={itens.length === 0 || saveResultados.isPending}>
                  <CheckCircle2 className="w-4 h-4" /> {saveResultados.isPending ? "Salvando..." : "Salvar Resultados"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {itens.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center gap-3">
                  <Trophy className="w-12 h-12 text-emerald-500/20" />
                  <p className="text-sm text-muted-foreground">Sem dados para homologar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="pl-6">Item</TableHead>
                      <TableHead className="w-64">Fornecedor Vencedor</TableHead>
                      <TableHead className="text-right">Vlr. Licitado</TableHead>
                      <TableHead className="text-right">Economia</TableHead>
                      <TableHead className="text-center w-24">Situação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item: any) => {
                      const data = resultadosForm[item.id] || { valor: "", fracassado: false, fornecedorId: "" };
                      const vlrCotado = Number(item.cotacao?.valorUnitarioCotado || 0);
                      const vlrLicitado = Number(toStorageDecimal(data.valor || "0"));
                      const economia = vlrCotado > 0 && vlrLicitado > 0 && !data.fracassado
                        ? (((vlrCotado - vlrLicitado) / vlrCotado) * 100).toFixed(1)
                        : null;
                      
                      return (
                        <TableRow key={item.id} className={data.fracassado ? "bg-red-50/50 dark:bg-red-950/20 opacity-70" : "hover:bg-muted/30 transition-colors"}>
                          <TableCell className="pl-6">
                            <p className="text-xs font-mono text-muted-foreground">{item.codigoInterno}</p>
                            <p className="font-semibold text-sm line-clamp-1">{item.descricao}</p>
                          </TableCell>
                          <TableCell>
                            <Select
                              disabled={data.fracassado}
                              value={data.fornecedorId || "none"}
                              onValueChange={(v) => setResultadosForm(f => ({ ...f, [item.id]: { ...data, fornecedorId: v === "none" ? "" : v } }))}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Selecione...</SelectItem>
                                {fornecedores.map((fo: any) => (
                                  <SelectItem key={fo.id} value={fo.id}>{fo.nome}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="relative ml-auto max-w-[140px]">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">R$</span>
                              <Input
                                disabled={data.fracassado}
                                className="pl-7 h-9 text-right font-bold text-emerald-600"
                                value={data.valor}
                                onChange={(e) => setResultadosForm(f => ({ ...f, [item.id]: { ...data, valor: normalizeDecimalInput(e.target.value) } }))}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {economia !== null ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-200 hover:bg-emerald-500/15">
                                -{economia}%
                              </Badge>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                               <Checkbox
                                 checked={data.fracassado}
                                 onCheckedChange={(checked) => setResultadosForm(f => ({ ...f, [item.id]: { ...data, fracassado: !!checked } }))}
                               />
                               <span className="text-[10px] font-bold text-muted-foreground uppercase">Deserto</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
