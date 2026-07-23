import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CalendarClock, Info, type LucideIcon } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  parseDataBr,
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
  // Renderiza entre o valor e o badge -- ex.: data do teste que gerou esse
  // valor. Fica antes do badge de risco pra seguir a leitura "quanto, quando,
  // qual o nivel".
  meta?: ReactNode;
  badge?: string;
  badgeClassName?: string;
  sublabel?: string;
  tooltip?: string;
  extra?: ReactNode;
};

// Subir e melhorar aqui (nota mais alta de EEA/DT normalizado = mais bem
// estar), entao a seta de tendencia usa verde pra "subindo" e vermelho pra
// "descendo" -- a leitura intuitiva de "seta pra cima = bom".
const TENDENCIA_VALOR_CLASSE: Record<Tendencia, string> = {
  subindo: "text-emerald-600",
  descendo: "text-red-600",
  estavel: "text-muted-foreground",
};

export function KpiCard({ icon: Icon, iconClassName, label, value, valueSuffix, meta, badge, badgeClassName, sublabel, tooltip, extra }: KpiCardProps) {
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
      {meta}
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
  const dtRisco = classificarRisco(colaborador.dt);

  const ultimoEea = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === "EEA")
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime())[0];
  const ultimoDt = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === "DT")
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime())[0];

  // A tendencia so faz sentido quando ja existe pelo menos 1 EEA e 1 DT
  // realizados -- sem os dois, nao ha o que comparar (mostra blank state
  // em vez de um numero calculado a partir de dado inexistente).
  const semDadosSuficientes = colaborador.totalTestesEea === 0 || colaborador.totalTestesDt === 0;
  const tendenciaEeaValor = tendenciaEeaVsUltimoDt(colaborador.eea, colaborador.dt);
  const tendencia = tendenciaDoFator(tendenciaEeaValor);

  return (
    <>
      <KpiCard
        label="Última pontuação EEA"
        value={String(colaborador.eea)}
        valueSuffix="/10"
        meta={
          ultimoEea && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" />
              Teste em {ultimoEea.data}
            </span>
          )
        }
        badge={RISCO_LABEL[eeaRisco]}
        badgeClassName={RISCO_BADGE_CLASS[eeaRisco]}
        sublabel={`${colaborador.totalTestesEea} testes EEA ao todo`}
        tooltip="Representa o resultado do último teste EEA realizado pelo funcionário."
      />
      <KpiCard
        label="Última pontuação DT"
        value={String(colaborador.dt)}
        valueSuffix="/10"
        meta={
          ultimoDt && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" />
              Teste em {ultimoDt.data}
            </span>
          )
        }
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
            tendencia === "descendo" ? RISCO_BADGE_CLASS.alto : "border-slate-200 bg-slate-50 text-slate-700"
          }
          sublabel="EEA atual em relação ao último DT realizado"
          tooltip="O DT é o teste de referência mais aprofundado. Compara o EEA mais recente com o resultado do último DT (na mesma escala) para indicar se o funcionário está piorando ou melhorando desde essa última avaliação."
        />
      )}
    </>
  );
}
