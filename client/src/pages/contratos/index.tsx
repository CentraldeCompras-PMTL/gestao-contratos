import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useContratos, useCreateContrato, useUpdateContrato } from "@/hooks/use-contratos";
import { useFases } from "@/hooks/use-fases";
import { useProcessos } from "@/hooks/use-processos";
import { useEntes } from "@/hooks/use-entes";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Eye, Edit2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { ContratoWithRelations, FaseContratacaoWithRelations, ProcessoDigitalWithRelations } from "@shared/schema";

function resetForm(
  setProcId: (value: string) => void,
  setFaseId: (value: string) => void,
  setFornecedorId: (value: string) => void,
  setNumeroContrato: (value: string) => void,
  setValorContrato: (value: string) => void,
  setVigenciaInicial: (value: string) => void,
  setVigenciaFinal: (value: string) => void,
) {
  setProcId("");
  setFaseId("");
  setFornecedorId("");
  setNumeroContrato("");
  setValorContrato("");
  setVigenciaInicial("");
  setVigenciaFinal("");
}

export default function Contratos() {
  const { user } = useAuth();
  const { data: contratos = [], isLoading } = useContratos();
  const { data: processos = [] } = useProcessos();
  const { data: fases = [] } = useFases();
  const { data: entes = [] } = useEntes();
  const createContrato = useCreateContrato();
  const updateContrato = useUpdateContrato();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [enteFilter, setEnteFilter] = useState("all");
  const [departamentoFilter, setDepartamentoFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [procId, setProcId] = useState("");
  const [faseId, setFaseId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [numeroContrato, setNumeroContrato] = useState("");
  const [valorContrato, setValorContrato] = useState("");
  const [vigenciaInicial, setVigenciaInicial] = useState("");
  const [vigenciaFinal, setVigenciaFinal] = useState("");

  const selectedProcesso = processos.find((p: ProcessoDigitalWithRelations) => p.id === procId);
  const fasesDoProcesso = useMemo(
    () => fases.filter((fase: FaseContratacaoWithRelations) => fase.processoDigitalId === procId),
    [fases, procId],
  );
  const selectedFase = useMemo(
    () => fasesDoProcesso.find((f: FaseContratacaoWithRelations) => f.id === faseId),
    [fasesDoProcesso, faseId],
  );

  const handleFaseSelect = (fid: string) => {
    setFaseId(fid);
  };

  useEffect(() => {
    if (selectedFase?.fornecedorId) {
      setFornecedorId(selectedFase.fornecedorId);
      return;
    }

    if (faseId) {
      setFornecedorId("");
    }
  }, [selectedFase, faseId]);

  const filtered = contratos.filter((c: ContratoWithRelations) =>
    (c.numeroContrato.toLowerCase().includes(search.toLowerCase()) ||
      c.fornecedor.nome.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || c.status === statusFilter) &&
    (enteFilter === "all" || c.processoDigital.departamento?.enteId === enteFilter) &&
    (departamentoFilter === "all" || c.processoDigital.departamentoId === departamentoFilter)
  );

  const departamentos = Array.from(
    new Map(
      processos
        .filter((processo) => enteFilter === "all" || processo.departamento?.enteId === enteFilter)
        .map((processo) => [processo.departamentoId, processo.departamento])
        .filter((entry): entry is [string, NonNullable<ProcessoDigitalWithRelations["departamento"]>] => Boolean(entry[0] && entry[1])),
    ).values(),
  );

  const handleEdit = (c: ContratoWithRelations) => {
    setEditingId(c.id);
    setProcId(c.processoDigitalId);
    setFaseId(c.faseContratacaoId);
    setFornecedorId(c.fornecedorId);
    setNumeroContrato(c.numeroContrato);
    setValorContrato(String(c.valorContrato));
    setVigenciaInicial(c.vigenciaInicial);
    setVigenciaFinal(c.vigenciaFinal);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procId || !faseId || !fornecedorId) {
      toast({ variant: "destructive", title: "Preencha todos os selects" });
      return;
    }

    const payload = {
      processoDigitalId: procId,
      faseContratacaoId: faseId,
      fornecedorId,
      numeroContrato,
      valorContrato,
      vigenciaInicial,
      vigenciaFinal,
    };

    if (editingId) {
      updateContrato.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            setDialogOpen(false);
            setEditingId(null);
            resetForm(setProcId, setFaseId, setFornecedorId, setNumeroContrato, setValorContrato, setVigenciaInicial, setVigenciaFinal);
          },
          onError: (error) => {
            toast({
              variant: "destructive",
              title: "Erro",
              description: error instanceof Error ? error.message : "Erro ao atualizar contrato",
            });
          },
        },
      );
      return;
    }

    createContrato.mutate(payload, {
      onSuccess: () => {
        toast({ title: "Cadastro realizado com sucesso!" });
        setDialogOpen(false);
        resetForm(setProcId, setFaseId, setFornecedorId, setNumeroContrato, setValorContrato, setVigenciaInicial, setVigenciaFinal);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: error instanceof Error ? error.message : "Erro ao criar contrato",
        });
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground mt-1">Gestao de contratos e acompanhamento de saldos.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingId(null);
            resetForm(setProcId, setFaseId, setFornecedorId, setNumeroContrato, setValorContrato, setVigenciaInicial, setVigenciaFinal);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Criar Novo"} Contrato</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5 pt-4">
              <div className="p-4 bg-muted/50 rounded-xl space-y-4 border border-border">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">1. Processo Digital</label>
                  <Select value={procId} onValueChange={(val) => { setProcId(val); setFaseId(""); setFornecedorId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o processo..." /></SelectTrigger>
                    <SelectContent>
                      {processos.map((p: ProcessoDigitalWithRelations) => (
                        <SelectItem key={p.id} value={p.id}>{p.numeroProcessoDigital} - {p.objetoResumido}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProcesso && (
                  <div className="text-xs text-muted-foreground bg-background p-3 rounded-lg border">
                    <span className="font-semibold block mb-1">Objeto Completo (Herdado):</span>
                    {selectedProcesso.objetoCompleto}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary">2. Fase de Contratacao</label>
                  <Select disabled={!procId} value={faseId} onValueChange={handleFaseSelect}>
                    <SelectTrigger><SelectValue placeholder="Selecione a fase..." /></SelectTrigger>
                    <SelectContent>
                      {fasesDoProcesso.map((f: FaseContratacaoWithRelations) => (
                        <SelectItem key={f.id} value={f.id}>{f.nomeFase}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
<<<<<<< HEAD
                  <label className="text-sm font-medium text-primary">3. Fornecedor da Etapa</label>
                  <Input
                    value={selectedFase?.fornecedor?.nome ?? ""}
                    readOnly
                    placeholder="Selecione uma etapa com fornecedor vinculado"
                  />
                  {selectedFase?.fornecedor && (
                    <p className="text-xs text-muted-foreground">
                      CNPJ: {selectedFase.fornecedor.cnpj}
                    </p>
                  )}
                  {faseId && !selectedFase?.fornecedor && (
                    <p className="text-xs text-destructive mt-1">Esta etapa nao possui fornecedor vinculado.</p>
                  )}
=======
                  <label className="text-sm font-medium text-primary">3. Fornecedor</label>
                  <Select disabled value={fornecedorId} onValueChange={setFornecedorId}>
                    <SelectTrigger><SelectValue placeholder="Vinculado a fase..." /></SelectTrigger>
                    <SelectContent>
                      {fornecedorId && (
  <SelectItem value={fornecedorId}>
    Fornecedor vinculado automaticamente
  </SelectItem>
)}
                    </SelectContent>
                  </Select>
                  {faseId && !fornecedorId && (
  <p className="text-xs text-destructive mt-1">
    Esta fase nao possui fornecedor vencedor vinculado.
  </p>
)}
>>>>>>> 646e84a2d29da2a259ee5bf3bdbeb72125eb99ce
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">No do Contrato</label>
                  <Input required value={numeroContrato} onChange={e => setNumeroContrato(e.target.value)} placeholder="001/2024" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor Total (R$)</label>
                  <Input required type="number" step="0.01" value={valorContrato} onChange={e => setValorContrato(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vigencia Inicial</label>
                  <Input required type="date" value={vigenciaInicial} onChange={e => setVigenciaInicial(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vigencia Final</label>
                  <Input required type="date" value={vigenciaFinal} onChange={e => setVigenciaFinal(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={createContrato.isPending || updateContrato.isPending || !fornecedorId}>
                {editingId ? "Atualizar" : "Gerar"} Contrato
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border/50 rounded-xl shadow-sm">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Search className="text-muted-foreground" size={18} />
          <Input
            placeholder="Buscar por no do contrato ou fornecedor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="grid gap-4 border-b border-border/50 p-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {user?.role === "admin" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Ente</label>
              <Select value={enteFilter} onValueChange={(value) => {
                setEnteFilter(value);
                setDepartamentoFilter("all");
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os entes</SelectItem>
                  {entes.map((ente) => (
                    <SelectItem key={ente.id} value={ente.id}>{ente.sigla} - {ente.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Departamento</label>
            <Select value={departamentoFilter} onValueChange={setDepartamentoFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departamentos.map((departamento) => (
                  <SelectItem key={departamento.id} value={departamento.id}>{departamento.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Contrato</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead className="text-right">Acao</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    Nenhum contrato encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((c: ContratoWithRelations) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold">{c.numeroContrato}</TableCell>
                    <TableCell>{c.fornecedor.nome}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "encerrado" ? "secondary" : "outline"}>
                        {c.status === "encerrado" ? "Encerrado" : "Vigente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(c.valorContrato)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(c.vigenciaInicial)} ate {formatDate(c.vigenciaFinal)}
                    </TableCell>
                    <TableCell className="text-right gap-1 flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(c)} data-testid={`button-edit-${c.id}`} disabled={c.status === "encerrado"}>
                        <Edit2 size={16} />
                      </Button>
                      <Link href={`/contratos/${c.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        <Eye size={16} className="mr-2" /> Detalhes
                      </Link>
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
