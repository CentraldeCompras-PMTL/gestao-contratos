import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";

// Components
import { AppLayout } from "./components/layout/app-layout";

// Pages
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Fornecedores from "./pages/fornecedores";
import Processos from "./pages/processos";
import Contratos from "./pages/contratos";
import ContratoDetail from "./pages/contratos/[id]";
import Notificacoes from "./pages/notificacoes";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse flex flex-col items-center"><div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div><p className="text-muted-foreground">Carregando aplicação...</p></div></div>;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <AppLayout>
      <Component />
    </AppLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/fornecedores" component={() => <ProtectedRoute component={Fornecedores} />} />
      <Route path="/processos" component={() => <ProtectedRoute component={Processos} />} />
      <Route path="/contratos" component={() => <ProtectedRoute component={Contratos} />} />
      <Route path="/contratos/:id" component={() => <ProtectedRoute component={ContratoDetail} />} />
      <Route path="/notificacoes" component={() => <ProtectedRoute component={Notificacoes} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
