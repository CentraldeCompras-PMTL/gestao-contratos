import { useParams } from "wouter";
import { useState } from "react";
import {
  useContrato,
  useCreateEmpenho,
  useAnnulEmpenho,
  useCloseContrato,
  useDeleteContrato,
  useDeleteEmpenho,
  useUpdateEmpenho,
  useCreateContratoAditivo,
  useDeleteContratoAditivo,
  useCreateContratoAnexo,
  useDeleteContratoAnexo,
} from "@/hooks/use-contratos";
import { useCreateAf, useUpdateAf } from "@/hooks/use-afs";
import { useFontesRecurso } from "@/hooks/use-fontes-recurso";
import { formatCurrency, formatDate, parseNumberString } from "@/lib/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, PackageOpen, Info, ArrowLeft, Trash2, Link2, FileBadge2, Pencil } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Af, EmpenhoWithRelations } from "@shared/schema";

function getEmpenhoMetrics(empenho: EmpenhoWithRelations) {
  const valorTotal = parseNumberString(empenho.valorEmpenho);
  const totalAfs = empenho.afs.reduce((acc, af) => acc + parseNumberString(af.valorAf), 0);
  const valorAnulado = parseNumberString(empenho.valorAnulado);
  const saldoDisponivel = valorTotal - totalAfs - valorAnulado;
  const valorComprometido = valorTotal - valorAnulado;

  return { valorTotal, totalAfs, valorAnulado, saldoDisponivel, valorComprometido };
}

function getFichaClassificacaoLabel(classificacao: unknown) {
  if (!classificacao) return "-";
  if (typeof classificacao === "string") return classificacao;
  if (typeof classificacao === "object" && classificacao !== null && "nome" in classificacao && typeof classificacao.nome === "string") {
    return classificacao.nome;
  }
  return "-";
}

