import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, register, user } = useAuth();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      register.mutate({ email, password, name }, {
        onSuccess: () => {
          toast({ title: "Conta criada com sucesso" });
          setLocation("/");
        },
        onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
      });
    } else {
      login.mutate({ email, password }, {
        onSuccess: () => {
          setLocation("/");
        },
        onError: (err) => toast({ variant: "destructive", title: "Erro", description: err.message })
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      {/* Unsplash nice subtle architecture background comment */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] bg-cover bg-center" 
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")' }}
      />
      
      <Card className="w-full max-w-md z-10 shadow-2xl border-border/50">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-primary/20 mb-2">
            <FileText size={32} />
          </div>
          <CardTitle className="text-2xl font-bold">Gestão de Contratos</CardTitle>
          <CardDescription>
            {isRegistering ? "Crie sua conta para acessar o sistema" : "Faça login para acessar o sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input 
                  id="name" 
                  placeholder="Seu nome" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nome@exemplo.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={login.isPending || register.isPending}
            >
              {isRegistering 
                ? (register.isPending ? "Criando..." : "Criar Conta") 
                : (login.isPending ? "Entrando..." : "Entrar")
              }
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            {isRegistering ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
            <button 
              type="button" 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-primary font-semibold hover:underline"
            >
              {isRegistering ? "Faça login" : "Registre-se"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
