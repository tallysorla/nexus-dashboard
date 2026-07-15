import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
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
  confirmacaoDoDT,
  statusDoFator,
  tendenciaDoFator,
  tendenciaEeaPercentual,
  variacaoLabel,
  type Colaborador,
  type ConfirmacaoDT,
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
  extra?: ReactNode;
};

const TENDENCIA_ICON: Record<Tendencia, LucideIcon> = {
  subindo: TrendingUp,
  descendo: TrendingDown,
  estavel: Minus,
};

const CONFIRMACAO_ICON: Record<ConfirmacaoDT, LucideIcon> = {
  confirma: CheckCircle2,
  diverge: AlertTriangle,
  aguardando: Clock,
};

const CONFIRMACAO_TEXTO: Record<ConfirmacaoDT, string> = {
  confirma: "DT recente confirma essa direção",
  diverge: "DT recente aponta direção diferente",
  aguardando: "Sem DT recente para confirmar",
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
      <Badge
        variant={badgeClassName ? "outline" : "secondary"}
        className={`w-fit rounded-lg px-2 py-0.5 text-xs ${badgeClassName ?? ""}`}
      >
        {badge}
      </Badge>
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
  const confirmacao = confirmacaoDoDT(colaborador.historicoTestes, tendencia);
  const ConfirmacaoIcon = CONFIRMACAO_ICON[confirmacao];

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
        label="Tendência (EEA)"
        value={variacaoLabel(tendenciaEeaValor)}
        badge={statusDoFator(tendencia)}
        badgeClassName="border-slate-200 bg-slate-50 text-slate-700"
        sublabel="Últimos 30 dias vs. 30 dias anteriores"
        tooltip="Calculada a partir do EEA (teste diário): média dos últimos 30 dias comparada com os 30 dias anteriores. O DT não entra nessa conta porque é aplicado com pouca frequência — em vez disso, mostramos abaixo se o DT mais recente confirma essa direção."
        extra={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ConfirmacaoIcon className="size-3.5 shrink-0" />
            <span>{CONFIRMACAO_TEXTO[confirmacao]}</span>
          </div>
        }
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
