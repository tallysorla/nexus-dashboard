import {
  AlertTriangle,
  Building,
  Building2,
  ChevronLeft,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useProfile, type NavKey } from "@/contexts/ProfileContext";
import { getEmpresaById } from "@/lib/mock-empresas";

const NAV_META: Record<NavKey, { icon: LucideIcon; label: string; href: (cid: string) => string }> = {
  overview: { icon: LayoutDashboard, label: "Visão geral", href: (cid) => `/empresas/${cid}` },
  filiais: { icon: Building2, label: "Filiais / NOPs", href: (cid) => `/empresas/${cid}/filiais` },
  func: { icon: Users, label: "Funcionários", href: (cid) => `/funcionarios?empresa=${cid}` },
  testes: { icon: FileText, label: "Testes", href: (cid) => `/empresas/${cid}/testes` },
  risco: { icon: AlertTriangle, label: "Combinações Críticas", href: (cid) => `/empresas/${cid}/combinacoes` },
  aplicar: { icon: ClipboardCheck, label: "Aplicar teste", href: (cid) => `/empresas/${cid}/aplicar-teste` },
  usuarios: { icon: ShieldCheck, label: "Usuários & acessos", href: (cid) => `/empresas/${cid}/usuarios` },
  dados: { icon: Building, label: "Dados da empresa", href: (cid) => `/empresas/${cid}/dados` },
};

export function Sidebar() {
  const [location] = useLocation();
  const { profile } = useProfile();

  const cidNaUrl = location.match(/^\/empresas\/([^/]+)/)?.[1];
  const cid = profile.empresaId ?? cidNaUrl ?? null;
  const empresa = cid ? getEmpresaById(cid) : undefined;

  return (
    <SidebarPrimitive collapsible="icon" className="border-r">
      <SidebarHeader className="items-center p-5 group-data-[collapsible=icon]:p-2">
        <img
          src="/nexus-logo.svg"
          alt="Nexus"
          className="h-14 w-auto group-data-[collapsible=icon]:h-8"
        />
        <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          People analytics
        </p>
      </SidebarHeader>

      {empresa && (
        <div className="mx-3 mb-2 space-y-2 rounded-xl border bg-muted/30 p-3 group-data-[collapsible=icon]:hidden">
          {profile.canExit && (
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <ChevronLeft className="size-3.5" />
              Empresas
            </Link>
          )}
          <p className="truncate text-sm font-semibold leading-tight">{empresa.nome}</p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                empresa.status === "ativo" ? "bg-emerald-500" : "bg-muted-foreground"
              }`}
            />
            {profile.filialId ? profile.scopeLabel : empresa.status === "ativo" ? "Ativo" : "Inativo"}
          </div>
        </div>
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {!cid ? (
                // Escopo global (diretorio de empresas): so existe um lugar
                // pra ir, e ja estamos nele -- nao faz sentido mostrar o nav
                // inteiro de uma empresa que ainda nao foi selecionada.
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive
                    size="lg"
                    className="rounded-xl px-3 text-sm font-medium data-[active=true]:bg-secondary"
                  >
                    <Building2 className="size-4" />
                    <span className="group-data-[collapsible=icon]:hidden">Empresas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                profile.nav.map((navKey) => {
                  const meta = NAV_META[navKey];
                  const href = meta.href(cid);
                  const hrefPath = href.split("?")[0];
                  const isActive =
                    navKey === "overview" ? location === hrefPath : location.startsWith(hrefPath);

                  return (
                    <SidebarMenuItem key={navKey}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        size="lg"
                        className="rounded-xl px-3 text-sm font-medium data-[active=true]:bg-secondary"
                      >
                        <Link href={href}>
                          <meta.icon className="size-4" />
                          <span className="group-data-[collapsible=icon]:hidden">{meta.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <SidebarMenuButton className="h-11 rounded-xl px-3 text-muted-foreground hover:text-destructive">
          <LogOut className="size-4" />
          <span className="group-data-[collapsible=icon]:hidden">Logout</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
