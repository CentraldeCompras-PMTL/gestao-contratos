import { useState } from "react";
import { useNotasFiscais, useCreateNotaFiscal, useUpdateNotaFiscalPagamento } from "@/hooks/use-notas-fiscais";
import { useContratos } from "@/hooks/use-contratos";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NotasFiscais() {
  const { data: notas = [], isLoading } = useNotasFiscais();
  const { data: contratos = [] } = useContratos();
  const createMutation = useCreateNotaFiscal();
  const paymentMutation = useUpdateNotaFiscalPagamento();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ contratoId: "", numeroNota: "", valorNota: "", dataNota: "" });

  const filtered = notas.filter((n: any) => 
    n.numeroNota.toLowerCase().includes(search.toLowerCase()) ||
    n.contrato.numeroContrato.includes(search)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      contratoId: formData.contratoId,
      numeroNota: formData.numeroNota,
      valorNota: parseFloat(formData.valorNota),
      dataNota: formData.dataNota
    }, {
      onSuccess: () => {
        toast({ title: "Nota Fiscal criada!" });
        setIsDialogOpen(false);
        setFormData({ contratoId: "", numeroNota: "", valorNota: "", dataNota: "" });
      },
      onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
    });
  };

  const handlePayment = (notaId: string, status: string) => {
    paymentMutation.mutate({
      id: notaId,
      statusPagamento: status,
      dataPagamento: status === "pago" ? new Date().toISOString().split('T')[0] : undefined
    }, {
      onSuccess: () => {
        toast({ title: `Nota marcada como ${status === "pago" ? "paga" : "pendente"}!` });
      },
      onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acompanhamento de Notas Fiscais</h1>
          <p className="text-muted-foreground mt-1">Gerencie notas fiscais e seu pagamento.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="mr-2" size={18} /> Nova Nota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Nota Fiscal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Contrato</label>
                <Select value={formData.contratoId} onValueChange={v => setFormData({...formData, contratoId: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contratos.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.numeroContrato}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Número da Nota</label>
                <Input required value={formData.numeroNota} onChange={e => setFormData({...formData, numeroNota: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor</label>
                <Input required type="number" step="0.01" value={formData.valorNota} onChange={e => setFormData({...formData, valorNota: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input required type="date" value={formData.dataNota} onChange={e => setFormData({...formData, dataNota: e.target.value})} />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                Criar Nota Fiscal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <div className="mb-4">
          <Input placeholder="Buscar nota..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Processo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8"><div className="flex flex-col items-center"><FileText className="w-12 h-12 text-muted-foreground/30 mb-2" /><p className="text-muted-foreground">Nenhuma nota fiscal</p></div></TableCell></TableRow>
              ) : (
                filtered.map((nota: any) => (
                  <TableRow key={nota.id} className="hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors">
                    <TableCell className="font-medium">{nota.numeroNota}</TableCell>
                    <TableCell>{nota.contrato.numeroContrato}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{nota.contrato.processoDigital.numeroProcessoDigital}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(parseFloat(nota.valorNota))}</TableCell>
                    <TableCell className="text-sm">{formatDate(nota.dataNota)}</TableCell>
                    <TableCell>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        nota.statusPagamento === 'pago' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                          : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                      }`}>
                        {nota.statusPagamento === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm" 
                        variant={nota.statusPagamento === 'pago' ? "outline" : "default"}
                        onClick={() => handlePayment(nota.id, nota.statusPagamento === 'pago' ? 'pendente' : 'pago')}
                        disabled={paymentMutation.isPending}
                        data-testid={`button-payment-${nota.id}`}
                      >
                        <Check size={16} />
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
