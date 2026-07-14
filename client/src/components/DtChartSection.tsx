import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Bar, BarChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Info } from "lucide-react";
import type { PontoDt } from "@/lib/mock-colaboradores";

type DtChartSectionProps = {
  data: PontoDt[];
};

const chartConfig = {
  dt: {
    label: "DT",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function DtChartSection({ data }: DtChartSectionProps) {
  const media = Math.round(data.reduce((sum, p) => sum + p.dt, 0) / data.length);

  return (
    <Card className="w-full py-0 shadow-sm">
      <CardHeader className="px-6 pt-6">
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
              ocorrências pontuais, não como uma linha contínua. A linha tracejada é a média
              do próprio histórico deste colaborador.
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="text-sm text-muted-foreground">Aplicado mensalmente ou em tratativas</p>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} style={{ fontSize: "12px" }} />
            <YAxis domain={[0, 750]} axisLine={false} tickLine={false} style={{ fontSize: "12px" }} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
            <ReferenceLine
              y={media}
              stroke="var(--color-dt)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{ value: `média: ${media}`, position: "insideTopRight", fontSize: 11, fill: "var(--color-dt)" }}
            />
            <Bar dataKey="dt" fill="var(--color-dt)" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
