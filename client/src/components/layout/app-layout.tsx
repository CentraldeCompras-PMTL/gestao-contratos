import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Users, 
  FolderOpen, 
  FileText, 
  Bell,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Fornecedores", href: "/fornecedores", icon: Users },
    { name: "Processos Digitais", href: "/processos", icon: FolderOpen },
    { name: "Fases de Contratação", href: "/fases", icon: FileText },
    { name: "Contratos", href: "/contratos", icon: FileText },
    { name: "Notas Fiscais", href: "/notas-fiscais", icon: FileText },
    { name: "AFs", href: "/afs", icon: FileText },
    { name: "Departamentos", href: "/departamentos", icon: Users },
    { name: "Notificações", href: "/notificacoes", icon: Bell },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-6 bg-primary/5 border-b border-border/50">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <FileText size={18} />
          </div>
          Gestão de Contratos
        </h1>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 gap-2">
        {navigation.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                ${isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <Icon size={20} className={isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"} />
              {item.name}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
          <div className="flex flex-col truncate">
            <span className="text-sm font-bold text-foreground truncate">{user?.name || 'Usuário'}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => logout.mutate()}
            title="Sair"
            className="hover:text-destructive shrink-0"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 border-r border-border bg-card shadow-sm z-10">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-72 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex h-16 items-center justify-between px-4 border-b border-border bg-card sticky top-0 z-20">
          <div className="flex items-center gap-2 font-bold text-primary">
            <FileText size={20} />
            Gestão AFs
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
