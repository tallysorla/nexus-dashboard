import type { ReactNode } from "react";
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
  tendenciaEeaPercentual,
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
  value: ReactNode;
  valueSuffix?: string;
  badge?: string;
  badgeClassName?: string;
  sublabel?: string;
  tooltip?: string;
  extra?: ReactNode;
};

const TENDENCIA_ICON: Record<Tendencia, LucideIcon> = {
  subindo: TrendingUp,
  descendo: TrendingDown,
  estavel: Minus,
};

// Subir e piorar aqui (nota mais alta de EEA/DT normalizado = mais risco),
// entao a seta de tendencia usa vermelho pra "subindo" e verde pra
// "descendo" -- o oposto do que "seta pra cima = bom" sugeriria a olho nu.
const TENDENCIA_VALOR_CLASSE: Record<Tendencia, string> = {
  subindo: "text-red-600",
  descendo: "text-emerald-600",
  estavel: "text-muted-foreground",
};

export function KpiCard({ icon: Icon, iconClassName, label, value, valueSuffix, badge, badgeClassName, sublabel, tooltip, extra }: KpiCardProps) {
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
      {badge && (
        <Badge
          variant={badgeClassName ? "outline" : "secondary"}
          className={`w-fit rounded-lg px-2 py-0.5 text-xs ${badgeClassName ?? ""}`}
        >
          {badge}
        </Badge>
      )}
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      {extra}
    </Card>
  );
}

export function KpiMiniCards({ colaborador }: MetricsCardsProps) {
  const eeaRisco = classificarRisco(colaborador.eea);
  const dtProgress = Math.round((colaborador.dt / 750) * 100);
  const dtRisco = classificarRisco(dtProgress);

  const tendenciaEeaValor = tendenciaEeaPercentual(colaborador.serieEea);
  const tendencia = tendenciaDoFator(tendenciaEeaValor);
  const TendenciaValorIcon = TENDENCIA_ICON[tendencia];

  return (
    <>
      <KpiCard
        icon={Users}
        iconClassName="bg-primary/10 text-primary"
        label="Índice EEA"
        value={String(colaborador.eea)}
        valueSuffix="/100"
        badge={RISCO_LABEL[eeaRisco]}
        badgeClassName={RISCO_BADGE_CLASS[eeaRisco]}
        sublabel={`${colaborador.totalTestesEea} testes EEA ao todo`}
        tooltip="Representa o resultado do último teste EEA realizado pelo funcionário."
      />
      <KpiCard
        icon={BarChart3}
        iconClassName="bg-amber-500/10 text-amber-600"
        label="Índice DT"
        value={String(colaborador.dt)}
        valueSuffix="/750"
        badge={RISCO_LABEL[dtRisco]}
        badgeClassName={RISCO_BADGE_CLASS[dtRisco]}
        sublabel={`${colaborador.totalTestesDt} testes DT ao todo`}
        tooltip="Representa o resultado do último teste DT realizado pelo funcionário."
      />
      <KpiCard
        icon={TENDENCIA_ICON[tendencia]}
        iconClassName="bg-slate-500/10 text-slate-600"
        label="Tendência (EEA)"
        value={
          <span className="inline-flex items-center gap-1.5">
            <TendenciaValorIcon className={`size-6 ${TENDENCIA_VALOR_CLASSE[tendencia]}`} />
            {variacaoLabel(tendenciaEeaValor)}
          </span>
        }
        badge={statusDoFator(tendencia)}
        badgeClassName="border-slate-200 bg-slate-50 text-slate-700"
        sublabel="Último DT realizado Vs Dt's realizados nos últimos 60 dias"
        tooltip="Compara o resultado mais recente do teste DT com o último ou últimos 3 testes DT's realizados. Valores positivos indicam aumento do índice; valores negativos indicam redução."
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