export default function ContratoDetail() {
  const { id } = useParams();
  const { data: contrato, isLoading } = useContrato(id!);
  const createEmpenho = useCreateEmpenho();
  const annulEmpenho = useAnnulEmpenho();
  const closeContrato = useCloseContrato();
  const deleteContrato = useDeleteContrato();
  const deleteEmpenho = useDeleteEmpenho();
  const createAditivo = useCreateContratoAditivo();
  const deleteAditivo = useDeleteContratoAditivo();
  const createAnexo = useCreateContratoAnexo();
  const deleteAnexo = useDeleteContratoAnexo();
  const createAf = useCreateAf();
  const { data: fontesRecurso = [] } = useFontesRecurso();
  const { toast } = useToast();
  const updateEmpenho = useUpdateEmpenho();
  const updateAf = useUpdateAf();
  const [, navigate] = useLocation();

  const [empenhoDialog, setEmpenhoDialog] = useState(false);
  const [empForm, setEmpForm] = useState({ dataEmpenho: "", valorEmpenho: "", fonteRecursoId: "", fichaId: "", numeroEmpenho: "" });

  const [afDialog, setAfDialog] = useState<string | null>(null);
  const [afForm, setAfForm] = useState({ dataPedidoAf: "", valorAf: "", numeroAf: "" });

  const [editEmpenhoId, setEditEmpenhoId] = useState<string | null>(null);
  const [editEmpForm, setEditEmpForm] = useState({ numeroEmpenho: "", dataEmpenho: "", valorEmpenho: "" });

  const [editAfId, setEditAfId] = useState<string | null>(null);
  const [editAfForm, setEditAfForm] = useState({ numeroAf: "", dataPedidoAf: "", valorAf: "" });
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [motivoEncerramento, setMotivoEncerramento] = useState("");
  const [deleteContratoOpen, setDeleteContratoOpen] = useState(false);
  const [deleteEmpenhoId, setDeleteEmpenhoId] = useState<string | null>(null);
  const [annulEmpenhoId, setAnnulEmpenhoId] = useState<string | null>(null);
  const [aditivoDialog, setAditivoDialog] = useState(false);
  const [anexoDialog, setAnexoDialog] = useState(false);
  const [deleteAditivoId, setDeleteAditivoId] = useState<string | null>(null);
  const [deleteAnexoId, setDeleteAnexoId] = useState<string | null>(null);
  const [aditivoForm, setAditivoForm] = useState({
    numeroAditivo: "",
    tipoAditivo: "outro" as "valor" | "vigencia" | "misto" | "apostilamento" | "outro",
    dataAssinatura: "",
    valorAditivo: "",
    novaVigenciaFinal: "",
    justificativa: "",
  });
  const [anexoForm, setAnexoForm] = useState({
    nomeArquivo: "",
    tipoDocumento: "",
    urlArquivo: "",
    observacao: "",
  });
  const [annulEmpenhoForm, setAnnulEmpenhoForm] = useState({
    valorAnulado: "",
    dataAnulacao: "",
    motivoAnulacao: "",
  });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Carregando contrato...</div>;
  if (!contrato) return <div className="p-8 text-center text-red-500">Contrato nao encontrado</div>;

  const valContrato = parseNumberString(contrato.valorContrato);
  const totalEmpenhado = contrato.empenhos.reduce((acc, empenho) => acc + getEmpenhoMetrics(empenho).valorComprometido, 0);
  const saldoContrato = valContrato - totalEmpenhado;

  const handleEmpenho = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseNumberString(empForm.valorEmpenho) > saldoContrato) {
      toast({ variant: "destructive", title: "Valor superior ao saldo do contrato!" });
      return;
    }
    createEmpenho.mutate(
      { contratoId: contrato.id, ...empForm },
      {
        onSuccess: () => {
          toast({ title: "Empenho registrado!" });
          setEmpenhoDialog(false);
          setEmpForm({ dataEmpenho: "", valorEmpenho: "", fonteRecursoId: "", fichaId: "", numeroEmpenho: "" });
        },
      },
    );
  };

  const handleAf = (e: React.FormEvent, empenho: EmpenhoWithRelations) => {
    e.preventDefault();
    const { saldoDisponivel } = getEmpenhoMetrics(empenho);

    if (parseNumberString(afForm.valorAf) > saldoDisponivel) {
      toast({ variant: "destructive", title: "Valor superior ao saldo do empenho!" });
      return;
    }

    createAf.mutate(
      { empenhoId: empenho.id, ...afForm },
      {
        onSuccess: () => {
          toast({ title: "AF gerada com sucesso! Data estimada calculada automaticamente (+30 dias)." });
          setAfDialog(null);
          setAfForm({ dataPedidoAf: "", valorAf: "", numeroAf: "" });
        },
      },
    );
  };

  const handleUpdateEmpenho = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmpenhoId) return;
    updateEmpenho.mutate(
      { id: editEmpenhoId, contratoId: contrato.id, ...editEmpForm },
      {
        onSuccess: () => {
          toast({ title: "Empenho atualizado com sucesso!" });
          setEditEmpenhoId(null);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro ao atualizar empenho",
          });
        },
      },
    );
  };

  const handleUpdateAf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAfId) return;
    updateAf.mutate(
      { id: editAfId, ...editAfForm },
      {
        onSuccess: () => {
          toast({ title: "AF atualizada com sucesso!" });
          setEditAfId(null);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro ao atualizar AF",
          });
        },
      },
    );
  };

  const handleAnnulEmpenho = () => {
    if (!annulEmpenhoId) return;
    annulEmpenho.mutate(
      {
        id: annulEmpenhoId,
        contratoId: contrato.id,
        valorAnulado: annulEmpenhoForm.valorAnulado,
        dataAnulacao: annulEmpenhoForm.dataAnulacao,
        motivoAnulacao: annulEmpenhoForm.motivoAnulacao,
      },
      {
        onSuccess: () => {
          toast({ title: "Empenho anulado com sucesso!" });
          setAnnulEmpenhoId(null);
          setAnnulEmpenhoForm({ valorAnulado: "", dataAnulacao: "", motivoAnulacao: "" });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro ao anular empenho",
          });
        },
      },
    );
  };

  const allAfs: any[] = contrato.empenhos.flatMap((empenho) => empenho.afs);
  const fichasDaFonte = fontesRecurso.find((fonte) => fonte.id === empForm.fonteRecursoId)?.fichas ?? [];
  const hasPendingAfs = allAfs.some((af) => !af.dataEntregaReal);
  const hasPendingNotas = contrato.notasFiscais.some((nota) => nota.statusPagamento !== "pago");
  const canClose = contrato.status !== "encerrado" && !hasPendingAfs && !hasPendingNotas;

  const handleCloseContrato = () => {
    closeContrato.mutate(
      { id: contrato.id, motivoEncerramento: motivoEncerramento || undefined },
      {
        onSuccess: () => {
          toast({ title: "Contrato encerrado com sucesso!" });
          setCloseDialogOpen(false);
          setMotivoEncerramento("");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro ao encerrar contrato",
          });
        },
      },
    );
  };

  const handleDeleteContrato = () => {
    deleteContrato.mutate(contrato.id, {
      onSuccess: () => {
        toast({ title: "Contrato excluido com sucesso!" });
        setDeleteContratoOpen(false);
        navigate("/contratos");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro ao excluir contrato",
        });
      },
    });
  };

  const handleDeleteEmpenho = () => {
    if (!deleteEmpenhoId) return;
    deleteEmpenho.mutate(
      { id: deleteEmpenhoId, contratoId: contrato.id },
      {
        onSuccess: () => {
          toast({ title: "Empenho excluido com sucesso!" });
          setDeleteEmpenhoId(null);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro ao excluir empenho",
          });
        },
      },
    );
  };

  const handleAditivo = (e: React.FormEvent) => {
    e.preventDefault();
    createAditivo.mutate(
      {
        contratoId: contrato.id,
        numeroAditivo: aditivoForm.numeroAditivo,
        tipoAditivo: aditivoForm.tipoAditivo,
        dataAssinatura: aditivoForm.dataAssinatura,
        valorAditivo: aditivoForm.valorAditivo || null,
        novaVigenciaFinal: aditivoForm.novaVigenciaFinal || null,
        justificativa: aditivoForm.justificativa || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Aditivo registrado com sucesso!" });
          setAditivoDialog(false);
          setAditivoForm({
            numeroAditivo: "",
            tipoAditivo: "outro",
            dataAssinatura: "",
            valorAditivo: "",
            novaVigenciaFinal: "",
            justificativa: "",
          });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro ao criar aditivo",
          });
        },
      },
    );
  };

  const handleAnexo = (e: React.FormEvent) => {
    e.preventDefault();
    createAnexo.mutate(
      {
        contratoId: contrato.id,
        nomeArquivo: anexoForm.nomeArquivo,
        tipoDocumento: anexoForm.tipoDocumento,
        urlArquivo: anexoForm.urlArquivo,
        observacao: anexoForm.observacao || null,
      },
      {
        onSuccess: () => {
          toast({ title: "Anexo registrado com sucesso!" });
          setAnexoDialog(false);
          setAnexoForm({ nomeArquivo: "", tipoDocumento: "", urlArquivo: "", observacao: "" });
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro ao criar anexo",
          });
        },
      },
    );
  };

  const handleDeleteAditivo = () => {
    if (!deleteAditivoId) return;
    deleteAditivo.mutate(
      { aditivoId: deleteAditivoId, contratoId: contrato.id },
      {
        onSuccess: () => {
          toast({ title: "Aditivo excluido com sucesso!" });
          setDeleteAditivoId(null);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro ao excluir aditivo",
          });
        },
      },
    );
  };

  const handleDeleteAnexo = () => {
    if (!deleteAnexoId) return;
    deleteAnexo.mutate(
      { anexoId: deleteAnexoId, contratoId: contrato.id },
      {
        onSuccess: () => {
          toast({ title: "Anexo excluido com sucesso!" });
          setDeleteAnexoId(null);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: error instanceof Error ? error.message : "Erro ao excluir anexo",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Link href="/contratos" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contrato {contrato.numeroContrato}</h1>
          <p className="text-muted-foreground mt-1">{contrato.fornecedor.nome} - CNPJ: {contrato.fornecedor.cnpj}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant={contrato.status === "encerrado" ? "secondary" : "outline"}>
            {contrato.status === "encerrado" ? "Encerrado" : "Vigente"}
          </Badge>
          <Button variant="ghost" onClick={() => setDeleteContratoOpen(true)} disabled={deleteContrato.isPending}>
            <Trash2 size={16} className="mr-2" />
            Excluir Contrato
          </Button>
          <Button variant="outline" onClick={() => setCloseDialogOpen(true)} disabled={!canClose || closeContrato.isPending}>
            Encerrar Contrato
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Valor Global</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">{formatCurrency(valContrato)}</div></CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm dark:bg-amber-500/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Total Empenhado</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalEmpenhado)}</div></CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm dark:bg-emerald-500/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Saldo Disponivel</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(saldoContrato)}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-5 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Info size={16} className="mr-2" /> Info</TabsTrigger>
          <TabsTrigger value="empenhos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><DollarSign size={16} className="mr-2" /> Empenhos</TabsTrigger>
          <TabsTrigger value="afs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><PackageOpen size={16} className="mr-2" /> AFs</TabsTrigger>
          <TabsTrigger value="aditivos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><FileBadge2 size={16} className="mr-2" /> Aditivos</TabsTrigger>
          <TabsTrigger value="anexos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Link2 size={16} className="mr-2" /> Anexos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader><CardTitle>Vinculos do Processo</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold block text-muted-foreground">Processo Digital</span>
                  {contrato.processoDigital.numeroProcessoDigital}
                </div>
                <div>
                  <span className="font-semibold block text-muted-foreground">Fase da Contratacao</span>
                  <Badge variant="outline">{contrato.faseContratacao.nomeFase}</Badge>
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <span className="font-semibold block mb-2 text-primary">Objeto do Processo</span>
                <p className="text-foreground/80 leading-relaxed">{contrato.processoDigital.objetoCompleto}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empenhos" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historico de Empenhos</CardTitle>
              <Dialog open={empenhoDialog} onOpenChange={setEmpenhoDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={contrato.status === "encerrado"}><Plus size={16} className="mr-1" /> Novo Empenho</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Empenho</DialogTitle></DialogHeader>
                  <form onSubmit={handleEmpenho} className="space-y-4 pt-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800">
                      Saldo do Contrato: <strong>{formatCurrency(saldoContrato)}</strong>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Numero do Empenho</label>
                       <Input required value={empForm.numeroEmpenho} onChange={(e) => setEmpForm({ ...empForm, numeroEmpenho: e.target.value })} placeholder="Ex: 2024/0001" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data do Empenho</label>
                      <Input type="date" required value={empForm.dataEmpenho} onChange={(e) => setEmpForm({ ...empForm, dataEmpenho: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor (R$)</label>
                      <Input type="number" step="0.01" required value={empForm.valorEmpenho} onChange={(e) => setEmpForm({ ...empForm, valorEmpenho: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fonte de Recurso</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                        value={empForm.fonteRecursoId}
                        onChange={(e) => setEmpForm({ ...empForm, fonteRecursoId: e.target.value, fichaId: "" })}
                      >
                        <option value="">Selecione a fonte</option>
                        {fontesRecurso.map((fonte) => (
                          <option key={fonte.id} value={fonte.id}>{fonte.codigo} - {fonte.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ficha</label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        required
                        value={empForm.fichaId}
                        onChange={(e) => setEmpForm({ ...empForm, fichaId: e.target.value })}
                        disabled={!empForm.fonteRecursoId}
                      >
                        <option value="">Selecione a ficha</option>
                        {fichasDaFonte.map((ficha) => (
                          <option key={ficha.id} value={ficha.id}>{ficha.codigo} - {getFichaClassificacaoLabel(ficha.classificacao)}</option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" className="w-full" disabled={createEmpenho.isPending}>Salvar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead>Ficha</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Executado (AFs)</TableHead>
                    <TableHead>Valor Anulado</TableHead>
                    <TableHead>Saldo do Empenho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contrato.empenhos.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum empenho registrado</TableCell></TableRow>}
                  {contrato.empenhos.map((empenho) => {
                    const { valorTotal, totalAfs, valorAnulado, saldoDisponivel } = getEmpenhoMetrics(empenho);
                    return (
                      <TableRow key={empenho.id}>
                        <TableCell className="font-medium text-muted-foreground">{empenho.numeroEmpenho}</TableCell>
                        <TableCell>{formatDate(empenho.dataEmpenho)}</TableCell>
                        <TableCell>{empenho.fonteRecurso.codigo}</TableCell>
                        <TableCell>{empenho.ficha.codigo}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(valorTotal)}</TableCell>
                        <TableCell className="text-blue-600">{formatCurrency(totalAfs)}</TableCell>
                        <TableCell className="text-amber-600">{formatCurrency(valorAnulado)}</TableCell>
                        <TableCell className="text-emerald-600">{formatCurrency(saldoDisponivel)}</TableCell>
                        <TableCell>
                          <Badge variant={empenho.status === "ativo" ? "outline" : "secondary"}>
                            {empenho.status === "ativo"
                              ? "Ativo"
                              : empenho.status === "anulado"
                                ? "Anulado"
                                : "Anulado Parcial"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Dialog open={afDialog === empenho.id} onOpenChange={(open) => setAfDialog(open ? empenho.id : null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={saldoDisponivel <= 0 || contrato.status === "encerrado"}>Gerar AF</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Autorizacao de Fornecimento</DialogTitle></DialogHeader>
                                <form onSubmit={(event) => handleAf(event, empenho)} className="space-y-4 pt-4">
                                  <div className="p-3 bg-muted rounded-lg text-sm">
                                    Saldo deste empenho: <strong>{formatCurrency(saldoDisponivel)}</strong>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Numero da AF</label>
                                    <Input required value={afForm.numeroAf} onChange={(event) => setAfForm({ ...afForm, numeroAf: event.target.value })} placeholder="Ex: AF 123/2024" />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Data do Pedido</label>
                                    <Input type="date" required value={afForm.dataPedidoAf} onChange={(event) => setAfForm({ ...afForm, dataPedidoAf: event.target.value })} />
                                    <p className="text-xs text-muted-foreground">+30 dias serao adicionados para entrega estimada.</p>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Valor da AF (R$)</label>
                                    <Input type="number" step="0.01" required value={afForm.valorAf} onChange={(event) => setAfForm({ ...afForm, valorAf: event.target.value })} />
                                  </div>
                                  <Button type="submit" className="w-full" disabled={createAf.isPending || contrato.status === "encerrado"}>Confirmar AF</Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditEmpenhoId(empenho.id);
                                setEditEmpForm({
                                  numeroEmpenho: empenho.numeroEmpenho,
                                  dataEmpenho: empenho.dataEmpenho.slice(0, 10),
                                  valorEmpenho: String(empenho.valorEmpenho),
                                });
                              }}
                              disabled={contrato.status === "encerrado"}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAnnulEmpenhoId(empenho.id)}
                              disabled={contrato.status === "encerrado" || saldoDisponivel <= 0 || annulEmpenho.isPending}
                            >
                              Anular
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteEmpenhoId(empenho.id)}
                              disabled={contrato.status === "encerrado" || empenho.afs.length > 0 || parseNumberString(empenho.valorAnulado) > 0 || deleteEmpenho.isPending}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="afs" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader><CardTitle>Todas as AFs</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Entrega Estimada</TableHead>
                    <TableHead>Entrega Real</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAfs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma AF gerada</TableCell></TableRow>}
                  {allAfs.map((af) => (
                    <TableRow key={af.id}>
                      <TableCell className="font-medium text-muted-foreground">{af.numeroAf}</TableCell>
                      <TableCell>{formatDate(af.dataPedidoAf)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(af.valorAf)}</TableCell>
                      <TableCell>{formatDate(af.dataEstimadaEntrega)}</TableCell>
                      <TableCell>
                        {af.dataEntregaReal ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700">{formatDate(af.dataEntregaReal)}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">Pendente</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {af.dataEntregaReal ? (
                          <Badge className="bg-emerald-500">Concluido</Badge>
                        ) : af.flagEntregaNotificada ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">Notificado</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">Pendente</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditAfId(af.id);
                            setEditAfForm({
                              numeroAf: af.numeroAf,
                              dataPedidoAf: af.dataPedidoAf.slice(0, 10),
                              valorAf: String(af.valorAf),
                            });
                          }}
                          disabled={contrato.status === "encerrado"}
                        >
                          <Pencil size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aditivos" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Aditivos Contratuais</CardTitle>
              <Dialog open={aditivoDialog} onOpenChange={setAditivoDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={contrato.status === "encerrado"}><Plus size={16} className="mr-1" /> Novo Aditivo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Aditivo</DialogTitle></DialogHeader>
                  <form onSubmit={handleAditivo} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Numero do Aditivo</label>
                      <Input required value={aditivoForm.numeroAditivo} onChange={(e) => setAditivoForm({ ...aditivoForm, numeroAditivo: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo</label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={aditivoForm.tipoAditivo}
                        onChange={(e) => setAditivoForm({ ...aditivoForm, tipoAditivo: e.target.value as typeof aditivoForm.tipoAditivo })}
                      >
                        <option value="valor">Valor</option>
                        <option value="vigencia">Vigencia</option>
                        <option value="misto">Misto</option>
                        <option value="apostilamento">Apostilamento</option>
                        <option value="outro">Outro</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data de Assinatura</label>
                        <Input required type="date" value={aditivoForm.dataAssinatura} onChange={(e) => setAditivoForm({ ...aditivoForm, dataAssinatura: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Valor do Aditivo</label>
                        <Input type="number" step="0.01" value={aditivoForm.valorAditivo} onChange={(e) => setAditivoForm({ ...aditivoForm, valorAditivo: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nova Vigencia Final</label>
                      <Input type="date" value={aditivoForm.novaVigenciaFinal} onChange={(e) => setAditivoForm({ ...aditivoForm, novaVigenciaFinal: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Justificativa</label>
                      <Input value={aditivoForm.justificativa} onChange={(e) => setAditivoForm({ ...aditivoForm, justificativa: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full" disabled={createAditivo.isPending}>Salvar Aditivo</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Assinatura</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Nova Vigencia</TableHead>
                    <TableHead className="text-right">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contrato.aditivos.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum aditivo registrado</TableCell></TableRow>}
                  {contrato.aditivos.map((aditivo) => (
                    <TableRow key={aditivo.id}>
                      <TableCell className="font-medium">{aditivo.numeroAditivo}</TableCell>
                      <TableCell>{aditivo.tipoAditivo}</TableCell>
                      <TableCell>{formatDate(aditivo.dataAssinatura)}</TableCell>
                      <TableCell>{aditivo.valorAditivo ? formatCurrency(aditivo.valorAditivo) : "-"}</TableCell>
                      <TableCell>{aditivo.novaVigenciaFinal ? formatDate(aditivo.novaVigenciaFinal) : "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDeleteAditivoId(aditivo.id)} disabled={contrato.status === "encerrado" || deleteAditivo.isPending}>
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anexos" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Anexos do Contrato</CardTitle>
              <Dialog open={anexoDialog} onOpenChange={setAnexoDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={contrato.status === "encerrado"}><Plus size={16} className="mr-1" /> Novo Anexo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Anexo</DialogTitle></DialogHeader>
                  <form onSubmit={handleAnexo} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Documento</label>
                      <Input required value={anexoForm.nomeArquivo} onChange={(e) => setAnexoForm({ ...anexoForm, nomeArquivo: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo do Documento</label>
                      <Input required value={anexoForm.tipoDocumento} onChange={(e) => setAnexoForm({ ...anexoForm, tipoDocumento: e.target.value })} placeholder="Contrato assinado, termo aditivo, parecer..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL do Arquivo</label>
                      <Input required type="url" value={anexoForm.urlArquivo} onChange={(e) => setAnexoForm({ ...anexoForm, urlArquivo: e.target.value })} placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Observacao</label>
                      <Input value={anexoForm.observacao} onChange={(e) => setAnexoForm({ ...anexoForm, observacao: e.target.value })} />
                    </div>
                    <Button type="submit" className="w-full" disabled={createAnexo.isPending}>Salvar Anexo</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Cadastrado Em</TableHead>
                    <TableHead className="text-right">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contrato.anexos.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum anexo registrado</TableCell></TableRow>}
                  {contrato.anexos.map((anexo) => (
                    <TableRow key={anexo.id}>
                      <TableCell className="font-medium">{anexo.nomeArquivo}</TableCell>
                      <TableCell>{anexo.tipoDocumento}</TableCell>
                      <TableCell>
                        <a className="text-primary underline" href={anexo.urlArquivo} target="_blank" rel="noreferrer">
                          Abrir documento
                        </a>
                      </TableCell>
                      <TableCell>{formatDate(String(anexo.criadoEm ?? ""))}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setDeleteAnexoId(anexo.id)} disabled={contrato.status === "encerrado" || deleteAnexo.isPending}>
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Empenho Dialog */}
      <Dialog open={!!editEmpenhoId} onOpenChange={(open) => !open && setEditEmpenhoId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Empenho</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateEmpenho} className="space-y-4 pt-4">
            <div className="space-y-2">
               <label className="text-sm font-medium">Numero do Empenho</label>
               <Input required value={editEmpForm.numeroEmpenho} onChange={(e) => setEditEmpForm({ ...editEmpForm, numeroEmpenho: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Empenho</label>
              <Input type="date" required value={editEmpForm.dataEmpenho} onChange={(e) => setEditEmpForm({ ...editEmpForm, dataEmpenho: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor (R$)</label>
              <Input type="number" step="0.01" required value={editEmpForm.valorEmpenho} onChange={(e) => setEditEmpForm({ ...editEmpForm, valorEmpenho: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={updateEmpenho.isPending}>Salvar Alteracoes</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit AF Dialog */}
      <Dialog open={!!editAfId} onOpenChange={(open) => !open && setEditAfId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar AF</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateAf} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Numero da AF</label>
              <Input required value={editAfForm.numeroAf} onChange={(e) => setEditAfForm({ ...editAfForm, numeroAf: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Pedido</label>
              <Input type="date" required value={editAfForm.dataPedidoAf} onChange={(e) => setEditAfForm({ ...editAfForm, dataPedidoAf: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor da AF (R$)</label>
              <Input type="number" step="0.01" required value={editAfForm.valorAf} onChange={(e) => setEditAfForm({ ...editAfForm, valorAf: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={updateAf.isPending}>Salvar Alteracoes</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar contrato</AlertDialogTitle>
            <AlertDialogDescription>
              {canClose
                ? "Confirme o encerramento do contrato. Depois disso, nao sera mais possivel gerar novos empenhos, AFs ou notas para ele."
                : "O contrato so pode ser encerrado quando todas as AFs estiverem entregues e todas as notas fiscais estiverem pagas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo do encerramento</label>
            <Input value={motivoEncerramento} onChange={(event) => setMotivoEncerramento(event.target.value)} placeholder="Opcional" />
          </div>
          {!canClose && (
            <div className="text-sm text-muted-foreground">
              {hasPendingAfs && <p>Existem AFs pendentes de entrega.</p>}
              {hasPendingNotas && <p>Existem notas fiscais pendentes de pagamento.</p>}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloseContrato} disabled={!canClose || closeContrato.isPending}>
              Confirmar encerramento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteContratoOpen} onOpenChange={setDeleteContratoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Voce deseja realmente excluir este item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContrato} disabled={deleteContrato.isPending}>
              Confirmar exclusao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteEmpenhoId} onOpenChange={(open) => !open && setDeleteEmpenhoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empenho</AlertDialogTitle>
            <AlertDialogDescription>
              Voce deseja realmente excluir este item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmpenho} disabled={deleteEmpenho.isPending}>
              Confirmar exclusao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!annulEmpenhoId} onOpenChange={(open) => !open && setAnnulEmpenhoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular empenho</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o valor que deve ser anulado do saldo ainda disponivel deste empenho.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor da anulacao</label>
              <Input
                type="number"
                step="0.01"
                value={annulEmpenhoForm.valorAnulado}
                onChange={(event) => setAnnulEmpenhoForm({ ...annulEmpenhoForm, valorAnulado: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data da anulacao</label>
              <Input
                type="date"
                value={annulEmpenhoForm.dataAnulacao}
                onChange={(event) => setAnnulEmpenhoForm({ ...annulEmpenhoForm, dataAnulacao: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo</label>
              <Input
                value={annulEmpenhoForm.motivoAnulacao}
                onChange={(event) => setAnnulEmpenhoForm({ ...annulEmpenhoForm, motivoAnulacao: event.target.value })}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAnnulEmpenho}
              disabled={
                annulEmpenho.isPending ||
                !annulEmpenhoForm.valorAnulado ||
                !annulEmpenhoForm.dataAnulacao ||
                !annulEmpenhoForm.motivoAnulacao
              }
            >
              Confirmar anulacao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAditivoId} onOpenChange={(open) => !open && setDeleteAditivoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aditivo</AlertDialogTitle>
            <AlertDialogDescription>
              Voce deseja realmente excluir este item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAditivo} disabled={deleteAditivo.isPending}>
              Confirmar exclusao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteAnexoId} onOpenChange={(open) => !open && setDeleteAnexoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anexo</AlertDialogTitle>
            <AlertDialogDescription>
              Voce deseja realmente excluir este item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAnexo} disabled={deleteAnexo.isPending}>
              Confirmar exclusao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
