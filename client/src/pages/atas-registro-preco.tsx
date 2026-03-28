import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Redirect } from "wouter";
import {
  useAtasRegistroPreco,
  useCreateAtaItem,
  useCreateAtaRegistroPreco,
  useDeleteAtaItem,
  useDeleteAtaRegistroPreco,
  useImportAtaItems,
  useSaveAtaCotacoes,
  useSaveAtaQuantidades,
  useSaveAtaResultados,
  useUpdateAtaItem,
  useUpdateAtaRegistroPreco,
} from "@/hooks/use-atas-registro-preco";
import { useProcessos } from "@/hooks/use-processos";
import { useEntes } from "@/hooks/use-entes";
import { useFornecedores } from "@/hooks/use-fornecedores";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, parseNumberString } from "@/lib/formatters";
import { Download, Edit2, FileSpreadsheet, Package, Plus, Scale, Trash2, Users } from "lucide-react";
import type { AtaItemWithRelations, AtaRegistroPrecoWithRelations, InsertAtaItem } from "@shared/schema";

const defaultAtaForm = {
  numeroAta: "",
  processoDigitalId: "",
  objeto: "",
  vigenciaInicial: "",
  vigenciaFinal: "",
  status: "planejamento" as "planejamento" | "cotacao" | "licitada" | "vigente" | "encerrada",
  participanteEnteIds: [] as string[],
  fornecedorIds: [] as string[],
};

const defaultItemForm: InsertAtaItem = {
  codigoInterno: "",
  descricao: "",
  unidadeMedida: "",
};

function getItemQuantidadeTotal(item: AtaItemWithRelations) {
  return item.quantidades.reduce((sum, entry) => sum + parseNumberString(entry.quantidade), 0);
}

function getItemValorCotadoTotal(item: AtaItemWithRelations) {
  const unitario = item.cotacao ? parseNumberString(item.cotacao.valorUnitarioCotado) : 0;
  return unitario * getItemQuantidadeTotal(item);
}

function getItemValorLicitadoTotal(item: AtaItemWithRelations) {
  if (!item.resultado || item.resultado.itemFracassado || item.resultado.valorUnitarioLicitado == null) return 0;
  return parseNumberString(item.resultado.valorUnitarioLicitado) * getItemQuantidadeTotal(item);
}

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

