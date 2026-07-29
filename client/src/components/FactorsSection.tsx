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
import { CalendarClock, Info } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRiscoPorTipo,
  ordenarFatoresPorRisco,
  parseDataBr,
  type Fator,
  type TesteHistorico,
  type TipoTeste,
} from "@/lib/mock-colaboradores";

type FactorsSectionProps = {
  fatoresDestaque: Fator[];
  fatoresAdicionais: Fator[];
  historicoTestes: TesteHistorico[];
  // Opcional: esconde a nota numerica ("nota X/100" ou "X/750") de cada
  // fator, deixando so o badge de status (Alto/Medio/Baixo risco).
  ocultarNota?: boolean;
  // Opcional: os 10 fatores juntos (destaque + adicionais). Em ambos os
  // casos (com ou sem esse prop), o split entre "Maior risco no momento" e
  // "Outros fatores acompanhados" e sempre recalculado por classificacao
  // real (medio/alto vs baixo) a cada troca do toggle EEA/DT -- nunca um
  // numero fixo de itens, entao "Maior risco" pode ter de 0 a 10 fatores.
  todosOsFatores?: Fator[];
};

type FatorExibido = { rank: number; nome: string; nota: number };

function FatorRow({
  factor,
  tipo,
  compact = false,
  ocultarNota = false,
}: {
  factor: FatorExibido;
  tipo: TipoTeste;
  compact?: boolean;
  ocultarNota?: boolean;
}) {
  const risco = classificarRiscoPorTipo(factor.nota, tipo);
  const sufixo = tipo === "EEA" ? "/100" : "/750";

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
              <p className="mt-0.5 text-xs text-muted-foreground">nota {factor.nota}{sufixo}</p>
            )}
          </>
        ) : (
          <>
            <p className="font-medium">{factor.nome}</p>
            <div className="mt-0.5 flex items-center justify-between gap-3">
              {!ocultarNota && (
                <p className="text-xs text-muted-foreground">nota {factor.nota}{sufixo}</p>
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
  todosOsFatores,
}: FactorsSectionProps) {
  const [tipoFiltro, setTipoFiltro] = useState<TipoTeste>("EEA");

  // EEA e DT avaliam os MESMOS 10 fatores -- o toggle nunca esconde fatores,
  // so troca qual nota exibir (a do ultimo EEA ou a do ultimo DT). "Maior
  // risco no momento" mostra SO os fatores em medio/alto risco (tamanho
  // variavel, de 0 a 10) -- nunca preenche com fatores em baixo risco so pra
  // completar 3 itens; esses ficam em "Outros fatores acompanhados" junto
  // com o resto.
  const notaExibida = (f: Fator) => (tipoFiltro === "EEA" ? f.notaEea : f.notaDt);
  const fatoresOrdenados = ordenarFatoresPorRisco(todosOsFatores ?? [...fatoresDestaque, ...fatoresAdicionais], tipoFiltro);
  const fatoresExibidos: FatorExibido[] = fatoresOrdenados.map((f) => ({
    rank: f.rank,
    nome: f.nome,
    nota: notaExibida(f),
  }));
  const destaqueExibido = fatoresExibidos.filter(
    (f) => classificarRiscoPorTipo(f.nota, tipoFiltro) !== "baixo"
  );
  const adicionaisExibido = fatoresExibidos.filter(
    (f) => classificarRiscoPorTipo(f.nota, tipoFiltro) === "baixo"
  );
  const [principal, ...resto] = destaqueExibido;

  // Sem nenhum teste do tipo selecionado (EEA ou DT) ainda, nao ha nota real
  // pra mostrar -- cobre tanto o caso "so falta o DT" (comum, DT e periodico)
  // quanto um funcionario recem-admitido que ainda nao fez teste nenhum.
  const outroTipo: TipoTeste = tipoFiltro === "EEA" ? "DT" : "EEA";
  const semTesteDoTipo = !historicoTestes.some((t) => t.tipo === tipoFiltro);
  const semTesteOutroTipo = !historicoTestes.some((t) => t.tipo === outroTipo);

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
  const semFatorEmAtencao = !semTesteDoTipo && destaqueExibido.length === 0;

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
            <span>
              {semTesteDoTipo
                ? `Os 10 fatores acompanhados, assim que o primeiro ${tipoFiltro} for realizado`
                : `Os 10 fatores acompanhados, com base no último ${tipoFiltro} realizado`}
            </span>
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
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
            <p className="text-sm font-medium">Nenhum fator em atenção</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Esse funcionário não tem nenhum fator em atenção no momento.
            </p>
          </div>
        ) : semTesteDoTipo ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
            <p className="text-sm font-medium">Nenhum teste {tipoFiltro} realizado ainda</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              {semTesteOutroTipo
                ? "Assim que o funcionário realizar o primeiro teste, os 10 fatores acompanhados passam a aparecer aqui."
                : `Assim que o primeiro ${tipoFiltro} for aplicado, os 10 fatores passam a ser exibidos também com base nele. Por enquanto, veja a aba ${outroTipo}.`}
            </p>
          </div>
        ) : (
          // flex-1 + justify-between numa lista UNICA (rotulo+destaque,
          // depois cada fator como irmao direto, depois rotulo+divisor,
          // depois cada fator adicional): quando o card cresce pra acompanhar
          // a altura combinada dos dois graficos ao lado (grid com items
          // stretch, ver ColaboradorProfile), o espaco
          // sobrando se distribui em incrementos iguais entre CADA fator (e
          // ao redor do divisor) -- nunca um unico vazio concentrado. O gap-4
          // e o minimo (usado quando nao ha sobra nenhuma); os rotulos ficam
          // colados ao elemento seguinte porque formam um unico item flex com
          // ele, entao nao recebem o espacamento extra distribuido entre os
          // irmaos da lista.
          <div className="flex flex-1 flex-col justify-between gap-4">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Maior risco no momento
              </p>
              {principal && (
                <div className="-mx-4 rounded-xl border bg-muted/30 p-4">
                  <FatorRow factor={principal} tipo={tipoFiltro} ocultarNota={ocultarNota} />
                </div>
              )}
            </div>

            {resto.map((factor) => (
              <FatorRow key={factor.rank} factor={factor} tipo={tipoFiltro} compact ocultarNota={ocultarNota} />
            ))}

            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Outros fatores acompanhados
              </p>
            </div>

            {adicionaisExibido.map((factor) => (
              <FatorRow key={factor.rank} factor={factor} tipo={tipoFiltro} compact ocultarNota={ocultarNota} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
