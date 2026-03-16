import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import { AppLayout } from "./components/layout/app-layout";
import Login from "./pages/login";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import ChangePassword from "./pages/change-password";
import Dashboard from "./pages/dashboard";
import Fornecedores from "./pages/fornecedores";
import Processos from "./pages/processos";
import Fases from "./pages/fases";
import Contratos from "./pages/contratos";
import ContratoDetail from "./pages/contratos/[id]";
import Departamentos from "./pages/departamentos";
import EntesPage from "./pages/entes";
import NotasFiscais from "./pages/notas-fiscais";
import AfsPanel from "./pages/afs";
import Notificacoes from "./pages/notificacoes";
import Usuarios from "./pages/usuarios";
import Auditoria from "./pages/auditoria";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
          <p className="text-muted-foreground">Carregando aplicacao...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.forcePasswordChange && window.location.pathname !== "/change-password") {
    return <Redirect to="/change-password" />;
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
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/change-password" component={() => <ProtectedRoute component={ChangePassword} />} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/fornecedores" component={() => <ProtectedRoute component={Fornecedores} />} />
      <Route path="/processos" component={() => <ProtectedRoute component={Processos} />} />
      <Route path="/fases" component={() => <ProtectedRoute component={Fases} />} />
      <Route path="/contratos" component={() => <ProtectedRoute component={Contratos} />} />
      <Route path="/contratos/:id" component={() => <ProtectedRoute component={ContratoDetail} />} />
      <Route path="/notas-fiscais" component={() => <ProtectedRoute component={NotasFiscais} />} />
      <Route path="/afs" component={() => <ProtectedRoute component={AfsPanel} />} />
      <Route path="/departamentos" component={() => <ProtectedRoute component={Departamentos} />} />
      <Route path="/entes" component={() => <ProtectedRoute component={EntesPage} />} />
      <Route path="/notificacoes" component={() => <ProtectedRoute component={Notificacoes} />} />
      <Route path="/usuarios" component={() => <ProtectedRoute component={Usuarios} />} />
      <Route path="/auditoria" component={() => <ProtectedRoute component={Auditoria} />} />
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
