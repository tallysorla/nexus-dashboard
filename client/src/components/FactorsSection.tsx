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
import { Award, ClipboardCheck, Info } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRiscoDT,
  type Fator,
} from "@/lib/mock-colaboradores";

type FactorsSectionProps = {
  fatoresDestaque: Fator[];
  fatoresAdicionais: Fator[];
};

function FatorRow({ factor, compact = false }: { factor: Fator; compact?: boolean }) {
  const risco = classificarRiscoDT(factor.nota);

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
            <p className="mt-0.5 text-xs text-muted-foreground">nota {factor.nota}/75</p>
          </>
        ) : (
          <>
            <p className="font-medium">{factor.nome}</p>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">nota {factor.nota}/75</p>
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

  // Se nenhum dos 10 fatores acompanhados chegou a risco medio/alto, nao ha
  // nada pra destacar -- mostra um estado vazio positivo em vez das duas
  // secoes (que ficariam cheias de badges "Baixo risco" repetidos).
  const semFatorEmAtencao = [...fatoresDestaque, ...fatoresAdicionais].every(
    (factor) => classificarRiscoDT(factor.nota) === "baixo",
  );

  return (
    <Card className="w-full gap-4 py-0 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 px-6 pt-6">
        <div className="space-y-0.5">
          <CardTitle className="text-lg">Principais fatores em atenção</CardTitle>
          <p className="text-sm text-muted-foreground">
            Os 10 fatores acompanhados, com base no último DT realizado
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="Sobre os fatores em atenção"
              className="text-muted-foreground hover:text-foreground"
            >
              <Info className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-72">
            Lista dos fatores com maior impacto no último teste DT, ordenados da maior para a
            menor criticidade.
          </TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {semFatorEmAtencao ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-primary/10">
              <ClipboardCheck className="size-11 text-primary" />
            </div>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <p className="text-lg font-semibold">Nenhum fator em atenção</p>
                <div className="mx-auto h-0.5 w-10 rounded-full bg-primary" />
              </div>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                Muito bem! Esse funcionário não tem nenhum fator em atenção no momento.
              </p>
            </div>
            <div className="flex w-full items-center gap-3 rounded-xl bg-primary/5 p-4 text-left">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Award className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground">
                  Continue acompanhando os próximos testes para manter os resultados sempre
                  positivos.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Maior risco no momento
              </p>
              {principal && (
                <div className="-mx-4 rounded-xl border bg-muted/30 p-4">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
