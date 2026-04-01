import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, user } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 gap-4">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 animate-pulse">
        <FileText size={32} />
      </div>
      <div className="flex items-center gap-3">
        <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-muted-foreground font-medium">Entrando no sistema...</p>
      </div>
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: () => {
          setLocation("/");
        },
        onError: (err) => toast({
          variant: "destructive",
          title: "Erro",
          description: err instanceof Error ? err.message : "Erro ao fazer login",
        }),
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div
        className="absolute inset-0 z-0 opacity-[0.03] bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")' }}
      />

      <Card className="w-full max-w-md z-10 shadow-2xl border-border/50">
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-primary/20 mb-2">
            <FileText size={32} />
          </div>
          <CardTitle className="text-2xl font-bold">Gestao de Contratos</CardTitle>
          <CardDescription>
            Faca login para acessar o sistema.
            <br />
            O acesso e liberado somente para usuarios cadastrados pelo administrador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              disabled={login.isPending}
            >
              {login.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-center">
            <Link href="/forgot-password" className="text-primary hover:underline">Esqueci minha senha</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
