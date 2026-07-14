import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type LayoutProps = {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
};

export function Layout({ title, subtitle, headerActions, children }: LayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        <Header title={title} subtitle={subtitle}>
          {headerActions}
        </Header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1440px] space-y-6 p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
