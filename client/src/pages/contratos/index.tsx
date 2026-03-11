import { useState } from "react";
import { Link } from "wouter";
import { useContratos, useCreateContrato, useUpdateContrato } from "@/hooks/use-contratos";
import { useProcessos } from "@/hooks/use-processos";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Eye, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contratos() {
  const { data: contratos = [], isLoading } = useContratos();
  const { data: processos = [] } = useProcessos();
  const createContrato = useCreateContrato();
  const updateContrato = useUpdateContrato();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Cascading form state
  const [procId, setProcId] = useState("");
  const [faseId, setFaseId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");
  const [valorContrato, setValorContrato] = useState("");
  const [vigenciaInicial, setVigenciaInicial] = useState("");
  const [vigenciaFinal, setVigenciaFinal] = useState("");

  const selectedProcesso = processos.find((p: any) => p.id === procId);
  const selectedFase = selectedProcesso?.fases?.find((f: any) => f.id === faseId);

  // Auto-select fornecedor if phase has one
  const handleFaseSelect = (fid: string) => {
    setFaseId(fid);
    const fase = selectedProcesso?.fases?.find((f: any) => f.id === fid);
    if (fase?.fornecedorId) {
      setFornecedorId(fase.fornecedorId);
    }
  };

  const filtered = contratos.filter((c: any) => 
    c.numeroContrato.includes(search) || 
    c.fornecedor?.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setProcId(c.processoDigitalId);
    setFaseId(c.faseContratacaoId);
    setFornecedorId(c.fornecedorId);
    setNumeroContrato(c.numeroContrato);
    setValorContrato(c.valorContrato);
    setVigenciaInicial(c.vigenciaInicial);
    setVigenciaFinal(c.vigenciaFinal);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procId || !faseId || !fornecedorId) {
      toast({ variant: "destructive", title: "Preencha todos os selects" });
      return;
    }
    createContrato.mutate({
      processoDigitalId: procId,
      faseContratacaoId: faseId,
      fornecedorId,
      numeroContrato,
      valorContrato, // Zod coerces or backend accepts string for precision
      vigenciaInicial,
      vigenciaFinal
    }, {
      onSuccess: () => {
        toast({ title: "Contrato criado!" });
        setDialogOpen(false);
        // reset
        setProcId(""); setFaseId(""); setFornecedorId("");
        setNumeroContrato(""); setValorContrato(""); setVigenciaInicial(""); setVigenciaFinal("");
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground mt-1">Gestão de contratos e acompanhamento de saldos.</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setProcId(""); setFaseId(""); setFornecedorId("");
            setNumeroContrato(""); setValorContrato(""); setVigenciaInicial(""); setVigenciaFinal("");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Criar Novo"} Contrato</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              
              <div className="p-4 bg-muted/50 rounded-xl space-y-4 border border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">1. Processo Digital</label>
                  <Select value={procId} onValueChange={(val) => { setProcId(val); setFaseId(""); setFornecedorId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o processo..." /></SelectTrigger>
                    <SelectContent>
                      {processos.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.numeroProcessoDigital} - {p.objetoResumido}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedProcesso && (
                  <div className="text-xs text-muted-foreground bg-background p-3 rounded-lg border">
                    <span className="font-semibold block mb-1">Objeto Completo (Herdado):</span>
                    {selectedProcesso.objetoCompleto}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">2. Fase de Contratação</label>
                  <Select disabled={!procId} value={faseId} onValueChange={handleFaseSelect}>
                    <SelectTrigger><SelectValue placeholder="Selecione a fase..." /></SelectTrigger>
                    <SelectContent>
                      {selectedProcesso?.fases?.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>{f.nomeFase}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">3. Fornecedor</label>
                  <Select disabled={true} value={fornecedorId} onValueChange={setFornecedorId}>
                    <SelectTrigger><SelectValue placeholder="Vinculado à fase..." /></SelectTrigger>
                    <SelectContent>
                      {selectedFase?.fornecedor && (
                        <SelectItem value={selectedFase.fornecedor.id}>{selectedFase.fornecedor.nome}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {faseId && !selectedFase?.fornecedor && (
                    <p className="text-xs text-destructive mt-1">Esta fase não possui fornecedor vencedor vinculado.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nº do Contrato</label>
                  <Input required value={numeroContrato} onChange={e => setNumeroContrato(e.target.value)} placeholder="001/2024" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Total (R$)</label>
                  <Input required type="number" step="0.01" value={valorContrato} onChange={e => setValorContrato(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vigência Inicial</label>
                  <Input required type="date" value={vigenciaInicial} onChange={e => setVigenciaInicial(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vigência Final</label>
                  <Input required type="date" value={vigenciaFinal} onChange={e => setVigenciaFinal(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createContrato.isPending || updateContrato.isPending || !fornecedorId}>
                {editingId ? "Atualizar" : "Gerar"} Contrato
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border/50 rounded-xl shadow-sm">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Search className="text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nº do contrato ou fornecedor..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Contrato</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c: any) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">{c.numeroContrato}</TableCell>
                    <TableCell>{c.fornecedor?.nome}</TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.valorContrato)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(c.vigenciaInicial)} até {formatDate(c.vigenciaFinal)}
                    </TableCell>
                    <TableCell className="text-right gap-1 flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(c)} data-testid={`button-edit-${c.id}`}>
                        <Edit2 size={16} />
                      </Button>
                      <Link href={`/contratos/${c.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        <Eye size={16} className="mr-2" /> Detalhes
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
