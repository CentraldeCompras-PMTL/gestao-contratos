import { useMemo, useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useEntes } from "@/hooks/use-entes";
import { useAtaPrePedidos } from "@/hooks/use-ata-pre-pedidos";
import {
  useAtaContratos,
  useCreateAtaAf,
  useCreateAtaContrato,
  useCreateAtaEmpenho,
  useCreateAtaNotaFiscal,
  useRegisterAtaNotaFiscalPayment,
  useSendAtaNotaFiscalToPayment,
} from "@/hooks/use-ata-contratos";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, parseNumberString } from "@/lib/formatters";
import type { AtaAf, AtaPrePedidoWithRelations } from "@shared/schema";

const defaultContratoForm = {
  numeroContrato: "",
  objeto: "",
  vigenciaInicial: "",
  vigenciaFinal: "",
};

const defaultEmpenhoForm = {
  ataPrePedidoId: "",
  dataEmpenho: "",
  numeroEmpenho: "",
  quantidadeEmpenhada: "",
  valorEmpenho: "",
};

const defaultAfForm = {
  dataPedidoAf: "",
  quantidadeAf: "",
  valorAf: "",
  dataEstimadaEntrega: "",
};

const defaultNotaForm = {
  numeroNota: "",
  quantidadeNota: "",
  valorNota: "",
  dataNota: "",
};

const defaultEnviarPagamentoForm = {
  numeroProcessoPagamento: "",
  dataEnvioPagamento: "",
};

const defaultRegistrarPagamentoForm = {
  dataPagamento: "",
};

