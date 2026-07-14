import { useState } from "react";
import { Link, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { KpiMiniCards } from "@/components/MetricsCards";
import { FactorsSection } from "@/components/FactorsSection";
import { EeaChartSection } from "@/components/EeaChartSection";
import { DtChartSection } from "@/components/DtChartSection";
import { TestHistoryTable } from "@/components/TestHistoryTable";
import { TratativaDialog } from "@/components/TratativaDialog";
import { UserCard } from "@/components/UserCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { getColaboradorById, type Tratativa } from "@/lib/mock-colaboradores";
import NotFound from "@/pages/NotFound";

export default function ColaboradorProfile() {
  const { id } = useParams<{ id: string }>();
  const colaborador = getColaboradorById(id ?? "");

  const [tratativas, setTratativas] = useState<Tratativa[]>(
    colaborador?.historicoTratativas ?? []
  );

  if (!colaborador) {
    return <NotFound />;
  }

  return (
    <Layout title={colaborador.nome} subtitle={colaborador.cargo}>
      <Link
        href="/colaboradores"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para colaboradores
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-none">Últimos testes realizados</h2>
          <p className="text-sm text-muted-foreground">Resultado mais recente por indicador · há 1 mês</p>
        </div>
        <TratativaDialog
          colaboradorNome={colaborador.nome}
          onRegistrar={(t) => setTratativas((prev) => [t, ...prev])}
        />
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

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Histórico de tratativas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Conversas, feedbacks e encaminhamentos registrados para este colaborador
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {tratativas.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma tratativa registrada ainda. Use "Registrar tratativa" para
              documentar a primeira ação com este colaborador.
            </p>
          ) : (
            <ul className="space-y-4">
              {tratativas.map((t) => (
                <li key={t.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="secondary" className="rounded-lg px-2.5 py-1">
                      {t.tipo}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t.data} · {t.autor}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{t.observacao}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <TestHistoryTable tests={colaborador.historicoTestes} />
    </Layout>
  );
}
