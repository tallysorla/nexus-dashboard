import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info, type LucideIcon } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  statusDoFator,
  tendenciaDoFator,
  tendenciaEeaVsUltimoDt,
  variacaoLabel,
  type Colaborador,
  type Tendencia,
} from "@/lib/mock-colaboradores";

type MetricsCardsProps = {
  colaborador: Colaborador;
};

type KpiCardProps = {
  icon?: LucideIcon;
  iconClassName?: string;
  label: string;
  value: ReactNode;
  valueSuffix?: string;
  badge?: string;
  badgeClassName?: string;
  sublabel?: string;
  tooltip?: string;
  extra?: ReactNode;
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
          {Icon && (
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClassName ?? ""}`}>
              <Icon className="size-4" />
            </div>
          )}
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

  // A tendencia so faz sentido quando ja existe pelo menos 1 EEA e 1 DT
  // realizados -- sem os dois, nao ha o que comparar (mostra blank state
  // em vez de um numero calculado a partir de dado inexistente).
  const semDadosSuficientes = colaborador.totalTestesEea === 0 || colaborador.totalTestesDt === 0;
  const tendenciaEeaValor = tendenciaEeaVsUltimoDt(colaborador.eea, colaborador.dt);
  const tendencia = tendenciaDoFator(tendenciaEeaValor);

  return (
    <>
      <KpiCard
        label="Índice EEA"
        value={String(colaborador.eea)}
        valueSuffix="/100"
        badge={RISCO_LABEL[eeaRisco]}
        badgeClassName={RISCO_BADGE_CLASS[eeaRisco]}
        sublabel={`${colaborador.totalTestesEea} testes EEA ao todo`}
        tooltip="Representa o resultado do último teste EEA realizado pelo funcionário."
      />
      <KpiCard
        label="Índice DT"
        value={String(colaborador.dt)}
        valueSuffix="/750"
        badge={RISCO_LABEL[dtRisco]}
        badgeClassName={RISCO_BADGE_CLASS[dtRisco]}
        sublabel={`${colaborador.totalTestesDt} testes DT ao todo`}
        tooltip="Representa o resultado do último teste DT realizado pelo funcionário."
      />
      {semDadosSuficientes ? (
        <KpiCard
          label="Tendência (EEA)"
          value={<span className="text-muted-foreground">—</span>}
          badge="Sem dados suficientes"
          badgeClassName="border-slate-200 bg-slate-50 text-slate-700"
          sublabel={
            colaborador.totalTestesEea === 0 && colaborador.totalTestesDt === 0
              ? "Aguardando o primeiro teste EEA e DT"
              : colaborador.totalTestesEea === 0
                ? "Aguardando o primeiro teste EEA"
                : "Aguardando o primeiro teste DT"
          }
          tooltip="A tendência compara o EEA mais recente com o último DT realizado. Ela só aparece depois que o funcionário tiver pelo menos um teste de cada tipo."
        />
      ) : (
        <KpiCard
          label="Tendência (EEA)"
          value={<span className={TENDENCIA_VALOR_CLASSE[tendencia]}>{variacaoLabel(tendenciaEeaValor)}</span>}
          badge={statusDoFator(tendencia)}
          badgeClassName={
            tendencia === "subindo" ? RISCO_BADGE_CLASS.alto : "border-slate-200 bg-slate-50 text-slate-700"
          }
          sublabel="EEA atual em relação ao último DT realizado"
          tooltip="O DT é o teste de referência mais aprofundado. Compara o EEA mais recente com o resultado do último DT (na mesma escala) para indicar se o funcionário está piorando ou melhorando desde essa última avaliação."
        />
      )}
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
