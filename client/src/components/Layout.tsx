import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type LayoutProps = {
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export function Layout({ headerActions, children }: LayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <Header>{headerActions}</Header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1440px] space-y-6 p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
