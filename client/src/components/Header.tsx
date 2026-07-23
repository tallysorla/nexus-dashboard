import { Bell, Check, ChevronDown, Eye, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROFILES, useProfile, type ProfileKey } from "@/contexts/ProfileContext";

type HeaderProps = {
  children?: React.ReactNode;
  showSidebarTrigger?: boolean;
};

export function Header({ children, showSidebarTrigger = true }: HeaderProps) {
  const { profileKey, profile, setProfile } = useProfile();

  return (
    <header className="border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between gap-4">
        {showSidebarTrigger ? (
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
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          {children}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="hidden h-11 items-center gap-2 rounded-xl bg-card px-3 text-sm font-medium sm:flex"
              >
                <Eye className="size-4 text-muted-foreground" />
                Ver como: {profile.label}
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Pré-visualizar como</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(PROFILES) as ProfileKey[]).map((key) => {
                const p = PROFILES[key];
                return (
                  <DropdownMenuItem key={key} onClick={() => setProfile(key)}>
                    <Check className={`size-4 ${key === profileKey ? "opacity-100" : "opacity-0"}`} />
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{p.label}</span>
                      <span className="truncate text-xs text-muted-foreground">{p.scopeLabel}</span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

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
