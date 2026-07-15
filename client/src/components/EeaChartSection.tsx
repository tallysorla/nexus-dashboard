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
import { Area, AreaChart, CartesianGrid, ReferenceArea, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import type { PontoEea } from "@/lib/mock-colaboradores";

type EeaChartSectionProps = {
  data: PontoEea[];
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

export function EeaChartSection({ data }: EeaChartSectionProps) {
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
    <Card className="w-full py-0 shadow-sm">
      <CardHeader className="flex flex-col gap-4 px-6 pt-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Evolução do EEA</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Sobre o EEA" className="text-muted-foreground hover:text-foreground">
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                Teste diário. As faixas coloridas indicam as zonas de baixo, médio e alto risco.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">Aplicado todos os dias</p>
        </div>

        <Tabs value={range} onValueChange={(v) => setRange(v as Range)} className="w-full xl:w-auto">
          <TabsList className="grid h-11 w-full grid-cols-4 rounded-xl xl:w-auto">
            <TabsTrigger value="7" className="rounded-lg px-3 text-xs">7 dias</TabsTrigger>
            <TabsTrigger value="30" className="rounded-lg px-3 text-xs">30 dias</TabsTrigger>
            <TabsTrigger value="90" className="rounded-lg px-3 text-xs">90 dias</TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg px-3 text-xs">Todo período</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <div className="flex">
          {/* Eixo Y fixo: nao pode rolar junto com os dados, senao os numeros
              da lateral somem quando o grafico rola para os dias recentes. */}
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-12 shrink-0">
            <AreaChart data={visibleData} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
              <YAxis
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
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
              className="aspect-auto h-64 w-full"
              style={{ minWidth: chartWidth }}
            >
              <AreaChart data={visibleData} margin={{ left: 0, right: 24, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-eea)" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="var(--color-eea)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                <Area
                  type="monotone"
                  dataKey="eea"
                  stroke="var(--color-eea)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorEea)"
                />
                {/* Faixas desenhadas por ultimo (depois da area) para que o
                    rotulo de cada uma nunca fique escondido atras do
                    preenchimento quando o EEA estiver alto. */}
                <ReferenceArea
                  y1={70}
                  y2={100}
                  fill="#dc2626"
                  fillOpacity={0.07}
                  ifOverflow="visible"
                  label={{ value: "Alto risco", position: "insideTopRight", fontSize: 10, fill: "#dc2626" }}
                />
                <ReferenceArea
                  y1={40}
                  y2={70}
                  fill="#d97706"
                  fillOpacity={0.07}
                  ifOverflow="visible"
                  label={{ value: "Médio risco", position: "insideTopRight", fontSize: 10, fill: "#d97706" }}
                />
                <ReferenceArea
                  y1={0}
                  y2={40}
                  fill="#059669"
                  fillOpacity={0.07}
                  ifOverflow="visible"
                  label={{ value: "Baixo risco", position: "insideBottomRight", fontSize: 10, fill: "#059669" }}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
