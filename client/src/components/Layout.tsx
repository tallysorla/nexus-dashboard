import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEmpresaScope } from "@/contexts/ProfileContext";

type LayoutProps = {
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export function Layout({ headerActions, children }: LayoutProps) {
  // No diretorio global (nenhuma empresa selecionada ainda) nao existe menu
  // de secoes pra mostrar -- a sidebar só aparece depois que o gestor entra
  // numa empresa.
  const dentroDeEmpresa = useEmpresaScope() !== null;

  return (
    <SidebarProvider>
      {dentroDeEmpresa && <Sidebar />}
      <SidebarInset>
        <Header showSidebarTrigger={dentroDeEmpresa}>{headerActions}</Header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1440px] space-y-6 p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
