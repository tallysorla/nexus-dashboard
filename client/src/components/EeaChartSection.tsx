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
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
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
  const media = Math.round(data.reduce((sum, p) => sum + p.eea, 0) / data.length);
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
                Teste diário. A linha tracejada é a média do próprio histórico deste colaborador.
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
        <div ref={scrollRef} className="overflow-x-auto">
          <ChartContainer config={chartConfig} className="aspect-auto h-64" style={{ width: chartWidth }}>
            <AreaChart data={visibleData} margin={{ left: 0, right: 24, top: 8 }}>
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
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} style={{ fontSize: "12px" }} />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <ReferenceLine
                y={media}
                stroke="var(--color-eea)"
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{ value: `média: ${media}`, position: "insideTopRight", fontSize: 11, fill: "var(--color-eea)" }}
              />
              <Area
                type="monotone"
                dataKey="eea"
                stroke="var(--color-eea)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorEea)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
