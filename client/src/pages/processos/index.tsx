import { useState } from "react";
import { useProcessos, useCreateProcesso, useCreateFase, useUpdateProcesso, useDeleteProcesso } from "@/hooks/use-processos";
import { useFornecedores } from "@/hooks/use-fornecedores";
import { useDepartamentos } from "@/hooks/use-departamentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Plus, Search, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Departamento, Fornecedor, InsertProcessoDigital, ProcessoDigitalWithRelations } from "@shared/schema";

type ProcessoForm = InsertProcessoDigital;
type FaseForm = {
  nomeFase: string;
  fornecedorId: string;
  modalidade: string;
  numeroModalidade: string;
  dataInicio: string;
  dataFim: string;
};

const defaultProcessoForm: ProcessoForm = {
  numeroProcessoDigital: "",
  objetoResumido: "",
  objetoCompleto: "",
  descricao: "",
  departamentoId: "",
};

const defaultFaseForm: FaseForm = {
  nomeFase: "",
  fornecedorId: "",
  modalidade: "",
  numeroModalidade: "",
  dataInicio: "",
  dataFim: "",
};

export default function Processos() {
  const { data: processos = [], isLoading } = useProcessos();
  const { data: fornecedores = [] } = useFornecedores();
  const { data: departamentos = [] } = useDepartamentos();
  const createProcesso = useCreateProcesso();
  const updateProcesso = useUpdateProcesso();
  const deleteProcesso = useDeleteProcesso();
  const createFase = useCreateFase();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [processoDialog, setProcessoDialog] = useState(false);
  const [faseDialog, setFaseDialog] = useState<string | null>(null);
  const [editingProcId, setEditingProcId] = useState<string | null>(null);
  const [processoToDelete, setProcessoToDelete] = useState<ProcessoDigitalWithRelations | null>(null);
  const [procForm, setProcForm] = useState<ProcessoForm>(defaultProcessoForm);
  const [faseForm, setFaseForm] = useState<FaseForm>(defaultFaseForm);

  const filtered = processos.filter((processo) =>
    processo.numeroProcessoDigital.includes(search) ||
    processo.objetoResumido.toLowerCase().includes(search.toLowerCase())
  );

  const resetProcForm = () => setProcForm(defaultProcessoForm);
  const resetFaseForm = () => setFaseForm(defaultFaseForm);

  const handleEditProcesso = (processo: ProcessoDigitalWithRelations) => {
    setEditingProcId(processo.id);
    setProcForm({
      numeroProcessoDigital: processo.numeroProcessoDigital,
      objetoResumido: processo.objetoResumido,
      objetoCompleto: processo.objetoCompleto,
      descricao: processo.descricao || "",
      departamentoId: processo.departamentoId || "",
    });
    setProcessoDialog(true);
  };

  const handleCreateProcesso = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...procForm,
      departamentoId: procForm.departamentoId || undefined,
    };
    if (editingProcId) {
      updateProcesso.mutate(
        { id: editingProcId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            setProcessoDialog(false);
            setEditingProcId(null);
            resetProcForm();
          },
          onError: (err) => toast({
            variant: "destructive",
            title: "Erro",
            description: err instanceof Error ? err.message : "Erro ao atualizar processo",
          }),
        },
      );
      return;
    }

    createProcesso.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Cadastro realizado com sucesso!" });
        setProcessoDialog(false);
        resetProcForm();
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar processo",
      }),
    });
  };

  const handleCreateFase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faseDialog) return;

    createFase.mutate(
      {
        processoId: faseDialog,
        ...faseForm,
        dataFim: faseForm.dataFim || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: "Fase adicionada!" });
          setFaseDialog(null);
          resetFaseForm();
        },
        onError: (err) => {
          toast({
            variant: "destructive",
            title: "Erro",
            description: err instanceof Error ? err.message : "Erro ao criar fase",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Processos Digitais</h1>
          <p className="text-muted-foreground mt-1">Acompanhe processos digitais e as etapas vinculadas aos fornecedores.</p>
        </div>

        <Dialog open={processoDialog} onOpenChange={(open) => {
          setProcessoDialog(open);
          if (!open) {
            setEditingProcId(null);
            resetProcForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Novo Processo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editingProcId ? "Editar" : "Cadastrar"} Processo Digital</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateProcesso} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">No Processo</label>
                <Input required value={procForm.numeroProcessoDigital} onChange={(e) => setProcForm({ ...procForm, numeroProcessoDigital: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Objeto Resumido</label>
                <Input required value={procForm.objetoResumido} onChange={(e) => setProcForm({ ...procForm, objetoResumido: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Objeto Completo</label>
                <Textarea required value={procForm.objetoCompleto} onChange={(e) => setProcForm({ ...procForm, objetoCompleto: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descricao (Opcional)</label>
                <Textarea value={procForm.descricao || ""} onChange={(e) => setProcForm({ ...procForm, descricao: e.target.value })} placeholder="Descricao adicional..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento Responsavel</label>
                <Select value={procForm.departamentoId || ""} onValueChange={(value) => setProcForm({ ...procForm, departamentoId: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {departamentos.map((departamento: Departamento) => (
                      <SelectItem key={departamento.id} value={departamento.id}>{departamento.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createProcesso.isPending || updateProcesso.isPending}>
                {editingProcId ? "Atualizar" : "Cadastrar"} Processo
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border/50 rounded-xl shadow-sm">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Search className="text-muted-foreground" size={18} />
          <Input placeholder="Buscar processos..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-0 shadow-none focus-visible:ring-0 px-0" />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12"></TableHead>
                <TableHead>No Processo</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Fases</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
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
                filtered.map((processo: ProcessoDigitalWithRelations) => (
                  <TableRow key={processo.id} className="group hover:bg-muted/30">
                    <TableCell><FolderOpen className="text-muted-foreground" size={18} /></TableCell>
                    <TableCell className="font-semibold text-primary">{processo.numeroProcessoDigital}</TableCell>
                    <TableCell className="max-w-md truncate" title={processo.objetoCompleto}>{processo.objetoResumido}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {processo.fases.map((fase) => (
                          <Badge key={fase.id} variant="secondary" className="text-xs font-normal">
                            {fase.nomeFase}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right gap-1 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleEditProcesso(processo)} data-testid={`button-edit-${processo.id}`}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setProcessoToDelete(processo)} data-testid={`button-delete-${processo.id}`}>
                        <Trash2 size={16} />
                      </Button>
                      <Dialog open={faseDialog === processo.id} onOpenChange={(open) => {
                        setFaseDialog(open ? processo.id : null);
                        if (!open) resetFaseForm();
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Plus size={14} className="mr-1" /> Add Etapa
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Adicionar Etapa do Fornecedor - {processo.numeroProcessoDigital}</DialogTitle></DialogHeader>
                          <form onSubmit={handleCreateFase} className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Etapa do Processo do Fornecedor</label>
                              <Input required value={faseForm.nomeFase} onChange={(e) => setFaseForm({ ...faseForm, nomeFase: e.target.value })} placeholder="Ex: Habilitacao, proposta aprovada, documentacao complementar" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Fornecedor Relacionado</label>
                              <Select value={faseForm.fornecedorId} onValueChange={(value) => setFaseForm({ ...faseForm, fornecedorId: value })}>
                                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent>
                                  {fornecedores.map((fornecedor: Fornecedor) => (
                                    <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                              <label className="text-sm font-medium">Modalidade</label>
                              <Input required value={faseForm.modalidade} onChange={(e) => setFaseForm({ ...faseForm, modalidade: e.target.value })} placeholder="Ex: Pregao Eletronico" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Numero da Modalidade</label>
                                <Input required value={faseForm.numeroModalidade} onChange={(e) => setFaseForm({ ...faseForm, numeroModalidade: e.target.value })} placeholder="Ex: 01/2024" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Data Inicio</label>
                                <Input type="date" required value={faseForm.dataInicio} onChange={(e) => setFaseForm({ ...faseForm, dataInicio: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Data Fim</label>
                                <Input type="date" value={faseForm.dataFim} onChange={(e) => setFaseForm({ ...faseForm, dataFim: e.target.value })} />
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

      <AlertDialog open={!!processoToDelete} onOpenChange={(open) => { if (!open) setProcessoToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir processo</AlertDialogTitle>
            <AlertDialogDescription>Voce deseja realmente excluir este item?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!processoToDelete) return;
                deleteProcesso.mutate(processoToDelete.id, {
                  onSuccess: () => {
                    toast({ title: "Registro excluido com sucesso!" });
                    setProcessoToDelete(null);
                  },
                  onError: (err) => toast({
                    variant: "destructive",
                    title: "Erro",
                    description: err instanceof Error ? err.message : "Erro ao excluir processo",
                  }),
                });
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
