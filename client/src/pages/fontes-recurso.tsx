import { useState } from "react";
import {
  useCreateFicha,
  useCreateFonteRecurso,
  useCreateProjetoAtividade,
  useDeleteFicha,
  useDeleteFonteRecurso,
  useDeleteProjetoAtividade,
  useFontesRecurso,
  useUpdateFicha,
  useUpdateFonteRecurso,
  useUpdateProjetoAtividade,
} from "@/hooks/use-fontes-recurso";
import {
  useClassificacoesOrcamentarias,
  useCreateClassificacaoOrcamentaria,
  useDeleteClassificacaoOrcamentaria,
  useUpdateClassificacaoOrcamentaria,
} from "@/hooks/use-classificacoes-orcamentarias";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useToast } from "@/hooks/use-toast";
import { Edit2, Plus, Shapes, Trash2 } from "lucide-react";
import type { ClassificacaoOrcamentaria, FichaOrcamentaria, FonteRecursoWithFichas, ProjetoAtividade } from "@shared/schema";

const defaultFonteForm = { nome: "", codigo: "", ano: "" };
const defaultFichaForm = { codigo: "", projetoAtividadeId: "", classificacaoId: "", ano: "" };
const defaultProjetoAtividadeForm = { codigo: "", descricao: "", ano: "" };
const defaultClassificacaoForm = { nome: "", descricao: "" };

function getClassificacaoLabel(classificacao: unknown) {
  if (!classificacao) return "-";
  if (typeof classificacao === "string") return classificacao;
  if (typeof classificacao === "object" && "nome" in classificacao && typeof classificacao.nome === "string") {
    return classificacao.nome;
  }
  return "-";
}