export default function AtasRegistroPrecoPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: atas = [], isLoading } = useAtasRegistroPreco();
  const { data: processos = [] } = useProcessos();
  const { data: entes = [] } = useEntes();
  const { data: fornecedores = [] } = useFornecedores();
  const createAta = useCreateAtaRegistroPreco();
  const updateAta = useUpdateAtaRegistroPreco();
  const deleteAta = useDeleteAtaRegistroPreco();
  const createItem = useCreateAtaItem();
  const updateItem = useUpdateAtaItem();
  const deleteItem = useDeleteAtaItem();
  const importItems = useImportAtaItems();
  const saveQuantidades = useSaveAtaQuantidades();
  const saveCotacoes = useSaveAtaCotacoes();
  const saveResultados = useSaveAtaResultados();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [ataDialogOpen, setAtaDialogOpen] = useState(false);
  const [editingAta, setEditingAta] = useState<AtaRegistroPrecoWithRelations | null>(null);
  const [ataForm, setAtaForm] = useState(defaultAtaForm);

  const [itemsAta, setItemsAta] = useState<AtaRegistroPrecoWithRelations | null>(null);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AtaItemWithRelations | null>(null);
  const [itemForm, setItemForm] = useState(defaultItemForm);

  const [quantidadesAta, setQuantidadesAta] = useState<AtaRegistroPrecoWithRelations | null>(null);
  const [quantidadesForm, setQuantidadesForm] = useState<Record<string, string>>({});

  const [cotacoesAta, setCotacoesAta] = useState<AtaRegistroPrecoWithRelations | null>(null);
  const [cotacoesForm, setCotacoesForm] = useState<Record<string, string>>({});

  const [resultadosAta, setResultadosAta] = useState<AtaRegistroPrecoWithRelations | null>(null);
  const [resultadosForm, setResultadosForm] = useState<Record<string, { valor: string; fracassado: boolean; fornecedorId: string }>>({});

  const sortedAtas = useMemo(() => [...atas].sort((a, b) => a.numeroAta.localeCompare(b.numeroAta)), [atas]);
  const canAccessAtaModule = useMemo(() => {
    const normalizeEnteName = (value: string | null | undefined) =>
      (value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (user?.role === "admin") return true;
    if (!user?.canAccessAtaModule) return false;
    return entes.some((ente) => {
      if (!(user?.accessibleEnteIds ?? []).includes(ente.id)) return false;
      const nome = normalizeEnteName(ente.nome);
      const sigla = normalizeEnteName(ente.sigla);
      return nome.includes("fazenda") || sigla.includes("fazenda") || sigla === "sefaz";
    });
  }, [entes, user?.accessibleEnteIds, user?.canAccessAtaModule, user?.role]);

  const resetAtaForm = () => {
    setEditingAta(null);
    setAtaForm(defaultAtaForm);
  };

  const openEditAta = (ata: AtaRegistroPrecoWithRelations) => {
    setEditingAta(ata);
    setAtaForm({
      numeroAta: ata.numeroAta,
      processoDigitalId: ata.processoDigitalId,
      objeto: ata.objeto,
      vigenciaInicial: ata.vigenciaInicial,
      vigenciaFinal: ata.vigenciaFinal,
      status: ata.status as typeof defaultAtaForm.status,
      participanteEnteIds: ata.participantes.map((participante) => participante.enteId),
      fornecedorIds: ata.fornecedores.map((fornecedor) => fornecedor.fornecedorId),
    });
    setAtaDialogOpen(true);
  };

  const toggleParticipante = (enteId: string, checked: boolean) => {
    setAtaForm((current) => ({
      ...current,
      participanteEnteIds: checked
        ? [...current.participanteEnteIds, enteId]
        : current.participanteEnteIds.filter((id) => id !== enteId),
    }));
  };

  const addParticipanteSlot = () => {
    setAtaForm((current) => ({
      ...current,
      participanteEnteIds: [...current.participanteEnteIds, ""],
    }));
  };

  const updateParticipanteSlot = (index: number, enteId: string) => {
    setAtaForm((current) => ({
      ...current,
      participanteEnteIds: current.participanteEnteIds.map((currentId, currentIndex) =>
        currentIndex === index ? enteId : currentId,
      ),
    }));
  };

  const removeParticipanteSlot = (index: number) => {
    setAtaForm((current) => ({
      ...current,
      participanteEnteIds: current.participanteEnteIds.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const addFornecedorSlot = () => {
    setAtaForm((current) => ({
      ...current,
      fornecedorIds: [...current.fornecedorIds, ""],
    }));
  };

  const updateFornecedorSlot = (index: number, fornecedorId: string) => {
    setAtaForm((current) => ({
      ...current,
      fornecedorIds: current.fornecedorIds.map((currentId, currentIndex) =>
        currentIndex === index ? fornecedorId : currentId,
      ),
    }));
  };

  const removeFornecedorSlot = (index: number) => {
    setAtaForm((current) => ({
      ...current,
      fornecedorIds: current.fornecedorIds.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleAtaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ataPayload = {
      ...ataForm,
      participanteEnteIds: ataForm.participanteEnteIds.filter((id, index, array) => id && array.indexOf(id) === index),
      fornecedorIds: ataForm.fornecedorIds.filter((id, index, array) => id && array.indexOf(id) === index),
    };

    if (editingAta) {
      updateAta.mutate(
        { id: editingAta.id, data: ataPayload },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            setAtaDialogOpen(false);
            resetAtaForm();
          },
          onError: (error) => {
            toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao atualizar ata" });
          },
        },
      );
      return;
    }

    createAta.mutate(ataPayload, {
      onSuccess: () => {
        toast({ title: "Cadastro realizado com sucesso!" });
        setAtaDialogOpen(false);
        resetAtaForm();
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar ata" });
      },
    });
  };

  const openItemForm = (ata: AtaRegistroPrecoWithRelations, item?: AtaItemWithRelations) => {
    setItemsAta(ata);
    setEditingItem(item ?? null);
    setItemForm(item ? {
      codigoInterno: item.codigoInterno,
      descricao: item.descricao,
      unidadeMedida: item.unidadeMedida,
    } : defaultItemForm);
    setItemFormOpen(true);
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemsAta) return;
    if (editingItem) {
      updateItem.mutate(
        { itemId: editingItem.id, data: itemForm },
        {
          onSuccess: () => {
            toast({ title: "Registro atualizado com sucesso!" });
            setItemFormOpen(false);
            setEditingItem(null);
            setItemForm(defaultItemForm);
          },
          onError: (error) => {
            toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao atualizar item" });
          },
        },
      );
      return;
    }

    createItem.mutate(
      { ataId: itemsAta.id, data: itemForm },
      {
        onSuccess: () => {
          toast({ title: "Cadastro realizado com sucesso!" });
          setItemFormOpen(false);
          setItemForm(defaultItemForm);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao criar item" });
        },
      },
    );
  };

  const exportTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { codigo_interno: "001", descricao: "Item de exemplo", unidade_medida: "UN" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Itens");
    XLSX.writeFile(wb, "modelo_itens_ata_registro_preco.xlsx");
  };

  const handleImportItems = async (file: File) => {
    if (!itemsAta) return;
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("A planilha nao possui abas");
      }
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: "" });
      const items = rows.map((row, index) => {
        const normalized = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [normalizeHeader(key), typeof value === "string" ? value.trim() : String(value ?? "").trim()]),
        );
        const codigoInterno = normalized.codigo_interno || normalized.codigo || normalized.item;
        const descricao = normalized.descricao;
        const unidadeMedida = normalized.unidade_medida || normalized.unidade || normalized.um;
        if (!codigoInterno || !descricao || !unidadeMedida) {
          throw new Error(`Linha ${index + 2}: preencha codigo_interno, descricao e unidade_medida`);
        }
        return { codigoInterno, descricao, unidadeMedida };
      });

      importItems.mutate(
        { ataId: itemsAta.id, items },
        {
          onSuccess: () => {
            toast({ title: "Cadastro realizado com sucesso!", description: "Itens importados com sucesso." });
          },
          onError: (error) => {
            toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao importar itens" });
          },
        },
      );
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Falha ao ler a planilha" });
    }
  };

  const openQuantidades = (ata: AtaRegistroPrecoWithRelations) => {
    const form: Record<string, string> = {};
    ata.itens.forEach((item) => {
      item.quantidades.forEach((quantidade) => {
        form[`${item.id}:${quantidade.enteId}`] = String(quantidade.quantidade);
      });
    });
    setQuantidadesForm(form);
    setQuantidadesAta(ata);
  };

  const openCotacoes = (ata: AtaRegistroPrecoWithRelations) => {
    const form: Record<string, string> = {};
    ata.itens.forEach((item) => {
      form[item.id] = item.cotacao?.valorUnitarioCotado != null ? String(item.cotacao.valorUnitarioCotado) : "";
    });
    setCotacoesForm(form);
    setCotacoesAta(ata);
  };

  const openResultados = (ata: AtaRegistroPrecoWithRelations) => {
    const form: Record<string, { valor: string; fracassado: boolean; fornecedorId: string }> = {};
    ata.itens.forEach((item) => {
      form[item.id] = {
        valor: item.resultado?.valorUnitarioLicitado != null ? String(item.resultado.valorUnitarioLicitado) : "",
        fracassado: item.resultado?.itemFracassado ?? false,
        fornecedorId: item.resultado?.fornecedorId ?? "",
      };
    });
    setResultadosForm(form);
    setResultadosAta(ata);
  };

  const handleSaveQuantidades = () => {
    if (!quantidadesAta) return;
    const quantidades = quantidadesAta.itens.flatMap((item) =>
      quantidadesAta.participantes.map((participante) => ({
        itemId: item.id,
        enteId: participante.enteId,
        quantidade: quantidadesForm[`${item.id}:${participante.enteId}`] ?? "0",
      })),
    );

    saveQuantidades.mutate(
      { ataId: quantidadesAta.id, quantidades },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          setQuantidadesAta(null);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar quantidades" });
        },
      },
    );
  };

  const handleSaveCotacoes = () => {
    if (!cotacoesAta) return;
    const cotacoes = cotacoesAta.itens.map((item) => ({
      itemId: item.id,
      valorUnitarioCotado: cotacoesForm[item.id] ?? "0",
    }));

    saveCotacoes.mutate(
      { ataId: cotacoesAta.id, cotacoes },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          setCotacoesAta(null);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar cotacoes" });
        },
      },
    );
  };

  const handleSaveResultados = () => {
    if (!resultadosAta) return;
    const resultados = resultadosAta.itens.map((item) => ({
      itemId: item.id,
      fornecedorId: resultadosForm[item.id]?.fornecedorId || null,
      valorUnitarioLicitado: resultadosForm[item.id]?.valor || null,
      itemFracassado: resultadosForm[item.id]?.fracassado ?? false,
    }));

    saveResultados.mutate(
      { ataId: resultadosAta.id, resultados },
      {
        onSuccess: () => {
          toast({ title: "Registro atualizado com sucesso!" });
          setResultadosAta(null);
        },
        onError: (error) => {
          toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao salvar resultados" });
        },
      },
    );
  };

  if (!authLoading && !canAccessAtaModule) {
    return <Redirect to="/" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atas de Registro de Preco</h1>
          <p className="text-muted-foreground mt-1">Cadastre o processo, participantes e monte a formacao da ARP com itens, quantidades, cotacao e resultado.</p>
        </div>
        <Dialog open={ataDialogOpen} onOpenChange={(open) => { setAtaDialogOpen(open); if (!open) resetAtaForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2" size={18} /> Nova Ata</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAta ? "Editar Ata de Registro de Preco" : "Cadastrar Ata de Registro de Preco"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAtaSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numero da Ata</Label>
                  <Input value={ataForm.numeroAta} onChange={(e) => setAtaForm((current) => ({ ...current, numeroAta: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Processo Digital</Label>
                  <Select
                    value={ataForm.processoDigitalId}
                    onValueChange={(value) => {
                      const processo = processos.find((entry) => entry.id === value);
                      setAtaForm((current) => ({
                        ...current,
                        processoDigitalId: value,
                        objeto: current.objeto || processo?.objetoResumido || "",
                      }));
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione um processo" /></SelectTrigger>
                    <SelectContent>
                      {processos.map((processo) => (
                        <SelectItem key={processo.id} value={processo.id}>
                          {processo.numeroProcessoDigital}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vigencia Inicial</Label>
                  <Input type="date" value={ataForm.vigenciaInicial} onChange={(e) => setAtaForm((current) => ({ ...current, vigenciaInicial: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Vigencia Final</Label>
                  <Input type="date" value={ataForm.vigenciaFinal} onChange={(e) => setAtaForm((current) => ({ ...current, vigenciaFinal: e.target.value }))} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Status</Label>
                  <Select value={ataForm.status} onValueChange={(value: typeof ataForm.status) => setAtaForm((current) => ({ ...current, status: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planejamento">Planejamento</SelectItem>
                      <SelectItem value="cotacao">Cotacao</SelectItem>
                      <SelectItem value="licitada">Licitada</SelectItem>
                      <SelectItem value="vigente">Vigente</SelectItem>
                      <SelectItem value="encerrada">Encerrada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Objeto</Label>
                  <Textarea value={ataForm.objeto} onChange={(e) => setAtaForm((current) => ({ ...current, objeto: e.target.value }))} rows={3} required />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Secretarias Participantes</Label>
                <div className="space-y-3 rounded-lg border p-4">
                  {entes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum ente cadastrado.</p>
                  ) : (
                    <>
                      {ataForm.participanteEnteIds.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum participante vinculado ainda. Adicione os entes participantes desta ata.
                        </p>
                      ) : (
                        ataForm.participanteEnteIds.map((enteId, index) => {
                          const selectedIds = ataForm.participanteEnteIds.filter((id, currentIndex) => id && currentIndex !== index);
                          return (
                            <div key={`${enteId || "novo"}-${index}`} className="flex items-center gap-2">
                              <Select value={enteId || "none"} onValueChange={(value) => updateParticipanteSlot(index, value === "none" ? "" : value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a secretaria participante" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Selecione a secretaria participante</SelectItem>
                                  {entes
                                    .filter((ente) => ente.id === enteId || !selectedIds.includes(ente.id))
                                    .map((ente) => (
                                      <SelectItem key={ente.id} value={ente.id}>
                                        {ente.sigla} - {ente.nome}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button type="button" variant="outline" size="icon" onClick={() => removeParticipanteSlot(index)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          );
                        })
                      )}
                      <Button type="button" variant="outline" onClick={addParticipanteSlot}>
                        <Plus className="mr-2" size={16} /> Adicionar participante
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Fornecedores da Ata (Opcional)</Label>
                <div className="space-y-3 rounded-lg border p-4">
                  {fornecedores.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum fornecedor cadastrado.</p>
                  ) : (
                    <>
                      {ataForm.fornecedorIds.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum fornecedor vinculado ainda. Adicione apenas os fornecedores participantes desta ata.
                        </p>
                      ) : (
                        ataForm.fornecedorIds.map((fornecedorId, index) => {
                          const selectedIds = ataForm.fornecedorIds.filter((id, currentIndex) => id && currentIndex !== index);
                          return (
                            <div key={`${fornecedorId || "novo"}-${index}`} className="flex items-center gap-2">
                              <Select value={fornecedorId || "none"} onValueChange={(value) => updateFornecedorSlot(index, value === "none" ? "" : value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o fornecedor" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">Selecione o fornecedor</SelectItem>
                                  {fornecedores
                                    .filter((fornecedor) => fornecedor.id === fornecedorId || !selectedIds.includes(fornecedor.id))
                                    .map((fornecedor) => (
                                      <SelectItem key={fornecedor.id} value={fornecedor.id}>
                                        {fornecedor.nome}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <Button type="button" variant="outline" size="icon" onClick={() => removeFornecedorSlot(index)}>
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          );
                        })
                      )}
                      <Button type="button" variant="outline" onClick={addFornecedorSlot}>
                        <Plus className="mr-2" size={16} /> Adicionar fornecedor
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  O fornecedor e opcional no planejamento. Ele so sera exigido ao gerar o contrato da ARP.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={createAta.isPending || updateAta.isPending}>
                {createAta.isPending || updateAta.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Carregando atas...</CardContent></Card>
      ) : sortedAtas.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma ata cadastrada.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {sortedAtas.map((ata) => {
            const totalCotado = ata.itens.reduce((sum, item) => sum + getItemValorCotadoTotal(item), 0);
            const totalLicitado = ata.itens.reduce((sum, item) => sum + getItemValorLicitadoTotal(item), 0);

            return (
              <Card key={ata.id} className="border-border/50 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{ata.numeroAta}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{ata.status}</Badge>
                      <span>{ata.processoDigital.numeroProcessoDigital}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{ata.objeto}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditAta(ata)}><Edit2 size={16} /></Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!window.confirm(`Deseja realmente excluir a ata ${ata.numeroAta}?`)) return;
                        deleteAta.mutate(ata.id, {
                          onSuccess: () => toast({ title: "Registro excluido com sucesso!" }),
                          onError: (error) => toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao excluir ata" }),
                        });
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Participantes</p>
                      <p className="font-semibold">{ata.participantes.length}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Itens</p>
                      <p className="font-semibold">{ata.itens.length}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Previsto Cotado</p>
                      <p className="font-semibold">{formatCurrency(totalCotado)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground">Previsto Licitado</p>
                      <p className="font-semibold">{formatCurrency(totalLicitado)}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {ata.participantes.map((participante) => (
                      <Badge key={participante.id} variant="outline">{participante.ente.sigla}</Badge>
                    ))}
                  </div>

                  {ata.fornecedores.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {ata.fornecedores.map((fornecedor) => (
                        <Badge key={fornecedor.id} variant="secondary">{fornecedor.fornecedor.nome}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button variant="outline" onClick={() => setItemsAta(ata)}><Package className="mr-2" size={16} /> Itens</Button>
                    <Button variant="outline" onClick={() => openQuantidades(ata)}><Users className="mr-2" size={16} /> Quantidades</Button>
                    <Button variant="outline" onClick={() => openCotacoes(ata)}><Scale className="mr-2" size={16} /> Cotacao</Button>
                    <Button variant="outline" onClick={() => openResultados(ata)}><FileSpreadsheet className="mr-2" size={16} /> Resultado</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!itemsAta} onOpenChange={(open) => { if (!open) { setItemsAta(null); setItemFormOpen(false); setEditingItem(null); setItemForm(defaultItemForm); } }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Itens da Ata {itemsAta?.numeroAta}</DialogTitle></DialogHeader>
          {itemsAta && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={exportTemplate}><Download className="mr-2" size={16} /> Baixar Modelo</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}><FileSpreadsheet className="mr-2" size={16} /> Importar Excel</Button>
                <Button onClick={() => openItemForm(itemsAta)}><Plus className="mr-2" size={16} /> Novo Item</Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleImportItems(file);
                    }
                    e.currentTarget.value = "";
                  }}
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>UM</TableHead>
                    <TableHead>Qtd. Total</TableHead>
                    <TableHead>Cotado</TableHead>
                    <TableHead>Fornecedor Vencedor</TableHead>
                    <TableHead>Licitado</TableHead>
                    <TableHead className="text-right">Acao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsAta.itens.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum item cadastrado.</TableCell></TableRow>
                  ) : (
                    itemsAta.itens.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.codigoInterno}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>{item.unidadeMedida}</TableCell>
                        <TableCell>{getItemQuantidadeTotal(item)}</TableCell>
                        <TableCell>{item.cotacao ? formatCurrency(item.cotacao.valorUnitarioCotado) : "-"}</TableCell>
                        <TableCell>{item.resultado?.fornecedor?.nome ?? "-"}</TableCell>
                        <TableCell>{item.resultado?.itemFracassado ? "Fracassado" : item.resultado?.valorUnitarioLicitado ? formatCurrency(item.resultado.valorUnitarioLicitado) : "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openItemForm(itemsAta, item)}><Edit2 size={16} /></Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (!window.confirm(`Deseja realmente excluir o item ${item.codigoInterno}?`)) return;
                                deleteItem.mutate(item.id, {
                                  onSuccess: () => toast({ title: "Registro excluido com sucesso!" }),
                                  onError: (error) => toast({ variant: "destructive", title: "Erro", description: error instanceof Error ? error.message : "Erro ao excluir item" }),
                                });
                              }}
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={itemFormOpen} onOpenChange={(open) => { setItemFormOpen(open); if (!open) { setEditingItem(null); setItemForm(defaultItemForm); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingItem ? "Editar Item" : "Cadastrar Item"}</DialogTitle></DialogHeader>
          <form onSubmit={handleItemSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Codigo Interno</Label>
              <Input value={itemForm.codigoInterno} onChange={(e) => setItemForm((current) => ({ ...current, codigoInterno: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Descricao</Label>
              <Textarea value={itemForm.descricao} onChange={(e) => setItemForm((current) => ({ ...current, descricao: e.target.value }))} rows={3} required />
            </div>
            <div className="space-y-2">
              <Label>Unidade de Medida</Label>
              <Input value={itemForm.unidadeMedida} onChange={(e) => setItemForm((current) => ({ ...current, unidadeMedida: e.target.value }))} required />
            </div>
            <Button type="submit" className="w-full" disabled={createItem.isPending || updateItem.isPending}>
              {createItem.isPending || updateItem.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!quantidadesAta} onOpenChange={(open) => { if (!open) setQuantidadesAta(null); }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Quantidades por Participante</DialogTitle></DialogHeader>
          {quantidadesAta && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Descricao</TableHead>
                    {quantidadesAta.participantes.map((participante) => (
                      <TableHead key={participante.id}>{participante.ente.sigla}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quantidadesAta.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.codigoInterno}</TableCell>
                      <TableCell>{item.descricao}</TableCell>
                      {quantidadesAta.participantes.map((participante) => (
                        <TableCell key={participante.id}>
                          <Input
                            value={quantidadesForm[`${item.id}:${participante.enteId}`] ?? ""}
                            onChange={(e) => setQuantidadesForm((current) => ({ ...current, [`${item.id}:${participante.enteId}`]: e.target.value }))}
                            placeholder="0,00"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="w-full" onClick={handleSaveQuantidades} disabled={saveQuantidades.isPending}>
                {saveQuantidades.isPending ? "Salvando..." : "Salvar Quantidades"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!cotacoesAta} onOpenChange={(open) => { if (!open) setCotacoesAta(null); }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Cotacao dos Itens</DialogTitle></DialogHeader>
          {cotacoesAta && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Qtd. Total</TableHead>
                    <TableHead>Valor Unitario</TableHead>
                    <TableHead>Total Cotado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotacoesAta.itens.map((item) => {
                    const quantidadeTotal = getItemQuantidadeTotal(item);
                    const valorUnitario = parseNumberString(cotacoesForm[item.id] || "0");
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.codigoInterno}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>{quantidadeTotal}</TableCell>
                        <TableCell>
                          <Input
                            value={cotacoesForm[item.id] ?? ""}
                            onChange={(e) => setCotacoesForm((current) => ({ ...current, [item.id]: e.target.value }))}
                            placeholder="0,00"
                          />
                        </TableCell>
                        <TableCell>{formatCurrency(valorUnitario * quantidadeTotal)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Button className="w-full" onClick={handleSaveCotacoes} disabled={saveCotacoes.isPending}>
                {saveCotacoes.isPending ? "Salvando..." : "Salvar Cotacoes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!resultadosAta} onOpenChange={(open) => { if (!open) setResultadosAta(null); }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Resultado Licitado</DialogTitle></DialogHeader>
          {resultadosAta && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codigo</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead>Qtd. Total</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Valor Cotado</TableHead>
                    <TableHead>Valor Licitado</TableHead>
                    <TableHead>Fracassado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultadosAta.itens.map((item) => {
                    const state = resultadosForm[item.id] ?? { valor: "", fracassado: false, fornecedorId: "" };
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.codigoInterno}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>{getItemQuantidadeTotal(item)}</TableCell>
                        <TableCell>
                          <Select
                            value={state.fornecedorId || "none"}
                            onValueChange={(value) => setResultadosForm((current) => ({ ...current, [item.id]: { ...state, fornecedorId: value === "none" ? "" : value } }))}
                            disabled={state.fracassado}
                          >
                            <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem fornecedor</SelectItem>
                              {resultadosAta.fornecedores.map((entry) => (
                                <SelectItem key={entry.fornecedorId} value={entry.fornecedorId}>{entry.fornecedor.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{item.cotacao ? formatCurrency(item.cotacao.valorUnitarioCotado) : "-"}</TableCell>
                        <TableCell>
                          <Input
                            value={state.valor}
                            onChange={(e) => setResultadosForm((current) => ({ ...current, [item.id]: { ...state, valor: e.target.value } }))}
                            placeholder="0,00"
                            disabled={state.fracassado}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={state.fracassado}
                              onCheckedChange={(checked) => setResultadosForm((current) => ({
                                ...current,
                                [item.id]: {
                                  valor: checked === true ? "" : state.valor,
                                  fracassado: checked === true,
                                  fornecedorId: checked === true ? "" : state.fornecedorId,
                                },
                              }))}
                            />
                            <span className="text-sm">Sim</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Button className="w-full" onClick={handleSaveResultados} disabled={saveResultados.isPending}>
                {saveResultados.isPending ? "Salvando..." : "Salvar Resultados"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
