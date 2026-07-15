import { Layout } from "@/components/Layout";
import { MetricsCards } from "@/components/MetricsCards";
import { UserCard } from "@/components/UserCard";
import { FactorsSection } from "@/components/FactorsSection";
import { EeaChartSection } from "@/components/EeaChartSection";
import { DtChartSection } from "@/components/DtChartSection";
import { TestHistoryTable } from "@/components/TestHistoryTable";
import { colaboradorDestaque } from "@/lib/mock-colaboradores";

export default function Dashboard() {
  const colaborador = colaboradorDestaque;

  return (
    <Layout>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral de saúde emocional e testes recentes
        </p>
      </div>

      {/* Top Section: Metrics Cards + Colaborador em destaque */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <MetricsCards colaborador={colaborador} />
        </div>
        <div className="lg:col-span-1">
          <UserCard colaborador={colaborador} />
        </div>
      </div>

      {/* Middle Section: Factors + Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.45fr)]">
        <FactorsSection
          fatoresDestaque={colaborador.fatoresDestaque}
          fatoresAdicionais={colaborador.fatoresAdicionais}
        />
        <div className="flex flex-col gap-6">
          <EeaChartSection data={colaborador.serieEea} />
          <DtChartSection data={colaborador.serieDt} />
        </div>
      </div>

      {/* Bottom Section: Test History Table */}
      <TestHistoryTable tests={colaborador.historicoTestes} />
    </Layout>
  );
}
