import { useState } from "react";
import { useFornecedores, useCreateFornecedor, useUpdateFornecedor } from "@/hooks/use-fornecedores";
import { formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Building2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Fornecedores() {
  const { data: fornecedores = [], isLoading } = useFornecedores();
  const createFornecedor = useCreateFornecedor();
  const updateFornecedor = useUpdateFornecedor();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: "", cnpj: "", email: "", telefone: "" });

  const filtered = fornecedores.filter((f: any) => 
    f.nome.toLowerCase().includes(search.toLowerCase()) || 
    f.cnpj.includes(search)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateFornecedor.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          toast({ title: "Fornecedor atualizado!" });
          setIsDialogOpen(false);
          setEditingId(null);
          setFormData({ nome: "", cnpj: "", email: "", telefone: "" });
        },
        onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
      });
    } else {
      createFornecedor.mutate(formData, {
        onSuccess: () => {
          toast({ title: "Fornecedor cadastrado com sucesso!" });
          setIsDialogOpen(false);
          setFormData({ nome: "", cnpj: "", email: "", telefone: "" });
        },
        onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
      });
    }
  };

  const handleEdit = (f: any) => {
    setEditingId(f.id);
    setFormData({ nome: f.nome, cnpj: f.cnpj, email: f.email || "", telefone: f.telefone || "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground mt-1">Gerencie a base de fornecedores credenciados.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingId(null);
            setFormData({ nome: "", cnpj: "", email: "", telefone: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Adicionar Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} Fornecedor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Razão Social / Nome</label>
                <Input required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CNPJ</label>
                <Input required value={formData.cnpj} onChange={e => setFormData({...formData, cnpj: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone</label>
                <Input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} />
              </div>
              <Button type="submit" className="w-full" disabled={createFornecedor.isPending}>
                {createFornecedor.isPending ? "Salvando..." : "Salvar Fornecedor"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border/50 rounded-xl shadow-sm">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Search className="text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nome ou CNPJ..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Fornecedor</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cadastrado Em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                    Nenhum fornecedor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((f: any) => (
                  <TableRow key={f.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{f.nome}</TableCell>
                    <TableCell>{f.cnpj}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{f.email || '-'}</div>
                        <div className="text-muted-foreground">{f.telefone || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(f.criadoEm)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(f)} data-testid={`button-edit-${f.id}`}>
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
