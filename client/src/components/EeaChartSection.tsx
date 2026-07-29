import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { AreaChart, CartesianGrid, ComposedChart, Line, ReferenceArea, XAxis, YAxis } from "recharts";
import { Info, Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRiscoDt,
  classificarRiscoEea,
  parseDataCurta,
  type PontoDt,
  type PontoEea,
  type RiskLevel,
} from "@/lib/mock-colaboradores";

// Escala do DT (0-750) plotada no mesmo eixo Y do EEA (0-100): a linha do DT
// vigente usa um valor ESCALADO so pra posicionamento (dtVigente * ESCALA_DT),
// nunca exibido -- tooltip e classificacao de risco sempre usam o valor real
// (revertendo a escala: dividir de volta por ESCALA_DT).
const ESCALA_DT = 100 / 750;

const NIVEL_COR: Record<RiskLevel, string> = { alto: "#dc2626", medio: "#d97706", baixo: "#059669" };
// Menor numero = pior (usado so pra comparar "previsto pelo DT" x "realizado
// no EEA" no insight abaixo do grafico -- nao confundir com RISCO_LABEL, que
// e so pra exibicao).
const ORDEM_NIVEL: Record<RiskLevel, number> = { alto: 0, medio: 1, baixo: 2 };
// Versao curta minuscula de RISCO_LABEL (que e "Alto risco" etc.), usada no
// titulo "Nível de risco {nivel} mantido" -- so precisa do nome do nivel, sem
// repetir a palavra "risco".
const NIVEL_LABEL_CURTO: Record<RiskLevel, string> = { alto: "alto", medio: "médio", baixo: "baixo" };

type SegmentoEea = {
  risco: RiskLevel;
  inicio: string;
  fim: string;
  dias: number;
};

// Agrupa dias consecutivos com a MESMA classificacao num unico segmento --
// base da visualizacao em timeline. Sem pontuacao, o que importa pro gestor
// e ha quantos dias o funcionario esta num certo nivel e quando isso mudou,
// nao cada dia isolado competindo por atencao igual aos outros 89.
function segmentarPorRisco(dados: PontoEea[]): SegmentoEea[] {
  const segmentos: SegmentoEea[] = [];
  for (const ponto of dados) {
    const risco = classificarRiscoEea(ponto.eea);
    const atual = segmentos[segmentos.length - 1];
    if (atual && atual.risco === risco) {
      atual.fim = ponto.date;
      atual.dias += 1;
    } else {
      segmentos.push({ risco, inicio: ponto.date, fim: ponto.date, dias: 1 });
    }
  }
  return segmentos;
}

type EeaChartSectionProps = {
  data: PontoEea[];
  // Opcional: pontuacao do ultimo DT, desenhada como linha tracejada dentro
  // do proprio grafico do EEA (em vez de um card separado). So passado pela
  // tela /nfuncionarios em iteracao -- omitido, o grafico fica exatamente
  // como no /funcionarios publico.
  dtReferencia?: number;
  // Data do teste DT que originou dtReferencia -- exibida junto do rotulo da
  // linha tracejada ("Último DT · 01/07/2026") pra deixar claro de qual
  // avaliação aquele valor de referência veio. So faz sentido quando
  // dtReferencia tambem esta presente.
  dtReferenciaData?: string;
  // Opcional: historico completo de DT do funcionario, usado pra desenhar a
  // linha tracejada como um DEGRAU que muda de valor a cada teste DT (nao um
  // unico valor fixo) -- o DT e mensal, entao o "DT vigente" muda mes a mes, e
  // olhar 90 dias/todo o periodo precisa mostrar essa evolucao inteira, nao
  // so a pontuacao do ultimo teste. Sem esse prop, a linha nao aparece.
  serieDt?: PontoDt[];
  // Opcional: troca o preenchimento em area (cor fixa do tema) por uma linha
  // fina com marcadores, numa cor neutra. Tentamos antes colorir a linha
  // conforme o risco atual, mas o proprio funcionario apontou o problema: a
  // linha passa por varios status ao longo das datas, entao uma cor unica
  // baseada so no ponto mais recente nao representa o percurso inteiro. Uma
  // cor neutra (sem pretender comunicar risco) evita essa contradicao -- quem
  // comunica o nivel de risco sao as faixas de fundo, nao a linha. So
  // passado pela tela /nfuncionarios em iteracao.
  linhaNeutra?: boolean;
  // Opcional: esconde os numeros do eixo Y (0-10), deixando so as faixas de
  // fundo coloridas como referencia de risco. So passado pela tela
  // /nfuncionarios em iteracao -- omitido, o grafico fica exatamente como no
  // /funcionarios publico.
  ocultarEscala?: boolean;
};

