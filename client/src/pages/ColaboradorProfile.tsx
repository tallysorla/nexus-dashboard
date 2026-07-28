import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "wouter";
import { Layout } from "@/components/Layout";
import { KpiCard } from "@/components/MetricsCards";
import { FactorsSection } from "@/components/FactorsSection";
import { EeaChartSection } from "@/components/EeaChartSection";
import { DtChartSection } from "@/components/DtChartSection";
import { TestHistoryTable } from "@/components/TestHistoryTable";
import { UserCard } from "@/components/UserCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ArrowLeft, CalendarClock, RotateCw } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  classificarRiscoDt,
  classificarRiscoEea,
  getColaboradorById,
  parseDataBr,
} from "@/lib/mock-colaboradores";
import NotFound from "@/pages/NotFound";

function ColaboradorProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-6 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.45fr)]">
        <Skeleton className="h-96 rounded-2xl" />
        <div className="flex flex-col gap-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

function ErroCarregamento({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="size-6 text-red-600" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold">Não foi possível carregar os dados do funcionário</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ocorreu um erro ao buscar as informações. Verifique sua conexão e tente novamente.
        </p>
      </div>
      <Button variant="outline" className="rounded-xl" onClick={onRetry}>
        <RotateCw className="size-4" />
        Tentar novamente
      </Button>
    </div>
  );
}

