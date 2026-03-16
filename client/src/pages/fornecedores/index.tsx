import { useState } from "react";
import {
  useFornecedores,
  useCreateFornecedor,
  useUpdateFornecedor,
  useLookupFornecedorCnpj,
  useDeleteFornecedor,
} from "@/hooks/use-fornecedores";
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
import { Search, Plus, Building2, Edit2, SearchCheck, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Fornecedor, InsertFornecedor } from "@shared/schema";

type FornecedorForm = InsertFornecedor;

const emptyForm: FornecedorForm = {
  nome: "",
  cnpj: "",
  email: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  municipio: "",
  uf: "",
};

function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "");
}

export default function Fornecedores() {
  const { data: fornecedores = [], isLoading } = useFornecedores();
  const createFornecedor = useCreateFornecedor();
  const updateFornecedor = useUpdateFornecedor();
  const lookupCnpj = useLookupFornecedorCnpj();
  const deleteFornecedor = useDeleteFornecedor();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState<FornecedorForm>(emptyForm);

  const filtered = fornecedores.filter((fornecedor: Fornecedor) =>
    fornecedor.nome.toLowerCase().includes(search.toLowerCase()) ||
    fornecedor.cnpj.includes(search),
  );

  const resetForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
  };

  const setField = (field: keyof FornecedorForm, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleLookupCnpj = () => {
    const cnpj = normalizeCnpj(formData.cnpj);
    if (cnpj.length !== 14) {
      toast({
        variant: "destructive",
        title: "CNPJ invalido",
        description: "Informe um CNPJ com 14 digitos para consultar",
      });
      return;
    }

    lookupCnpj.mutate(cnpj, {
      onSuccess: (data) => {
        setFormData((current) => ({
          ...current,
          cnpj: data.cnpj || current.cnpj,
          nome: data.nome || current.nome,
          email: data.email || current.email,
          telefone: data.telefone || current.telefone,
          cep: data.cep || current.cep,
          logradouro: data.logradouro || current.logradouro,
          numero: data.numero || current.numero,
          complemento: data.complemento || current.complemento,
          bairro: data.bairro || current.bairro,
          municipio: data.municipio || current.municipio,
          uf: data.uf || current.uf,
        }));
        toast({ title: "Dados do CNPJ carregados" });
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro ao consultar CNPJ",
        description: err instanceof Error ? err.message : "Falha na consulta publica. Voce pode preencher os dados manualmente.",
      }),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateFornecedor.mutate(
        { id: editingId, ...formData },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            setIsDialogOpen(false);
            resetForm();
          },
          onError: (err) => toast({
            variant: "destructive",
            title: "Erro",
            description: err instanceof Error ? err.message : "Erro ao atualizar fornecedor",
          }),
        },
      );
      return;
    }

    createFornecedor.mutate(formData, {
      onSuccess: () => {
        toast({ title: "Cadastro realizado com sucesso!" });
        setIsDialogOpen(false);
        resetForm();
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar fornecedor",
      }),
    });
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingId(fornecedor.id);
    setFormData({
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj,
      email: fornecedor.email || "",
      telefone: fornecedor.telefone || "",
      cep: fornecedor.cep || "",
      logradouro: fornecedor.logradouro || "",
      numero: fornecedor.numero || "",
      complemento: fornecedor.complemento || "",
      bairro: fornecedor.bairro || "",
      municipio: fornecedor.municipio || "",
      uf: fornecedor.uf || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteFornecedor.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast({ title: "Registro excluido com sucesso!" });
        setDeleteTarget(null);
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao excluir fornecedor",
      }),
    });
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
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Adicionar Fornecedor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Fornecedor</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="space-y-2">
                  <label className="text-sm font-medium">CNPJ</label>
                  <Input
                    required
                    value={formData.cnpj}
                    onChange={(e) => setField("cnpj", e.target.value)}
                    disabled={!!editingId}
                  />
                  {editingId && <p className="text-xs text-muted-foreground">O CNPJ nao pode ser alterado depois do cadastro.</p>}
                </div>
                {!editingId && (
                  <div className="flex items-end">
                    <Button type="button" variant="outline" className="w-full" onClick={handleLookupCnpj} disabled={lookupCnpj.isPending}>
                      <SearchCheck className="mr-2" size={16} />
                      {lookupCnpj.isPending ? "Consultando..." : "Buscar CNPJ"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Razao Social / Nome</label>
                <Input required value={formData.nome} onChange={(e) => setField("nome", e.target.value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-mail</label>
                  <Input type="email" value={formData.email ?? ""} onChange={(e) => setField("email", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefone</label>
                  <Input value={formData.telefone ?? ""} onChange={(e) => setField("telefone", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.4fr_0.6fr_1fr]">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Logradouro</label>
                  <Input value={formData.logradouro ?? ""} onChange={(e) => setField("logradouro", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Numero</label>
                  <Input value={formData.numero ?? ""} onChange={(e) => setField("numero", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complemento</label>
                  <Input value={formData.complemento ?? ""} onChange={(e) => setField("complemento", e.target.value)} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.7fr_0.4fr]">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bairro</label>
                  <Input value={formData.bairro ?? ""} onChange={(e) => setField("bairro", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Municipio</label>
                  <Input value={formData.municipio ?? ""} onChange={(e) => setField("municipio", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CEP</label>
                  <Input value={formData.cep ?? ""} onChange={(e) => setField("cep", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">UF</label>
                  <Input value={formData.uf ?? ""} onChange={(e) => setField("uf", e.target.value)} maxLength={2} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createFornecedor.isPending || updateFornecedor.isPending}>
                {createFornecedor.isPending || updateFornecedor.isPending ? "Salvando..." : "Salvar Fornecedor"}
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
            onChange={(e) => setSearch(e.target.value)}
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
                <TableHead>Endereco</TableHead>
                <TableHead>Cadastrado Em</TableHead>
                <TableHead className="w-24">Acao</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                    Nenhum fornecedor encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((fornecedor: Fornecedor) => (
                  <TableRow key={fornecedor.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-foreground">{fornecedor.nome}</TableCell>
                    <TableCell>{fornecedor.cnpj}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{fornecedor.email || "-"}</div>
                        <div className="text-muted-foreground">{fornecedor.telefone || "-"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fornecedor.municipio || fornecedor.uf || fornecedor.logradouro
                        ? `${fornecedor.logradouro || ""}${fornecedor.logradouro && fornecedor.numero ? ", " : ""}${fornecedor.numero || ""}${fornecedor.municipio ? " - " : ""}${fornecedor.municipio || ""}${fornecedor.uf ? `/${fornecedor.uf}` : ""}`
                        : "-"}
                    </TableCell>
                    <TableCell>{formatDate(fornecedor.criadoEm?.toString())}</TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(fornecedor)} data-testid={`button-edit-${fornecedor.id}`}>
                        <Edit2 size={16} />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(fornecedor)} data-testid={`button-delete-${fornecedor.id}`}>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fornecedor</AlertDialogTitle>
            <AlertDialogDescription>
              Voce deseja realmente excluir este item?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteFornecedor.isPending}>
              Confirmar exclusao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
