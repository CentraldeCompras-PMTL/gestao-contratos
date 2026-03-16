import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCreateEnte, useEntes, useUpdateEnte } from "@/hooks/use-entes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function EntesPage() {
  const { user } = useAuth();
  const { data: entes = [], isLoading } = useEntes();
  const createEnte = useCreateEnte();
  const updateEnte = useUpdateEnte();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", sigla: "" });

  if (user?.role !== "admin") return <Redirect to="/" />;

  const reset = () => {
    setEditingId(null);
    setForm({ nome: "", sigla: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateEnte.mutate(
        { id: editingId, data: form },
        {
          onSuccess: () => {
            toast({
              title: "Registro atualizado com sucesso!",
              description: "Os dados foram salvos com sucesso.",
            });
            setDialogOpen(false);
            reset();
          },
          onError: (err) => toast({
            variant: "destructive",
            title: "Erro",
            description: err instanceof Error ? err.message : "Erro ao atualizar ente",
          }),
        },
      );
      return;
    }

    createEnte.mutate(form, {
      onSuccess: () => {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Os dados foram cadastrados com sucesso.",
        });
        setDialogOpen(false);
        reset();
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar ente",
      }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entes</h1>
          <p className="text-muted-foreground mt-1">Gerencie as secretarias municipais.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) reset(); }}>
          <DialogTrigger asChild><Button>Novo Ente</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Ente</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2"><label className="text-sm font-medium">Nome</label><Input value={form.nome} onChange={(e) => setForm((c) => ({ ...c, nome: e.target.value }))} required /></div>
              <div className="space-y-2"><label className="text-sm font-medium">Sigla</label><Input value={form.sigla} onChange={(e) => setForm((c) => ({ ...c, sigla: e.target.value.toUpperCase() }))} required /></div>
              <Button type="submit" className="w-full" disabled={createEnte.isPending || updateEnte.isPending}>
                {createEnte.isPending || updateEnte.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Sigla</TableHead><TableHead>Acao</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={3} className="text-center py-8">Carregando...</TableCell></TableRow> : entes.map((ente) => (
              <TableRow key={ente.id}>
                <TableCell>{ente.nome}</TableCell>
                <TableCell>{ente.sigla}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => { setEditingId(ente.id); setForm({ nome: ente.nome, sigla: ente.sigla }); setDialogOpen(true); }}>Editar</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
