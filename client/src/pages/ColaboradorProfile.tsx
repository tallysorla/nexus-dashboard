import { useState } from "react";
import { Link, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { MetricsCards } from "@/components/MetricsCards";
import { FactorsSection } from "@/components/FactorsSection";
import { EeaChartSection } from "@/components/EeaChartSection";
import { DtChartSection } from "@/components/DtChartSection";
import { TestHistoryTable } from "@/components/TestHistoryTable";
import { TratativaDialog } from "@/components/TratativaDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin } from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  getColaboradorById,
  type Tratativa,
} from "@/lib/mock-colaboradores";
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

  const initials = colaborador.nome
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Layout title={colaborador.nome} subtitle={colaborador.cargo}>
      <Link
        href="/colaboradores"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para colaboradores
      </Link>

      <Card className="w-full py-0 shadow-sm">
        <CardContent className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 ring-2 ring-primary/10">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${colaborador.avatarSeed}`}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold leading-tight">
                  {colaborador.nome}
                </h2>
                <Badge
                  variant="outline"
                  className={`rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[colaborador.risco]}`}
                >
                  {RISCO_LABEL[colaborador.risco]}
                </Badge>
              </div>
              <p className="text-sm font-medium text-primary">{colaborador.cargo}</p>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                <span>
                  {colaborador.setor} · {colaborador.local}
                </span>
              </div>
            </div>
          </div>

          <TratativaDialog
            colaboradorNome={colaborador.nome}
            onRegistrar={(t) => setTratativas((prev) => [t, ...prev])}
          />
        </CardContent>
      </Card>

      <MetricsCards colaborador={colaborador} />

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
