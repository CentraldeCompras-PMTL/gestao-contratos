import { useParams } from "wouter";
import { useState } from "react";
import { useContrato, useCreateEmpenho } from "@/hooks/use-contratos";
import { useCreateAf } from "@/hooks/use-afs";
import { formatCurrency, formatDate, parseNumberString } from "@/lib/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, DollarSign, PackageOpen, Info, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ContratoDetail() {
  const { id } = useParams();
  const { data: contrato, isLoading } = useContrato(id!);
  const createEmpenho = useCreateEmpenho();
  const createAf = useCreateAf();
  const { toast } = useToast();

  const [empenhoDialog, setEmpenhoDialog] = useState(false);
  const [empForm, setEmpForm] = useState({ dataEmpenho: "", valorEmpenho: "" });

  const [afDialog, setAfDialog] = useState<string | null>(null);
  const [afForm, setAfForm] = useState({ dataPedidoAf: "", valorAf: "" });

  if (isLoading) return <div className="p-8 text-center animate-pulse">Carregando contrato...</div>;
  if (!contrato) return <div className="p-8 text-center text-red-500">Contrato não encontrado</div>;

  // Calculos Frontend Reais
  const valContrato = parseNumberString(contrato.valorContrato);
  const totalEmpenhado = contrato.empenhos?.reduce((acc: number, e: any) => acc + parseNumberString(e.valorEmpenho), 0) || 0;
  const saldoContrato = valContrato - totalEmpenhado;

  const handleEmpenho = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseNumberString(empForm.valorEmpenho) > saldoContrato) {
      toast({ variant: "destructive", title: "Valor superior ao saldo do contrato!" });
      return;
    }
    createEmpenho.mutate({ contratoId: contrato.id, ...empForm }, {
      onSuccess: () => {
        toast({ title: "Empenho registrado!" });
        setEmpenhoDialog(false);
        setEmpForm({ dataEmpenho: "", valorEmpenho: "" });
      }
    });
  };

  const handleAf = (e: React.FormEvent, empenho: any) => {
    e.preventDefault();
    const valEmp = parseNumberString(empenho.valorEmpenho);
    const totAfs = empenho.afs?.reduce((acc: number, af: any) => acc + parseNumberString(af.valorAf), 0) || 0;
    const saldoEmpenho = valEmp - totAfs;

    if (parseNumberString(afForm.valorAf) > saldoEmpenho) {
      toast({ variant: "destructive", title: "Valor superior ao saldo do empenho!" });
      return;
    }

    createAf.mutate({ empenhoId: empenho.id, ...afForm }, {
      onSuccess: () => {
        toast({ title: "AF gerada com sucesso! Data estimada calculada automaticamente (+30 dias)." });
        setAfDialog(null);
        setAfForm({ dataPedidoAf: "", valorAf: "" });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <Link href="/contratos" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contrato {contrato.numeroContrato}</h1>
          <p className="text-muted-foreground mt-1">{contrato.fornecedor?.nome} - CNPJ: {contrato.fornecedor?.cnpj}</p>
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
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Saldo Disponível</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(saldoContrato)}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><Info size={16} className="mr-2" /> Info</TabsTrigger>
          <TabsTrigger value="empenhos" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><DollarSign size={16} className="mr-2" /> Empenhos</TabsTrigger>
          <TabsTrigger value="afs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"><PackageOpen size={16} className="mr-2" /> AFs</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6 space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader><CardTitle>Vínculos do Processo</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold block text-muted-foreground">Processo Digital</span>
                  {contrato.processoDigital?.numeroProcessoDigital}
                </div>
                <div>
                  <span className="font-semibold block text-muted-foreground">Fase da Contratação</span>
                  <Badge variant="outline">{contrato.faseContratacao?.nomeFase}</Badge>
                </div>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                <span className="font-semibold block mb-2 text-primary">Objeto do Processo</span>
                <p className="text-foreground/80 leading-relaxed">{contrato.processoDigital?.objetoCompleto}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empenhos" className="mt-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Histórico de Empenhos</CardTitle>
              <Dialog open={empenhoDialog} onOpenChange={setEmpenhoDialog}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus size={16} className="mr-1"/> Novo Empenho</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Registrar Empenho</DialogTitle></DialogHeader>
                  <form onSubmit={handleEmpenho} className="space-y-4 pt-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm border border-emerald-200 dark:border-emerald-800">
                      Saldo do Contrato: <strong>{formatCurrency(saldoContrato)}</strong>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data do Empenho</label>
                      <Input type="date" required value={empForm.dataEmpenho} onChange={e => setEmpForm({...empForm, dataEmpenho: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor (R$)</label>
                      <Input type="number" step="0.01" required value={empForm.valorEmpenho} onChange={e => setEmpForm({...empForm, valorEmpenho: e.target.value})} />
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
                    <TableHead>Data</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Executado (AFs)</TableHead>
                    <TableHead>Saldo do Empenho</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contrato.empenhos?.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum empenho registrado</TableCell></TableRow>}
                  {contrato.empenhos?.map((e: any) => {
                    const val = parseNumberString(e.valorEmpenho);
                    const afsVal = e.afs?.reduce((acc: number, a: any) => acc + parseNumberString(a.valorAf), 0) || 0;
                    const saldo = val - afsVal;
                    return (
                      <TableRow key={e.id}>
                        <TableCell>{formatDate(e.dataEmpenho)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(val)}</TableCell>
                        <TableCell className="text-blue-600">{formatCurrency(afsVal)}</TableCell>
                        <TableCell className="text-emerald-600">{formatCurrency(saldo)}</TableCell>
                        <TableCell className="text-right">
                          <Dialog open={afDialog === e.id} onOpenChange={open => setAfDialog(open ? e.id : null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" disabled={saldo <= 0}>Gerar AF</Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader><DialogTitle>Autorização de Fornecimento</DialogTitle></DialogHeader>
                              <form onSubmit={(ev) => handleAf(ev, e)} className="space-y-4 pt-4">
                                <div className="p-3 bg-muted rounded-lg text-sm">
                                  Saldo deste empenho: <strong>{formatCurrency(saldo)}</strong>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Data do Pedido</label>
                                  <Input type="date" required value={afForm.dataPedidoAf} onChange={ev => setAfForm({...afForm, dataPedidoAf: ev.target.value})} />
                                  <p className="text-xs text-muted-foreground">+30 dias serão adicionados para entrega estimada.</p>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Valor da AF (R$)</label>
                                  <Input type="number" step="0.01" required value={afForm.valorAf} onChange={ev => setAfForm({...afForm, valorAf: ev.target.value})} />
                                </div>
                                <Button type="submit" className="w-full" disabled={createAf.isPending}>Confirmar AF</Button>
                              </form>
                            </DialogContent>
                          </Dialog>
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
            <CardHeader><CardTitle>Todas as AFs (Autorizações)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Entrega Estimada</TableHead>
                    <TableHead>Entrega Real</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contrato.empenhos?.flatMap((e: any) => e.afs).length === 0 && 
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma AF gerada</TableCell></TableRow>}
                  
                  {contrato.empenhos?.flatMap((e: any) => e.afs).map((af: any) => (
                    <TableRow key={af.id}>
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
                          <Badge className="bg-emerald-500">Concluído</Badge>
                        ) : af.flagEntregaNotificada ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800">Notificado</Badge>
                        ) : (
                          <Badge variant="outline">Aguardando</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
