import { useState } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Award, CalendarClock, ClipboardCheck, Info } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  parseDataBr,
  type Fator,
  type TesteHistorico,
  type TipoTeste,
} from "@/lib/mock-colaboradores";

type FactorsSectionProps = {
  fatoresDestaque: Fator[];
  fatoresAdicionais: Fator[];
  historicoTestes: TesteHistorico[];
  // Opcional: esconde a nota numerica ("nota X/10") de cada fator, deixando
  // so o badge de status (Alto/Medio/Baixo risco). So passado pela tela
  // /nfuncionarios em iteracao -- omitido, a secao fica exatamente como no
  // /funcionarios publico.
  ocultarNota?: boolean;
};

type FatorExibido = { rank: number; nome: string; nota: number };

function FatorRow({
  factor,
  compact = false,
  ocultarNota = false,
}: {
  factor: FatorExibido;
  compact?: boolean;
  ocultarNota?: boolean;
}) {
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
            {!ocultarNota && (
              <p className="mt-0.5 text-xs text-muted-foreground">nota {factor.nota}/10</p>
            )}
          </>
        ) : (
          <>
            <p className="font-medium">{factor.nome}</p>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              {!ocultarNota && (
                <p className="text-xs text-muted-foreground">nota {factor.nota}/10</p>
              )}
              <Badge
                variant="outline"
                className={`shrink-0 rounded-lg px-2 py-0.5 text-xs ${RISCO_BADGE_CLASS[risco]} ${ocultarNota ? "ml-auto" : ""}`}
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

export function FactorsSection({
  fatoresDestaque,
  fatoresAdicionais,
  historicoTestes,
  ocultarNota = false,
}: FactorsSectionProps) {
  const [tipoFiltro, setTipoFiltro] = useState<TipoTeste>("EEA");

  // EEA e DT avaliam os MESMOS 10 fatores -- o toggle nunca esconde fatores,
  // so troca qual nota exibir (a do ultimo EEA ou a do ultimo DT).
  const notaExibida = (f: Fator) => (tipoFiltro === "EEA" ? f.notaEea : f.notaDt);
  const destaqueExibido: FatorExibido[] = fatoresDestaque.map((f) => ({
    rank: f.rank,
    nome: f.nome,
    nota: notaExibida(f),
  }));
  const adicionaisExibido: FatorExibido[] = fatoresAdicionais.map((f) => ({
    rank: f.rank,
    nome: f.nome,
    nota: notaExibida(f),
  }));
  const [principal, ...resto] = destaqueExibido;

  // So relevante pra DT: sem nenhum teste DT ainda, nao ha nota de DT real
  // pra mostrar (diferente de EEA, que todo colaborador ja tem desde o
  // primeiro dia).
  const semTesteDt = tipoFiltro === "DT" && !historicoTestes.some((t) => t.tipo === "DT");

  const ultimoTeste = [...historicoTestes]
    .filter((t) => t.tipo === tipoFiltro)
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime())[0];

  function updateTipoFiltro(value: string) {
    if (!value) return; // radix toggle group emits "" ao desmarcar; mantem a selecao atual
    setTipoFiltro(value as TipoTeste);
  }

  // Se nenhum dos 10 fatores (na nota do teste selecionado) chegou a risco
  // medio/alto, nao ha nada pra destacar -- mostra um estado vazio positivo
  // em vez das duas secoes (que ficariam cheias de badges "Baixo risco"
  // repetidos).
  const semFatorEmAtencao =
    !semTesteDt &&
    [...destaqueExibido, ...adicionaisExibido].every((factor) => classificarRisco(factor.nota) === "baixo");

  return (
    <Card className="w-full gap-4 py-0 shadow-sm">
      <CardHeader className="flex flex-col gap-4 px-6 pt-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <CardTitle className="text-lg">Principais fatores em atenção</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="Sobre os fatores em atenção"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-72">
                Lista dos fatores com maior impacto no último teste {tipoFiltro}, ordenados da maior
                para a menor criticidade. Use o toggle para ver os fatores já confirmados pelo EEA
                (diário) ou pelo DT (avaliação aprofundada).
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Os 10 fatores acompanhados, com base no último {tipoFiltro} realizado</span>
          </p>
          {ultimoTeste && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" />
              Teste em {ultimoTeste.data}
            </p>
          )}
        </div>

        <ToggleGroup
          type="single"
          variant="outline"
          value={tipoFiltro}
          onValueChange={updateTipoFiltro}
          className="h-11 shrink-0 rounded-xl bg-card"
        >
          <ToggleGroupItem value="EEA" className="px-4 text-xs">EEA</ToggleGroupItem>
          <ToggleGroupItem value="DT" className="px-4 text-xs">DT</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-6 pb-6">
        {semFatorEmAtencao ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
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
        ) : semTesteDt ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
            <p className="text-sm font-medium">Nenhum teste DT realizado ainda</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Assim que o primeiro DT for aplicado, os 10 fatores passam a ser exibidos também com
              base nele. Por enquanto, veja a aba EEA.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Maior risco no momento
              </p>
              {principal && (
                <div className="-mx-4 rounded-xl border bg-muted/30 p-4">
                  <FatorRow factor={principal} ocultarNota={ocultarNota} />
                </div>
              )}
              <div className="space-y-4">
                {resto.map((factor) => (
                  <FatorRow key={factor.rank} factor={factor} compact ocultarNota={ocultarNota} />
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Outros fatores acompanhados
              </p>
              <div className="space-y-4">
                {adicionaisExibido.map((factor) => (
                  <FatorRow key={factor.rank} factor={factor} compact ocultarNota={ocultarNota} />
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
