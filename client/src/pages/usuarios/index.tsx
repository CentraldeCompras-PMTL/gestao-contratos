import { useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useCreateUser, useResetUserPassword, useUpdateUser, useUsers } from "@/hooks/use-users";
import { useEntes } from "@/hooks/use-entes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatDate } from "@/lib/formatters";
import { Plus, Shield, UserCog, KeyRound, Edit2 } from "lucide-react";
import type { PublicUser } from "@shared/schema";

export default function Usuarios() {
  const { user } = useAuth();
  const { data: users = [], isLoading } = useUsers(user?.role === "admin");
  const { data: entes = [] } = useEntes();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resetUserPassword = useResetUserPassword();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "operacional" as "admin" | "operacional",
    enteId: "",
  });
  const [resetTarget, setResetTarget] = useState<PublicUser | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  const resetForm = () => {
    setEditingUserId(null);
    setForm({
      name: "",
      email: "",
      password: "",
      role: "operacional",
      enteId: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.role === "operacional" && !form.enteId) {
      toast({
        variant: "destructive",
        title: "Preencha os campos obrigatorios",
        description: "Selecione o ente do usuario operacional antes de salvar.",
      });
      return;
    }

    if (editingUserId) {
      updateUser.mutate(
        { id: editingUserId, ...form, enteId: form.role === "admin" ? undefined : form.enteId },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            setDialogOpen(false);
            resetForm();
          },
          onError: (err) => toast({
            variant: "destructive",
            title: "Erro",
            description: err instanceof Error ? err.message : "Erro ao atualizar usuario",
          }),
        },
      );
      return;
    }

    createUser.mutate({ ...form, enteId: form.role === "admin" ? undefined : form.enteId }, {
      onSuccess: () => {
        toast({ title: "Cadastro realizado com sucesso!" });
        setDialogOpen(false);
        resetForm();
      },
      onError: (err) => toast({
        variant: "destructive",
        title: "Erro",
        description: err instanceof Error ? err.message : "Erro ao criar usuario",
      }),
    });
  };

  const handleEdit = (target: PublicUser) => {
    setEditingUserId(target.id);
    setForm({
      name: target.name ?? "",
      email: target.email,
      password: "",
      role: target.role === "admin" ? "admin" : "operacional",
      enteId: target.enteId ?? "",
    });
    setDialogOpen(true);
  };

  const handleResetPassword = () => {
    if (!resetTarget) return;
    resetUserPassword.mutate(
      { id: resetTarget.id, password: resetPassword },
      {
        onSuccess: () => {
          toast({ title: "Senha redefinida com sucesso!" });
          setResetTarget(null);
          setResetPassword("");
        },
        onError: (err) => toast({
          variant: "destructive",
          title: "Erro",
          description: err instanceof Error ? err.message : "Erro ao redefinir senha",
        }),
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground mt-1">Cadastre e gerencie os acessos administrativos e operacionais.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2" size={18} /> Novo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingUserId ? "Editar Usuario" : "Cadastrar Usuario"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nome</Label>
                <Input id="user-name" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">E-mail</Label>
                <Input id="user-email" type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} required />
              </div>
              {!editingUserId && (
                <div className="space-y-2">
                  <Label htmlFor="user-password">Senha Inicial</Label>
                  <Input id="user-password" type="password" minLength={6} value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} required />
                </div>
              )}
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select
                  value={form.role}
                  onValueChange={(value: "admin" | "operacional") => setForm((current) => ({
                    ...current,
                    role: value,
                    enteId: value === "admin" ? "" : current.enteId,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ente {form.role === "operacional" ? "*" : ""}</Label>
                <Select value={form.enteId} onValueChange={(value) => setForm((current) => ({ ...current, enteId: value }))} disabled={form.role === "admin"}>
                  <SelectTrigger>
                    <SelectValue placeholder={form.role === "admin" ? "Administrador acessa todos" : "Selecione o ente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {entes.map((ente) => (
                      <SelectItem key={ente.id} value={ente.id}>{ente.sigla} - {ente.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.role === "operacional" && (
                  <p className="text-xs text-muted-foreground">Usuarios operacionais devem ser vinculados a um ente.</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={createUser.isPending || updateUser.isPending}>
                {createUser.isPending || updateUser.isPending ? "Salvando..." : "Salvar Usuario"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <Shield className="text-primary" />
            <div>
              <h2 className="font-semibold">Administrador</h2>
              <p className="text-sm text-muted-foreground">Cadastra usuarios e controla o sistema.</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <UserCog className="text-primary" />
            <div>
              <h2 className="font-semibold">Operacional</h2>
              <p className="text-sm text-muted-foreground">Opera os cadastros e fluxos do dia a dia.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Ente</TableHead>
              <TableHead>Criado Em</TableHead>
              <TableHead className="text-right">Acao</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum usuario encontrado.</TableCell></TableRow>
            ) : (
              users.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name || "-"}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.role === "admin" ? "Administrador" : "Operacional"}</TableCell>
                  <TableCell>{item.role === "admin" ? "Todos" : entes.find((ente) => ente.id === item.enteId)?.sigla || "-"}</TableCell>
                  <TableCell>{formatDate(item.createdAt ? String(item.createdAt) : "")}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                      <Edit2 size={16} className="mr-2" />
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setResetTarget(item)}>
                      <KeyRound size={16} className="mr-2" />
                      Resetar senha
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Redefinir senha do usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Informe uma nova senha temporaria. O usuario sera obrigado a trocar a senha no proximo acesso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reset-user-password">Nova senha temporaria</Label>
            <Input
              id="reset-user-password"
              type="password"
              minLength={6}
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="Minimo de 6 caracteres"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResetPassword("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} disabled={resetUserPassword.isPending || resetPassword.length < 6}>
              Confirmar redefinicao
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
