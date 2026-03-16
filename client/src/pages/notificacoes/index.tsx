import { useState } from "react";
import { useNotificacoes } from "@/hooks/use-notificacoes";
import { useContratos } from "@/hooks/use-contratos";
import { useNotifyAf, useUpdateEntregaAf } from "@/hooks/use-afs";
import { formatDate, formatCurrency, parseNumberString } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { AlertCircle, BellRing, CheckCircle, Clock3, FileWarning, PackageCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Notificacao } from "@shared/schema";

function daysUntil(date: string) {
  const today = new Date();
  const base = new Date(`${date}T00:00:00`);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = base.getTime() - todayStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export default function Notificacoes() {
  const { data: notificacoes = [], isLoading } = useNotificacoes();
  const { data: contratos = [], isLoading: contratosLoading } = useContratos();
  const notifyAf = useNotifyAf();
  const updateEntrega = useUpdateEntregaAf();
  const { toast } = useToast();

  const [entregaDialog, setEntregaDialog] = useState<string | null>(null);
  const [confirmEntregaId, setConfirmEntregaId] = useState<string | null>(null);
  const [dataEntrega, setDataEntrega] = useState("");

  const contratosProximosVencimento = contratos
    .filter((contrato) => contrato.status === "vigente")
    .map((contrato) => ({
      contrato,
      diasRestantes: daysUntil(contrato.vigenciaFinal),
    }))
    .filter((item) => item.diasRestantes <= 120)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  const handleNotify = (id: string) => {
    notifyAf.mutate(id, {
      onSuccess: () => toast({ title: "Empresa notificada com sucesso!" }),
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao notificar empresa",
      }),
    });
  };

  const handleEntrega = (id: string) => {
    updateEntrega.mutate(
      { id, dataEntregaReal: dataEntrega },
      {
        onSuccess: () => {
          toast({ title: "Entrega registrada!" });
          setConfirmEntregaId(null);
          setEntregaDialog(null);
          setDataEntrega("");
        },
        onError: (err) => toast({
          variant: "destructive",
          title: "Erro",
          description: err instanceof Error ? err.message : "Erro ao registrar entrega",
        }),
      },
    );
  };

  if (isLoading || contratosLoading) return <div className="p-8 text-center animate-pulse">Buscando alertas...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central de Notificacoes</h1>
        <p className="text-muted-foreground mt-1">Acompanhe alertas operacionais de AFs e vencimento de contratos.</p>
      </div>

      <Tabs defaultValue="afs" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="afs">AFs</TabsTrigger>
          <TabsTrigger value="contratos">Contratos</TabsTrigger>
        </TabsList>

        <TabsContent value="afs" className="mt-6">
          <div className="grid gap-4">
            {notificacoes.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground bg-card border border-border/50 rounded-xl shadow-sm">
                <CheckCircle size={64} className="mx-auto mb-4 text-emerald-500 opacity-50" />
                <h3 className="text-xl font-medium">Tudo em dia!</h3>
                <p className="mt-2">Nenhuma AF com prazo de entrega critico no momento.</p>
              </div>
            ) : (
              notificacoes.map((item: Notificacao) => {
                const isAtrasado = item.isLate;

                return (
                  <Card key={item.id} className={`border-l-4 shadow-sm transition-all hover:shadow-md ${isAtrasado ? "border-l-red-500 bg-red-50/10" : "border-l-amber-500 bg-amber-50/10"}`}>
                    <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {isAtrasado ? <AlertCircle className="text-red-500" /> : <BellRing className="text-amber-500" />}
                          <h3 className="text-lg font-bold text-foreground">Contrato: {item.contrato}</h3>
                          <Badge variant="outline" className={isAtrasado ? "bg-red-100 text-red-800 border-red-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                            {isAtrasado ? "Atrasado" : "Prazo Proximo"}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground max-w-2xl">
                          A AF no valor de {formatCurrency(parseNumberString(item.af.valorAf))} vinculada ao fornecedor{" "}
                          <strong>{item.fornecedor}</strong> tem entrega estimada para{" "}
                          <strong>{formatDate(item.af.dataExtensao || item.af.dataEstimadaEntrega)}</strong>.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                        <Button
                          variant={isAtrasado ? "destructive" : "secondary"}
                          disabled={item.af.flagEntregaNotificada || notifyAf.isPending}
                          onClick={() => handleNotify(item.af.id)}
                          className="flex-1 md:flex-none shadow-sm"
                        >
                          {item.af.flagEntregaNotificada ? "Ja Notificado" : "Notificar Empresa"}
                        </Button>

                        <Dialog open={entregaDialog === item.af.id} onOpenChange={(open) => setEntregaDialog(open ? item.af.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 flex-1 md:flex-none shadow-sm">
                              <PackageCheck size={18} className="mr-2" /> Receber AF
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>Registrar Entrega de AF</DialogTitle></DialogHeader>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              setConfirmEntregaId(item.af.id);
                            }} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Data Real da Entrega</label>
                                <Input type="date" required value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} />
                              </div>
                              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={updateEntrega.isPending}>
                                Confirmar Recebimento
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="contratos" className="mt-6">
          <div className="grid gap-4">
            {contratosProximosVencimento.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground bg-card border border-border/50 rounded-xl shadow-sm">
                <CheckCircle size={64} className="mx-auto mb-4 text-emerald-500 opacity-50" />
                <h3 className="text-xl font-medium">Nenhum vencimento proximo</h3>
                <p className="mt-2">Nao ha contratos vigentes vencendo nos proximos 120 dias.</p>
              </div>
            ) : (
              contratosProximosVencimento.map(({ contrato, diasRestantes }) => {
                const vencido = diasRestantes < 0;
                const venceHoje = diasRestantes === 0;

                return (
                  <Card
                    key={contrato.id}
                    className={`border-l-4 shadow-sm transition-all hover:shadow-md ${
                      vencido
                        ? "border-l-red-500 bg-red-50/10"
                        : diasRestantes <= 30
                          ? "border-l-amber-500 bg-amber-50/10"
                          : "border-l-blue-500 bg-blue-50/10"
                    }`}
                  >
                    <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileWarning className={vencido ? "text-red-500" : "text-amber-500"} />
                          <h3 className="text-lg font-bold text-foreground">Contrato: {contrato.numeroContrato}</h3>
                          <Badge
                            variant="outline"
                            className={
                              vencido
                                ? "bg-red-100 text-red-800 border-red-200"
                                : diasRestantes <= 30
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-blue-100 text-blue-800 border-blue-200"
                            }
                          >
                            {vencido ? "Vencido" : venceHoje ? "Vence Hoje" : "Vencimento Proximo"}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground max-w-2xl">
                          O contrato com <strong>{contrato.fornecedor.nome}</strong> vence em{" "}
                          <strong>{formatDate(contrato.vigenciaFinal)}</strong>.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Processo: <strong>{contrato.processoDigital.numeroProcessoDigital}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="rounded-xl border border-border/50 bg-background px-4 py-3 text-center min-w-[160px]">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                            <Clock3 size={16} />
                            Contagem regressiva
                          </div>
                          <div className={`mt-2 text-2xl font-bold ${vencido ? "text-red-600" : "text-foreground"}`}>
                            {vencido ? `${Math.abs(diasRestantes)} dias` : `${diasRestantes} dias`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {vencido ? "desde o vencimento" : venceHoje ? "vence hoje" : "para o vencimento"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmEntregaId !== null} onOpenChange={(open) => { if (!open) setConfirmEntregaId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteracao da AF</AlertDialogTitle>
            <AlertDialogDescription>Voce deseja realmente alterar este item?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmEntregaId) {
                  handleEntrega(confirmEntregaId);
                }
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