// Tela de detalhes do funcionario, alinhada ao refinamento de 23/07 (ver
// NFuncionarioProfile.tsx, onde essas mudancas foram iteradas antes de
// chegar aqui): sem pontuacao numerica em nenhum lugar -- so classificacao
// de risco --, ranking de fatores calculado de verdade (com desempate
// alfabetico dentro do mesmo nivel de risco), tendencia como linha tracejada
// dentro do grafico de EEA (o card "Tendencia" separado saiu de circulacao),
// loading/erro implementados. Os cards "Status de risco" e "Insights
// automaticos" existem no codigo mas ficam OCULTOS por hora (mesmo estado
// da tela privada) -- nao reativar sem confirmar antes.
export default function ColaboradorProfile() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const colaborador = getColaboradorById(id ?? "");

  // Loading simulado: a busca do colaborador aqui e sincrona (dado mock
  // local), mas um dashboard real busca isso de uma API -- simula um atraso
  // curto pra manter o esqueleto de carregamento sempre implementado e
  // testavel, em vez de assumir que a rede real nunca demora.
  const [carregando, setCarregando] = useState(true);
  useEffect(() => {
    setCarregando(true);
    const timer = setTimeout(() => setCarregando(false), 400);
    return () => clearTimeout(timer);
  }, [id]);

  // Estado de erro: nao ha uma falha de rede real possivel aqui (o dado e
  // local), mas a tela de erro existe e pode ser exercitada via
  // ?simular=erro na URL -- da pra times de QA validarem o estado sem
  // precisar derrubar um backend de verdade.
  const [erroSimulado, setErroSimulado] = useState(searchParams.get("simular") === "erro");
  useEffect(() => {
    setErroSimulado(searchParams.get("simular") === "erro");
  }, [searchParams]);

  if (carregando) {
    return (
      <Layout>
        <ColaboradorProfileSkeleton />
      </Layout>
    );
  }

  if (erroSimulado) {
    return (
      <Layout>
        <ErroCarregamento onRetry={() => setErroSimulado(false)} />
      </Layout>
    );
  }

  if (!colaborador) {
    return <NotFound />;
  }

  const empresaEscopo = searchParams.get("empresa");
  const voltarHref = empresaEscopo ? `/funcionarios?empresa=${empresaEscopo}` : "/funcionarios";

  // Nota numerica (0-10) e classificacao de risco lado a lado -- restaurado a
  // pedido do usuario apos o periodo em que essa tela mostrava so a
  // classificacao (ver historico do componente EeaChartSection/DtChartSection
  // e FactorsSection pros mesmos flags de ocultar, ainda la mas sem uso).
  const eeaRisco = classificarRiscoEea(colaborador.eea);
  const dtRisco = classificarRiscoDt(colaborador.dt);
  const ultimoEea = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === "EEA")
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime())[0];
  const ultimoDt = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === "DT")
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime())[0];
  // Status de risco geral: baseado no teste mais recente, seja ele EEA ou DT.
  // Card ocultado por hora (ver abaixo), mas a variavel fica pronta pra
  // quando ele for reativado.
  const ultimoTesteGeral = [...colaborador.historicoTestes].sort(
    (a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime()
  )[0];

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

      {/* Grid em 3 colunas -- o card "Status de risco" foi ocultado por hora
          (ver bloco comentado abaixo), a pedido do usuario. Nao reativar sem
          confirmar antes. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colaborador.totalTestesEea === 0 ? (
          <KpiCard
            label="Última pontuação EEA"
            value={<span className="text-muted-foreground">—</span>}
            badge="Sem teste realizado"
            badgeClassName="border-slate-200 bg-slate-50 text-slate-700"
            sublabel="Aguardando o primeiro teste EEA"
            tooltip="Representa o resultado do último teste EEA realizado pelo funcionário."
          />
        ) : (
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
        )}
        {colaborador.totalTestesDt === 0 ? (
          <KpiCard
            label="Última pontuação DT"
            value={<span className="text-muted-foreground">—</span>}
            badge="Sem teste realizado"
            badgeClassName="border-slate-200 bg-slate-50 text-slate-700"
            sublabel="Aguardando o primeiro teste DT"
            tooltip="Representa o resultado do último teste DT realizado pelo funcionário."
          />
        ) : (
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
        )}
        {/* Card "Status de risco" ocultado por hora, a pedido do usuario --
            codigo mantido pra reativar depois, nao apagar nem revivir sem
            perguntar antes.
        {!ultimoTesteGeral ? (
          <KpiCard
            label="Status de risco"
            value={<span className="text-muted-foreground">—</span>}
            badge="Sem teste realizado"
            badgeClassName="border-slate-200 bg-slate-50 text-slate-700"
            sublabel="Aguardando o primeiro teste"
            tooltip="Classificação de risco com base no teste mais recente do funcionário, seja EEA ou DT — o que tiver sido feito por último."
          />
        ) : (
          <KpiCard
            label="Status de risco"
            value={
              <Badge
                variant="outline"
                className={`w-fit rounded-lg px-3 py-1 text-base font-semibold ${RISCO_BADGE_CLASS[ultimoTesteGeral.status]}`}
              >
                {ultimoTesteGeral.classificacao}
              </Badge>
            }
            meta={
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="size-3.5" />
                Teste {ultimoTesteGeral.tipo} em {ultimoTesteGeral.data}
              </span>
            }
            sublabel="Com base no teste mais recente"
            tooltip="Classificação de risco com base no teste mais recente do funcionário, seja EEA ou DT — o que tiver sido feito por último."
          />
        )}
        */}
        <UserCard colaborador={colaborador} />
      </div>

      {/* Secao "Insights automaticos" ocultada por hora, a pedido do usuario
          -- componente mantido em InsightsSection.tsx pra reativar depois,
          nao apagar nem revivir sem perguntar antes.
      <InsightsSection colaborador={colaborador} />
      */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.45fr)]">
        <FactorsSection
          fatoresDestaque={colaborador.fatoresDestaque}
          fatoresAdicionais={colaborador.fatoresAdicionais}
          todosOsFatores={[...colaborador.fatoresDestaque, ...colaborador.fatoresAdicionais]}
          historicoTestes={colaborador.historicoTestes}
          ocultarNota
        />
        <div className="flex flex-col gap-6">
          <EeaChartSection
            data={colaborador.serieEea}
            dtReferencia={colaborador.totalTestesDt > 0 ? colaborador.dt : undefined}
            dtReferenciaData={ultimoDt?.data}
            serieDt={colaborador.serieDt}
          />
          <DtChartSection data={colaborador.serieDt} />
        </div>
      </div>

      <TestHistoryTable
        tests={colaborador.historicoTestes}
        colaboradorId={colaborador.id}
        ocultarIndice
      />
    </Layout>
  );
}
