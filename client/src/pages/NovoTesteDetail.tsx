import { useState } from "react";
import { Link, useParams, useSearchParams } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AutorizacaoFuncaoDialog } from "@/components/AutorizacaoFuncaoDialog";
import { RegistrarDecisaoDialog } from "@/components/RegistrarDecisaoDialog";
import { TratativaDialog } from "@/components/TratativaDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfile } from "@/contexts/ProfileContext";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  History,
  User,
} from "lucide-react";
import {
  RISCO_LABEL,
  autorizacaoDoTeste,
  classificarRiscoDT,
  getColaboradorById,
  horaDoTeste,
  parseDataBr,
  resultadosCompletosDoTeste,
  tempoNaEmpresa,
  type DecisaoAutorizacao,
  type RiskLevel,
  type Tratativa,
} from "@/lib/mock-colaboradores";
import {
  casosDoColaborador,
  getCombinacaoCriticaById,
  getEmpresaById,
  getFilialById,
  NIVEL_BADGE_CLASS,
  NIVEL_LABEL,
  type CombinacaoCriticaCaso,
  type CombinacaoCriticaDef,
  type NivelCombinacao,
} from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

const RISCO_HEX: Record<RiskLevel, string> = {
  alto: "#dc2626",
  medio: "#d97706",
  baixo: "#059669",
};

const STATUS_TEXT_CLASS: Record<RiskLevel, string> = {
  alto: "text-red-600",
  medio: "text-amber-600",
  baixo: "text-emerald-600",
};

const ORDEM_NIVEL: Record<NivelCombinacao, number> = {
  ESPECIAL: 0,
  "CRÍTICO": 1,
  ALTA: 2,
};

type EventoTimeline = { data: string; titulo: string; descricao?: string };

