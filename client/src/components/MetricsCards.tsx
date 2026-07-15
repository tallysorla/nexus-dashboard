import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BarChart3,
  Info,
  Minus,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  statusDoFator,
  tendenciaDoFator,
  variacaoLabel,
  type Colaborador,
  type Tendencia,
} from "@/lib/mock-colaboradores";

type MetricsCardsProps = {
  colaborador: Colaborador;
};

type KpiCardProps = {
  icon: LucideIcon;
  iconClassName: string;
  label: string;
  value: string;
  valueSuffix?: string;
  badge: string;
  badgeClassName?: string;
  sublabel?: string;
  tooltip?: string;
};

const TENDENCIA_ICON: Record<Tendencia, LucideIcon> = {
  subindo: TrendingUp,
  descendo: TrendingDown,
  estavel: Minus,
};

export function KpiCard({ icon: Icon, iconClassName, label, value, valueSuffix, badge, badgeClassName, sublabel, tooltip }: KpiCardProps) {
  return (
    <Card className="gap-3 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
            <Icon className="size-4" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`Sobre ${label}`}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Info className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-64">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <p className="text-3xl font-semibold tracking-tight">
        {value}
        {valueSuffix && <span className="text-sm font-medium text-muted-foreground">{valueSuffix}</span>}
      </p>
      <Badge
        variant={badgeClassName ? "outline" : "secondary"}
        className={`w-fit rounded-lg px-2 py-0.5 text-xs ${badgeClassName ?? ""}`}
      >
        {badge}
      </Badge>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </Card>
  );
}

export function KpiMiniCards({ colaborador }: MetricsCardsProps) {
  const eeaRisco = classificarRisco(colaborador.eea);
  const dtProgress = Math.round((colaborador.dt / 750) * 100);
  const dtRisco = classificarRisco(dtProgress);
  const tendencia = tendenciaDoFator(colaborador.evolucao);

  return (
    <>
      <KpiCard
        icon={Users}
        iconClassName="bg-primary/10 text-primary"
        label="EEA atual"
        value={String(colaborador.eea)}
        valueSuffix="/100"
        badge={RISCO_LABEL[eeaRisco]}
        badgeClassName={RISCO_BADGE_CLASS[eeaRisco]}
        sublabel={`${colaborador.totalTestesEea} testes EEA ao todo`}
        tooltip="Resultado do EEA, o questionário de autoavaliação que o funcionário responde todos os dias. Vai de 0 a 100 — quanto maior, maior o risco psicossocial identificado no dia a dia."
      />
      <KpiCard
        icon={BarChart3}
        iconClassName="bg-amber-500/10 text-amber-600"
        label="DT atual"
        value={String(colaborador.dt)}
        valueSuffix="/750"
        badge={RISCO_LABEL[dtRisco]}
        badgeClassName={RISCO_BADGE_CLASS[dtRisco]}
        sublabel={`${colaborador.totalTestesDt} testes DT ao todo`}
        tooltip="Resultado do último DT, o teste mais aprofundado, aplicado com menor frequência (periodicamente ou durante uma tratativa). Vai de 0 a 750 — quanto maior, maior o risco identificado."
      />
      <KpiCard
        icon={TENDENCIA_ICON[tendencia]}
        iconClassName="bg-slate-500/10 text-slate-600"
        label="Tendência"
        value={variacaoLabel(colaborador.evolucao)}
        badge={statusDoFator(tendencia)}
        badgeClassName="border-slate-200 bg-slate-50 text-slate-700"
        sublabel="Comparado a 30 dias atrás"
        tooltip="Mostra se o risco deste funcionário está piorando, melhorando ou estável, comparando a situação atual com a de 30 dias atrás. Não substitui o EEA e o DT: aqui o que importa é a direção da mudança, não o nível de risco."
      />
    </>
  );
}

export function MetricsCards({ colaborador }: MetricsCardsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-none">Últimos testes realizados</h2>
          <p className="text-sm text-muted-foreground">Resultado mais recente por indicador · há 1 mês</p>
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
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiMiniCards colaborador={colaborador} />
      </div>
    </div>
  );
}
