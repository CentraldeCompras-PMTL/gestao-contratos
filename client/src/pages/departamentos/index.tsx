import { useEffect, useMemo, useState } from "react";
import { useDepartamentos, useCreateDepartamento, useUpdateDepartamento, useDeleteDepartamento } from "@/hooks/use-departamentos";
import { useAuth } from "@/hooks/use-auth";
import { useEntes } from "@/hooks/use-entes";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Building2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Departamento } from "@shared/schema";

export default function Departamentos() {
  const { user } = useAuth();
  const { data: departamentos = [], isLoading } = useDepartamentos();
  const { data: entes = [] } = useEntes();
  const createMutation = useCreateDepartamento();
  const updateMutation = useUpdateDepartamento();
  const deleteMutation = useDeleteDepartamento();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [departamentoToDelete, setDepartamentoToDelete] = useState<Departamento | null>(null);
  const accessibleEnteIds = user?.accessibleEnteIds ?? (user?.enteId ? [user.enteId] : []);
  const availableEntes = useMemo(
    () => (user?.role === "admin" ? entes : entes.filter((ente) => accessibleEnteIds.includes(ente.id))),
    [accessibleEnteIds, entes, user?.role],
  );
  const [formData, setFormData] = useState({ nome: "", descricao: "", enteId: "" });

  useEffect(() => {
    if (!editingId && !formData.enteId && availableEntes.length > 0) {
      setFormData((current) => ({ ...current, enteId: availableEntes[0].id }));
    }
  }, [availableEntes, editingId, formData.enteId]);

  const filtered = departamentos.filter((departamento) =>
    departamento.nome.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData({ nome: "", descricao: "", enteId: availableEntes[0]?.id || "" });
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
            description: err instanceof Error ? err.message : "Erro ao atualizar departamento",
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
        description: err instanceof Error ? err.message : "Erro ao criar departamento",
      }),
    });
  };

  const handleEdit = (departamento: Departamento) => {
    setEditingId(departamento.id);
    setFormData({ nome: departamento.nome, descricao: departamento.descricao || "", enteId: departamento.enteId || "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os departamentos responsaveis.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Novo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Departamento</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input required value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ente</label>
                <Select value={formData.enteId} onValueChange={(value) => setFormData({ ...formData, enteId: value })} disabled={availableEntes.length <= 1}>
                  <SelectTrigger><SelectValue placeholder="Selecione o ente" /></SelectTrigger>
                  <SelectContent>
                    {availableEntes.map((ente) => (
                      <SelectItem key={ente.id} value={ente.id}>{ente.sigla} - {ente.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descricao</label>
                <Input value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Atualizar" : "Criar"} Departamento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <div className="mb-4">
          <Input placeholder="Buscar departamento..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Ente</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descricao</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-20">Acao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><div className="flex flex-col items-center"><Building2 className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhum departamento</p></div></TableCell></TableRow>
              ) : (
                filtered.map((departamento) => (
                  <TableRow key={departamento.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                    <TableCell>{entes.find((ente) => ente.id === departamento.enteId)?.sigla || "-"}</TableCell>
                    <TableCell className="font-medium">{departamento.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{departamento.descricao || "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(departamento.criadoEm?.toString())}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(departamento)} data-testid={`button-edit-${departamento.id}`}>
                        <Edit2 size={16} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDepartamentoToDelete(departamento)} data-testid={`button-delete-${departamento.id}`}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={!!departamentoToDelete} onOpenChange={(open) => { if (!open) setDepartamentoToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir departamento</AlertDialogTitle>
            <AlertDialogDescription>Voce deseja realmente excluir este item?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!departamentoToDelete) return;
                deleteMutation.mutate(departamentoToDelete.id, {
                  onSuccess: () => {
                    toast({ title: "Registro excluido com sucesso!" });
                    setDepartamentoToDelete(null);
                  },
                  onError: (err) => toast({
                    variant: "destructive",
                    title: "Erro",
                    description: err instanceof Error ? err.message : "Erro ao excluir departamento",
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
