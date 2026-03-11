import { useState } from "react";
import { useAfs, useExtendAf, useUpdateEntregaAf } from "@/hooks/use-afs";
import { useCreateNotaFiscal } from "@/hooks/use-notas-fiscais";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Package, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AfsPanel() {
  const { data: afs = [], isLoading } = useAfs();
  const extendMutation = useExtendAf();
  const updateEntregaMutation = useUpdateEntregaAf();
  const createNotaMutation = useCreateNotaFiscal();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("aberto");
  const [selectedAf, setSelectedAf] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<"extend" | "entrega">("extend");
  const [extensionDate, setExtensionDate] = useState("");
  const [notaForm, setNotaForm] = useState({ numeroNota: "", valorNota: "", dataNota: "" });

  const afsAberto = afs.filter((a: any) => !a.dataEntregaReal);
  const afsEntregues = afs.filter((a: any) => a.dataEntregaReal);

  const filterAfs = (list: any[]) => 
    list.filter((a: any) => 
      a.empenho.contrato.numeroContrato.includes(search) ||
      a.empenho.contrato.fornecedor.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.empenho.contrato.processoDigital.numeroProcessoDigital.includes(search) ||
      search === ""
    );

  const filtered = activeTab === "aberto" 
    ? filterAfs(afsAberto)
    : filterAfs(afsEntregues);

  const handleExtend = () => {
    if (!selectedAf || !extensionDate) return;
    extendMutation.mutate({ id: selectedAf.id, dataExtensao: extensionDate }, {
      onSuccess: () => {
        toast({ title: "Prazo estendido com sucesso!" });
        setSelectedAf(null);
        setExtensionDate("");
      },
      onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
    });
  };

  const handleEntrega = () => {
    if (!selectedAf || !notaForm.numeroNota || !notaForm.valorNota || !notaForm.dataNota) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }

    createNotaMutation.mutate({
      contratoId: selectedAf.empenho.contrato.id,
      numeroNota: notaForm.numeroNota,
      valorNota: parseFloat(notaForm.valorNota),
      dataNota: notaForm.dataNota
    }, {
      onSuccess: () => {
        updateEntregaMutation.mutate({ id: selectedAf.id, dataEntregaReal: new Date().toISOString().split('T')[0] }, {
          onSuccess: () => {
            toast({ title: "Entrega registrada e nota fiscal criada!" });
            setSelectedAf(null);
            setNotaForm({ numeroNota: "", valorNota: "", dataNota: "" });
            setDialogMode("extend");
          },
          onError: (err) => toast({ variant: "destructive", title: "Erro ao registrar entrega", description: err.message })
        });
      },
      onError: (err) => toast({ variant: "destructive", title: "Erro ao criar nota fiscal", description: err.message })
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Acompanhamento de AFs</h1>
        <p className="text-muted-foreground mt-1">Acompanhe autoridades de fornecimento e prazos.</p>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="aberto">
                AFs em Aberto ({afsAberto.length})
              </TabsTrigger>
              <TabsTrigger value="entregue">
                AFs Entregues ({afsEntregues.length})
              </TabsTrigger>
            </TabsList>
            <Input 
              placeholder="Buscar contrato..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>

          <TabsContent value="aberto" className="mt-4">
            <div className="overflow-x-auto">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Processo</TableHead>
                <TableHead>Valor AF</TableHead>
                <TableHead>Data Estimada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><div className="flex flex-col items-center"><Package className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhuma AF</p></div></TableCell></TableRow>
              ) : (
                filtered.map((af: any) => (
                  <TableRow key={af.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                    <TableCell className="font-medium">{af.empenho.contrato.numeroContrato}</TableCell>
                    <TableCell className="text-sm">{af.empenho.contrato.fornecedor.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{af.empenho.contrato.processoDigital.numeroProcessoDigital}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(parseFloat(af.valorAf))}</TableCell>
                    <TableCell className="text-sm">{formatDate(af.dataExtensao || af.dataEstimadaEntrega)}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        af.dataEntregaReal
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                          : af.flagEntregaNotificada
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100'
                      }`}>
                        {af.dataEntregaReal ? 'Entregue' : af.flagEntregaNotificada ? 'Notificada' : 'Pendente'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant={af.dataEntregaReal ? "outline" : "default"}
                          onClick={() => {
                            setSelectedAf(af);
                            setDialogMode("entrega");
                          }}
                          data-testid={`button-entrega-${af.id}`}
                        >
                          <CheckCircle size={16} />
                        </Button>
                        {af.flagEntregaNotificada && !af.dataEntregaReal && (
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Valor AF</TableHead>
                    <TableHead>Data Estimada</TableHead>
                    <TableHead>Data Entrega</TableHead>
                    <TableHead className="w-20">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8"><div className="flex flex-col items-center"><Package className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhuma AF entregue</p></div></TableCell></TableRow>
                  ) : (
                    filtered.map((af: any) => (
                      <TableRow key={af.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                        <TableCell className="font-medium">{af.empenho.contrato.numeroContrato}</TableCell>
                        <TableCell className="text-sm">{af.empenho.contrato.fornecedor.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{af.empenho.contrato.processoDigital.numeroProcessoDigital}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(parseFloat(af.valorAf))}</TableCell>
                        <TableCell className="text-sm">{formatDate(af.dataExtensao || af.dataEstimadaEntrega)}</TableCell>
                        <TableCell className="text-sm font-medium">{formatDate(af.dataEntregaReal)}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedAf(af);
                              setDialogMode("entrega");
                            }}
                            data-testid={`button-entrega-${af.id}`}
                          >
                            <CheckCircle size={16} />
                          </Button>
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

      <Dialog open={!!selectedAf} onOpenChange={(open) => {
        if (!open) {
          setSelectedAf(null);
          setExtensionDate("");
          setNotaForm({ numeroNota: "", valorNota: "", dataNota: "" });
          setDialogMode("extend");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "extend" ? "Prorrogar Prazo de Entrega" : "Registrar Entrega"}
            </DialogTitle>
          </DialogHeader>
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
                    <Input 
                      type="date" 
                      value={extensionDate} 
                      onChange={e => setExtensionDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <Button 
                    onClick={handleExtend} 
                    className="w-full"
                    disabled={!extensionDate || extendMutation.isPending}
                  >
                    Prorrogar Prazo
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Número da Nota Fiscal</label>
                    <Input 
                      value={notaForm.numeroNota}
                      onChange={e => setNotaForm({...notaForm, numeroNota: e.target.value})}
                      placeholder="Ex: NF-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Valor da Nota (R$)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={notaForm.valorNota}
                      onChange={e => setNotaForm({...notaForm, valorNota: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data da Nota</label>
                    <Input 
                      type="date"
                      value={notaForm.dataNota}
                      onChange={e => setNotaForm({...notaForm, dataNota: e.target.value})}
                    />
                  </div>
                  <Button 
                    onClick={handleEntrega} 
                    className="w-full"
                    disabled={!notaForm.numeroNota || !notaForm.valorNota || !notaForm.dataNota || createNotaMutation.isPending || updateEntregaMutation.isPending}
                  >
                    Registrar Entrega
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