export default function NovoTesteDetail() {
  const { cid, colaboradorId, testeId } = useParams<{
    cid: string;
    colaboradorId: string;
    testeId: string;
  }>();
  const [searchParams] = useSearchParams();
  const { profile } = useProfile();

  const empresa = getEmpresaById(cid ?? "");
  const colaborador = getColaboradorById(colaboradorId ?? "");
  const teste = colaborador?.historicoTestes.find((t) => t.id === testeId);

  const [tratativas, setTratativas] = useState<Tratativa[]>(colaborador?.historicoTratativas ?? []);
  const [decisaoAutorizacao, setDecisaoAutorizacao] = useState<DecisaoAutorizacao | undefined>(
    teste?.autorizacaoDecidida
  );

  if (!empresa || !colaborador || !teste) return <NotFound />;

  const filialId = searchParams.get("filial");
  const filial = filialId ? getFilialById(empresa, filialId) : undefined;
  const voltarHref = `/empresas/${empresa.id}/testes${filial ? `?filial=${filial.id}` : ""}`;
  const podeVerRisco = profile.nav.includes("risco");

  const resultados = resultadosCompletosDoTeste(teste);
  const autorizacao = autorizacaoDoTeste(teste.status);
  const autorizacaoLabel = decisaoAutorizacao
    ? decisaoAutorizacao.decisao === "autorizado"
      ? "Autorizado"
      : "Não autorizado"
    : autorizacao.label;
  const autorizacaoColorClass = decisaoAutorizacao
    ? decisaoAutorizacao.decisao === "autorizado"
      ? "text-emerald-600"
      : "text-red-600"
    : STATUS_TEXT_CLASS[teste.status];

  // Todas as combinacoes criticas do colaborador (nao so a deste teste
  // especifico) -- essa versao mostra a situacao geral dele, nao so o
  // recorte de um teste isolado.
  const casos = podeVerRisco
    ? casosDoColaborador(colaborador.id)
        .map((caso) => ({ caso, def: getCombinacaoCriticaById(caso.combinacaoId) }))
        .filter(
          (item): item is { caso: CombinacaoCriticaCaso; def: CombinacaoCriticaDef } => item.def !== undefined
        )
        .sort((a, b) => ORDEM_NIVEL[a.def.nivel] - ORDEM_NIVEL[b.def.nivel])
    : [];
  const casosPendentes = casos.filter((c) => c.caso.status === "sem_tratativa");

  // Fatores que participam de alguma combinacao ativa -- usados pra
  // destacar visualmente esses fatores na secao de resultados.
  const fatoresRelacionados = new Set(casos.flatMap((c) => c.def.fatores));

  const testesEea = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === "EEA")
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime());
  const testesDt = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === "DT")
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime());
  const ultimoEea = testesEea[0];
  const ultimoDt = testesDt[0];
  const ultimaTratativa = [...tratativas].sort(
    (a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime()
  )[0];

  const eventos: EventoTimeline[] = [
    ...casos.map(({ caso, def }) => ({
      data: caso.detectadoEm,
      titulo: `Combinação identificada: ${def.nome}`,
      descricao: `Nível ${NIVEL_LABEL[def.nivel]}`,
    })),
    ...tratativas.map((t) => ({ data: t.data, titulo: t.tipo, descricao: t.observacao })),
  ].sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime());

  function registrarTratativaSimples(t: Tratativa) {
    setTratativas((prev) => [t, ...prev]);
  }

  function registrarDecisao(t: Tratativa, casosSelecionados: string[]) {
    setTratativas((prev) => [t, ...prev]);
    casosSelecionados.forEach((casoId) => {
      const caso = casos.find((c) => c.caso.id === casoId)?.caso;
      if (caso) caso.status = "em_tratativa";
    });
  }

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/" },
          { label: empresa.nome, href: `/empresas/${empresa.id}` },
          ...(filial
            ? [
                { label: "Filiais / NOPs", href: `/empresas/${empresa.id}/filiais` },
                { label: filial.nome, href: `/empresas/${empresa.id}/filiais/${filial.id}` },
              ]
            : []),
          { label: "Testes", href: voltarHref },
          { label: teste.data },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link
          href={voltarHref}
          className="inline-flex items-center gap-1.5 text-2xl font-semibold tracking-tight hover:text-muted-foreground"
        >
          <ArrowLeft className="size-5" />
          Situação atual
        </Link>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/funcionarios/${colaborador.id}`}>
            <User className="size-4" />
            Ver perfil do funcionário
          </Link>
        </Button>
      </div>

      {/* 1. Cabecalho -- prioriza "o que precisa acontecer agora" em vez da
          pontuacao bruta do teste. */}
      <Card className="w-full shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{colaborador.nome}</h2>
              <p className="text-sm text-muted-foreground">CPF: {colaborador.cpf}</p>
            </div>
            {casosPendentes.length > 0 ? (
              <div className="text-right">
                <Badge variant="outline" className="rounded-lg border-red-200 bg-red-50 px-3 py-1 text-red-700">
                  Tratativa pendente
                </Badge>
                <p className="mt-1 text-sm text-muted-foreground">
                  {casosPendentes.length} combinaç{casosPendentes.length === 1 ? "ão crítica" : "ões críticas"}{" "}
                  identificada{casosPendentes.length === 1 ? "" : "s"}
                </p>
              </div>
            ) : (
              <Badge
                variant="outline"
                className={`rounded-lg px-3 py-1 ${
                  autorizacaoColorClass === "text-emerald-600"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {autorizacaoLabel}
              </Badge>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-11 px-4">Último EEA</TableHead>
                  <TableHead className="h-11 px-4">Último DT</TableHead>
                  <TableHead className="h-11 px-4">Última ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="px-4 py-3">
                    {ultimoEea ? `${ultimoEea.data} · ${horaDoTeste(colaborador.id, ultimoEea.id)}` : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {ultimoDt ? `${ultimoDt.data} · ${horaDoTeste(colaborador.id, ultimoDt.id)}` : "Pendente"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {ultimaTratativa ? `${ultimaTratativa.tipo} · ${ultimaTratativa.data}` : "Nenhuma registrada"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 2. Combinacoes detectadas -- o elemento mais importante da tela:
          o que aciona a tratativa e a combinacao de fatores, nao a
          pontuacao total isolada. */}
      {podeVerRisco && casos.length > 0 && (
        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-lg">Combinações críticas identificadas</CardTitle>
            <p className="text-sm text-muted-foreground">
              {casos.length} combinaç{casos.length === 1 ? "ão" : "ões"} — Tríade (nível Especial) sempre aparece
              primeiro, as demais em ordem de severidade
            </p>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {casos.map(({ caso, def }, index) => {
              const especial = def.nivel === "ESPECIAL";
              return (
                <div
                  key={caso.id}
                  className={`rounded-xl border p-4 shadow-sm ${especial ? "bg-slate-900 text-white" : "bg-card"}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        especial ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold uppercase tracking-wide">{def.nome}</p>
                        <Badge
                          variant="outline"
                          className={`rounded-lg px-2 py-0.5 text-xs ${
                            especial ? "border-white/30 bg-white/10 text-white" : NIVEL_BADGE_CLASS[def.nivel]
                          }`}
                        >
                          {NIVEL_LABEL[def.nivel]}
                          {especial ? " · Prioridade absoluta" : ""}
                        </Badge>
                      </div>
                      <p className={`mt-1.5 text-sm ${especial ? "text-white/80" : "text-muted-foreground"}`}>
                        {def.fatores.join(" + ")}
                      </p>
                      <p className={`mt-2 text-sm font-medium ${especial ? "text-white" : "text-foreground"}`}>
                        {def.protocolo}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-xs font-medium ${
                            especial ? "text-white/70" : caso.status === "em_tratativa" ? "text-amber-600" : "text-red-600"
                          }`}
                        >
                          {caso.status === "em_tratativa" ? "Em tratativa" : "Sem tratativa"}
                        </span>
                        <Button
                          asChild
                          size="sm"
                          variant={especial ? "secondary" : "outline"}
                          className="rounded-xl"
                        >
                          <Link href={`/empresas/${caso.empresaId}/combinacoes/${caso.id}`}>
                            Ver tratativa
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* 3. Proxima acao -- o gestor nao deveria ter que interpretar a tela
          inteira pra descobrir o proximo passo. */}
      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Próxima ação</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {casosPendentes.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-red-800">Registrar decisão da tratativa</p>
                <p className="mt-1 text-sm text-red-900">
                  {casosPendentes.length === 1
                    ? `A combinação ${casosPendentes[0].def.nome} está aguardando uma decisão.`
                    : `${casosPendentes.length} combinações estão aguardando uma decisão.`}{" "}
                  Recomendação: {casosPendentes[0].def.protocolo.toLowerCase()}
                </p>
              </div>
              <RegistrarDecisaoDialog
                colaboradorNome={colaborador.nome}
                combinacoesRelacionadas={casosPendentes.map((c) => ({ id: c.caso.id, nome: c.def.nome }))}
                onRegistrar={registrarDecisao}
                className="shrink-0 bg-red-600 hover:bg-red-700"
              />
            </div>
          ) : teste.status === "medio" && !decisaoAutorizacao ? (
            <AutorizacaoFuncaoDialog
              colaboradorNome={colaborador.nome}
              classificacao={teste.classificacao}
              onDecidir={(decisao) => {
                teste.autorizacaoDecidida = decisao;
                setDecisaoAutorizacao(decisao);
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma ação pendente no momento.</p>
          )}
        </CardContent>
      </Card>

      {/* 4. Resultados dos fatores -- desce na hierarquia, mas destaca os
          fatores que participam de alguma combinacao critica. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
            <CardTitle className="text-lg">Gráfico de risco</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: RISCO_HEX.baixo }} />
                Baixo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: RISCO_HEX.medio }} />
                Médio
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: RISCO_HEX.alto }} />
                Alto
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="h-[360px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resultados} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} />
                  <XAxis
                    type="number"
                    domain={[0, 75]}
                    ticks={[0, 15, 30, 45, 60, 75]}
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    width={150}
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: "12px" }}
                  />
                  <Bar dataKey="nota" radius={[0, 6, 6, 0]} maxBarSize={20}>
                    {resultados.map((r) => (
                      <Cell key={r.nome} fill={RISCO_HEX[classificarRiscoDT(r.nota)]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="size-4.5 text-muted-foreground" />
              Resultados dos fatores
            </CardTitle>
            {fatoresRelacionados.size > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="size-2 rounded-full bg-red-500" />
                Fator relacionado a uma combinação crítica
              </p>
            )}
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="divide-y">
              {resultados.map((r) => {
                const risco = classificarRiscoDT(r.nota);
                const relacionado = fatoresRelacionados.has(r.nome);
                return (
                  <div key={r.nome} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      {relacionado && <span className="size-2 shrink-0 rounded-full bg-red-500" />}
                      <span className="truncate text-sm">{r.nome}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.nota}/75</span>
                      <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-xs ${STATUS_TEXT_CLASS[risco]}`}>
                        {RISCO_LABEL[risco]}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Historico -- timeline unificada (combinacoes + tratativas), em
          vez de uma tabela de logs. */}
      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="size-4.5 text-muted-foreground" />
              Histórico da tratativa
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Combinações identificadas e ações registradas para {colaborador.nome}
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {eventos.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum evento registrado ainda para este funcionário.
            </p>
          ) : (
            <ol className="space-y-4">
              {eventos.map((evento, index) => (
                <li key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                    {index < eventos.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs text-muted-foreground">{evento.data}</p>
                    <p className="text-sm font-medium">{evento.titulo}</p>
                    {evento.descricao && <p className="text-xs text-muted-foreground">{evento.descricao}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
          <CardTitle className="text-lg">Registrar tratativa simples</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <p className="mb-3 text-sm text-muted-foreground">
            Para conversas e feedbacks pontuais, sem vínculo com uma combinação específica.
          </p>
          <TratativaDialog colaboradorNome={colaborador.nome} onRegistrar={registrarTratativaSimples} />
        </CardContent>
      </Card>

      <Collapsible className="w-full">
        <Card className="w-full gap-0 py-0 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="size-4.5 text-muted-foreground" />
              Detalhes do funcionário
            </CardTitle>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cargo</p>
                <p className="font-medium">{colaborador.cargo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Filial / NOP</p>
                <p className="font-medium">{colaborador.local}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tempo na empresa</p>
                <p className="font-medium">{tempoNaEmpresa(colaborador.dataAdmissao)}</p>
              </div>
              <CollapsibleTrigger className="group flex items-center text-muted-foreground hover:text-foreground">
                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-1 gap-4 border-t px-6 py-5 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Setor</p>
                <p className="text-sm font-medium">{colaborador.setor}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Matrícula</p>
                <p className="text-sm font-medium">{colaborador.matricula}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Idade</p>
                <p className="text-sm font-medium">{colaborador.idade} anos</p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Data de admissão</p>
                  <p className="text-sm font-medium">{colaborador.dataAdmissao}</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </Layout>
  );
}
