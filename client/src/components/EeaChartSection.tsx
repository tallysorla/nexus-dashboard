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
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  type PontoEea,
} from "@/lib/mock-colaboradores";

type EeaChartSectionProps = {
  data: PontoEea[];
  // Opcional: pontuacao do ultimo DT, desenhada como linha tracejada dentro
  // do proprio grafico do EEA (em vez de um card separado). So passado pela
  // tela /nfuncionarios em iteracao -- omitido, o grafico fica exatamente
  // como no /funcionarios publico.
  dtReferencia?: number;
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

export function EeaChartSection({ data, dtReferencia }: EeaChartSectionProps) {
  const [range, setRange] = useState<Range>("90");
  const scrollRef = useRef<HTMLDivElement>(null);

  const dias = range === "all" ? data.length : Math.min(Number(range), data.length);
  const visibleData = data.slice(-dias);
  const chartWidth = Math.max(MIN_CHART_WIDTH, visibleData.length * PX_PER_DAY);

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
                Teste diário. A faixa de fundo vermelha indica alto risco, âmbar médio risco e
                verde baixo risco.
                {dtReferencia !== undefined && " A linha tracejada mostra a pontuação do último DT realizado."}
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

        <p className="text-sm text-muted-foreground">Aplicado todos os dias</p>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="flex">
          {/* Eixo Y fixo: nao pode rolar junto com os dados, senao os numeros
              da lateral somem quando o grafico rola para os dias recentes.
              top/bottom precisam ser identicos aos do grafico principal ao
              lado, senao os dois ficam desalinhados verticalmente. */}
          <ChartContainer config={chartConfig} className="aspect-auto h-72 w-14 shrink-0">
            <AreaChart data={visibleData} margin={{ left: 8, right: 4, top: 8, bottom: 8 }}>
              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                interval={0}
                width={40}
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
              <AreaChart data={visibleData} margin={{ left: 0, right: 24, top: 8, bottom: 8 }}>
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
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-muted-foreground">EEA</span>
                              <span className="font-medium text-foreground">{value}</span>
                            </div>
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
                {/* Faixas desenhadas por ultimo (depois da area) para nunca
                    ficarem escondidas atras do preenchimento. Sem texto
                    dentro do grafico: qualquer posicao fixa eventualmente
                    coincide com o traçado e fica ilegivel -- a legenda de
                    cor fica no tooltip, fora da area de plotagem. */}
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
                      value: `DT: ${dtReferencia}/10`,
                      position: "insideTopRight",
                      fill: "var(--chart-2)",
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  />
                )}
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
