import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowRight, CalendarClock, Info, Minus, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  mediaEea7Dias,
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
  badge?: ReactNode;
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

const TENDENCIA_BADGE_CLASS: Record<Tendencia, string> = {
  subindo: RISCO_BADGE_CLASS.baixo,
  descendo: RISCO_BADGE_CLASS.alto,
  estavel: "border-slate-200 bg-slate-50 text-slate-700",
};

// So o valor que muda (media do EEA) ganha cor de acordo com a tendencia --
// o DT fica neutro porque e so a referencia fixa, nao o dado que estamos
// avaliando.
const TENDENCIA_VALOR_CLASSE: Record<Tendencia, string> = {
  subindo: "text-emerald-600",
  descendo: "text-red-600",
  estavel: "text-foreground",
};

// "3,0" em vez de "3" -- casa com a media do EEA (que quase sempre tem uma
// casa decimal) sem o DT parecer um numero de tipo diferente ao lado dela.
function formatPontuacao(valor: number): string {
  return valor.toFixed(1).replace(".", ",");
}

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
      <div className="text-3xl font-semibold tracking-tight">
        {value}
        {valueSuffix && <span className="text-sm font-medium text-muted-foreground">{valueSuffix}</span>}
      </div>
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
  const mediaEea = mediaEea7Dias(colaborador.serieEea);
  // Usa colaborador.dt (o mesmo valor do card "Ultima pontuacao DT" ao lado)
  // em vez do registro isolado do historico, pra nunca poder divergir do que
  // ja esta exibido na tela.
  const tendenciaEeaValor = ultimoDt ? tendenciaEeaVsUltimoDt(mediaEea, colaborador.dt) : 0;
  const tendencia = tendenciaDoFator(tendenciaEeaValor);
  const TendenciaIcon = TENDENCIA_ICON[tendencia];

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
          label="Tendência"
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
          tooltip="A tendência compara a média do EEA nos últimos 7 dias com o último DT realizado. Ela só aparece depois que o funcionário tiver pelo menos um teste de cada tipo."
        />
      ) : (
        <KpiCard
          label="Tendência"
          value={
            <div className="w-full">
              <div className="flex items-center justify-between text-xs font-normal text-muted-foreground">
                <span>DT ({ultimoDt!.data.slice(0, 5)})</span>
                <span>Média EEA</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-2xl font-semibold text-foreground">{formatPontuacao(colaborador.dt)}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                <span className={`text-2xl font-semibold ${TENDENCIA_VALOR_CLASSE[tendencia]}`}>
                  {formatPontuacao(mediaEea)}
                </span>
              </div>
            </div>
          }
          meta={<div className="border-t pt-1" />}
          badge={
            <span className="flex items-center gap-1">
              <TendenciaIcon className="size-3.5" />
              {variacaoLabel(tendenciaEeaValor)} {statusDoFator(tendencia)}
            </span>
          }
          badgeClassName={TENDENCIA_BADGE_CLASS[tendencia]}
          sublabel="Com base nos últimos 7 dias de teste EEA"
          tooltip="Compara a média do EEA nos últimos 7 dias com a pontuação do último DT realizado (o teste de referência, mais aprofundado), para indicar se o funcionário está melhorando ou piorando desde essa última avaliação."
        />
      )}
    </>
  );
}
