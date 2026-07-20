import { Link, useParams, useSearchParams } from "wouter";
import { Layout } from "@/components/Layout";
import { KpiMiniCards } from "@/components/MetricsCards";
import { FactorsSection } from "@/components/FactorsSection";
import { EeaChartSection } from "@/components/EeaChartSection";
import { DtChartSection } from "@/components/DtChartSection";
import { TestHistoryTable } from "@/components/TestHistoryTable";
import { UserCard } from "@/components/UserCard";
import { CombinacoesCriticasAlert } from "@/components/CombinacoesCriticasAlert";
import { ArrowLeft } from "lucide-react";
import { getColaboradorById } from "@/lib/mock-colaboradores";
import { useProfile } from "@/contexts/ProfileContext";
import NotFound from "@/pages/NotFound";

export default function ColaboradorProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { profile } = useProfile();
  const colaborador = getColaboradorById(id ?? "");

  if (!colaborador) {
    return <NotFound />;
  }

  const empresaEscopo = searchParams.get("empresa");
  const voltarHref = empresaEscopo ? `/funcionarios?empresa=${empresaEscopo}` : "/funcionarios";

  return (
    <Layout>
      <Link
        href={voltarHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para funcionários
      </Link>

      {/* So perfis gestores (quem tem "risco" no nav) veem as combinacoes
          criticas do funcionario -- o Avaliador nao deve ter acesso a essa
          informacao, mesmo que consiga abrir esta tela. */}
      {profile.nav.includes("risco") && <CombinacoesCriticasAlert colaboradorId={colaborador.id} />}

      <div className="space-y-1">
        <h2 className="text-lg font-semibold leading-none">Últimos testes realizados</h2>
        <p className="text-sm text-muted-foreground">Resultado mais recente por indicador · há 1 mês</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiMiniCards colaborador={colaborador} />

        <UserCard colaborador={colaborador} />
      </div>

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

      <TestHistoryTable tests={colaborador.historicoTestes} />
    </Layout>
  );
}
