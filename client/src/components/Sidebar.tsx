import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Lock,
  LogOut,
  Settings,
  UserCheck,
  Users,
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

const menuItems = [
  { icon: LayoutDashboard, label: "Vis&atilde;o geral", href: "/", disabled: true },
  { icon: Users, label: "Funcion&aacute;rios", href: "/funcionarios", disabled: false },
  { icon: UserCheck, label: "Avaliadores", href: "/avaliadores", disabled: true },
  { icon: FileText, label: "Testes", href: "/testes", disabled: true },
  { icon: BarChart3, label: "Relat&oacute;rios", href: "/relatorios", disabled: true },
  { icon: Settings, label: "Configura&ccedil;&otilde;es", href: "/configuracoes", disabled: true },
];

export function Sidebar() {
  const [location] = useLocation();

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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? location === "/"
                    : location.startsWith(item.href);

                if (item.disabled) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        disabled
                        size="lg"
                        className="cursor-not-allowed rounded-xl px-3 text-sm font-medium text-muted-foreground"
                      >
                        <item.icon className="size-4" />
                        <span
                          className="group-data-[collapsible=icon]:hidden"
                          dangerouslySetInnerHTML={{ __html: item.label }}
                        />
                        <Lock className="ml-auto size-3.5 shrink-0 group-data-[collapsible=icon]:hidden" />
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      size="lg"
                      className="rounded-xl px-3 text-sm font-medium data-[active=true]:bg-secondary"
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span
                          className="group-data-[collapsible=icon]:hidden"
                          dangerouslySetInnerHTML={{ __html: item.label }}
                        />
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
