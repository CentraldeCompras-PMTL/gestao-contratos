import { useState } from "react";
import { useFases, useCreateFase, useUpdateFase, useDeleteFase } from "@/hooks/use-fases";
import { useFornecedores } from "@/hooks/use-fornecedores";
import { useProcessos } from "@/hooks/use-processos";
import { formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { FaseContratacaoWithRelations, Fornecedor, InsertFaseContratacao, ProcessoDigitalWithRelations } from "@shared/schema";

const defaultForm: InsertFaseContratacao = {
  nomeFase: "",
  fornecedorId: "",
  processoDigitalId: "",
  modalidade: "pregao",
  numeroModalidade: "",
  dataInicio: "",
  dataFim: undefined,
};

export default function Fases() {
  const { data: fases = [], isLoading } = useFases();
  const { data: fornecedores = [] } = useFornecedores();
  const { data: processos = [] } = useProcessos();
  const createFase = useCreateFase();
  const updateFase = useUpdateFase();
  const deleteFase = useDeleteFase();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [faseToDelete, setFaseToDelete] = useState<FaseContratacaoWithRelations | null>(null);
  const [formData, setFormData] = useState<InsertFaseContratacao>(defaultForm);

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingId(null);
  };

  const toPayload = (): InsertFaseContratacao => ({
    ...formData,
    dataFim: formData.dataFim || undefined,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createFase.mutate(toPayload(), {
      onSuccess: () => {
        toast({ title: "Cadastro realizado com sucesso!" });
        resetForm();
        setIsCreateOpen(false);
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro ao criar fase",
        description: err instanceof Error ? err.message : "Falha ao criar fase",
      }),
    });
  };

  const handleEdit = (fase: FaseContratacaoWithRelations) => {
    setFormData({
      nomeFase: fase.nomeFase,
      fornecedorId: fase.fornecedorId,
      processoDigitalId: fase.processoDigitalId,
      modalidade: fase.modalidade,
      numeroModalidade: fase.numeroModalidade,
      dataInicio: fase.dataInicio,
      dataFim: fase.dataFim ?? undefined,
    });
    setEditingId(fase.id);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    updateFase.mutate(
      { id: editingId, data: toPayload() },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          resetForm();
        },
        onError: (err) => toast({
          variant: "destructive",
          title: "Erro ao atualizar fase",
          description: err instanceof Error ? err.message : "Falha ao atualizar fase",
        }),
      },
    );
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Carregando fases...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fases de Contratacao</h1>
          <p className="text-muted-foreground mt-1">Gerencie as etapas do processo digital vinculadas a cada fornecedor.</p>
        </div>
        <Dialog open={isCreateOpen && !editingId} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsCreateOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus size={18} /> Nova Fase</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Criar Nova Etapa do Fornecedor</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Processo Digital *</Label>
                  <Select value={formData.processoDigitalId} onValueChange={(v) => setFormData({ ...formData, processoDigitalId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o processo" /></SelectTrigger>
                    <SelectContent>
                      {processos.map((processo: ProcessoDigitalWithRelations) => (
                        <SelectItem key={processo.id} value={processo.id}>{processo.numeroProcessoDigital}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor Relacionado *</Label>
                  <Select value={formData.fornecedorId} onValueChange={(v) => setFormData({ ...formData, fornecedorId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((fornecedor: Fornecedor) => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Etapa do Processo do Fornecedor *</Label>
                  <Input value={formData.nomeFase} onChange={(e) => setFormData({ ...formData, nomeFase: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Modalidade *</Label>
                  <Select value={formData.modalidade} onValueChange={(v) => setFormData({ ...formData, modalidade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pregao">Pregao</SelectItem>
                      <SelectItem value="dispensa">Dispensa</SelectItem>
                      <SelectItem value="concorrencia">Concorrencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Numero da Modalidade *</Label>
                  <Input value={formData.numeroModalidade} onChange={(e) => setFormData({ ...formData, numeroModalidade: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data de Inicio *</Label>
                  <Input type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data de Fim</Label>
                  <Input type="date" value={formData.dataFim ?? ""} onChange={(e) => setFormData({ ...formData, dataFim: e.target.value || undefined })} />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createFase.isPending}>
                {createFase.isPending ? "Criando..." : "Criar Fase"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
          <CardHeader><CardTitle>Etapas Cadastradas</CardTitle></CardHeader>
        <CardContent>
          {fases.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma etapa cadastrada ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Processo</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>No Modalidade</TableHead>
                  <TableHead>Inicio</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fases.map((fase: FaseContratacaoWithRelations) => (
                  <TableRow key={fase.id}>
                    <TableCell className="font-medium">{fase.nomeFase}</TableCell>
                    <TableCell>{fase.processoDigital.numeroProcessoDigital}</TableCell>
                    <TableCell>{fase.fornecedor.nome}</TableCell>
                    <TableCell className="capitalize">{fase.modalidade}</TableCell>
                    <TableCell>{fase.numeroModalidade}</TableCell>
                    <TableCell>{formatDate(fase.dataInicio)}</TableCell>
                    <TableCell>{fase.dataFim ? formatDate(fase.dataFim) : "-"}</TableCell>
                    <TableCell>
                      <Dialog open={editingId === fase.id} onOpenChange={(open) => { if (!open) resetForm(); }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(fase)}>
                          <Edit2 size={16} />
                        </Button>
                      </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader><DialogTitle>Editar Fase</DialogTitle></DialogHeader>
                          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Processo Digital</Label>
                                <Select value={formData.processoDigitalId} onValueChange={(v) => setFormData({ ...formData, processoDigitalId: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {processos.map((processo: ProcessoDigitalWithRelations) => (
                                      <SelectItem key={processo.id} value={processo.id}>{processo.numeroProcessoDigital}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Fornecedor Relacionado</Label>
                                <Select value={formData.fornecedorId} onValueChange={(v) => setFormData({ ...formData, fornecedorId: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {fornecedores.map((fornecedor: Fornecedor) => (
                                      <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Etapa do Processo do Fornecedor</Label>
                                <Input value={formData.nomeFase} onChange={(e) => setFormData({ ...formData, nomeFase: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>Modalidade</Label>
                                <Select value={formData.modalidade} onValueChange={(v) => setFormData({ ...formData, modalidade: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pregao">Pregao</SelectItem>
                                    <SelectItem value="dispensa">Dispensa</SelectItem>
                                    <SelectItem value="concorrencia">Concorrencia</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Numero da Modalidade</Label>
                                <Input value={formData.numeroModalidade} onChange={(e) => setFormData({ ...formData, numeroModalidade: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>Data de Inicio</Label>
                                <Input type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>Data de Fim</Label>
                                <Input type="date" value={formData.dataFim ?? ""} onChange={(e) => setFormData({ ...formData, dataFim: e.target.value || undefined })} />
                              </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={updateFase.isPending}>
                              {updateFase.isPending ? "Salvando..." : "Salvar Alteracoes"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => setFaseToDelete(fase)}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!faseToDelete} onOpenChange={(open) => { if (!open) setFaseToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fase</AlertDialogTitle>
            <AlertDialogDescription>Voce deseja realmente excluir este item?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!faseToDelete) return;
                deleteFase.mutate(faseToDelete.id, {
                  onSuccess: () => {
                    toast({ title: "Registro excluido com sucesso!" });
                    setFaseToDelete(null);
                  },
                  onError: (err) => toast({
                    variant: "destructive",
                    title: "Erro",
                    description: err instanceof Error ? err.message : "Erro ao excluir fase",
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
