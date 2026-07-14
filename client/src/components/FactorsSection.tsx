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
import { AlertCircle } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  type Fator,
} from "@/lib/mock-colaboradores";

type FactorsSectionProps = {
  fatoresDestaque: Fator[];
  fatoresAdicionais: Fator[];
};

function FatorRow({ factor, compact = false }: { factor: Fator; compact?: boolean }) {
  const risco = classificarRisco(factor.nota);

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
        {compact ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-medium">{factor.nome}</p>
              <Badge
                variant="outline"
                className={`shrink-0 rounded-lg px-2 py-0.5 text-xs ${RISCO_BADGE_CLASS[risco]}`}
              >
                {RISCO_LABEL[risco]}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">nota {factor.nota}/100</p>
          </>
        ) : (
          <>
            <p className="font-medium">{factor.nome}</p>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">nota {factor.nota}/100</p>
              <Badge
                variant="outline"
                className={`shrink-0 rounded-lg px-2 py-0.5 text-xs ${RISCO_BADGE_CLASS[risco]}`}
              >
                {RISCO_LABEL[risco]}
              </Badge>
            </div>
          </>
        )}
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
            risco (Alto/Médio/Baixo), com base no teste mais recente do colaborador. Os
            fatores em destaque no topo são os de maior nota de risco.
          </TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent className="space-y-5 px-6 pb-6">
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Maior risco no momento
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
