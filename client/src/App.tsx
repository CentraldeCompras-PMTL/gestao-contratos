import { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./hooks/use-auth";
import NotFound from "@/pages/not-found";
import { AppLayout } from "./components/layout/app-layout";
import Login from "./pages/login";

const ForgotPassword = lazy(() => import("./pages/forgot-password"));
const ResetPassword = lazy(() => import("./pages/reset-password"));
const ChangePassword = lazy(() => import("./pages/change-password"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const Fornecedores = lazy(() => import("./pages/fornecedores"));
const FontesRecursoPage = lazy(() => import("./pages/fontes-recurso"));
const AtasRegistroPrecoPage = lazy(() => import("./pages/atas-registro-preco"));
const PrePedidosArpPage = lazy(() => import("./pages/pre-pedidos-arp"));
const ContratosArpPage = lazy(() => import("./pages/contratos-arp"));
const Processos = lazy(() => import("./pages/processos"));
const ProcessoDetail = lazy(() => import("./pages/processos/[id]"));
const Fases = lazy(() => import("./pages/fases"));
const Contratos = lazy(() => import("./pages/contratos"));
const ContratoDetail = lazy(() => import("./pages/contratos/[id]"));
const Departamentos = lazy(() => import("./pages/departamentos"));
const EntesPage = lazy(() => import("./pages/entes"));
const NotasFiscais = lazy(() => import("./pages/notas-fiscais"));
const AfsPanel = lazy(() => import("./pages/afs"));
const Notificacoes = lazy(() => import("./pages/notificacoes"));
const Usuarios = lazy(() => import("./pages/usuarios"));
const Auditoria = lazy(() => import("./pages/auditoria"));
const Relatorios = lazy(() => import("./pages/relatorios"));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

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
      <Route path="/fontes-recurso" component={() => <ProtectedRoute component={FontesRecursoPage} />} />
      <Route path="/atas-registro-preco" component={() => <ProtectedRoute component={AtasRegistroPrecoPage} />} />
      <Route path="/pre-pedidos-arp" component={() => <ProtectedRoute component={PrePedidosArpPage} />} />
      <Route path="/contratos-arp" component={() => <ProtectedRoute component={ContratosArpPage} />} />
      <Route path="/processos" component={() => <ProtectedRoute component={Processos} />} />
      <Route path="/processos/:id" component={() => <ProtectedRoute component={ProcessoDetail} />} />
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
      <Route path="/relatorios" component={() => <ProtectedRoute component={Relatorios} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Suspense fallback={<PageLoader />}>
          <Router />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
