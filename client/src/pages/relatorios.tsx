import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useContratos } from "@/hooks/use-contratos";
import { useEntes } from "@/hooks/use-entes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportRowsToExcel, exportRowsToPdf, type ReportColumn } from "@/lib/report-export";
import { formatCurrency, formatDate, parseNumberString } from "@/lib/formatters";
import { FileSpreadsheet, FileText } from "lucide-react";
import type { ContratoWithRelations } from "@shared/schema";

type Row = Record<string, string | number | null | undefined>;
type ReportDefinition = {
  id: string;
  label: string;
  columns: ReportColumn[];
  rows: Row[];
};

function getEmpenhoSaldo(empenho: ContratoWithRelations["empenhos"][number]) {
  return parseNumberString(empenho.valorEmpenho) - parseNumberString(empenho.valorAnulado) - empenho.afs.reduce((acc, af) => acc + parseNumberString(af.valorAf), 0);
}

export default function Relatorios() {
  const { user } = useAuth();
  const { data: contratos = [], isLoading } = useContratos();
  const { data: entes = [] } = useEntes();

  const [reportType, setReportType] = useState("contratos_detalhado");
  const [enteFilter, setEnteFilter] = useState("all");
  const [fornecedorFilter, setFornecedorFilter] = useState("all");
  const [processoFilter, setProcessoFilter] = useState("all");
  const [contratoFilter, setContratoFilter] = useState("all");
  const [statusContratoFilter, setStatusContratoFilter] = useState("all");
  const [fonteFilter, setFonteFilter] = useState("all");
  const [fichaFilter, setFichaFilter] = useState("all");

  const accessibleEnteIds = user?.accessibleEnteIds ?? (user?.enteId ? [user.enteId] : []);
  const showEnteFilter = user?.role === "admin" || accessibleEnteIds.length > 1;

  const filteredContratos = useMemo(() => {
    return contratos.filter((contrato) => {
      if (enteFilter !== "all" && (contrato.enteId ?? contrato.processoDigital.enteId) !== enteFilter) return false;
      if (fornecedorFilter !== "all" && contrato.fornecedorId !== fornecedorFilter) return false;
      if (processoFilter !== "all" && contrato.processoDigitalId !== processoFilter) return false;
      if (contratoFilter !== "all" && contrato.id !== contratoFilter) return false;
      if (statusContratoFilter !== "all" && contrato.status !== statusContratoFilter) return false;
      if (fonteFilter !== "all" && !contrato.empenhos.some((empenho) => empenho.fonteRecursoId === fonteFilter)) return false;
      if (fichaFilter !== "all" && !contrato.empenhos.some((empenho) => empenho.fichaId === fichaFilter)) return false;
      return true;
    });
  }, [contratos, contratoFilter, enteFilter, fichaFilter, fonteFilter, fornecedorFilter, processoFilter, showEnteFilter, statusContratoFilter]);

  const contratosOpcoes = filteredContratos.map((contrato) => ({ id: contrato.id, label: contrato.numeroContrato }));
  const fornecedoresOpcoes = Array.from(new Map(contratos.map((contrato) => [contrato.fornecedorId, { id: contrato.fornecedorId, label: contrato.fornecedor.nome }])).values());
  const processosOpcoes = Array.from(new Map(contratos.map((contrato) => [contrato.processoDigitalId, { id: contrato.processoDigitalId, label: contrato.processoDigital.numeroProcessoDigital }])).values());
  const fontesOpcoes = Array.from(new Map(
    contratos.flatMap((contrato) => contrato.empenhos.map((empenho) => [empenho.fonteRecursoId, { id: empenho.fonteRecursoId, label: `${empenho.fonteRecurso.codigo} - ${empenho.fonteRecurso.nome}` }]))
  ).values());
  const fichasOpcoes = Array.from(new Map(
    contratos.flatMap((contrato) => contrato.empenhos
      .filter((empenho) => fonteFilter === "all" || empenho.fonteRecursoId === fonteFilter)
      .map((empenho) => [empenho.fichaId, { id: empenho.fichaId, label: `${empenho.ficha.codigo} - ${empenho.ficha.classificacao}` }]))
  ).values());

  const report = useMemo<ReportDefinition>(() => {
    const baseColumns = {
      secretaria: { key: "secretaria", label: "Secretaria" },
      processo: { key: "processo", label: "Processo Digital" },
      contrato: { key: "contrato", label: "Contrato" },
      fornecedor: { key: "fornecedor", label: "Fornecedor" },
      fonte: { key: "fonte", label: "Fonte de Recurso" },
      ficha: { key: "ficha", label: "Ficha" },
    };

    const defs: Record<string, ReportDefinition> = {
      contratos_detalhado: {
        id: "contratos_detalhado",
        label: "Contratos Detalhados",
        columns: [
          baseColumns.secretaria,
          baseColumns.processo,
          baseColumns.contrato,
          baseColumns.fornecedor,
          { key: "status", label: "Status" },
          { key: "valor", label: "Valor" },
          { key: "vigencia", label: "Vigencia" },
        ],
        rows: filteredContratos.map((contrato) => ({
          secretaria: contrato.ente?.nome ?? contrato.processoDigital.ente?.nome ?? "-",
          processo: contrato.processoDigital.numeroProcessoDigital,
          contrato: contrato.numeroContrato,
          fornecedor: contrato.fornecedor.nome,
          status: contrato.status,
          valor: formatCurrency(contrato.valorContrato),
          vigencia: `${formatDate(contrato.vigenciaInicial)} ate ${formatDate(contrato.vigenciaFinal)}`,
        })),
      },
      empenhos_detalhado: {
        id: "empenhos_detalhado",
        label: "Empenhos Detalhados",
        columns: [
          baseColumns.secretaria,
          baseColumns.contrato,
          baseColumns.fornecedor,
          baseColumns.fonte,
          baseColumns.ficha,
          { key: "data", label: "Data do Empenho" },
          { key: "valor", label: "Valor Liquido" },
          { key: "execucao", label: "Executado" },
          { key: "saldo", label: "Saldo" },
          { key: "status", label: "Status" },
        ],
        rows: filteredContratos.flatMap((contrato) =>
          contrato.empenhos
            .filter((empenho) => (fonteFilter === "all" || empenho.fonteRecursoId === fonteFilter) && (fichaFilter === "all" || empenho.fichaId === fichaFilter))
            .map((empenho) => ({
              secretaria: contrato.ente?.nome ?? contrato.processoDigital.ente?.nome ?? "-",
              contrato: contrato.numeroContrato,
              fornecedor: contrato.fornecedor.nome,
              fonte: `${empenho.fonteRecurso.codigo} - ${empenho.fonteRecurso.nome}`,
              ficha: `${empenho.ficha.codigo} - ${empenho.ficha.classificacao}`,
              data: formatDate(empenho.dataEmpenho),
              valor: formatCurrency(parseNumberString(empenho.valorEmpenho) - parseNumberString(empenho.valorAnulado)),
              execucao: formatCurrency(empenho.afs.reduce((acc, af) => acc + parseNumberString(af.valorAf), 0)),
              saldo: formatCurrency(getEmpenhoSaldo(empenho)),
              status: empenho.status,
            })),
        ),
      },
      afs_detalhado: {
        id: "afs_detalhado",
        label: "AFs Detalhadas",
        columns: [
          baseColumns.secretaria,
          baseColumns.contrato,
          baseColumns.fornecedor,
          baseColumns.fonte,
          baseColumns.ficha,
          { key: "dataPedido", label: "Data do Pedido" },
          { key: "valor", label: "Valor da AF" },
          { key: "status", label: "Status" },
        ],
        rows: filteredContratos.flatMap((contrato) =>
          contrato.empenhos
            .filter((empenho) => (fonteFilter === "all" || empenho.fonteRecursoId === fonteFilter) && (fichaFilter === "all" || empenho.fichaId === fichaFilter))
            .flatMap((empenho) =>
              empenho.afs.map((af) => ({
                secretaria: contrato.ente?.nome ?? contrato.processoDigital.ente?.nome ?? "-",
                contrato: contrato.numeroContrato,
                fornecedor: contrato.fornecedor.nome,
                fonte: `${empenho.fonteRecurso.codigo} - ${empenho.fonteRecurso.nome}`,
                ficha: `${empenho.ficha.codigo} - ${empenho.ficha.classificacao}`,
                dataPedido: formatDate(af.dataPedidoAf),
                valor: formatCurrency(af.valorAf),
                status: af.dataEntregaReal ? "Entregue" : "Pendente",
              })),
            ),
        ),
      },
      notas_detalhado: {
        id: "notas_detalhado",
        label: "Notas Fiscais",
        columns: [
          baseColumns.secretaria,
          baseColumns.contrato,
          baseColumns.fornecedor,
          { key: "nota", label: "Nota" },
          { key: "valor", label: "Valor" },
          { key: "status", label: "Status" },
          { key: "processoPagamento", label: "Proc. Pagamento" },
          { key: "dataPagamento", label: "Data de Pagamento" },
        ],
        rows: filteredContratos.flatMap((contrato) =>
          contrato.notasFiscais.map((nota) => ({
            secretaria: contrato.ente?.nome ?? contrato.processoDigital.ente?.nome ?? "-",
            contrato: contrato.numeroContrato,
            fornecedor: contrato.fornecedor.nome,
            nota: nota.numeroNota,
            valor: formatCurrency(nota.valorNota),
            status: nota.statusPagamento,
            processoPagamento: nota.numeroProcessoPagamento ?? "-",
            dataPagamento: nota.dataPagamento ? formatDate(nota.dataPagamento) : "-",
          })),
        ),
      },
      resumo_fornecedor: {
        id: "resumo_fornecedor",
        label: "Resumo por Fornecedor",
        columns: [{ key: "fornecedor", label: "Fornecedor" }, { key: "contratos", label: "Contratos" }, { key: "valor", label: "Valor Total" }],
        rows: Array.from(new Map(filteredContratos.map((contrato) => [contrato.fornecedorId, contrato])).keys()).map((fornecedorId) => {
          const rows = filteredContratos.filter((contrato) => contrato.fornecedorId === fornecedorId);
          return {
            fornecedor: rows[0]?.fornecedor.nome ?? "-",
            contratos: rows.length,
            valor: formatCurrency(rows.reduce((acc, contrato) => acc + parseNumberString(contrato.valorContrato), 0)),
          };
        }),
      },
      resumo_processo: {
        id: "resumo_processo",
        label: "Resumo por Processo",
        columns: [{ key: "processo", label: "Processo" }, { key: "contratos", label: "Contratos" }, { key: "valor", label: "Valor Total" }],
        rows: Array.from(new Map(filteredContratos.map((contrato) => [contrato.processoDigitalId, contrato])).keys()).map((processoId) => {
          const rows = filteredContratos.filter((contrato) => contrato.processoDigitalId === processoId);
          return {
            processo: rows[0]?.processoDigital.numeroProcessoDigital ?? "-",
            contratos: rows.length,
            valor: formatCurrency(rows.reduce((acc, contrato) => acc + parseNumberString(contrato.valorContrato), 0)),
          };
        }),
      },
      resumo_secretaria: {
        id: "resumo_secretaria",
        label: "Resumo por Secretaria",
        columns: [{ key: "secretaria", label: "Secretaria" }, { key: "contratos", label: "Contratos" }, { key: "valor", label: "Valor Total" }],
        rows: Array.from(new Map(filteredContratos.map((contrato) => [contrato.enteId ?? contrato.processoDigital.enteId ?? "sem", contrato])).keys()).map((enteId) => {
          const rows = filteredContratos.filter((contrato) => (contrato.enteId ?? contrato.processoDigital.enteId ?? "sem") === enteId);
          return {
            secretaria: rows[0]?.ente?.nome ?? rows[0]?.processoDigital.ente?.nome ?? "Sem secretaria",
            contratos: rows.length,
            valor: formatCurrency(rows.reduce((acc, contrato) => acc + parseNumberString(contrato.valorContrato), 0)),
          };
        }),
      },
      resumo_fonte: {
        id: "resumo_fonte",
        label: "Resumo por Fonte de Recurso",
        columns: [{ key: "fonte", label: "Fonte" }, { key: "valor", label: "Valor Empenhado" }, { key: "execucao", label: "Execucao" }],
        rows: Array.from(new Map(
          filteredContratos.flatMap((contrato) => contrato.empenhos
            .filter((empenho) => fonteFilter === "all" || empenho.fonteRecursoId === fonteFilter)
            .map((empenho) => [empenho.fonteRecursoId, empenho]))
        ).keys()).map((fonteId) => {
          const empenhos = filteredContratos.flatMap((contrato) => contrato.empenhos).filter((empenho) => empenho.fonteRecursoId === fonteId);
          return {
            fonte: `${empenhos[0]?.fonteRecurso.codigo ?? "-"} - ${empenhos[0]?.fonteRecurso.nome ?? "-"}`,
            valor: formatCurrency(empenhos.reduce((acc, empenho) => acc + parseNumberString(empenho.valorEmpenho) - parseNumberString(empenho.valorAnulado), 0)),
            execucao: formatCurrency(empenhos.reduce((acc, empenho) => acc + empenho.afs.reduce((afAcc, af) => afAcc + parseNumberString(af.valorAf), 0), 0)),
          };
        }),
      },
      resumo_ficha: {
        id: "resumo_ficha",
        label: "Resumo por Ficha",
        columns: [{ key: "ficha", label: "Ficha" }, { key: "valor", label: "Valor Empenhado" }, { key: "execucao", label: "Execucao" }],
        rows: Array.from(new Map(
          filteredContratos.flatMap((contrato) => contrato.empenhos
            .filter((empenho) => (fonteFilter === "all" || empenho.fonteRecursoId === fonteFilter) && (fichaFilter === "all" || empenho.fichaId === fichaFilter))
            .map((empenho) => [empenho.fichaId, empenho]))
        ).keys()).map((fichaId) => {
          const empenhos = filteredContratos.flatMap((contrato) => contrato.empenhos).filter((empenho) => empenho.fichaId === fichaId);
          return {
            ficha: `${empenhos[0]?.ficha.codigo ?? "-"} - ${empenhos[0]?.ficha.classificacao ?? "-"}`,
            valor: formatCurrency(empenhos.reduce((acc, empenho) => acc + parseNumberString(empenho.valorEmpenho) - parseNumberString(empenho.valorAnulado), 0)),
            execucao: formatCurrency(empenhos.reduce((acc, empenho) => acc + empenho.afs.reduce((afAcc, af) => afAcc + parseNumberString(af.valorAf), 0), 0)),
          };
        }),
      },
      cruzado_contrato_empenho_secretaria: {
        id: "cruzado_contrato_empenho_secretaria",
        label: "Contratos x Empenhos x Secretaria",
        columns: [
          baseColumns.secretaria,
          baseColumns.processo,
          baseColumns.contrato,
          baseColumns.fornecedor,
          baseColumns.fonte,
          baseColumns.ficha,
          { key: "empenhoData", label: "Data do Empenho" },
          { key: "valorEmpenhado", label: "Valor Empenhado" },
          { key: "valorExecutado", label: "Valor Executado" },
        ],
        rows: filteredContratos.flatMap((contrato) =>
          contrato.empenhos
            .filter((empenho) => (fonteFilter === "all" || empenho.fonteRecursoId === fonteFilter) && (fichaFilter === "all" || empenho.fichaId === fichaFilter))
            .map((empenho) => ({
              secretaria: contrato.ente?.nome ?? contrato.processoDigital.ente?.nome ?? "-",
              processo: contrato.processoDigital.numeroProcessoDigital,
              contrato: contrato.numeroContrato,
              fornecedor: contrato.fornecedor.nome,
              fonte: `${empenho.fonteRecurso.codigo} - ${empenho.fonteRecurso.nome}`,
              ficha: `${empenho.ficha.codigo} - ${empenho.ficha.classificacao}`,
              empenhoData: formatDate(empenho.dataEmpenho),
              valorEmpenhado: formatCurrency(parseNumberString(empenho.valorEmpenho) - parseNumberString(empenho.valorAnulado)),
              valorExecutado: formatCurrency(empenho.afs.reduce((acc, af) => acc + parseNumberString(af.valorAf), 0)),
            })),
        ),
      },
    };

    return defs[reportType];
  }, [filteredContratos, fichaFilter, fonteFilter, reportType]);

  const previewRows = report.rows.slice(0, 200);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatorios</h1>
          <p className="text-muted-foreground mt-1">Cruze os dados operacionais e exporte a visao atual em Excel ou PDF.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportRowsToExcel(report.id, report.columns, report.rows)}>
            <FileSpreadsheet className="mr-2" size={16} /> Excel
          </Button>
          <Button onClick={() => exportRowsToPdf(report.label, report.id, report.columns, report.rows)}>
            <FileText className="mr-2" size={16} /> PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">Relatorio</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="contratos_detalhado">Contratos Detalhados</SelectItem>
                <SelectItem value="empenhos_detalhado">Empenhos Detalhados</SelectItem>
                <SelectItem value="afs_detalhado">AFs Detalhadas</SelectItem>
                <SelectItem value="notas_detalhado">Notas Fiscais</SelectItem>
                <SelectItem value="resumo_fornecedor">Resumo por Fornecedor</SelectItem>
                <SelectItem value="resumo_processo">Resumo por Processo</SelectItem>
                <SelectItem value="resumo_secretaria">Resumo por Secretaria</SelectItem>
                <SelectItem value="resumo_fonte">Resumo por Fonte</SelectItem>
                <SelectItem value="resumo_ficha">Resumo por Ficha</SelectItem>
                <SelectItem value="cruzado_contrato_empenho_secretaria">Contratos x Empenhos x Secretaria</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {showEnteFilter && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Ente</label>
              <Select value={enteFilter} onValueChange={setEnteFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {entes
                    .filter((ente) => user?.role === "admin" || accessibleEnteIds.includes(ente.id))
                    .map((ente) => <SelectItem key={ente.id} value={ente.id}>{ente.sigla}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fornecedor</label>
            <Select value={fornecedorFilter} onValueChange={setFornecedorFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {fornecedoresOpcoes.map((fornecedor) => <SelectItem key={fornecedor.id} value={fornecedor.id}>{fornecedor.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Processo</label>
            <Select value={processoFilter} onValueChange={setProcessoFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {processosOpcoes.map((processo) => <SelectItem key={processo.id} value={processo.id}>{processo.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Contrato</label>
            <Select value={contratoFilter} onValueChange={setContratoFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {contratos.map((contrato) => <SelectItem key={contrato.id} value={contrato.id}>{contrato.numeroContrato}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status do Contrato</label>
            <Select value={statusContratoFilter} onValueChange={setStatusContratoFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fonte de Recurso</label>
            <Select value={fonteFilter} onValueChange={(value) => { setFonteFilter(value); setFichaFilter("all"); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {fontesOpcoes.map((fonte) => <SelectItem key={fonte.id} value={fonte.id}>{fonte.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ficha</label>
            <Select value={fichaFilter} onValueChange={setFichaFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {fichasOpcoes.map((ficha) => <SelectItem key={ficha.id} value={ficha.id}>{ficha.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{report.label}</CardTitle>
          <p className="text-sm text-muted-foreground">{report.rows.length} linha(s) encontradas. A tabela abaixo mostra ate 200 linhas.</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {report.columns.map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.length === 0 ? (
                <TableRow><TableCell colSpan={report.columns.length} className="py-8 text-center text-muted-foreground">Nenhum dado encontrado para os filtros aplicados.</TableCell></TableRow>
              ) : previewRows.map((row, index) => (
                <TableRow key={`${report.id}-${index}`}>
                  {report.columns.map((column) => <TableCell key={column.key}>{String(row[column.key] ?? "-")}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