export default function FontesRecursoPage() {
  const { data: fontes = [], isLoading } = useFontesRecurso();
  const { data: classificacoes = [] } = useClassificacoesOrcamentarias();
  const createClassificacao = useCreateClassificacaoOrcamentaria();
  const updateClassificacao = useUpdateClassificacaoOrcamentaria();
  const deleteClassificacao = useDeleteClassificacaoOrcamentaria();
  const createFonte = useCreateFonteRecurso();
  const updateFonte = useUpdateFonteRecurso();
  const deleteFonte = useDeleteFonteRecurso();
  const createFicha = useCreateFicha();
  const updateFicha = useUpdateFicha();
  const deleteFicha = useDeleteFicha();
  const createProjetoAtividade = useCreateProjetoAtividade();
  const updateProjetoAtividade = useUpdateProjetoAtividade();
  const deleteProjetoAtividade = useDeleteProjetoAtividade();
  const { toast } = useToast();

  const [fonteDialog, setFonteDialog] = useState(false);
  const [editingFonte, setEditingFonte] = useState<FonteRecursoWithFichas | null>(null);
  const [fonteForm, setFonteForm] = useState(defaultFonteForm);
  const [fichaFonteId, setFichaFonteId] = useState<string | null>(null);
  const [editingFicha, setEditingFicha] = useState<FichaOrcamentaria | null>(null);
  const [fichaForm, setFichaForm] = useState(defaultFichaForm);
  const [classificacaoDialog, setClassificacaoDialog] = useState(false);
  const [editingClassificacao, setEditingClassificacao] = useState<ClassificacaoOrcamentaria | null>(null);
  const [classificacaoForm, setClassificacaoForm] = useState(defaultClassificacaoForm);
  const [classificacaoToDelete, setClassificacaoToDelete] = useState<ClassificacaoOrcamentaria | null>(null);
  const [projetoAtividadeFonteId, setProjetoAtividadeFonteId] = useState<string | null>(null);
  const [editingProjetoAtividade, setEditingProjetoAtividade] = useState<ProjetoAtividade | null>(null);
  const [projetoAtividadeForm, setProjetoAtividadeForm] = useState(defaultProjetoAtividadeForm);

  const resetFonte = () => {
    setEditingFonte(null);
    setFonteForm(defaultFonteForm);
  };

  const resetFicha = () => {
    setEditingFicha(null);
    setFichaForm(defaultFichaForm);
    setFichaFonteId(null);
  };

  const resetClassificacao = () => {
    setEditingClassificacao(null);
    setClassificacaoForm(defaultClassificacaoForm);
  };

  const resetProjetoAtividade = () => {
    setEditingProjetoAtividade(null);
    setProjetoAtividadeForm(defaultProjetoAtividadeForm);
    setProjetoAtividadeFonteId(null);
  };

  const handleFonteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFonte) {
      updateFonte.mutate(
        { id: editingFonte.id, data: fonteForm },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            setFonteDialog(false);
            resetFonte();
          },
          onError: (error: unknown) => {
            toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar fonte" });
          },
        },
      );
      return;
    }

    createFonte.mutate(fonteForm, {
      onSuccess: () => {
        toast({ title: "Cadastro realizado com sucesso!" });
        setFonteDialog(false);
        resetFonte();
      },
      onError: (error: unknown) => {
        toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar fonte" });
      },
    });
  };

  const handleFichaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fichaFonteId) return;
    if (editingFicha) {
      updateFicha.mutate(
        { id: editingFicha.id, data: fichaForm },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            resetFicha();
          },
          onError: (error: unknown) => {
            toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar ficha" });
          },
        },
      );
      return;
    }

    createFicha.mutate(
      { fonteRecursoId: fichaFonteId, data: fichaForm },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          resetFicha();
        },
        onError: (error: unknown) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar ficha" });
        },
      },
    );
  };

  const handleProjetoAtividadeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projetoAtividadeFonteId) return;
    if (editingProjetoAtividade) {
      updateProjetoAtividade.mutate(
        { id: editingProjetoAtividade.id, data: projetoAtividadeForm },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            resetProjetoAtividade();
          },
          onError: (error: unknown) => {
            toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar projeto/atividade" });
          },
        },
      );
      return;
    }

    createProjetoAtividade.mutate(
      { fonteRecursoId: projetoAtividadeFonteId, data: projetoAtividadeForm },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          resetProjetoAtividade();
        },
        onError: (error: unknown) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar projeto/atividade" });
        },
      },
    );
  };

  const handleClassificacaoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClassificacao) {
      updateClassificacao.mutate(
        { id: editingClassificacao.id, data: classificacaoForm },
        {
          onSuccess: () => {
            toast({ title: "Classificacao atualizada com sucesso!" });
            setClassificacaoDialog(false);
            resetClassificacao();
          },
          onError: (error: unknown) => {
            toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar classificacao" });
          },
        },
      );
      return;
    }

    createClassificacao.mutate(classificacaoForm, {
      onSuccess: () => {
        toast({ title: "Classificacao cadastrada com sucesso!" });
        setClassificacaoDialog(false);
        resetClassificacao();
      },
      onError: (error: unknown) => {
        toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar classificacao" });
      },
    });
  };

  const fichaFonte = fontes.find((fonte) => fonte.id === fichaFonteId) ?? null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fontes de Recurso</h1>
          <p className="text-muted-foreground mt-1">Cadastre as fontes e mantenha as fichas orcamentarias e projetos/atividade vinculados a cada uma.</p>
        </div>
        <Dialog open={fonteDialog} onOpenChange={(open) => { setFonteDialog(open); if (!open) resetFonte(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2" size={18} /> Nova Fonte</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingFonte ? "Editar Fonte de Recurso" : "Cadastrar Fonte de Recurso"}</DialogTitle></DialogHeader>
            <form onSubmit={handleFonteSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={fonteForm.nome} onChange={(e) => setFonteForm((current) => ({ ...current, nome: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Codigo</Label>
                <Input value={fonteForm.codigo} onChange={(e) => setFonteForm((current) => ({ ...current, codigo: e.target.value }))} placeholder="1.500.0000" required />
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Input value={fonteForm.ano} onChange={(e) => setFonteForm((current) => ({ ...current, ano: e.target.value }))} placeholder="Ex: 2025" maxLength={4} required />
              </div>
              <Button type="submit" className="w-full" disabled={createFonte.isPending || updateFonte.isPending}>
                {createFonte.isPending || updateFonte.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shapes size={18} />
              Classificacoes das Fichas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Cadastre aqui as classificacoes que poderao ser vinculadas nas fichas orcamentarias.
            </p>
          </div>
          <Dialog
            open={classificacaoDialog}
            onOpenChange={(open) => {
              setClassificacaoDialog(open);
              if (!open) resetClassificacao();
            }}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2" size={16} />
                Nova Classificacao
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClassificacao ? "Editar Classificacao" : "Cadastrar Classificacao"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleClassificacaoSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={classificacaoForm.nome}
                    onChange={(e) => setClassificacaoForm((current) => ({ ...current, nome: e.target.value }))}
                    placeholder="Ex: Material de Consumo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descricao</Label>
                  <Input
                    value={classificacaoForm.descricao}
                    onChange={(e) => setClassificacaoForm((current) => ({ ...current, descricao: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createClassificacao.isPending || updateClassificacao.isPending}
                >
                  {createClassificacao.isPending || updateClassificacao.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead className="text-right">Acao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classificacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-6">
                    Nenhuma classificacao cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                classificacoes.map((classificacao) => (
                  <TableRow key={classificacao.id}>
                    <TableCell className="font-medium">{classificacao.nome}</TableCell>
                    <TableCell>{classificacao.descricao || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingClassificacao(classificacao);
                            setClassificacaoForm({
                              nome: classificacao.nome,
                              descricao: classificacao.descricao || "",
                            });
                            setClassificacaoDialog(true);
                          }}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setClassificacaoToDelete(classificacao)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Carregando fontes...</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {fontes.map((fonte) => (
            <Card key={fonte.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>{fonte.codigo} - {fonte.nome}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{fonte.fichas.length} ficha(s) vinculada(s)</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingFonte(fonte); setFonteForm({ nome: fonte.nome, codigo: fonte.codigo, ano: fonte.ano }); setFonteDialog(true); }}>
                    <Edit2 size={16} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setFichaFonteId(fonte.id)}>
                    <Plus size={16} className="mr-2" /> Ficha
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setProjetoAtividadeFonteId(fonte.id)}>
                    <Plus size={16} className="mr-2" /> Projeto/Atividade
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteFonte.mutate(fonte.id, {
                      onSuccess: () => toast({ title: "Registro excluido com sucesso!" }),
                      onError: (error) => toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao excluir fonte" }),
                    })}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ficha</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Projeto/Atividade</TableHead>
                      <TableHead>Classificacao</TableHead>
                      <TableHead className="text-right">Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fonte.fichas.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Nenhuma ficha cadastrada.</TableCell></TableRow>
                    ) : (
                      fonte.fichas.map((ficha) => (
                        <TableRow key={ficha.id}>
                          <TableCell>{ficha.codigo}</TableCell>
                          <TableCell>{ficha.ano}</TableCell>
                          <TableCell>{fontes.find(f => f.id === ficha.fonteRecursoId)?.projetosAtividade.find((projetoAtividade) => projetoAtividade.id === ficha.projetoAtividadeId)?.codigo ?? "-"}</TableCell>
                          <TableCell className="capitalize">{getClassificacaoLabel(ficha.classificacao)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setFichaFonteId(fonte.id);
                                setEditingFicha(ficha);
                                setFichaForm({
                                  codigo: ficha.codigo,
                                  projetoAtividadeId: ficha.projetoAtividadeId,
                                  classificacaoId: (ficha as any).classificacaoId || "",
                                  ano: ficha.ano,
                                });
                              }}>
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteFicha.mutate(ficha.id, {
                                  onSuccess: () => toast({ title: "Registro excluido com sucesso!" }),
                                  onError: (error) => toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao excluir ficha" }),
                                })}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projeto/Atividade</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Descricao</TableHead>
                      <TableHead className="text-right">Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fonte.projetosAtividade.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">Nenhum projeto/atividade cadastrado.</TableCell></TableRow>
                    ) : (
                      fonte.projetosAtividade.map((projetoAtividade) => (
                        <TableRow key={projetoAtividade.id}>
                          <TableCell>{projetoAtividade.codigo}</TableCell>
                          <TableCell>{projetoAtividade.ano}</TableCell>
                          <TableCell>{projetoAtividade.descricao}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => {
                                setProjetoAtividadeFonteId(fonte.id);
                                setEditingProjetoAtividade(projetoAtividade);
                                setProjetoAtividadeForm({ codigo: projetoAtividade.codigo, descricao: projetoAtividade.descricao, ano: projetoAtividade.ano });
                              }}>
                                <Edit2 size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteProjetoAtividade.mutate(projetoAtividade.id, {
                                  onSuccess: () => toast({ title: "Registro excluido com sucesso!" }),
                                  onError: (error) => toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao excluir projeto/atividade" }),
                                })}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!fichaFonteId} onOpenChange={(open) => { if (!open) resetFicha(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingFicha ? "Editar Ficha" : "Cadastrar Ficha"}</DialogTitle></DialogHeader>
          <form onSubmit={handleFichaSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Ficha</Label>
              <Input value={fichaForm.codigo} onChange={(e) => setFichaForm((current) => ({ ...current, codigo: e.target.value }))} placeholder="001" required />
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input value={fichaForm.ano} onChange={(e) => setFichaForm((current) => ({ ...current, ano: e.target.value }))} placeholder="Ex: 2025" maxLength={4} required />
            </div>
            <div className="space-y-2">
              <Label>Projeto/Atividade</Label>
              <Select value={fichaForm.projetoAtividadeId} onValueChange={(value) => setFichaForm((current) => ({ ...current, projetoAtividadeId: value }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o projeto/atividade" /></SelectTrigger>
                <SelectContent>
                  {fichaFonte?.projetosAtividade.map((projetoAtividade) => (
                    <SelectItem key={projetoAtividade.id} value={projetoAtividade.id}>
                      {projetoAtividade.codigo} - {projetoAtividade.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Classificação</Label>
              <Select 
                value={fichaForm.classificacaoId} 
                onValueChange={(value) => setFichaForm((current) => ({ ...current, classificacaoId: value }))}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a classificação" /></SelectTrigger>
                <SelectContent>
                  {classificacoes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Selecione uma categoria validada para a ficha.</p>
            </div>
            <Button type="submit" className="w-full" disabled={createFicha.isPending || updateFicha.isPending}>
              {createFicha.isPending || updateFicha.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!projetoAtividadeFonteId} onOpenChange={(open) => { if (!open) resetProjetoAtividade(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProjetoAtividade ? "Editar Projeto/Atividade" : "Cadastrar Projeto/Atividade"}</DialogTitle></DialogHeader>
          <form onSubmit={handleProjetoAtividadeSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Codigo</Label>
              <Input value={projetoAtividadeForm.codigo} onChange={(e) => setProjetoAtividadeForm((current) => ({ ...current, codigo: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Input value={projetoAtividadeForm.ano} onChange={(e) => setProjetoAtividadeForm((current) => ({ ...current, ano: e.target.value }))} placeholder="Ex: 2025" maxLength={4} required />
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Input value={projetoAtividadeForm.descricao} onChange={(e) => setProjetoAtividadeForm((current) => ({ ...current, descricao: e.target.value }))} required />
            </div>
            <Button type="submit" className="w-full" disabled={createProjetoAtividade.isPending || updateProjetoAtividade.isPending}>
              {createProjetoAtividade.isPending || updateProjetoAtividade.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!classificacaoToDelete} onOpenChange={(open) => { if (!open) setClassificacaoToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir classificacao</AlertDialogTitle>
            <AlertDialogDescription>
              Voce deseja realmente excluir a classificacao "{classificacaoToDelete?.nome}"?
              A exclusao sera bloqueada se houver fichas vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!classificacaoToDelete) return;
                deleteClassificacao.mutate(classificacaoToDelete.id, {
                  onSuccess: () => {
                    toast({ title: "Classificacao excluida com sucesso!" });
                    setClassificacaoToDelete(null);
                  },
                  onError: (error: unknown) => {
                    toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao excluir classificacao" });
                  },
                });
              }}
            >
              Confirmar exclusao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
