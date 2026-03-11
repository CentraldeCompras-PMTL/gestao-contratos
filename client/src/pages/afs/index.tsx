import { useState } from "react";
import { useAfs, useExtendAf } from "@/hooks/use-afs";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AfsPanel() {
  const { data: afs = [], isLoading } = useAfs();
  const extendMutation = useExtendAf();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [selectedAf, setSelectedAf] = useState<any>(null);
  const [extensionDate, setExtensionDate] = useState("");

  const filtered = afs.filter((a: any) => 
    a.empenho.contrato.numeroContrato.includes(search) ||
    a.empenho.contrato.fornecedor.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.empenho.contrato.processoDigital.numeroProcessoDigital.includes(search) ||
    search === ""
  );

  const handleExtend = () => {
    if (!selectedAf || !extensionDate) return;
    extendMutation.mutate({ id: selectedAf.id, dataExtensao: extensionDate }, {
      onSuccess: () => {
        toast({ title: "Prazo estendido com sucesso!" });
        setSelectedAf(null);
        setExtensionDate("");
      },
      onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Acompanhamento de AFs</h1>
        <p className="text-muted-foreground mt-1">Acompanhe autoridades de fornecimento e prazos.</p>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <div className="mb-4">
          <Input placeholder="Buscar contrato..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrato</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Processo</TableHead>
                <TableHead>Valor AF</TableHead>
                <TableHead>Data Estimada</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><div className="flex flex-col items-center"><Package className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhuma AF</p></div></TableCell></TableRow>
              ) : (
                filtered.map((af: any) => (
                  <TableRow key={af.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                    <TableCell className="font-medium">{af.empenho.contrato.numeroContrato}</TableCell>
                    <TableCell className="text-sm">{af.empenho.contrato.fornecedor.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{af.empenho.contrato.processoDigital.numeroProcessoDigital}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(parseFloat(af.valorAf))}</TableCell>
                    <TableCell className="text-sm">{formatDate(af.dataExtensao || af.dataEstimadaEntrega)}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        af.flagEntregaNotificada 
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100'
                      }`}>
                        {af.flagEntregaNotificada ? 'Notificada' : 'Pendente'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {af.flagEntregaNotificada && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedAf(af)}
                          data-testid={`button-extend-${af.id}`}
                        >
                          <Clock size={16} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selectedAf} onOpenChange={(open) => !open && setSelectedAf(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prorrogar Prazo de Entrega</DialogTitle>
          </DialogHeader>
          {selectedAf && (
            <div className="space-y-4 pt-4">
              <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded">
                <p className="text-sm text-muted-foreground">Contrato</p>
                <p className="font-medium">{selectedAf.empenho.contrato.numeroContrato}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nova Data de Entrega</label>
                <Input 
                  type="date" 
                  value={extensionDate} 
                  onChange={e => setExtensionDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <Button 
                onClick={handleExtend} 
                className="w-full"
                disabled={!extensionDate || extendMutation.isPending}
              >
                Prorrogar Prazo
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
