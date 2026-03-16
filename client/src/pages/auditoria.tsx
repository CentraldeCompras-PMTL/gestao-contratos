import { Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/formatters";

export default function Auditoria() {
  const { user } = useAuth();
  const { data: logs = [], isLoading } = useAuditLogs(user?.role === "admin");

  if (user?.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoria</h1>
        <p className="text-muted-foreground mt-1">Historico basico das principais acoes executadas no sistema.</p>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Acao</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Carregando...</TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum evento registrado.</TableCell></TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.entity}</TableCell>
                  <TableCell>{log.entityId || "-"}</TableCell>
                  <TableCell>{log.details || "-"}</TableCell>
                  <TableCell>{formatDate(log.createdAt ? String(log.createdAt) : "")}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
