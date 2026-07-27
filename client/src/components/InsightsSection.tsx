import {
  AlertTriangle,
  CalendarClock,
  Lightbulb,
  Minus,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  classificarRisco,
  diasDesde,
  ordenarFatoresPorRisco,
  parseDataBr,
  statusDoFator,
  tendenciaDoFator,
  tendenciaEeaVsUltimoDt,
  variacaoLabel,
  type Colaborador,
} from "@/lib/mock-colaboradores";

type Insight = {
  id: string;
  icon: LucideIcon;
  iconClassName: string;
  titulo: string;
  descricao: string;
};

// Ciclo esperado do DT e mensal (~30 dias) -- acima de 35 dias, o gestor ja
// deveria estar de olho num novo agendamento.
const DIAS_DT_ATRASO = 35;

// Cada insight e derivado de dado real do colaborador (nunca hardcoded) --
// se a condicao de origem nao se aplica (ex.: sem DT ainda), o insight
// correspondente simplesmente nao entra na lista, em vez de aparecer com um
// valor vazio ou inventado.
function gerarInsights(colaborador: Colaborador): Insight[] {
  const insights: Insight[] = [];

  const ultimoDt = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === "DT")
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime())[0];

  // Tendencia: so faz sentido comparando um EEA e um DT reais.
  if (colaborador.totalTestesEea > 0 && colaborador.totalTestesDt > 0 && ultimoDt) {
    const variacao = tendenciaEeaVsUltimoDt(colaborador.eea, colaborador.dt);
    const tendencia = tendenciaDoFator(variacao);
    const Icon = tendencia === "subindo" ? TrendingUp : tendencia === "descendo" ? TrendingDown : Minus;
    insights.push({
      id: "tendencia",
      icon: Icon,
      iconClassName: "bg-blue-50 text-blue-600",
      titulo: `${statusDoFator(tendencia)} desde o último DT`,
      descricao: `O EEA mais recente está ${variacaoLabel(variacao)} ${
        variacao >= 0 ? "melhor" : "pior"
      } que o último DT, realizado em ${ultimoDt.data}.`,
    });
  }

  // Fator prioritario: o de maior risco no ranking dinamico do ultimo EEA,
  // quando ele de fato estiver em medio/alto risco (nao ha o que destacar
  // se todos os 10 fatores estao em baixo risco).
  if (colaborador.totalTestesEea > 0) {
    const todos = [...colaborador.fatoresDestaque, ...colaborador.fatoresAdicionais];
    const [prioritario] = ordenarFatoresPorRisco(todos, "EEA");
    const riscoPrioritario = prioritario ? classificarRisco(prioritario.notaEea) : "baixo";
    if (prioritario && riscoPrioritario !== "baixo") {
      insights.push({
        id: "fator-prioritario",
        icon: AlertTriangle,
        iconClassName:
          riscoPrioritario === "alto" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600",
        titulo: `${prioritario.nome} é o fator de maior atenção`,
        descricao: `Esse é o fator com maior risco no último teste EEA realizado.`,
      });
    }
  }

  // Regularidade do DT: so faz sentido se ja houve pelo menos um.
  if (ultimoDt) {
    const dias = diasDesde(ultimoDt.data);
    const atrasado = dias > DIAS_DT_ATRASO;
    insights.push({
      id: "regularidade-dt",
      icon: CalendarClock,
      iconClassName: atrasado ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600",
      titulo: atrasado ? "DT pode estar atrasado" : "DT em dia",
      descricao: atrasado
        ? `Já se passaram ${dias} dias desde o último DT (${ultimoDt.data}). Considere agendar uma nova avaliação.`
        : `Último DT realizado há ${dias} dias (${ultimoDt.data}), dentro do ciclo mensal esperado.`,
    });
  }

  return insights;
}

export function InsightsSection({ colaborador }: { colaborador: Colaborador }) {
  const insights = gerarInsights(colaborador);

  return (
    <Card className="w-full gap-4 py-0 shadow-sm">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-lg">Insights automáticos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Leituras rápidas geradas a partir do histórico deste funcionário
        </p>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {insights.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center">
            <Lightbulb className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Ainda não há histórico suficiente</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Assim que o funcionário tiver mais testes realizados, os insights automáticos
              aparecem aqui.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {insights.map((insight) => (
              <div key={insight.id} className="flex items-start gap-3 rounded-xl border p-4">
                <div
                  className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${insight.iconClassName}`}
                >
                  <insight.icon className="size-4" />
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold">{insight.titulo}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {insight.descricao}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
