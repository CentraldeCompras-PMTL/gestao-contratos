import { useState } from "react";
import { useProcessos, useCreateProcesso, useCreateFase } from "@/hooks/use-processos";
import { useFornecedores } from "@/hooks/use-fornecedores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, Search, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Processos() {
  const { data: processos = [], isLoading } = useProcessos();
  const { data: fornecedores = [] } = useFornecedores();
  const createProcesso = useCreateProcesso();
  const createFase = useCreateFase();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [processoDialog, setProcessoDialog] = useState(false);
  const [faseDialog, setFaseDialog] = useState<string | null>(null);
  
  const [procForm, setProcForm] = useState({ numeroProcessoDigital: "", objetoResumido: "", objetoCompleto: "", descricao: "" });
  const [faseForm, setFaseForm] = useState({ nomeFase: "", fornecedorId: "", dataInicio: "", dataFim: "" });

  const filtered = processos.filter((p: any) => 
    p.numeroProcessoDigital.includes(search) || 
    p.objetoResumido.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProcesso = (e: React.FormEvent) => {
    e.preventDefault();
    createProcesso.mutate(procForm, {
      onSuccess: () => {
        toast({ title: "Processo criado!" });
        setProcessoDialog(false);
        setProcForm({ numeroProcessoDigital: "", objetoResumido: "", objetoCompleto: "", descricao: "" });
      }
    });
  };

  const handleCreateFase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faseDialog) return;
    createFase.mutate({
      processoId: faseDialog,
      ...faseForm
    }, {
      onSuccess: () => {
        toast({ title: "Fase adicionada!" });
        setFaseDialog(null);
        setFaseForm({ nomeFase: "", fornecedorId: "", dataInicio: "", dataFim: "" });
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processos Digitais</h1>
          <p className="text-muted-foreground mt-1">Acompanhe processos e suas respectivas fases.</p>
        </div>
        
        <Dialog open={processoDialog} onOpenChange={setProcessoDialog}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Novo Processo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>Cadastrar Processo Digital</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateProcesso} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nº Processo</label>
                <Input required value={procForm.numeroProcessoDigital} onChange={e => setProcForm({...procForm, numeroProcessoDigital: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Objeto Resumido</label>
                <Input required value={procForm.objetoResumido} onChange={e => setProcForm({...procForm, objetoResumido: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Objeto Completo</label>
                <Textarea required value={procForm.objetoCompleto} onChange={e => setProcForm({...procForm, objetoCompleto: e.target.value})} />
              </div>
              <Button type="submit" className="w-full" disabled={createProcesso.isPending}>
                {createProcesso.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border/50 rounded-xl shadow-sm">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Search className="text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar processos..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12"></TableHead>
                <TableHead>Nº Processo</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Fases</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-20" />
                    Nenhum processo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p: any) => (
                  <TableRow key={p.id} className="group hover:bg-muted/30">
                    <TableCell><FolderOpen className="text-muted-foreground" size={18} /></TableCell>
                    <TableCell className="font-semibold text-primary">{p.numeroProcessoDigital}</TableCell>
                    <TableCell className="max-w-md truncate" title={p.objetoCompleto}>
                      {p.objetoResumido}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {p.fases?.map((f: any) => (
                          <Badge key={f.id} variant="secondary" className="text-xs font-normal">
                            {f.nomeFase}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog open={faseDialog === p.id} onOpenChange={(open) => setFaseDialog(open ? p.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Plus size={14} className="mr-1" /> Add Fase
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Adicionar Fase - {p.numeroProcessoDigital}</DialogTitle></DialogHeader>
                          <form onSubmit={handleCreateFase} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Nome da Fase</label>
                              <Input required value={faseForm.nomeFase} onChange={e => setFaseForm({...faseForm, nomeFase: e.target.value})} placeholder="Ex: Pregão Eletrônico" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Fornecedor Vencedor (Opcional)</label>
                              <Select value={faseForm.fornecedorId} onValueChange={val => setFaseForm({...faseForm, fornecedorId: val})}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                  {fornecedores.map((f: any) => (
                                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Data Início</label>
                                <Input type="date" required value={faseForm.dataInicio} onChange={e => setFaseForm({...faseForm, dataInicio: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Data Fim (Opcional)</label>
                                <Input type="date" value={faseForm.dataFim} onChange={e => setFaseForm({...faseForm, dataFim: e.target.value})} />
                              </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={createFase.isPending}>Salvar Fase</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
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
