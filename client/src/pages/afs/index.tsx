import { useMemo, useState } from "react";
import { useAfs, useExtendAf, useNotifyAf, useUpdateEntregaAf, useUpdateAf } from "@/hooks/use-afs";
import { useCreateNotaFiscal } from "@/hooks/use-notas-fiscais";
import { formatDate, formatCurrency, parseNumberString } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BellRing, Clock, Package, CheckCircle, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDeleteAf } from "@/hooks/use-afs";
import type { AfWithRelations } from "@shared/schema";

function daysUntil(date: string) {
  const today = new Date();
  const target = new Date(`${date}T00:00:00`);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = target.getTime() - todayStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getPrazoEntregaInfo(af: AfWithRelations) {
  const prazoBase = af.dataExtensao || af.dataEstimadaEntrega;
  const diasRestantes = daysUntil(prazoBase);

  if (af.dataEntregaReal) {
    return {
      prazoBase,
      diasRestantes,
      label: "Entregue",
      badgeClass: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100",
    };
  }

  if (diasRestantes < 0) {
    return {
      prazoBase,
      diasRestantes,
      label: "Prazo vencido",
      badgeClass: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100",
    };
  }

  if (diasRestantes === 0) {
    return {
      prazoBase,
      diasRestantes,
      label: "Entrega vence hoje",
      badgeClass: "bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100",
    };
  }

  if (diasRestantes <= 10) {
    return {
      prazoBase,
      diasRestantes,
      label: "Prazo proximo",
      badgeClass: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100",
    };
  }

  return {
    prazoBase,
    diasRestantes,
    label: af.flagEntregaNotificada ? "Empresa notificada" : "Pendente",
    badgeClass: af.flagEntregaNotificada
      ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
      : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100",
  };
}

export default function AfsPanel() {
  const { data: afs = [], isLoading } = useAfs();
  const extendMutation = useExtendAf();
  const notifyMutation = useNotifyAf();
  const updateEntregaMutation = useUpdateEntregaAf();
  const deleteAfMutation = useDeleteAf();
  const updateAfMutation = useUpdateAf();
  const createNotaMutation = useCreateNotaFiscal();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("aberto");
  const [selectedAf, setSelectedAf] = useState<AfWithRelations | null>(null);
  const [pendingAction, setPendingAction] = useState<"extend" | "entrega" | "delete" | null>(null);
  const [dialogMode, setDialogMode] = useState<"extend" | "entrega">("extend");
  const [extensionDate, setExtensionDate] = useState("");
  const [entregaForm, setEntregaForm] = useState({ dataEntregaReal: "", numeroNota: "", valorNota: "", dataNota: "" });

  const [editAfId, setEditAfId] = useState<string | null>(null);
  const [editAfForm, setEditAfForm] = useState({ numeroAf: "", dataPedidoAf: "", valorAf: "" });

  const afsAberto = useMemo(() => afs.filter((af) => !af.dataEntregaReal), [afs]);
  const afsEntregues = useMemo(() => afs.filter((af) => !!af.dataEntregaReal), [afs]);

  const filterAfs = (list: AfWithRelations[]) =>
    list.filter((af) =>
      af.empenho.contrato.numeroContrato.includes(search) ||
      af.empenho.contrato.fornecedor.nome.toLowerCase().includes(search.toLowerCase()) ||
      af.empenho.contrato.processoDigital.numeroProcessoDigital.includes(search) ||
      search === ""
    );

  const filtered = activeTab === "aberto" ? filterAfs(afsAberto) : filterAfs(afsEntregues);

  const resetDialog = () => {
    setSelectedAf(null);
    setPendingAction(null);
    setExtensionDate("");
    setEntregaForm({ dataEntregaReal: "", numeroNota: "", valorNota: "", dataNota: "" });
    setDialogMode("extend");
  };

  const executeExtend = () => {
    if (!selectedAf || !extensionDate) return;
    extendMutation.mutate(
      { id: selectedAf.id, dataExtensao: extensionDate },
      {
        onSuccess: () => {
          toast({ title: "Prazo estendido com sucesso!" });
          resetDialog();
        },
        onError: (err) => toast({
          variant: "destructive",
          title: "Erro",
          description: err instanceof Error ? err.message : "Erro ao estender prazo",
        }),
      },
    );
  };

  const handleUpdateAf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAfId) return;
    updateAfMutation.mutate(
      { id: editAfId, ...editAfForm },
      {
        onSuccess: () => {
          toast({ title: "AF atualizada com sucesso!" });
          setEditAfId(null);
        },
        onError: (err) =>
          toast({
            variant: "destructive",
            title: "Erro ao atualizar AF",
            description: err instanceof Error ? err.message : "Falha ao atualizar AF",
          }),
      },
    );
  };

  const executeEntrega = () => {
    if (!selectedAf || !entregaForm.dataEntregaReal || !entregaForm.numeroNota || !entregaForm.valorNota || !entregaForm.dataNota) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }

    createNotaMutation.mutate(
      {
        contratoId: selectedAf.empenho.contrato.id,
        numeroNota: entregaForm.numeroNota,
        valorNota: entregaForm.valorNota,
        dataNota: entregaForm.dataNota,
      },
      {
        onSuccess: () => {
          updateEntregaMutation.mutate(
            { id: selectedAf.id, dataEntregaReal: entregaForm.dataEntregaReal },
            {
              onSuccess: () => {
                toast({ title: "Entrega registrada e nota recebida cadastrada!" });
                resetDialog();
              },
              onError: (err) => toast({
                variant: "destructive",
                title: "Erro ao registrar entrega",
                description: err instanceof Error ? err.message : "Falha ao registrar entrega",
              }),
            },
          );
        },
        onError: (err) => toast({
          variant: "destructive",
          title: "Erro ao criar nota fiscal",
          description: err instanceof Error ? err.message : "Falha ao criar nota fiscal",
        }),
      },
    );
  };

  const executeDelete = () => {
    if (!selectedAf) return;
    deleteAfMutation.mutate(selectedAf.id, {
      onSuccess: () => {
        toast({ title: "AF excluida com sucesso!" });
        resetDialog();
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro ao excluir AF",
        description: err instanceof Error ? err.message : "Falha ao excluir AF",
      }),
    });
  };

  const executeNotify = (af: AfWithRelations) => {
    notifyMutation.mutate(af.id, {
      onSuccess: () => {
        toast({ title: "Empresa notificada com sucesso!" });
      },
      onError: (err) =>
        toast({
          variant: "destructive",
          title: "Erro ao notificar fornecedor",
          description: err instanceof Error ? err.message : "Falha ao notificar fornecedor",
        }),
    });
  };

  const renderRows = (list: AfWithRelations[], delivered: boolean) => (
    list.map((af) => (
      <TableRow key={af.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
        <TableCell className="font-medium">{af.empenho.contrato.numeroContrato}</TableCell>
        <TableCell className="font-medium text-center">{af.numeroAf}</TableCell>
        <TableCell className="text-sm">{af.empenho.contrato.fornecedor.nome}</TableCell>
        <TableCell className="text-sm text-muted-foreground">{af.empenho.contrato.processoDigital.numeroProcessoDigital}</TableCell>
        <TableCell className="font-medium">{formatCurrency(parseNumberString(af.valorAf))}</TableCell>
        <TableCell className="text-sm">{formatDate(getPrazoEntregaInfo(af).prazoBase)}</TableCell>
        {delivered && <TableCell className="text-sm font-medium">{formatDate(af.dataEntregaReal)}</TableCell>}
        {!delivered && (
          <TableCell>
            <div className="space-y-1">
              <Badge className={getPrazoEntregaInfo(af).badgeClass}>
                {getPrazoEntregaInfo(af).label}
              </Badge>
              {getPrazoEntregaInfo(af).diasRestantes <= 10 && getPrazoEntregaInfo(af).diasRestantes >= 0 && (
                <p className="text-xs text-muted-foreground">
                  {getPrazoEntregaInfo(af).diasRestantes === 0
                    ? "Entrega prevista para hoje"
                    : `${getPrazoEntregaInfo(af).diasRestantes} dia(s) restantes`}
                </p>
              )}
              {getPrazoEntregaInfo(af).diasRestantes < 0 && (
                <p className="text-xs text-red-600">
                  {Math.abs(getPrazoEntregaInfo(af).diasRestantes)} dia(s) em atraso
                </p>
              )}
            </div>
          </TableCell>
        )}
        <TableCell>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditAfId(af.id);
                setEditAfForm({
                  numeroAf: af.numeroAf,
                  dataPedidoAf: af.dataPedidoAf.slice(0, 10),
                  valorAf: String(af.valorAf),
                });
              }}
              title="Editar AF"
            >
              <Pencil size={16} />
            </Button>
            <Button
              size="sm"
              variant={delivered ? "outline" : af.dataEntregaReal ? "outline" : "default"}
              onClick={() => {
                setSelectedAf(af);
                setDialogMode("entrega");
              }}
              data-testid={`button-entrega-${af.id}`}
            >
              <CheckCircle size={16} />
            </Button>
            {!delivered && af.flagEntregaNotificada && !af.dataEntregaReal && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedAf(af);
                  setDialogMode("extend");
                }}
                data-testid={`button-extend-${af.id}`}
              >
                <Clock size={16} />
              </Button>
            )}
            {!delivered && !af.flagEntregaNotificada && getPrazoEntregaInfo(af).diasRestantes <= 10 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => executeNotify(af)}
                disabled={notifyMutation.isPending}
                data-testid={`button-notify-${af.id}`}
              >
                <BellRing size={16} />
              </Button>
            )}
            {!delivered && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedAf(af);
                  setPendingAction("delete");
                }}
                data-testid={`button-delete-${af.id}`}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Acompanhamento de AFs</h1>
        <p className="text-muted-foreground mt-1">Acompanhe autorizacoes de fornecimento e prazos.</p>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="aberto">AFs em Aberto ({afsAberto.length})</TabsTrigger>
              <TabsTrigger value="entregue">AFs Entregues ({afsEntregues.length})</TabsTrigger>
            </TabsList>
            <Input placeholder="Buscar contrato..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-64" />
          </div>

          <TabsContent value="aberto" className="mt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead className="text-center">Número AF</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Valor AF</TableHead>
                    <TableHead>Prazo de Entrega</TableHead>
                    <TableHead>Status do Prazo</TableHead>
                    <TableHead className="w-20">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8"><div className="flex flex-col items-center"><Package className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhuma AF</p></div></TableCell></TableRow>
                  ) : renderRows(filtered, false)}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="entregue" className="mt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead className="text-center">Número AF</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Valor AF</TableHead>
                    <TableHead>Data Estimada</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead className="w-20">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8"><div className="flex flex-col items-center"><Package className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhuma AF entregue</p></div></TableCell></TableRow>
                  ) : renderRows(filtered, true)}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedAf} onOpenChange={(open) => { if (!open) resetDialog(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogMode === "extend" ? "Prorrogar Prazo de Entrega" : "Registrar Entrega"}</DialogTitle></DialogHeader>
          {selectedAf && (
            <div className="space-y-4 pt-4">
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded">
                <p className="text-sm text-muted-foreground">Contrato</p>
                <p className="font-medium">{selectedAf.empenho.contrato.numeroContrato}</p>
              </div>

              {dialogMode === "extend" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nova Data de Entrega</label>
                    <Input type="date" value={extensionDate} onChange={(e) => setExtensionDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  </div>
                  <Button onClick={() => setPendingAction("extend")} className="w-full" disabled={!extensionDate || extendMutation.isPending}>Prorrogar Prazo</Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data da Entrega</label>
                    <Input type="date" value={entregaForm.dataEntregaReal} onChange={(e) => setEntregaForm({ ...entregaForm, dataEntregaReal: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Numero da Nota Fiscal</label>
                    <Input value={entregaForm.numeroNota} onChange={(e) => setEntregaForm({ ...entregaForm, numeroNota: e.target.value })} placeholder="Ex: NF-001" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valor da Nota (R$)</label>
                    <Input type="number" step="0.01" value={entregaForm.valorNota} onChange={(e) => setEntregaForm({ ...entregaForm, valorNota: e.target.value })} placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data da Nota</label>
                    <Input type="date" value={entregaForm.dataNota} onChange={(e) => setEntregaForm({ ...entregaForm, dataNota: e.target.value })} />
                  </div>
                  <Button onClick={() => setPendingAction("entrega")} className="w-full" disabled={!entregaForm.dataEntregaReal || !entregaForm.numeroNota || !entregaForm.valorNota || !entregaForm.dataNota || createNotaMutation.isPending || updateEntregaMutation.isPending}>
                    Registrar Entrega
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
            <Button type="submit" className="w-full" disabled={updateAfMutation.isPending}>Salvar Alteracoes</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => { if (!open) setPendingAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "delete" ? "Excluir AF" : "Confirmar alteracao da AF"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "delete"
                ? "Voce deseja realmente excluir este item?"
                : "Voce deseja realmente alterar este item?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAction === "extend") executeExtend();
                if (pendingAction === "entrega") executeEntrega();
                if (pendingAction === "delete") executeDelete();
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
