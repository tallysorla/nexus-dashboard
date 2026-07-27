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
import { Area, AreaChart, CartesianGrid, ComposedChart, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  type PontoEea,
  type RiskLevel,
} from "@/lib/mock-colaboradores";

const NIVEL_COR: Record<RiskLevel, string> = { alto: "#dc2626", medio: "#d97706", baixo: "#059669" };

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
    const risco = classificarRisco(ponto.eea);
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
} satisfies ChartConfig;

export function EeaChartSection({ data, dtReferencia, dtReferenciaData, linhaNeutra, ocultarEscala }: EeaChartSectionProps) {
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
                    {dtReferencia !== undefined && " A linha tracejada mostra a pontuação do último DT realizado."}
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
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
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
              <ComposedChart data={visibleData} margin={{ left: 0, right: 24, top: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="colorEea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-eea)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--color-eea)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
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
                <YAxis domain={[0, 10]} hide />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      formatter={(value) => {
                        const risco = classificarRisco(Number(value));
                        return (
                          <div className="flex w-full flex-col gap-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">EEA</span>
                              <span className="font-mono font-medium text-foreground">
                                {Number(value).toFixed(1)}/10
                              </span>
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
                <Area
                  type="monotone"
                  dataKey="eea"
                  stroke="var(--color-eea)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEea)"
                />
                <ReferenceArea y1={0} y2={3} fill="#dc2626" fillOpacity={0.05} ifOverflow="visible" />
                <ReferenceArea y1={3} y2={6} fill="#d97706" fillOpacity={0.05} ifOverflow="visible" />
                <ReferenceArea y1={6} y2={10} fill="#059669" fillOpacity={0.05} ifOverflow="visible" />
                {dtReferencia !== undefined && (
                  <ReferenceLine
                    y={dtReferencia}
                    stroke="var(--chart-2)"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    ifOverflow="visible"
                    label={{
                      value: dtReferenciaData ? `Último DT · ${dtReferenciaData}` : "Último DT",
                      position: "insideTopRight",
                      fill: "var(--chart-2)",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  />
                )}
              </ComposedChart>
            </ChartContainer>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  );
}
