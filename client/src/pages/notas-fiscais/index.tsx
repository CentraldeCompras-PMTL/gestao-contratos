import { useState } from "react";
import { useNotasFiscais, useCreateNotaFiscal, useSendNotaFiscalToPayment, useRegisterNotaFiscalPayment, useDeleteNotaFiscal } from "@/hooks/use-notas-fiscais";
import { useContratos } from "@/hooks/use-contratos";
import { useEntes } from "@/hooks/use-entes";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, formatCurrency, parseNumberString } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Plus, FileText, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ContratoWithRelations, NotaFiscalWithRelations } from "@shared/schema";

export default function NotasFiscais() {
  const { user } = useAuth();
  const { data: notas = [], isLoading } = useNotasFiscais();
  const { data: contratos = [] } = useContratos();
  const { data: entes = [] } = useEntes();
  const createMutation = useCreateNotaFiscal();
  const sendToPaymentMutation = useSendNotaFiscalToPayment();
  const registerPaymentMutation = useRegisterNotaFiscalPayment();
  const deleteMutation = useDeleteNotaFiscal();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("nota_recebida");
  const [contratoStatusFilter, setContratoStatusFilter] = useState("all");
  const [enteFilter, setEnteFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ contratoId: "", numeroNota: "", valorNota: "", dataNota: "" });
  const [deleteTarget, setDeleteTarget] = useState<NotaFiscalWithRelations | null>(null);
  const [sendTarget, setSendTarget] = useState<NotaFiscalWithRelations | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<NotaFiscalWithRelations | null>(null);
  const [paymentFlowForm, setPaymentFlowForm] = useState({ numeroProcessoPagamento: "", dataEnvioPagamento: "", dataPagamento: "" });

  const filtered = notas.filter((nota) =>
    (nota.numeroNota.toLowerCase().includes(search.toLowerCase()) ||
      nota.contrato.numeroContrato.includes(search)) &&
    (statusTab === "all" || nota.statusPagamento === statusTab) &&
    (contratoStatusFilter === "all" || nota.contrato.status === contratoStatusFilter) &&
    (enteFilter === "all" || nota.contrato.processoDigital.enteId === enteFilter || nota.contrato.enteId === enteFilter)
  );

  const resetForm = () => setFormData({ contratoId: "", numeroNota: "", valorNota: "", dataNota: "" });
  const resetPaymentFlowForm = () => setPaymentFlowForm({ numeroProcessoPagamento: "", dataEnvioPagamento: "", dataPagamento: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        contratoId: formData.contratoId,
        numeroNota: formData.numeroNota,
        valorNota: String(formData.valorNota),
        dataNota: formData.dataNota,
      },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setIsDialogOpen(false);
          resetForm();
        },
        onError: (err) => toast({
          variant: "destructive",
          title: "Erro",
          description: err instanceof Error ? err.message : "Erro ao criar nota fiscal",
        }),
      },
    );
  };

  const handleSendToPayment = () => {
    if (!sendTarget || !paymentFlowForm.numeroProcessoPagamento || !paymentFlowForm.dataEnvioPagamento) {
      toast({ variant: "destructive", title: "Preencha os campos obrigatorios" });
      return;
    }
    sendToPaymentMutation.mutate(
      {
        id: sendTarget.id,
        numeroProcessoPagamento: paymentFlowForm.numeroProcessoPagamento,
        dataEnvioPagamento: paymentFlowForm.dataEnvioPagamento,
      },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          setSendTarget(null);
          resetPaymentFlowForm();
        },
        onError: (err) => toast({
          variant: "destructive",
          title: "Erro",
          description: err instanceof Error ? err.message : "Erro ao enviar nota para pagamento",
        }),
      },
    );
  };

  const handleRegisterPayment = () => {
    if (!paymentTarget || !paymentFlowForm.dataPagamento) {
      toast({ variant: "destructive", title: "Preencha os campos obrigatorios" });
      return;
    }
    registerPaymentMutation.mutate(
      {
        id: paymentTarget.id,
        dataPagamento: paymentFlowForm.dataPagamento,
      },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          setPaymentTarget(null);
          resetPaymentFlowForm();
        },
        onError: (err) => toast({
          variant: "destructive",
          title: "Erro",
          description: err instanceof Error ? err.message : "Erro ao registrar pagamento",
        }),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Registro excluido com sucesso!" });
        setDeleteTarget(null);
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao excluir nota fiscal",
      }),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acompanhamento de Notas Fiscais</h1>
          <p className="text-muted-foreground mt-1">Gerencie notas fiscais e seu pagamento.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Nova Nota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Nota Fiscal</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contrato</label>
                <Select value={formData.contratoId} onValueChange={(v) => setFormData({ ...formData, contratoId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {contratos.map((contrato: ContratoWithRelations) => (
                      <SelectItem key={contrato.id} value={contrato.id} disabled={contrato.status === "encerrado"}>
                        {contrato.numeroContrato}{contrato.status === "encerrado" ? " - Encerrado" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Numero da Nota</label>
                <Input required value={formData.numeroNota} onChange={(e) => setFormData({ ...formData, numeroNota: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor</label>
                <Input required type="number" step="0.01" value={formData.valorNota} onChange={(e) => setFormData({ ...formData, valorNota: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input required type="date" value={formData.dataNota} onChange={(e) => setFormData({ ...formData, dataNota: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>Criar Nota Fiscal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <div className="mb-4">
          <Input placeholder="Buscar nota..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status do Contrato</label>
            <Select value={contratoStatusFilter} onValueChange={setContratoStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {user?.role === "admin" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Ente</label>
              <Select value={enteFilter} onValueChange={setEnteFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os entes</SelectItem>
                  {entes.map((ente) => (
                    <SelectItem key={ente.id} value={ente.id}>{ente.sigla} - {ente.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Tabs value={statusTab} onValueChange={setStatusTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="nota_recebida">Notas Recebidas</TabsTrigger>
            <TabsTrigger value="aguardando_pagamento">Aguardando Pagamento</TabsTrigger>
            <TabsTrigger value="pago">Notas Pagas</TabsTrigger>
          </TabsList>
          <TabsContent value={statusTab} className="mt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numero</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data da Nota</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processo Pagamento</TableHead>
                    <TableHead className="w-40">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8"><div className="flex flex-col items-center"><FileText className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhuma nota fiscal</p></div></TableCell></TableRow>
                  ) : (
                    filtered.map((nota: NotaFiscalWithRelations) => (
                      <TableRow key={nota.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                        <TableCell className="font-medium">{nota.numeroNota}</TableCell>
                        <TableCell>{nota.contrato.numeroContrato}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{nota.contrato.processoDigital.numeroProcessoDigital}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(parseNumberString(nota.valorNota))}</TableCell>
                        <TableCell className="text-sm">{formatDate(nota.dataNota)}</TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            nota.statusPagamento === "pago"
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                              : nota.statusPagamento === "aguardando_pagamento"
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100"
                          }`}>
                            {nota.statusPagamento === "pago" ? "Pago" : nota.statusPagamento === "aguardando_pagamento" ? "Aguardando pagamento" : "Nota recebida"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{nota.numeroProcessoPagamento || "-"}</TableCell>
                        <TableCell className="flex gap-1">
                          {nota.statusPagamento === "nota_recebida" && (
                            <Button size="sm" onClick={() => { setSendTarget(nota); setPaymentFlowForm({ numeroProcessoPagamento: "", dataEnvioPagamento: "", dataPagamento: "" }); }}>
                              Enviar
                            </Button>
                          )}
                          {nota.statusPagamento === "aguardando_pagamento" && (
                            <Button size="sm" variant="outline" onClick={() => { setPaymentTarget(nota); setPaymentFlowForm({ numeroProcessoPagamento: "", dataEnvioPagamento: "", dataPagamento: "" }); }}>
                              <Check size={16} className="mr-1" />
                              Pagar
                            </Button>
                          )}
                          {nota.statusPagamento === "nota_recebida" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteTarget(nota)}
                              disabled={nota.contrato.status === "encerrado"}
                              data-testid={`button-delete-${nota.id}`}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir nota fiscal</AlertDialogTitle>
            <AlertDialogDescription>
              Voce deseja realmente excluir este item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              Confirmar exclusao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!sendTarget} onOpenChange={(open) => { if (!open) { setSendTarget(null); resetPaymentFlowForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar nota para pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Numero do Processo de Pagamento</label>
              <Input value={paymentFlowForm.numeroProcessoPagamento} onChange={(e) => setPaymentFlowForm({ ...paymentFlowForm, numeroProcessoPagamento: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Envio</label>
              <Input type="date" value={paymentFlowForm.dataEnvioPagamento} onChange={(e) => setPaymentFlowForm({ ...paymentFlowForm, dataEnvioPagamento: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleSendToPayment} disabled={sendToPaymentMutation.isPending}>
              Confirmar envio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!paymentTarget} onOpenChange={(open) => { if (!open) { setPaymentTarget(null); resetPaymentFlowForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar pagamento</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Pagamento</label>
              <Input type="date" value={paymentFlowForm.dataPagamento} onChange={(e) => setPaymentFlowForm({ ...paymentFlowForm, dataPagamento: e.target.value })} />
            </div>
            <Button className="w-full" onClick={handleRegisterPayment} disabled={registerPaymentMutation.isPending}>
              Confirmar pagamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
