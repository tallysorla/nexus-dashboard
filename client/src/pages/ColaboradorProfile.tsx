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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <MetricsCards colaborador={colaborador} />
        </div>

        <Card className="h-full justify-between overflow-hidden py-0 shadow-sm lg:col-span-1">
          <CardHeader className="px-4 pt-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-12 shrink-0 ring-2 ring-primary/10">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${colaborador.avatarSeed}`}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="truncate font-semibold leading-tight">{colaborador.nome}</h2>
                <p className="mt-1 truncate text-sm font-medium leading-tight text-primary">
                  {colaborador.cargo}
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {colaborador.setor} · {colaborador.local}
                  </span>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`mt-3 w-fit rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[colaborador.risco]}`}
            >
              {RISCO_LABEL[colaborador.risco]}
            </Badge>
          </CardHeader>

          <Separator />

          <CardFooter className="px-4 pb-4">
            <TratativaDialog
              colaboradorNome={colaborador.nome}
              onRegistrar={(t) => setTratativas((prev) => [t, ...prev])}
              className="w-full justify-center"
            />
          </CardFooter>
        </Card>
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
