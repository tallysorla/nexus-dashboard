import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BarChart3, Info, TrendingDown, TrendingUp, Users } from "lucide-react";
import type { Colaborador } from "@/lib/mock-colaboradores";

type MetricsCardsProps = {
  colaborador: Colaborador;
};

export function MetricsCards({ colaborador }: MetricsCardsProps) {
  const eeaBadge = colaborador.eea >= 70 ? "Nível alto" : colaborador.eea >= 40 ? "Nível moderado" : "Nível baixo";
  const dtProgress = Math.round((colaborador.dt / 750) * 100);
  const dtBadge = dtProgress >= 70 ? "Monitorar de perto" : dtProgress >= 40 ? "Monitorar" : "Estável";
  const isPositive = colaborador.evolucao >= 0;

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 pt-6">
        <div className="space-y-1">
          <CardTitle className="text-lg">Últimos testes realizados</CardTitle>
          <CardDescription>Resultado mais recente por indicador · há 1 mês</CardDescription>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Sobre EEA e DT"
              className="mt-1 text-muted-foreground hover:text-foreground"
            >
              <Info className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            EEA é diário e DT é um teste mais aprofundado e periódico — as escalas são diferentes,
            por isso aparecem separadas.
          </TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent className="grid grid-cols-1 divide-y px-6 pb-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="flex items-center gap-3 py-4 first:pt-0 sm:py-0 sm:pr-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">EEA atual</p>
            <p className="text-2xl font-semibold tracking-tight">
              {colaborador.eea}
              <span className="text-sm font-medium text-muted-foreground">/100</span>
            </p>
            <Badge variant="secondary" className="mt-1 rounded-lg px-2 py-0.5 text-xs">
              {eeaBadge}
            </Badge>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {colaborador.totalTestesEea} testes EEA ao todo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-4 sm:py-0 sm:px-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">DT atual</p>
            <p className="text-2xl font-semibold tracking-tight">
              {colaborador.dt}
              <span className="text-sm font-medium text-muted-foreground">/750</span>
            </p>
            <Badge variant="secondary" className="mt-1 rounded-lg px-2 py-0.5 text-xs">
              {dtBadge}
            </Badge>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {colaborador.totalTestesDt} testes DT ao todo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-4 last:pb-0 sm:py-0 sm:pl-6">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
              isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
            }`}
          >
            {isPositive ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Evolução geral</p>
            <p className="text-2xl font-semibold tracking-tight">
              {isPositive ? "+" : ""}
              {colaborador.evolucao}
            </p>
            <Badge variant="secondary" className="mt-1 rounded-lg px-2 py-0.5 text-xs">
              {isPositive ? "Melhora" : "Queda"} nos últimos 3 testes
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
