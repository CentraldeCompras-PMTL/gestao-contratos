import { useState } from "react";
import { useFases, useCreateFase, useUpdateFase } from "@/hooks/use-fases";
import { useFornecedores } from "@/hooks/use-fornecedores";
import { useProcessos } from "@/hooks/use-processos";
import { formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Fases() {
  const { data: fases = [], isLoading } = useFases();
  const { data: fornecedores = [] } = useFornecedores();
  const { data: processos = [] } = useProcessos();
  const createFase = useCreateFase();
  const updateFase = useUpdateFase();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nomeFase: "",
    fornecedorId: "",
    processoDigitalId: "",
    modalidade: "pregao",
    numeroModalidade: "",
    dataInicio: "",
    dataFim: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createFase.mutate(formData, {
      onSuccess: () => {
        toast({ title: "Fase criada com sucesso!" });
        setFormData({
          nomeFase: "",
          fornecedorId: "",
          processoDigitalId: "",
          modalidade: "pregao",
          numeroModalidade: "",
          dataInicio: "",
          dataFim: "",
        });
        setIsCreateOpen(false);
      },
      onError: () => toast({ variant: "destructive", title: "Erro ao criar fase" }),
    });
  };

  const handleEdit = (fase: any) => {
    setFormData({
      nomeFase: fase.nomeFase,
      fornecedorId: fase.fornecedorId,
      processoDigitalId: fase.processoDigitalId,
      modalidade: fase.modalidade,
      numeroModalidade: fase.numeroModalidade,
      dataInicio: fase.dataInicio,
      dataFim: fase.dataFim || "",
    });
    setEditingId(fase.id);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    updateFase.mutate(
      { id: editingId, data: formData },
      {
        onSuccess: () => {
          toast({ title: "Fase atualizada com sucesso!" });
          setEditingId(null);
          setFormData({
            nomeFase: "",
            fornecedorId: "",
            processoDigitalId: "",
            modalidade: "pregao",
            numeroModalidade: "",
            dataInicio: "",
            dataFim: "",
          });
        },
      }
    );
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Carregando fases...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fases de Contratação</h1>
          <p className="text-muted-foreground mt-1">Gerencie as fases de contratação dos processos administrativos.</p>
        </div>
        <Dialog open={isCreateOpen && !editingId} onOpenChange={(open) => {
          if (!open) {
            setFormData({
              nomeFase: "",
              fornecedorId: "",
              processoDigitalId: "",
              modalidade: "pregao",
              numeroModalidade: "",
              dataInicio: "",
              dataFim: "",
            });
          }
          setIsCreateOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus size={18} /> Nova Fase</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Criar Nova Fase de Contratação</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Processo Digital *</Label>
                  <Select value={formData.processoDigitalId} onValueChange={(v) => setFormData({ ...formData, processoDigitalId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o processo" />
                    </SelectTrigger>
                    <SelectContent>
                      {processos.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.numeroProcessoDigital}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor *</Label>
                  <Select value={formData.fornecedorId} onValueChange={(v) => setFormData({ ...formData, fornecedorId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nome da Fase *</Label>
                  <Input value={formData.nomeFase} onChange={(e) => setFormData({ ...formData, nomeFase: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Modalidade *</Label>
                  <Select value={formData.modalidade} onValueChange={(v) => setFormData({ ...formData, modalidade: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pregao">Pregão</SelectItem>
                      <SelectItem value="dispensa">Dispensa</SelectItem>
                      <SelectItem value="concorrencia">Concorrência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número da Modalidade *</Label>
                  <Input value={formData.numeroModalidade} onChange={(e) => setFormData({ ...formData, numeroModalidade: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data de Início *</Label>
                  <Input type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data de Fim</Label>
                  <Input type="date" value={formData.dataFim} onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} />
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
        <CardHeader>
          <CardTitle>Fases Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {fases.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma fase cadastrada ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Processo</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Nº Modalidade</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Fim</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fases.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.nomeFase}</TableCell>
                    <TableCell>{f.processoDigital?.numeroProcessoDigital}</TableCell>
                    <TableCell>{f.fornecedor?.nome}</TableCell>
                    <TableCell className="capitalize">{f.modalidade}</TableCell>
                    <TableCell>{f.numeroModalidade}</TableCell>
                    <TableCell>{formatDate(f.dataInicio)}</TableCell>
                    <TableCell>{f.dataFim ? formatDate(f.dataFim) : "—"}</TableCell>
                    <TableCell>
                      <Dialog open={editingId === f.id} onOpenChange={(open) => {
                        if (!open) setEditingId(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(f)}>
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
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {processos.map((p: any) => (
                                      <SelectItem key={p.id} value={p.id}>
                                        {p.numeroProcessoDigital}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Fornecedor</Label>
                                <Select value={formData.fornecedorId} onValueChange={(v) => setFormData({ ...formData, fornecedorId: v })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {fornecedores.map((fn: any) => (
                                      <SelectItem key={fn.id} value={fn.id}>
                                        {fn.nome}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Nome da Fase</Label>
                                <Input value={formData.nomeFase} onChange={(e) => setFormData({ ...formData, nomeFase: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>Modalidade</Label>
                                <Select value={formData.modalidade} onValueChange={(v) => setFormData({ ...formData, modalidade: v })}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pregao">Pregão</SelectItem>
                                    <SelectItem value="dispensa">Dispensa</SelectItem>
                                    <SelectItem value="concorrencia">Concorrência</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Número da Modalidade</Label>
                                <Input value={formData.numeroModalidade} onChange={(e) => setFormData({ ...formData, numeroModalidade: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>Data de Início</Label>
                                <Input type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} />
                              </div>
                              <div className="space-y-2">
                                <Label>Data de Fim</Label>
                                <Input type="date" value={formData.dataFim} onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} />
                              </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={updateFase.isPending}>
                              {updateFase.isPending ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
