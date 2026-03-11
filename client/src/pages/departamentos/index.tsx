import { useState } from "react";
import { useDepartamentos, useCreateDepartamento, useUpdateDepartamento } from "@/hooks/use-departamentos";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Departamentos() {
  const { data: departamentos = [], isLoading } = useDepartamentos();
  const createMutation = useCreateDepartamento();
  const updateMutation = useUpdateDepartamento();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: "", descricao: "" });

  const filtered = departamentos.filter((d: any) => 
    d.nome.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          toast({ title: "Departamento atualizado!" });
          setIsDialogOpen(false);
          setEditingId(null);
          setFormData({ nome: "", descricao: "" });
        },
        onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast({ title: "Departamento criado!" });
          setIsDialogOpen(false);
          setFormData({ nome: "", descricao: "" });
        },
        onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
      });
    }
  };

  const handleEdit = (dept: any) => {
    setEditingId(dept.id);
    setFormData({ nome: dept.nome, descricao: dept.descricao || "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departamentos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os departamentos responsáveis.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({ nome: "", descricao: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Novo Departamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} Departamento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome</label>
                <Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} />
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
          <Input placeholder="Buscar departamento..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-20">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8"><div className="flex flex-col items-center"><Building2 className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhum departamento</p></div></TableCell></TableRow>
              ) : (
                filtered.map((dept: any) => (
                  <TableRow key={dept.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                    <TableCell className="font-medium">{dept.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{dept.descricao || "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(dept.criadoEm)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(dept)} data-testid={`button-edit-${dept.id}`}>
                        <Edit2 size={16} />
                      </Button>
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
