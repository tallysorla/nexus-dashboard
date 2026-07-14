import {
  BarChart3,
  FileText,
  LayoutDashboard,
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
  { icon: LayoutDashboard, label: "Vis&atilde;o geral", href: "/" },
  { icon: Users, label: "Funcion&aacute;rios", href: "/colaboradores" },
  { icon: UserCheck, label: "Avaliadores", href: "/avaliadores" },
  { icon: FileText, label: "Testes", href: "/testes" },
  { icon: BarChart3, label: "Relat&oacute;rios", href: "/relatorios" },
  { icon: Settings, label: "Configura&ccedil;&otilde;es", href: "/configuracoes" },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <SidebarPrimitive collapsible="offcanvas" className="border-r">
      <SidebarHeader className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            EM
          </div>
          <div>
            <p className="font-semibold leading-none text-foreground">
              EMOVISION
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              People analytics
            </p>
          </div>
        </div>
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
                        <span dangerouslySetInnerHTML={{ __html: item.label }} />
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
          Logout
        </SidebarMenuButton>
      </SidebarFooter>
    </SidebarPrimitive>
  );
}
