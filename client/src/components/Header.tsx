import { Bell, LogOut, Search, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HeaderProps = {
  children?: React.ReactNode;
};

export function Header({ children }: HeaderProps) {
  return (
    <header className="border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger
              variant="outline"
              aria-label="Recolher ou expandir menu lateral"
              className="size-11 rounded-xl bg-card"
            />
          </TooltipTrigger>
          <TooltipContent>Recolher menu</TooltipContent>
        </Tooltip>

        <div className="flex items-center gap-2">
          {children}
          <div className="relative hidden w-72 lg:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar no dashboard"
              className="h-11 rounded-xl bg-card pl-9"
              placeholder="Buscar..."
            />
          </div>

          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    aria-label="Notificações"
                    variant="outline"
                    size="icon"
                    className="size-11 rounded-xl bg-card"
                  >
                    <Bell className="size-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent>Notificações</TooltipContent>
            </Tooltip>
            <PopoverContent align="end" className="w-80">
              <p className="text-sm font-medium">Notificações</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma notificação por enquanto. Avisos de risco alto/médio aparecerão aqui.
              </p>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label="Perfil"
                    variant="outline"
                    size="icon"
                    className="size-11 rounded-xl bg-card"
                  >
                    <User className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Perfil</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="size-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="size-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <LogOut className="size-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
