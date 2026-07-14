import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  statusDoFator,
  tendenciaDoFator,
  variacaoLabel,
  type Fator,
  type Tendencia,
} from "@/lib/mock-colaboradores";

type FactorsSectionProps = {
  fatoresDestaque: Fator[];
  fatoresAdicionais: Fator[];
};

const TENDENCIA_ICON: Record<Tendencia, typeof TrendingUp> = {
  subindo: TrendingUp,
  estavel: Minus,
  descendo: TrendingDown,
};

const TENDENCIA_CLASS: Record<Tendencia, string> = {
  subindo: "text-red-600",
  estavel: "text-muted-foreground",
  descendo: "text-emerald-600",
};

function FatorRow({ factor, compact = false }: { factor: Fator; compact?: boolean }) {
  const tendencia = tendenciaDoFator(factor.variacaoPercentual);
  const risco = classificarRisco(factor.nota);
  const TendenciaIcon = TENDENCIA_ICON[tendencia];

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground ${
          compact ? "size-6 text-xs" : "size-8 text-sm"
        }`}
      >
        {factor.rank}
      </div>
      <div className="min-w-0 flex-1">
        <div className={compact ? "flex items-center justify-between gap-3" : "flex flex-wrap items-start justify-between gap-x-3 gap-y-1"}>
          <p className={compact ? "truncate text-sm font-medium" : "font-medium"}>{factor.nome}</p>
          <Badge
            variant="outline"
            className={`shrink-0 rounded-lg px-2 py-0.5 text-xs ${RISCO_BADGE_CLASS[risco]}`}
          >
            {RISCO_LABEL[risco]}
          </Badge>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span>nota {factor.nota}/100</span>
          <span className="text-border">·</span>
          <span className={`inline-flex items-center gap-1 ${TENDENCIA_CLASS[tendencia]}`}>
            <TendenciaIcon className="size-3" />
            {variacaoLabel(factor.variacaoPercentual)} · {statusDoFator(tendencia)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function FactorsSection({ fatoresDestaque, fatoresAdicionais }: FactorsSectionProps) {
  const [principal, ...resto] = fatoresDestaque;

  return (
    <Card className="w-full py-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 pt-6">
        <div className="space-y-1">
          <CardTitle className="text-lg">Principais fatores em atenção</CardTitle>
          <p className="text-sm text-muted-foreground">
            Os 10 fatores acompanhados, com nota e classificação de risco
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Sobre os fatores em atenção"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"
            >
              <AlertCircle className="size-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-72">
            Cada fator mostra sua nota atual (0–100, quanto maior pior) e a classificação de
            risco (Alto/Médio/Baixo), com base no teste mais recente do colaborador. O destaque
            no topo é o fator com maior variação no período, mesmo que ainda não esteja em
            risco alto.
          </TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent className="space-y-5 px-6 pb-6">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Maior variação no período
          </p>
          {principal && (
            <div className="rounded-xl border bg-muted/30 p-4">
              <FatorRow factor={principal} />
            </div>
          )}
          <div className="space-y-4">
            {resto.map((factor) => (
              <FatorRow key={factor.rank} factor={factor} compact />
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Outros fatores acompanhados
          </p>
          <div className="space-y-4">
            {fatoresAdicionais.map((factor) => (
              <FatorRow key={factor.rank} factor={factor} compact />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
