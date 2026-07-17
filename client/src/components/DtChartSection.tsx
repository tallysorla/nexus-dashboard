import { useState } from "react";
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
import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  type PontoDt,
} from "@/lib/mock-colaboradores";

type DtChartSectionProps = {
  data: PontoDt[];
};

type Range = "3" | "6" | "12";

const chartConfig = {
  dt: {
    label: "DT",
    color: "var(--chart-2)",
  },
  dtTratativa: {
    label: "DT",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function DtChartSection({ data }: DtChartSectionProps) {
  const [range, setRange] = useState<Range>("6");

  const meses = Math.min(Number(range), data.length);
  const visibleData = data.slice(-meses);
  const media = Math.round(visibleData.reduce((sum, p) => sum + p.dt, 0) / visibleData.length);

  return (
    <Card className="w-full gap-4 py-0 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 pt-6">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Evolução do DT</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Sobre o DT" className="text-muted-foreground hover:text-foreground">
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                Teste mais aprofundado, aplicado periodicamente ou como{" "}
                <span className="text-[var(--chart-3)]">tratativa</span> (barras azuis). A linha
                tracejada é a média do período.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm text-muted-foreground">
              Aplicado mensalmente ou em tratativas · Média do período: {media}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
                Ciclo mensal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: "var(--chart-3)" }} />
                Tratativa
              </span>
            </div>
          </div>
        </div>

        <Tabs value={range} onValueChange={(v) => setRange(v as Range)} className="shrink-0">
          <TabsList className="inline-grid h-10 grid-cols-3 rounded-xl">
            <TabsTrigger value="3" className="rounded-lg px-3 text-xs">3 meses</TabsTrigger>
            <TabsTrigger value="6" className="rounded-lg px-3 text-xs">6 meses</TabsTrigger>
            <TabsTrigger value="12" className="rounded-lg px-3 text-xs">12 meses</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <BarChart data={visibleData} margin={{ left: 8, right: 20, top: 8, bottom: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "12px" }} />
            <YAxis
              domain={[0, 750]}
              ticks={[0, 150, 300, 450, 600, 750]}
              interval={0}
              axisLine={false}
              tickLine={false}
              style={{ fontSize: "12px" }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, _name, item) => {
                    const origem = (item?.payload as PontoDt | undefined)?.origem;
                    const cor = origem === "tratativa" ? "var(--color-dtTratativa)" : "var(--color-dt)";
                    const risco = classificarRisco(Math.round((Number(value) / 750) * 100));
                    return (
                      <div className="flex w-full flex-col gap-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                            DT · {origem === "tratativa" ? "Tratativa" : "Ciclo mensal"}
                          </span>
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
            <Bar dataKey="dt" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {visibleData.map((ponto) => (
                <Cell
                  key={ponto.date}
                  fill={ponto.origem === "tratativa" ? "var(--color-dtTratativa)" : "var(--color-dt)"}
                />
              ))}
            </Bar>
            {/* Faixas e linha de media desenhadas por ultimo (depois das
                barras) para nunca ficarem escondidas atras de uma barra alta.
                Sem texto dentro do grafico: qualquer posicao fixa (canto da
                faixa, altura da media) eventualmente coincide com alguma
                barra alta e fica ilegivel -- a legenda de cor fica no
                cabecalho do card e no tooltip, fora da area de plotagem. */}
            <ReferenceArea y1={525} y2={750} fill="#dc2626" fillOpacity={0.05} ifOverflow="visible" />
            <ReferenceArea y1={300} y2={525} fill="#d97706" fillOpacity={0.05} ifOverflow="visible" />
            <ReferenceArea y1={0} y2={300} fill="#059669" fillOpacity={0.05} ifOverflow="visible" />
            <ReferenceLine y={media} stroke="var(--color-dt)" strokeDasharray="4 4" strokeOpacity={0.6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
