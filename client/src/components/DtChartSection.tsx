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
import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, ReferenceLine, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import type { PontoDt } from "@/lib/mock-colaboradores";

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
    <Card className="w-full py-0 shadow-sm">
      <CardHeader className="flex flex-col gap-4 px-6 pt-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Evolução do DT</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Sobre o DT" className="text-muted-foreground hover:text-foreground">
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                Teste mais aprofundado, aplicado com menor frequência — por isso aparece como
                ocorrências pontuais, não como uma linha contínua. As barras em{" "}
                <span className="text-[var(--chart-3)]">azul</span> são DTs feitos como
                tratativa (ex.: após uma sequência de EEA em alto risco), diferentes do ciclo
                mensal normal. A faixa de fundo vermelha/âmbar/verde indica alto/médio/baixo
                risco, e a linha tracejada é a média do próprio histórico deste funcionário no
                período selecionado.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
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

        <Tabs value={range} onValueChange={(v) => setRange(v as Range)} className="w-full xl:w-auto">
          <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl xl:w-auto">
            <TabsTrigger value="3" className="rounded-lg px-3 text-xs">3 meses</TabsTrigger>
            <TabsTrigger value="6" className="rounded-lg px-3 text-xs">6 meses</TabsTrigger>
            <TabsTrigger value="12" className="rounded-lg px-3 text-xs">12 meses</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <BarChart data={visibleData} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "12px" }} />
            <YAxis domain={[0, 750]} axisLine={false} tickLine={false} style={{ fontSize: "12px" }} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  formatter={(value, _name, item) => {
                    const origem = (item?.payload as PontoDt | undefined)?.origem;
                    const cor = origem === "tratativa" ? "var(--color-dtTratativa)" : "var(--color-dt)";
                    return (
                      <div className="flex w-full items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: cor }} />
                          DT · {origem === "tratativa" ? "Tratativa" : "Ciclo mensal"}
                        </span>
                        <span className="font-medium text-foreground">{value}</span>
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
            <ReferenceArea y1={525} y2={750} fill="#dc2626" fillOpacity={0.07} ifOverflow="visible" />
            <ReferenceArea y1={300} y2={525} fill="#d97706" fillOpacity={0.07} ifOverflow="visible" />
            <ReferenceArea y1={0} y2={300} fill="#059669" fillOpacity={0.07} ifOverflow="visible" />
            <ReferenceLine y={media} stroke="var(--color-dt)" strokeDasharray="4 4" strokeOpacity={0.6} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
