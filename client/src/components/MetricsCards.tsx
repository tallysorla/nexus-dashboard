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
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  type Colaborador,
  type RiskLevel,
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
};

const RISCO_ICON_CLASS: Record<RiskLevel, string> = {
  alto: "bg-red-500/10 text-red-600",
  medio: "bg-amber-500/10 text-amber-600",
  baixo: "bg-emerald-500/10 text-emerald-600",
};

export function KpiCard({ icon: Icon, iconClassName, label, value, valueSuffix, badge, badgeClassName, sublabel }: KpiCardProps) {
  return (
    <Card className="gap-3 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
          <Icon className="size-4" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
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
      />
      <Card className="gap-3 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${RISCO_ICON_CLASS[colaborador.risco]}`}>
            <ShieldAlert className="size-4" />
          </div>
          <p className="text-xs font-medium text-muted-foreground">Status de risco</p>
        </div>
        <Badge
          variant="outline"
          className={`w-fit rounded-lg px-3 py-1.5 text-base font-semibold ${RISCO_BADGE_CLASS[colaborador.risco]}`}
        >
          {RISCO_LABEL[colaborador.risco]}
        </Badge>
        <p className="text-xs text-muted-foreground">Com base no teste DT (mais aprofundado)</p>
      </Card>
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
