import { Link, useParams, useSearchParams } from "wouter";
import { Layout } from "@/components/Layout";
import { KpiMiniCards } from "@/components/MetricsCards";
import { FactorsSection } from "@/components/FactorsSection";
import { EeaChartSection } from "@/components/EeaChartSection";
import { DtChartSection } from "@/components/DtChartSection";
import { TestHistoryTable } from "@/components/TestHistoryTable";
import { UserCard } from "@/components/UserCard";
import { ArrowLeft } from "lucide-react";
import { getColaboradorById } from "@/lib/mock-colaboradores";
import NotFound from "@/pages/NotFound";

// Copia de ColaboradorProfile.tsx sob /nfuncionarios -- espaco reservado pra
// iterar no fluxo em refinamento sem tocar na tela /funcionarios ja
// compartilhada com o stakeholder.
export default function NFuncionarioProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const colaborador = getColaboradorById(id ?? "");

  if (!colaborador) {
    return <NotFound />;
  }

  const empresaEscopo = searchParams.get("empresa");
  const voltarHref = empresaEscopo ? `/nfuncionarios?empresa=${empresaEscopo}` : "/nfuncionarios";

  return (
    <Layout>
      <Link
        href={voltarHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para funcionários
      </Link>

      <h2 className="text-lg font-semibold leading-none">Detalhes do funcionário</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiMiniCards colaborador={colaborador} />

        <UserCard colaborador={colaborador} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.45fr)]">
        <FactorsSection
          fatoresDestaque={colaborador.fatoresDestaque}
          fatoresAdicionais={colaborador.fatoresAdicionais}
          historicoTestes={colaborador.historicoTestes}
        />
        <div className="flex flex-col gap-6">
          <EeaChartSection data={colaborador.serieEea} />
          <DtChartSection data={colaborador.serieDt} />
        </div>
      </div>

      <TestHistoryTable tests={colaborador.historicoTestes} colaboradorId={colaborador.id} />
    </Layout>
  );
}