function normalizeEnteName(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function hasFazendaAccess(
  user: { role: string; canAccessAtaModule?: boolean; accessibleEnteIds?: string[] } | null | undefined,
  entes: Array<{ id: string; nome: string; sigla: string }>,
) {
  if (user?.role === "admin") return true;
  if (!user?.canAccessAtaModule) return false;
  const accessible = new Set(user.accessibleEnteIds ?? []);
  return entes.some((ente) => {
    if (!accessible.has(ente.id)) return false;
    const nome = normalizeEnteName(ente.nome);
    const sigla = normalizeEnteName(ente.sigla);
    return nome.includes("fazenda") || sigla.includes("fazenda") || sigla === "sefaz";
  });
}

function getOpenPrePedidos(prePedidos: AtaPrePedidoWithRelations[]) {
  return prePedidos.filter((prePedido) => prePedido.status === "aberto" && !prePedido.ataContratoId && (prePedido.empenhos?.length ?? 0) === 0);
}

function getConcludedPrePedidos(prePedidos: AtaPrePedidoWithRelations[]) {
  return prePedidos.filter((prePedido) => prePedido.status === "concluido" || Boolean(prePedido.ataContratoId));
}

export default function ContratosArpPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: entes = [] } = useEntes();
  const { data: prePedidos = [], isLoading: prePedidosLoading } = useAtaPrePedidos();
  const { data: contratos = [], isLoading: contratosLoading } = useAtaContratos();
  const createContrato = useCreateAtaContrato();
  const createEmpenho = useCreateAtaEmpenho();
  const createAf = useCreateAtaAf();
  const createNotaFiscal = useCreateAtaNotaFiscal();
  const sendAtaNotaFiscalToPayment = useSendAtaNotaFiscalToPayment();
  const registerAtaNotaFiscalPayment = useRegisterAtaNotaFiscalPayment();
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contratoForm, setContratoForm] = useState(defaultContratoForm);
  const [empenhoDialogOpen, setEmpenhoDialogOpen] = useState<string | null>(null);
  const [afDialogOpen, setAfDialogOpen] = useState<string | null>(null);
  const [notaDialogOpen, setNotaDialogOpen] = useState<AtaAf | null>(null);
  const [enviarPagamentoDialogOpen, setEnviarPagamentoDialogOpen] = useState<string | null>(null);
  const [registrarPagamentoDialogOpen, setRegistrarPagamentoDialogOpen] = useState<string | null>(null);
  const [empenhoForm, setEmpenhoForm] = useState(defaultEmpenhoForm);
  const [afForm, setAfForm] = useState(defaultAfForm);
  const [notaForm, setNotaForm] = useState(defaultNotaForm);
  const [enviarPagamentoForm, setEnviarPagamentoForm] = useState(defaultEnviarPagamentoForm);
  const [registrarPagamentoForm, setRegistrarPagamentoForm] = useState(defaultRegistrarPagamentoForm);

  const canManageArp = useMemo(() => hasFazendaAccess(user, entes), [user, entes]);
  const openPrePedidos = useMemo(() => getOpenPrePedidos(prePedidos), [prePedidos]);
  const concludedPrePedidos = useMemo(() => getConcludedPrePedidos(prePedidos), [prePedidos]);

  const selectedPrePedidos = useMemo(
    () => openPrePedidos.filter((prePedido) => selectedIds.includes(prePedido.id)),
    [openPrePedidos, selectedIds],
  );

  const groupedOpenByAta = useMemo(() => {
    return openPrePedidos.reduce<Record<string, AtaPrePedidoWithRelations[]>>((acc, current) => {
      const key = current.ataId;
      acc[key] = [...(acc[key] ?? []), current];
      return acc;
    }, {});
  }, [openPrePedidos]);

  const groupedConcludedByAta = useMemo(() => {
    return concludedPrePedidos.reduce<Record<string, AtaPrePedidoWithRelations[]>>((acc, current) => {
      const key = current.ataId;
      acc[key] = [...(acc[key] ?? []), current];
      return acc;
    }, {});
  }, [concludedPrePedidos]);

  const selectedAtaId = selectedPrePedidos[0]?.ataId ?? null;
  const selectedEntes = Array.from(new Set(selectedPrePedidos.map((prePedido) => prePedido.ente.sigla)));
  const empenhoDialogContratoId = empenhoDialogOpen ?? undefined;
  const fornecedorDerivado = useMemo(() => {
    if (!selectedAtaId || selectedPrePedidos.length === 0) return null;
    const fornecedores = Array.from(new Set(selectedPrePedidos.map((prePedido) => prePedido.item.resultado?.fornecedor?.nome).filter(Boolean)));
    if (fornecedores.length !== 1) return null;
    return fornecedores[0];
  }, [selectedAtaId, selectedPrePedidos]);

  const getQuantidadeEmpenhada = (prePedidoId: string, contratoId?: string) => {
    const fonte = contratoId
      ? contratos.find((contrato) => contrato.id === contratoId)?.empenhos ?? []
      : contratos.flatMap((contrato) => contrato.empenhos);
    return fonte
      .filter((empenho) => empenho.ataPrePedidoId === prePedidoId)
      .reduce((sum, empenho) => sum + parseNumberString(empenho.quantidadeEmpenhada), 0);
  };

  const getSaldoPrePedido = (prePedido: AtaPrePedidoWithRelations, contratoId?: string) =>
    Math.max(parseNumberString(prePedido.quantidadeSolicitada) - getQuantidadeEmpenhada(prePedido.id, contratoId), 0);

  const togglePrePedido = (prePedido: AtaPrePedidoWithRelations, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        const sameAtaIds = current.filter((id) => openPrePedidos.find((item) => item.id === id)?.ataId === prePedido.ataId);
        return Array.from(new Set([...sameAtaIds, prePedido.id]));
      }
      return current.filter((id) => id !== prePedido.id);
    });
  };

  const handleCreateContrato = () => {
    if (selectedPrePedidos.length === 0 || !selectedAtaId) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione pelo menos um pre-pedido em aberto." });
      return;
    }

    createContrato.mutate(
      {
        ataId: selectedAtaId,
        numeroContrato: contratoForm.numeroContrato,
        objeto: contratoForm.objeto,
        vigenciaInicial: contratoForm.vigenciaInicial,
        vigenciaFinal: contratoForm.vigenciaFinal,
        prePedidoIds: selectedPrePedidos.map((prePedido) => prePedido.id),
      },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setSelectedIds([]);
          setContratoForm(defaultContratoForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar contrato da ARP" });
        },
      },
    );
  };

  const handleOpenEmpenho = (contratoId: string) => {
    setEmpenhoDialogOpen(contratoId);
    setEmpenhoForm(defaultEmpenhoForm);
  };

  const handleOpenAf = (empenhoId: string) => {
    setAfDialogOpen(empenhoId);
    setAfForm(defaultAfForm);
  };

  const handleOpenNota = (af: AtaAf) => {
    setNotaDialogOpen(af);
    setNotaForm(defaultNotaForm);
  };

  const handleOpenEnviarPagamento = (ataNotaFiscalId: string) => {
    setEnviarPagamentoDialogOpen(ataNotaFiscalId);
    setEnviarPagamentoForm(defaultEnviarPagamentoForm);
  };

  const handleOpenRegistrarPagamento = (ataNotaFiscalId: string) => {
    setRegistrarPagamentoDialogOpen(ataNotaFiscalId);
    setRegistrarPagamentoForm(defaultRegistrarPagamentoForm);
  };

  const handleCreateEmpenho = () => {
    if (!empenhoDialogOpen) return;
    createEmpenho.mutate(
      {
        ataContratoId: empenhoDialogOpen,
        data: empenhoForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setEmpenhoDialogOpen(null);
          setEmpenhoForm(defaultEmpenhoForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar empenho da ARP" });
        },
      },
    );
  };

  const handleCreateAf = () => {
    if (!afDialogOpen) return;
    createAf.mutate(
      {
        ataEmpenhoId: afDialogOpen,
        data: afForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setAfDialogOpen(null);
          setAfForm(defaultAfForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar AF da ARP" });
        },
      },
    );
  };

  const handleCreateNota = () => {
    if (!notaDialogOpen) return;
    createNotaFiscal.mutate(
      {
        ataAfId: notaDialogOpen.id,
        data: notaForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setNotaDialogOpen(null);
          setNotaForm(defaultNotaForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar nota fiscal da ARP" });
        },
      },
    );
  };

  const handleEnviarPagamento = () => {
    if (!enviarPagamentoDialogOpen) return;
    sendAtaNotaFiscalToPayment.mutate(
      {
        ataNotaFiscalId: enviarPagamentoDialogOpen,
        data: enviarPagamentoForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          setEnviarPagamentoDialogOpen(null);
          setEnviarPagamentoForm(defaultEnviarPagamentoForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao enviar nota da ARP para pagamento" });
        },
      },
    );
  };

  const handleRegistrarPagamento = () => {
    if (!registrarPagamentoDialogOpen) return;
    registerAtaNotaFiscalPayment.mutate(
      {
        ataNotaFiscalId: registrarPagamentoDialogOpen,
        data: registrarPagamentoForm,
      },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          setRegistrarPagamentoDialogOpen(null);
          setRegistrarPagamentoForm(defaultRegistrarPagamentoForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao registrar pagamento da nota da ARP" });
        },
      },
    );
  };

  if (!authLoading && !canManageArp) {
    return <Redirect to="/" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contratos da ARP</h1>
        <p className="text-muted-foreground mt-1">
          Consolide pre-pedidos em aberto, gere contratos por ata e siga com empenho e AF da execucao.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Gerar Contrato a Partir dos Pre-pedidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Fornecedor Derivado dos Itens</Label>
              <div className="min-h-10 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {fornecedorDerivado ?? "Selecione pre-pedidos do mesmo fornecedor vencedor"}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Numero do Contrato</Label>
              <Input
                value={contratoForm.numeroContrato}
                onChange={(e) => setContratoForm((current) => ({ ...current, numeroContrato: e.target.value }))}
                placeholder="Ex.: ARP-001/2026"
              />
            </div>
            <div className="space-y-2">
              <Label>Vigencia Inicial</Label>
              <Input
                type="date"
                value={contratoForm.vigenciaInicial}
                onChange={(e) => setContratoForm((current) => ({ ...current, vigenciaInicial: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Vigencia Final</Label>
              <Input
                type="date"
                value={contratoForm.vigenciaFinal}
                onChange={(e) => setContratoForm((current) => ({ ...current, vigenciaFinal: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Entes Selecionados</Label>
              <div className="min-h-10 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                {selectedEntes.length > 0 ? selectedEntes.join(", ") : "Nenhum pre-pedido selecionado"}
              </div>
            </div>
            <div className="space-y-2 md:col-span-2 xl:col-span-4">
              <Label>Objeto</Label>
              <Input
                value={contratoForm.objeto}
                onChange={(e) => setContratoForm((current) => ({ ...current, objeto: e.target.value }))}
                placeholder="Descricao do contrato derivado da ata"
              />
            </div>
          </div>

          <Tabs defaultValue="abertos" className="space-y-4">
            <TabsList>
              <TabsTrigger value="abertos">Pre-pedidos em Aberto</TabsTrigger>
              <TabsTrigger value="concluidos">Pre-pedidos Concluidos</TabsTrigger>
            </TabsList>

            <TabsContent value="abertos" className="space-y-4">
              {prePedidosLoading ? (
                <div className="py-8 text-center text-muted-foreground">Carregando pre-pedidos...</div>
              ) : Object.keys(groupedOpenByAta).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Nenhum pre-pedido em aberto.</div>
              ) : (
                Object.entries(groupedOpenByAta).map(([ataId, items]) => (
                  <Card key={ataId} className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {items[0].ata.numeroAta} - {items[0].ata.objeto}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Sel.</TableHead>
                            <TableHead>Ente</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Fonte/Ficha</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((prePedido) => (
                            <TableRow key={prePedido.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.includes(prePedido.id)}
                                  onCheckedChange={(checked) => togglePrePedido(prePedido, checked === true)}
                                />
                              </TableCell>
                              <TableCell>{prePedido.ente.sigla}</TableCell>
                              <TableCell>{prePedido.item.codigoInterno} - {prePedido.item.descricao}</TableCell>
                              <TableCell>{prePedido.fonteRecurso.codigo} / {prePedido.ficha.codigo}</TableCell>
                              <TableCell>{prePedido.quantidadeSolicitada}</TableCell>
                              <TableCell><Badge variant="secondary">{prePedido.status}</Badge></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="concluidos" className="space-y-4">
              {Object.keys(groupedConcludedByAta).length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Nenhum pre-pedido concluido.</div>
              ) : (
                Object.entries(groupedConcludedByAta).map(([ataId, items]) => (
                  <Card key={ataId} className="border-border/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{items[0].ata.numeroAta}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ente</TableHead>
                            <TableHead>Item</TableHead>
                            <TableHead>Fonte/Ficha</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Contrato</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((prePedido) => (
                            <TableRow key={prePedido.id}>
                              <TableCell>{prePedido.ente.sigla}</TableCell>
                              <TableCell>{prePedido.item.codigoInterno} - {prePedido.item.descricao}</TableCell>
                              <TableCell>{prePedido.fonteRecurso.codigo} / {prePedido.ficha.codigo}</TableCell>
                              <TableCell>{prePedido.quantidadeSolicitada}</TableCell>
                              <TableCell>{prePedido.ataContrato?.numeroContrato ?? "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>

          <Button className="w-full" onClick={handleCreateContrato} disabled={createContrato.isPending || !fornecedorDerivado}>
            {createContrato.isPending ? "Gerando contrato..." : "Gerar Contrato da ARP"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Execucao dos Contratos da ARP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {contratosLoading ? (
            <div className="py-8 text-center text-muted-foreground">Carregando contratos da ARP...</div>
          ) : contratos.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Nenhum contrato da ARP cadastrado.</div>
          ) : (
            contratos.map((contrato) => (
              <Card key={contrato.id} className="border-border/50">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-base">{contrato.numeroContrato}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{contrato.status}</Badge>
                      <Badge variant="outline">{contrato.ata.numeroAta}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{contrato.objeto}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEmpenho(contrato.id)}>
                    Novo Empenho
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Pre-pedidos</p>
                      <p className="font-semibold">{contrato.prePedidos.length}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Fornecedor</p>
                      <p className="font-semibold">{contrato.fornecedor.nome}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Empenhado</p>
                      <p className="font-semibold">
                        {formatCurrency(contrato.empenhos.reduce((sum, empenho) => sum + parseNumberString(empenho.valorEmpenho), 0))}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">AFs</p>
                      <p className="font-semibold">{contrato.empenhos.reduce((sum, empenho) => sum + empenho.afs.length, 0)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Notas da ARP</p>
                      <p className="font-semibold">{contrato.empenhos.reduce((sum, empenho) => sum + empenho.afs.reduce((afSum, af) => afSum + (af.notasFiscais?.length ?? 0), 0), 0)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Saldo dos Pre-pedidos</p>
                      <p className="font-semibold">
                        {contrato.prePedidos.reduce((sum, prePedido) => sum + getSaldoPrePedido(prePedido, contrato.id), 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(contrato.prePedidos.map((prePedido) => prePedido.ente.sigla))).map((sigla) => (
                      <Badge key={sigla} variant="outline">{sigla}</Badge>
                    ))}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empenho</TableHead>
                        <TableHead>Pre-pedido</TableHead>
                        <TableHead>Qtd.</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>AFs</TableHead>
                        <TableHead>Notas</TableHead>
                        <TableHead className="text-right">Acao</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contrato.empenhos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                            Nenhum empenho cadastrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        contrato.empenhos.map((empenho) => (
                          <TableRow key={empenho.id}>
                            <TableCell>{empenho.numeroEmpenho}</TableCell>
                            <TableCell>{empenho.prePedido.item.codigoInterno} / {empenho.prePedido.ente.sigla}</TableCell>
                            <TableCell>{empenho.quantidadeEmpenhada}</TableCell>
                            <TableCell>{formatCurrency(empenho.valorEmpenho)}</TableCell>
                            <TableCell>{empenho.afs.length}</TableCell>
                            <TableCell>{empenho.afs.reduce((sum, af) => sum + (af.notasFiscais?.length ?? 0), 0)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleOpenAf(empenho.id)}>
                                Nova AF
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>

                  {contrato.empenhos.some((empenho) => empenho.afs.length > 0) && (
                    <div className="space-y-3">
                      {contrato.empenhos.flatMap((empenho) =>
                        empenho.afs.map((af) => (
                          <Card key={af.id} className="border-border/50">
                            <CardContent className="pt-4 space-y-3">
                              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div>
                                                  <p className="font-medium text-sm">
                                                    AF de {new Date(`${af.dataPedidoAf}T00:00:00`).toLocaleDateString("pt-BR")} - {formatCurrency(af.valorAf)}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground">
                                                    Empenho {empenho.numeroEmpenho} | Qtd. {af.quantidadeAf} | Entrega estimada {new Date(`${af.dataEstimadaEntrega}T00:00:00`).toLocaleDateString("pt-BR")}
                                                  </p>
                                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleOpenNota(af)}>
                                  Nova Nota
                                </Button>
                              </div>

                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nota</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Qtd.</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Processo</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead className="text-right">Acao</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(af.notasFiscais?.length ?? 0) === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={7} className="py-4 text-center text-muted-foreground">
                                        Nenhuma nota fiscal cadastrada para esta AF.
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    af.notasFiscais!.map((nota) => (
                                      <TableRow key={nota.id}>
                                        <TableCell>{nota.numeroNota}</TableCell>
                                        <TableCell>{new Date(`${nota.dataNota}T00:00:00`).toLocaleDateString("pt-BR")}</TableCell>
                                        <TableCell>{nota.quantidadeNota}</TableCell>
                                        <TableCell><Badge variant="secondary">{nota.statusPagamento}</Badge></TableCell>
                                        <TableCell>{nota.numeroProcessoPagamento ?? "-"}</TableCell>
                                        <TableCell>{formatCurrency(nota.valorNota)}</TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex justify-end gap-2">
                                            {nota.statusPagamento === "nota_recebida" && (
                                              <Button variant="outline" size="sm" onClick={() => handleOpenEnviarPagamento(nota.id)}>
                                                Enviar
                                              </Button>
                                            )}
                                            {nota.statusPagamento === "aguardando_pagamento" && (
                                              <Button variant="outline" size="sm" onClick={() => handleOpenRegistrarPagamento(nota.id)}>
                                                Registrar Pagamento
                                              </Button>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  )}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        )),
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(empenhoDialogOpen)} onOpenChange={(open) => !open && setEmpenhoDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Empenho da ARP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pre-pedido</Label>
              <Select value={empenhoForm.ataPrePedidoId} onValueChange={(value) => setEmpenhoForm((current) => ({ ...current, ataPrePedidoId: value }))}>
                <SelectTrigger><SelectValue placeholder="Selecione o pre-pedido" /></SelectTrigger>
                <SelectContent>
                  {(contratos.find((contrato) => contrato.id === empenhoDialogOpen)?.prePedidos ?? [])
                    .filter((prePedido) => getSaldoPrePedido(prePedido, empenhoDialogContratoId) > 0)
                    .map((prePedido) => (
                      <SelectItem key={prePedido.id} value={prePedido.id}>
                        {prePedido.ente.sigla} - {prePedido.item.codigoInterno} - Saldo {getSaldoPrePedido(prePedido, empenhoDialogContratoId)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {empenhoForm.ataPrePedidoId && (
              <div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                Saldo disponivel no pre-pedido: {(() => {
                  const prePedido = (contratos.find((contrato) => contrato.id === empenhoDialogOpen)?.prePedidos ?? []).find((entry) => entry.id === empenhoForm.ataPrePedidoId);
                  return prePedido ? getSaldoPrePedido(prePedido, empenhoDialogOpen ?? undefined) : 0;
                })()}
              </div>
            )}
            <div className="space-y-2">
              <Label>Numero do Empenho</Label>
              <Input value={empenhoForm.numeroEmpenho} onChange={(e) => setEmpenhoForm((current) => ({ ...current, numeroEmpenho: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data do Empenho</Label>
              <Input type="date" value={empenhoForm.dataEmpenho} onChange={(e) => setEmpenhoForm((current) => ({ ...current, dataEmpenho: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Quantidade Empenhada</Label>
              <Input value={empenhoForm.quantidadeEmpenhada} onChange={(e) => setEmpenhoForm((current) => ({ ...current, quantidadeEmpenhada: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Valor do Empenho</Label>
              <Input value={empenhoForm.valorEmpenho} onChange={(e) => setEmpenhoForm((current) => ({ ...current, valorEmpenho: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleCreateEmpenho} disabled={createEmpenho.isPending}>
              {createEmpenho.isPending ? "Salvando..." : "Salvar Empenho"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(afDialogOpen)} onOpenChange={(open) => !open && setAfDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar AF da ARP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data do Pedido</Label>
              <Input type="date" value={afForm.dataPedidoAf} onChange={(e) => setAfForm((current) => ({ ...current, dataPedidoAf: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Quantidade da AF</Label>
              <Input value={afForm.quantidadeAf} onChange={(e) => setAfForm((current) => ({ ...current, quantidadeAf: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Valor da AF</Label>
              <Input value={afForm.valorAf} onChange={(e) => setAfForm((current) => ({ ...current, valorAf: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data Estimada de Entrega</Label>
              <Input type="date" value={afForm.dataEstimadaEntrega} onChange={(e) => setAfForm((current) => ({ ...current, dataEstimadaEntrega: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleCreateAf} disabled={createAf.isPending}>
              {createAf.isPending ? "Salvando..." : "Salvar AF"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(notaDialogOpen)} onOpenChange={(open) => !open && setNotaDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nota Fiscal da ARP</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Numero da Nota</Label>
              <Input value={notaForm.numeroNota} onChange={(e) => setNotaForm((current) => ({ ...current, numeroNota: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Quantidade da Nota</Label>
              <Input value={notaForm.quantidadeNota} onChange={(e) => setNotaForm((current) => ({ ...current, quantidadeNota: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Valor da Nota</Label>
              <Input value={notaForm.valorNota} onChange={(e) => setNotaForm((current) => ({ ...current, valorNota: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Data da Nota</Label>
              <Input type="date" value={notaForm.dataNota} onChange={(e) => setNotaForm((current) => ({ ...current, dataNota: e.target.value }))} />
            </div>
            <Button className="w-full" onClick={handleCreateNota} disabled={createNotaFiscal.isPending}>
              {createNotaFiscal.isPending ? "Salvando..." : "Salvar Nota Fiscal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(enviarPagamentoDialogOpen)} onOpenChange={(open) => !open && setEnviarPagamentoDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Nota para Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Numero do Processo</Label>
              <Input
                value={enviarPagamentoForm.numeroProcessoPagamento}
                onChange={(e) => setEnviarPagamentoForm((current) => ({ ...current, numeroProcessoPagamento: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Data do Envio</Label>
              <Input
                type="date"
                value={enviarPagamentoForm.dataEnvioPagamento}
                onChange={(e) => setEnviarPagamentoForm((current) => ({ ...current, dataEnvioPagamento: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleEnviarPagamento} disabled={sendAtaNotaFiscalToPayment.isPending}>
              {sendAtaNotaFiscalToPayment.isPending ? "Salvando..." : "Enviar para Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(registrarPagamentoDialogOpen)} onOpenChange={(open) => !open && setRegistrarPagamentoDialogOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input
                type="date"
                value={registrarPagamentoForm.dataPagamento}
                onChange={(e) => setRegistrarPagamentoForm((current) => ({ ...current, dataPagamento: e.target.value }))}
              />
            </div>
            <Button className="w-full" onClick={handleRegistrarPagamento} disabled={registerAtaNotaFiscalPayment.isPending}>
              {registerAtaNotaFiscalPayment.isPending ? "Salvando..." : "Registrar Pagamento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