type Range = "7" | "30" | "90" | "all";

const PX_PER_DAY = 42;
const MIN_CHART_WIDTH = 600;

const chartConfig = {
  eea: {
    label: "EEA",
    color: "var(--chart-1)",
  },
  dtVigenteEscalado: {
    label: "DT",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function EeaChartSection({
  data,
  dtReferencia,
  dtReferenciaData,
  serieDt,
  linhaNeutra,
  ocultarEscala,
}: EeaChartSectionProps) {
  const [range, setRange] = useState<Range>("90");
  const scrollRef = useRef<HTMLDivElement>(null);

  const semDados = data.length === 0;
  const dias = range === "all" ? data.length : Math.min(Number(range), data.length);
  const visibleData = data.slice(-dias);
  const chartWidth = Math.max(MIN_CHART_WIDTH, visibleData.length * PX_PER_DAY);
  const segmentos = linhaNeutra ? segmentarPorRisco(visibleData) : [];

  // Marcador vertical do ultimo DT: so aparece quando a propria data do teste
  // cai dentro do periodo visivel no momento -- e um evento pontual na linha
  // do tempo, entao faz sentido sumir quando o gestor troca pra um recorte
  // (ex.: "7 dias") que nao inclui aquela data, em vez de ficar sempre visivel
  // desencostado do tempo (como era a linha horizontal por nivel de risco).
  const dtIndexNoRange = dtReferenciaData
    ? visibleData.findIndex((p) => p.date === dtReferenciaData.slice(0, 5))
    : -1;
  const marcadorDtOffset = dtIndexNoRange >= 0 ? (dtIndexNoRange + 0.5) * PX_PER_DAY : null;

  // DT vigente por dia: pra cada dia do EEA, qual foi o ultimo teste DT
  // realizado ate aquela data -- o DT e mensal, entao esse valor muda a cada
  // novo teste (mes com baixo risco, mes seguinte com medio, etc.), formando
  // um degrau ao longo do periodo em vez de uma unica linha reta com a
  // pontuacao do ultimo DT. Sem nenhum DT ainda realizado ate aquele dia, o
  // ponto fica sem valor (undefined) e a linha simplesmente nao comeca ainda.
  const dtOrdenado = [...(serieDt ?? [])].sort(
    (a, b) => parseDataCurta(a.date).getTime() - parseDataCurta(b.date).getTime()
  );
  const visibleDataComDt = visibleData.map((ponto) => {
    const dataPonto = parseDataCurta(ponto.date);
    let dtVigente: number | undefined;
    for (const p of dtOrdenado) {
      if (parseDataCurta(p.date).getTime() <= dataPonto.getTime()) dtVigente = p.dt;
      else break;
    }
    return {
      ...ponto,
      dtVigenteEscalado: dtVigente !== undefined ? dtVigente * ESCALA_DT : undefined,
    };
  });

  // Insight "previsto (DT) x realizado (EEA)": compara a classificacao do
  // ULTIMO teste EEA feito (nao a predominante num periodo, que mudava
  // conforme o filtro 7/30/90/todo periodo -- o mesmo funcionario nao pode
  // "melhorar" ou "piorar" so porque o gestor trocou a aba) com a
  // classificacao do ultimo DT. Usa `data` (serie completa), nao
  // `visibleData`, porque o dia mais recente e o mesmo em qualquer recorte.
  const riscoDt = dtReferencia !== undefined ? classificarRiscoDt(dtReferencia) : undefined;
  const ultimoPontoEea = data.length > 0 ? data[data.length - 1] : undefined;
  const riscoUltimoEea = ultimoPontoEea ? classificarRiscoEea(ultimoPontoEea.eea) : undefined;
  // ORDEM_NIVEL maior = risco mais baixo (mais seguro) -- ultimo EEA "melhor"
  // que o previsto pelo DT quando ficou num nivel mais seguro do que aquele
  // que o DT indicava.
  const comparacaoInsight =
    riscoDt === undefined || riscoUltimoEea === undefined
      ? "igual"
      : ORDEM_NIVEL[riscoUltimoEea] > ORDEM_NIVEL[riscoDt]
        ? "melhor"
        : ORDEM_NIVEL[riscoUltimoEea] < ORDEM_NIVEL[riscoDt]
          ? "pior"
          : "igual";
  // Seta pra cima = risco subindo (pior), seta pra baixo = risco caindo
  // (melhor) -- a direcao acompanha o sentido literal do titulo ("em
  // elevacao"/"em reducao"), nao o julgamento de valor.
  const IconeInsight = comparacaoInsight === "pior" ? TrendingUp : comparacaoInsight === "melhor" ? TrendingDown : Minus;
  const corInsight =
    comparacaoInsight === "melhor" ? "text-emerald-600" : comparacaoInsight === "pior" ? "text-red-600" : "text-blue-600";
  const tituloInsight =
    comparacaoInsight === "melhor"
      ? "Nível de risco em redução"
      : comparacaoInsight === "pior"
        ? "Nível de risco em elevação"
        : `Nível de risco ${NIVEL_LABEL_CURTO[riscoUltimoEea ?? "baixo"]} mantido`;
  // Datas curtas (dd/mm, sem ano) do ultimo EEA e do DT de referencia -- o
  // ano fica implicito pelo contexto (testes recentes), o dia/mes ja basta
  // pra deixar explicito DE QUAL teste cada classificacao veio.
  const dataUltimoEeaCurta = ultimoPontoEea?.date ?? "";
  const dtCurta = dtReferenciaData ? dtReferenciaData.slice(0, 5) : "";
  const descricaoInsight =
    comparacaoInsight === "pior"
      ? `Monitoramento com EEA de ${dataUltimoEeaCurta} indica elevação do nível de risco avaliado no DT de ${dtCurta}. Recomenda-se reavaliação das medidas de prevenção.`
      : comparacaoInsight === "melhor"
        ? `Monitoramento com EEA de ${dataUltimoEeaCurta} indica redução do nível de risco avaliado no DT de ${dtCurta}.`
        : `Monitoramento com EEA de ${dataUltimoEeaCurta} indica manutenção do nível de risco avaliado no DT de ${dtCurta}.`;

  // Ao trocar de periodo, comeca mostrando os dias mais recentes (extremidade
  // direita), ja que sao os mais relevantes para o gestor.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [range, dias]);

  return (
    <Card className="w-full gap-4 py-0 shadow-sm">
      {/* Titulo e Tabs na mesma linha, com o subtitulo isolado abaixo (livre
          pra quebrar sem empurrar os Tabs). O TabsList tem largura fixa
          (w-96) igual nos dois graficos -- o EEA tem 4 opcoes de periodo e o
          DT so 3, entao sem essa largura compartilhada os dois quebrariam de
          linha em pontos diferentes (ver DtChartSection para o mesmo
          ajuste), deixando os filtros em alturas inconsistentes entre os
          dois cards. Com a mesma largura, ou os dois cabem na linha do
          titulo, ou os dois quebram juntos -- nunca um sem o outro. */}
      <CardHeader className="flex flex-col items-stretch gap-2 px-6 pt-6">
        <div className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Evolução do EEA</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Sobre o EEA" className="text-muted-foreground hover:text-foreground">
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                {linhaNeutra ? (
                  <>
                    Teste diário. Cada bloco representa um período contínuo na mesma
                    classificação de risco — vermelho alto, âmbar médio, verde baixo.
                    {dtReferencia !== undefined && marcadorDtOffset !== null && " A linha tracejada marca a data do último DT realizado."}
                  </>
                ) : (
                  <>
                    Teste diário. A faixa de fundo vermelha indica alto risco, âmbar médio risco e
                    verde baixo risco.
                    {serieDt && serieDt.length > 0 &&
                      " A linha tracejada mostra o DT (Diagnóstico de Tendência) vigente em cada período — ela muda de valor a cada novo teste DT realizado."}
                  </>
                )}
              </TooltipContent>
            </Tooltip>
          </div>

          <Tabs value={range} onValueChange={(v) => setRange(v as Range)} className="shrink-0">
            <TabsList className="grid h-9 w-96 grid-cols-4 rounded-xl">
              <TabsTrigger value="7" className="rounded-lg px-2 text-xs">7 dias</TabsTrigger>
              <TabsTrigger value="30" className="rounded-lg px-2 text-xs">30 dias</TabsTrigger>
              <TabsTrigger value="90" className="rounded-lg px-2 text-xs">90 dias</TabsTrigger>
              <TabsTrigger value="all" className="rounded-lg px-2 text-xs">Todo período</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <p className="text-sm text-muted-foreground">
          {semDados ? "Nenhum teste EEA realizado ainda" : "Aplicado todos os dias"}
        </p>

        {!semDados && !linhaNeutra && (
          // So as duas series (EEA/DT) na legenda -- o significado das cores
          // de risco fica dentro do proprio grafico agora (rotulo "Alto/
          // Medio/Baixo risco" escrito dentro de cada faixa, ver
          // ReferenceArea abaixo), entao nao precisa repetir isso aqui.
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
              EEA Diário
            </span>
            {serieDt && serieDt.length > 0 && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: "var(--chart-2)" }} />
                DT Mensal
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {semDados ? (
          <div className="flex h-72 flex-col items-center justify-center gap-2 text-center">
            <p className="text-sm font-medium">Nenhum teste EEA realizado ainda</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Assim que o funcionário realizar o primeiro teste EEA, a evolução aparece aqui.
            </p>
          </div>
        ) : linhaNeutra ? (
          // Timeline segmentada: dias consecutivos na mesma classificacao
          // viram um unico bloco (largura = duracao), em vez de uma barra por
          // dia -- o olho vai direto pras transicoes de risco, que e a
          // informacao que importa pro gestor, e nao compete com 90 blocos
          // iguais. O valor exato de um dia especifico fica na tabela de
          // testes realizados, abaixo do grafico (ver TestHistoryTable).
          <div ref={scrollRef} className="overflow-x-auto pb-1">
            <div className="relative pt-6" style={{ width: chartWidth, minWidth: chartWidth }}>
              {marcadorDtOffset !== null && (
                <div
                  className="pointer-events-none absolute top-6 bottom-0 z-10 border-l-2 border-dashed"
                  style={{ left: marcadorDtOffset, borderColor: "var(--chart-2)" }}
                >
                  <span
                    className="absolute -top-6 left-1 whitespace-nowrap text-[11px] font-medium"
                    style={{ color: "var(--chart-2)" }}
                  >
                    Último DT · {dtReferenciaData}
                  </span>
                </div>
              )}

              <div className="flex overflow-hidden rounded-lg">
                {segmentos.map((seg, i) => {
                  const largura = seg.dias * PX_PER_DAY;
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div
                          className="flex h-16 items-center justify-center"
                          style={{
                            width: largura,
                            backgroundColor: NIVEL_COR[seg.risco],
                            borderRight: i < segmentos.length - 1 ? "1px solid var(--card)" : undefined,
                          }}
                        >
                          {largura >= 44 && (
                            <span className="px-1 text-[11px] font-semibold text-white">
                              {seg.dias} {seg.dias === 1 ? "dia" : "dias"}
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={`w-fit rounded-lg px-2 py-0.5 text-xs ${RISCO_BADGE_CLASS[seg.risco]}`}
                          >
                            {RISCO_LABEL[seg.risco]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {seg.dias === 1 ? seg.inicio : `${seg.inicio} a ${seg.fim}`} · {seg.dias}{" "}
                            {seg.dias === 1 ? "dia" : "dias"}
                          </span>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>

              <div className="mt-1.5 flex">
                {segmentos.map((seg, i) => {
                  const largura = seg.dias * PX_PER_DAY;
                  const rotulo = seg.dias === 1 ? seg.inicio : `${seg.inicio} – ${seg.fim}`;
                  return (
                    <div key={i} style={{ width: largura }} className="flex justify-center overflow-hidden">
                      {largura >= 64 && <span className="truncate text-[11px] text-muted-foreground">{rotulo}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
        <>
        <div className="flex">
          {/* Eixo Y fixo: nao pode rolar junto com os dados, senao os numeros
              da lateral somem quando o grafico rola para os dias recentes.
              top/bottom precisam ser identicos aos do grafico principal ao
              lado, senao os dois ficam desalinhados verticalmente. */}
          <ChartContainer
            config={chartConfig}
            className={`aspect-auto h-72 shrink-0 ${ocultarEscala ? "w-4" : "w-14"}`}
          >
            <AreaChart data={visibleData} margin={{ left: 8, right: 4, top: 8, bottom: 8 }}>
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                interval={0}
                width={ocultarEscala ? 8 : 40}
                tick={!ocultarEscala}
                axisLine={false}
                tickLine={false}
                style={{ fontSize: "12px" }}
              />
              <XAxis dataKey="date" hide height={dias > 14 ? 40 : 24} />
            </AreaChart>
          </ChartContainer>

          <div ref={scrollRef} className="min-w-0 flex-1 overflow-x-auto">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-72 w-full"
              style={{ minWidth: chartWidth }}
            >
              <ComposedChart data={visibleDataComDt} margin={{ left: 32, right: 24, top: 8, bottom: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  angle={dias > 14 ? -45 : 0}
                  textAnchor={dias > 14 ? "end" : "middle"}
                  height={dias > 14 ? 40 : 24}
                  style={{ fontSize: "12px" }}
                />
                <YAxis domain={[0, 100]} hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value, name) => {
                        if (value === undefined || value === null) return null;
                        const ehDt = name === "dtVigenteEscalado";
                        // dtVigenteEscalado so existe pra posicionar a linha no
                        // mesmo eixo 0-100 do EEA -- aqui revertemos pro valor
                        // real (0-750) antes de classificar. O DT nesse grafico
                        // mostra so o status (sem numero); o EEA continua
                        // mostrando a nota, ja que o grafico de evolucao e o
                        // unico lugar do app onde a nota aparece.
                        const valorReal = ehDt ? Number(value) / ESCALA_DT : Number(value);
                        const risco = ehDt ? classificarRiscoDt(valorReal) : classificarRiscoEea(valorReal);
                        const rotulo = ehDt ? "DT vigente" : "EEA";
                        return (
                          <div className="flex w-full flex-col gap-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">{rotulo}</span>
                              {!ehDt && (
                                <span className="font-mono font-medium text-foreground">
                                  {Math.round(valorReal)}/100
                                </span>
                              )}
                            </span>
                            <Badge
                              variant="outline"
                              className={`w-fit rounded-lg px-2 py-0.5 text-xs ${RISCO_BADGE_CLASS[risco]}`}
                            >
                              {RISCO_LABEL[risco]}
                            </Badge>
                          </div>
                        );
                      }}
                    />
                  }
                />
                <ReferenceArea
                  y1={70}
                  y2={100}
                  fill="#dc2626"
                  fillOpacity={0.05}
                  ifOverflow="visible"
                  label={{ value: "Alto risco", position: "insideRight", fill: "#dc2626", fontSize: 12, fontWeight: 600 }}
                />
                <ReferenceArea
                  y1={40}
                  y2={70}
                  fill="#d97706"
                  fillOpacity={0.05}
                  ifOverflow="visible"
                  label={{ value: "Médio risco", position: "insideRight", fill: "#d97706", fontSize: 12, fontWeight: 600 }}
                />
                <ReferenceArea
                  y1={0}
                  y2={40}
                  fill="#059669"
                  fillOpacity={0.05}
                  ifOverflow="visible"
                  label={{ value: "Baixo risco", position: "insideRight", fill: "#059669", fontSize: 12, fontWeight: 600 }}
                />
                {serieDt && serieDt.length > 0 && (
                  <Line
                    type="stepAfter"
                    dataKey="dtVigenteEscalado"
                    stroke="var(--chart-2)"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                    connectNulls={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="eea"
                  stroke="var(--color-eea)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "var(--color-eea)", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ChartContainer>
          </div>
        </div>

        {dtReferencia !== undefined && riscoDt && (
          <div className="mt-4 flex items-start gap-3 border-t pt-4">
            <IconeInsight className={`mt-0.5 size-5 shrink-0 ${corInsight}`} />
            <div>
              <p className="text-sm font-semibold">{tituloInsight}</p>
              <p className="text-sm text-muted-foreground">{descricaoInsight}</p>
            </div>
          </div>
        )}
        </>
        )}
      </CardContent>
    </Card>
  );
}
