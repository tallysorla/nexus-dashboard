import { useState } from "react";
import { Link, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { TratativaDialog } from "@/components/TratativaDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { getColaboradorById, parseDataBr, type Tratativa } from "@/lib/mock-colaboradores";
import {
  combinacoesCasos,
  diasDesde,
  getCombinacaoCriticaById,
  getEmpresaById,
  NIVEL_BADGE_CLASS,
  NIVEL_LABEL,
  SLA_DIAS_TRATATIVA,
} from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

export default function TratativaCombinacao() {
  const { cid, kid } = useParams<{ cid: string; kid: string }>();
  const empresa = getEmpresaById(cid ?? "");
  const caso = combinacoesCasos.find((c) => c.id === kid);
  const colaborador = caso ? getColaboradorById(caso.colaboradorId) : undefined;

  const [status, setStatus] = useState(caso?.status);
  const [tratativas, setTratativas] = useState<Tratativa[]>(colaborador?.historicoTratativas ?? []);

  if (!empresa || !caso || !colaborador) return <NotFound />;

  const def = getCombinacaoCriticaById(caso.combinacaoId);
  if (!def) return <NotFound />;

  const dias = diasDesde(caso.detectadoEm);
  const slaExcedido = status === "sem_tratativa" && dias > SLA_DIAS_TRATATIVA;

  // Linha do tempo com dados reais do colaborador -- a combinacao e sempre
  // apurada a partir de um DT (nao do EEA, que so sinaliza risco antes
  // disso), entao o EEA anterior aparece como contexto, nao como a origem
  // da combinacao.
  const testesAntesDoDt = colaborador.historicoTestes
    .filter((t) => parseDataBr(t.data).getTime() < parseDataBr(caso.detectadoEm).getTime())
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime());
  const ultimoEeaAntes = testesAntesDoDt.find((t) => t.tipo === "EEA");
  const testeDt = colaborador.historicoTestes.find((t) => t.tipo === "DT" && t.data === caso.detectadoEm);

  const timeline = [
    ...(ultimoEeaAntes
      ? [{ data: ultimoEeaAntes.data, titulo: "EEA sinalizou risco", descricao: ultimoEeaAntes.classificacao }]
      : []),
    {
      data: caso.detectadoEm,
      titulo: "DT confirmou a combinação",
      descricao: testeDt ? testeDt.classificacao : def.nome,
    },
    { data: caso.detectadoEm, titulo: "Caso aberto para tratativa", descricao: `Nível ${NIVEL_LABEL[def.nivel]}` },
    {
      data: null,
      titulo: status === "em_tratativa" ? "Tratativa registrada" : "Aguardando decisão do gestor",
      descricao: null,
    },
  ];

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/" },
          { label: empresa.nome, href: `/empresas/${empresa.id}` },
          { label: "Combinações Críticas", href: `/empresas/${empresa.id}/combinacoes` },
          { label: colaborador.nome },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{colaborador.nome}</h1>
            <Badge variant="outline" className={`rounded-lg px-2.5 py-1 ${NIVEL_BADGE_CLASS[def.nivel]}`}>
              {NIVEL_LABEL[def.nivel]}
            </Badge>
          </div>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span>{colaborador.local}</span>
            <span>·</span>
            <span>DT confirmado em {caso.detectadoEm}</span>
            <span>·</span>
            <span className={`font-medium ${status === "em_tratativa" ? "text-amber-600" : "text-red-600"}`}>
              {status === "em_tratativa"
                ? "Em tratativa"
                : `Sem tratativa há ${dias} dia${dias === 1 ? "" : "s"}${slaExcedido ? " · SLA excedido" : ""}`}
            </span>
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/empresas/${empresa.id}/combinacoes`}>
            <ArrowLeft className="size-4" />
            Voltar para a lista
          </Link>
        </Button>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardContent className="space-y-3 px-6 py-6">
          <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-xs ${NIVEL_BADGE_CLASS[def.nivel]}`}>
            {NIVEL_LABEL[def.nivel]}
          </Badge>
          <div className="flex flex-wrap gap-1.5">
            {def.fatores.map((f) => (
              <Badge
                key={f}
                variant="outline"
                className="rounded-lg border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800"
              >
                {f}
              </Badge>
            ))}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vulnerabilidade identificada
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{def.vulnerabilidade}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
        <Card className="w-full py-0 shadow-sm">
          <CardContent className="px-6 py-6">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="size-4" />
                <p className="text-sm font-semibold">Ação recomendada pelo protocolo</p>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-red-700">{def.protocolo}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-base">Linha do tempo</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <ol className="space-y-4">
              {timeline.map((item, index) => {
                const alcancado = index < timeline.length - 1 || status === "em_tratativa";
                return (
                  <li key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1 size-2.5 shrink-0 rounded-full ${
                          alcancado ? "bg-primary" : "border-2 border-muted-foreground/40 bg-transparent"
                        }`}
                      />
                      {index < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-1">
                      {item.data && <p className="text-xs text-muted-foreground">{item.data}</p>}
                      <p className="text-sm font-medium">{item.titulo}</p>
                      {item.descricao && <p className="text-xs text-muted-foreground">{item.descricao}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
          <div>
            <CardTitle className="text-lg">Histórico de tratativas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Conversas, feedbacks e encaminhamentos registrados para {colaborador.nome}
            </p>
          </div>
          <TratativaDialog
            colaboradorNome={colaborador.nome}
            onRegistrar={(t) => {
              setTratativas((prev) => [t, ...prev]);
              caso.status = "em_tratativa";
              setStatus("em_tratativa");
            }}
          />
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {tratativas.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma tratativa registrada ainda. Use "Registrar tratativa" para
              documentar a primeira ação com este funcionário.
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
    </Layout>
  );
}
