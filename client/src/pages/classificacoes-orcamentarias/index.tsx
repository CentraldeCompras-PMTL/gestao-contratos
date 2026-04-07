import { useState } from "react";
import { useClassificacoesOrcamentarias, useCreateClassificacaoOrcamentaria, useUpdateClassificacaoOrcamentaria, useDeleteClassificacaoOrcamentaria } from "@/hooks/use-classificacoes-orcamentarias";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Edit2, BookOpen, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ClassificacaoOrcamentaria } from "@shared/schema";

export default function ClassificacoesOrcamentarias() {
  const { data: classificacoes = [], isLoading } = useClassificacoesOrcamentarias();
  const createMutation = useCreateClassificacaoOrcamentaria();
  const updateMutation = useUpdateClassificacaoOrcamentaria();
  const deleteMutation = useDeleteClassificacaoOrcamentaria();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ClassificacaoOrcamentaria | null>(null);
  const [formData, setFormData] = useState({ nome: "", descricao: "" });

  const filtered = classificacoes.filter((item) =>
    item.nome.toLowerCase().includes(search.toLowerCase()) ||
    (item.descricao && item.descricao.toLowerCase().includes(search.toLowerCase()))
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nome: "", descricao: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate(
        { id: editingId, data: formData },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            setIsDialogOpen(false);
            resetForm();
          },
          onError: (err) => toast({
            variant: "destructive",
            title: "Erro",
            description: err instanceof Error ? err.message : "Erro ao atualizar classificação",
          }),
        },
      );
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        toast({ title: "Cadastro realizado com sucesso!" });
        setIsDialogOpen(false);
        resetForm();
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar classificação",
      }),
    });
  };

  const handleEdit = (item: ClassificacaoOrcamentaria) => {
    setEditingId(item.id);
    setFormData({ nome: item.nome, descricao: item.descricao || "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classificações Orçamentárias</h1>
          <p className="text-muted-foreground mt-1">Gerencie as categorias de classificação de fichas.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Nova Classificação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nova"} Classificação</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input 
                  required 
                  placeholder="Ex: Material de Consumo"
                  value={formData.nome} 
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição (Opcional)</label>
                <Input 
                  placeholder="Breve descrição da categoria"
                  value={formData.descricao} 
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} 
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Atualizar" : "Criar"} Classificação
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <div className="mb-4">
          <Input placeholder="Buscar classificação..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8"><div className="flex flex-col items-center"><BookOpen className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhuma classificação encontrada</p></div></TableCell></TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{item.descricao || "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(item.criadoEm?.toString())}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                          <Edit2 size={16} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setItemToDelete(item)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => { if (!open) setItemToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir classificação</AlertDialogTitle>
            <AlertDialogDescription>
              Você deseja realmente excluir a classificação "{itemToDelete?.nome}"? 
              Esta ação não poderá ser desfeita e falhará se houver fichas vinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!itemToDelete) return;
                deleteMutation.mutate(itemToDelete.id, {
                  onSuccess: () => {
                    toast({ title: "Registro excluído com sucesso!" });
                    setItemToDelete(null);
                  },
                  onError: (err) => toast({
                    variant: "destructive",
                    title: "Erro",
                    description: err instanceof Error ? err.message : "Erro ao excluir classificação",
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
