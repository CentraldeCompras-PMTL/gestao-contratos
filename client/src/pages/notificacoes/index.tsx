import { useState } from "react";
import { useNotificacoes } from "@/hooks/use-notificacoes";
import { useNotifyAf, useUpdateEntregaAf } from "@/hooks/use-afs";
import { formatDate } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertCircle, BellRing, CheckCircle, PackageCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Notificacoes() {
  const { data: notificacoes = [], isLoading } = useNotificacoes();
  const notifyAf = useNotifyAf();
  const updateEntrega = useUpdateEntregaAf();
  const { toast } = useToast();

  const [entregaDialog, setEntregaDialog] = useState<string | null>(null);
  const [dataEntrega, setDataEntrega] = useState("");

  const handleNotify = (id: string) => {
    notifyAf.mutate(id, {
      onSuccess: () => toast({ title: "Empresa notificada com sucesso!" })
    });
  };

  const handleEntrega = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    updateEntrega.mutate({ id, dataEntregaReal: dataEntrega }, {
      onSuccess: () => {
        toast({ title: "Entrega registrada!" });
        setEntregaDialog(null);
        setDataEntrega("");
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Buscando alertas...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Central de Notificações</h1>
        <p className="text-muted-foreground mt-1">Alertas automáticos de prazos de entrega de AFs.</p>
      </div>

      <div className="grid gap-4">
        {notificacoes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card border border-border/50 rounded-xl shadow-sm">
            <CheckCircle size={64} className="mx-auto mb-4 text-emerald-500 opacity-50" />
            <h3 className="text-xl font-medium">Tudo em dia!</h3>
            <p className="mt-2">Nenhuma AF com prazo de entrega crítico no momento.</p>
          </div>
        ) : (
          notificacoes.map((item: any) => {
            const isAtrasado = item.isLate === true;
            
            return (
              <Card key={item.id} className={`border-l-4 shadow-sm transition-all hover:shadow-md ${
                isAtrasado ? 'border-l-red-500 bg-red-50/10' : 'border-l-amber-500 bg-amber-50/10'
              }`}>
                <CardContent className="p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {isAtrasado ? <AlertCircle className="text-red-500" /> : <BellRing className="text-amber-500" />}
                      <h3 className="text-lg font-bold text-foreground">
                        Contrato: {item.contrato}
                      </h3>
                      <Badge variant="outline" className={isAtrasado ? "bg-red-100 text-red-800 border-red-200" : "bg-amber-100 text-amber-800 border-amber-200"}>
                        {isAtrasado ? 'Atrasado' : 'Prazo Próximo'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground max-w-2xl">
                      A Autorização de Fornecimento (AF) no valor de R$ {item.af.valorAf} vinculada ao fornecedor <strong>{item.fornecedor}</strong> tem entrega estimada para <strong>{formatDate(item.af.dataEstimadaEntrega)}</strong>.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                    {/* Notify Button */}
                    <Button 
                      variant={isAtrasado ? "destructive" : "secondary"}
                      disabled={item.af.flagEntregaNotificada || notifyAf.isPending}
                      onClick={() => handleNotify(item.af.id)}
                      className="flex-1 md:flex-none shadow-sm"
                    >
                      {item.af.flagEntregaNotificada ? "Já Notificado" : "Notificar Empresa"}
                    </Button>

                    {/* Receive Button */}
                    <Dialog open={entregaDialog === item.af.id} onOpenChange={open => setEntregaDialog(open ? item.af.id : null)}>
                      <DialogTrigger asChild>
                        <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700 flex-1 md:flex-none shadow-sm">
                          <PackageCheck size={18} className="mr-2"/> Receber AF
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Registrar Entrega de AF</DialogTitle></DialogHeader>
                        <form onSubmit={(e) => handleEntrega(e, item.af.id)} className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Data Real da Entrega</label>
                            <Input type="date" required value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} />
                          </div>
                          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={updateEntrega.isPending}>
                            Confirmar Recebimento
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
