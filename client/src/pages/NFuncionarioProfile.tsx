import { Link, useParams, useSearchParams } from "wouter";
import { Layout } from "@/components/Layout";
import { KpiCard } from "@/components/MetricsCards";
import { FactorsSection } from "@/components/FactorsSection";
import { EeaChartSection } from "@/components/EeaChartSection";
import { DtChartSection } from "@/components/DtChartSection";
import { TestHistoryTable } from "@/components/TestHistoryTable";
import { UserCard } from "@/components/UserCard";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarClock } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRisco,
  getColaboradorById,
  parseDataBr,
} from "@/lib/mock-colaboradores";
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

  // So o status (Alto/Medio/Baixo risco) fica visivel aqui -- sem a nota
  // numerica, a pedido explicito pra essa tela.
  const eeaRisco = classificarRisco(colaborador.eea);
  const dtRisco = classificarRisco(colaborador.dt);
  const ultimoEea = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === "EEA")
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime())[0];
  const ultimoDt = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === "DT")
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime())[0];

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Última pontuação EEA"
          value={
            <Badge
              variant="outline"
              className={`w-fit rounded-lg px-3 py-1 text-base font-semibold ${RISCO_BADGE_CLASS[eeaRisco]}`}
            >
              {RISCO_LABEL[eeaRisco]}
            </Badge>
          }
          meta={
            ultimoEea && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Teste em {ultimoEea.data}
              </span>
            )
          }
          sublabel={`${colaborador.totalTestesEea} testes EEA ao todo`}
          tooltip="Representa o resultado do último teste EEA realizado pelo funcionário."
        />
        <KpiCard
          label="Última pontuação DT"
          value={
            <Badge
              variant="outline"
              className={`w-fit rounded-lg px-3 py-1 text-base font-semibold ${RISCO_BADGE_CLASS[dtRisco]}`}
            >
              {RISCO_LABEL[dtRisco]}
            </Badge>
          }
          meta={
            ultimoDt && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Teste em {ultimoDt.data}
              </span>
            )
          }
          sublabel={`${colaborador.totalTestesDt} testes DT ao todo`}
          tooltip="Representa o resultado do último teste DT realizado pelo funcionário."
        />
        <UserCard colaborador={colaborador} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.45fr)]">
        <FactorsSection
          fatoresDestaque={colaborador.fatoresDestaque}
          fatoresAdicionais={colaborador.fatoresAdicionais}
          historicoTestes={colaborador.historicoTestes}
        />
        <div className="flex flex-col gap-6">
          <EeaChartSection
            data={colaborador.serieEea}
            dtReferencia={colaborador.totalTestesDt > 0 ? colaborador.dt : undefined}
            linhaNeutra
          />
          <DtChartSection data={colaborador.serieDt} />
        </div>
      </div>

      <TestHistoryTable tests={colaborador.historicoTestes} colaboradorId={colaborador.id} />
    </Layout>
  );
}
