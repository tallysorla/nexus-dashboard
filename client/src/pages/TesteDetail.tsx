import { useState } from "react";
import { Link, useParams, useSearchParams } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AutorizacaoFuncaoDialog } from "@/components/AutorizacaoFuncaoDialog";
import { TesteCombinacaoCritica } from "@/components/TesteCombinacaoCritica";
import { TratativaDialog } from "@/components/TratativaDialog";
import { useProfile } from "@/contexts/ProfileContext";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ShieldAlert,
  User,
} from "lucide-react";
import {
  RISCO_LABEL,
  autorizacaoDoTeste,
  classificarRiscoDT,
  descricaoRiscoFator,
  duracaoDoTeste,
  getColaboradorById,
  horaDoTeste,
  perguntasPuladasDoTeste,
  recomendacaoDoTeste,
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

export default function TesteDetail() {
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

  const autorizacao = autorizacaoDoTeste(teste.status);
  // Uma vez que o gestor decide (so acontece com risco medio), a decisao
  // dele prevalece sobre o "Aguardando" automatico.
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
  const resultados = resultadosCompletosDoTeste(teste);
  const perguntasPuladas = perguntasPuladasDoTeste(teste);
  const hora = horaDoTeste(colaborador.id, teste.id);
  const duracao = duracaoDoTeste(colaborador.id, teste.id);

  // O Gráfico de risco logo acima já mostra os 10 fatores visualmente -- o
  // accordion de Resultados do Teste so precisa detalhar em texto os que
  // exigem atencao, sem repetir os 10 de novo (a maioria fica baixo risco
  // na pratica).
  const resultadosEmAtencao = resultados.filter((r) => classificarRiscoDT(r.nota) !== "baixo");
  const quantidadeBaixo = resultados.length - resultadosEmAtencao.length;

  const acaoBoxClass =
    teste.status === "baixo" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50";
  const acaoTextClass = teste.status === "baixo" ? "text-emerald-700" : "text-red-700";
  const acaoBodyClass = teste.status === "baixo" ? "text-emerald-900" : "text-red-900";

  // So renderiza o card de combinacao critica quando ha um caso batendo com
  // a data deste teste (e o perfil ativo pode ver essa informacao).
  const casoCritico = casosDoColaborador(colaborador.id).find((c) => c.detectadoEm === teste.data);
  const defCritico = casoCritico ? getCombinacaoCriticaById(casoCritico.combinacaoId) : undefined;
  const temCombinacaoCritica = profile.nav.includes("risco") && !!defCritico;

  // Quando ha combinacao critica, o protocolo dela e mais especifico e
  // urgente que a recomendacao generica do teste -- mostrar as duas ao
  // mesmo tempo dava a impressao de duas orientacoes conflitantes (uma de
  // rotina, outra de encaminhamento imediato). Uma unica acao prevalece.
  const acaoRecomendada = temCombinacaoCritica && defCritico ? defCritico.protocolo : recomendacaoDoTeste(teste);

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
          Detalhes do teste
        </Link>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/funcionarios/${colaborador.id}`}>
            <User className="size-4" />
            Ver perfil do funcionário
          </Link>
        </Button>
      </div>

      <Card className="w-full shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{colaborador.nome}</h2>
              <p className="text-sm text-muted-foreground">CPF: {colaborador.cpf}</p>
            </div>
            <Badge variant="outline" className="rounded-lg border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              Teste {teste.tipo}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Autorização para exercer a função</p>
              <p className={`mt-1 text-xl font-bold ${autorizacaoColorClass}`}>{autorizacaoLabel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pontuação total</p>
              <p className="mt-1 text-xl font-bold">{teste.pontuacao} / 100</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`mt-1 text-xl font-bold ${STATUS_TEXT_CLASS[teste.status]}`}>{teste.classificacao}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duração do teste</p>
              <p className="mt-1 text-xl font-bold">{duracao} min</p>
            </div>
          </div>

          {teste.status === "baixo" ? (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-800">Nenhum risco relevante identificado</p>
                <p className="mt-1 text-sm text-emerald-900">
                  Os resultados do teste não indicam fatores que exijam atenção imediata.
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`flex items-start gap-3 rounded-xl border p-4 ${
                teste.status === "alto" ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
              }`}
            >
              <AlertTriangle
                className={`mt-0.5 size-5 shrink-0 ${teste.status === "alto" ? "text-red-600" : "text-amber-600"}`}
              />
              <div>
                <p className={`font-semibold ${teste.status === "alto" ? "text-red-800" : "text-amber-800"}`}>
                  Atenção: Risco {teste.status === "alto" ? "Alto" : "Médio"} Detectado
                </p>
                <p className={`mt-1 text-sm ${teste.status === "alto" ? "text-red-900" : "text-amber-900"}`}>
                  Os resultados do teste indicam um nível {teste.status === "alto" ? "alto" : "médio"} de risco para
                  dirigir. Veja a ação recomendada pelo protocolo abaixo.
                </p>
              </div>
            </div>
          )}

          <div className={`rounded-xl border p-4 ${acaoBoxClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className={`flex items-center gap-2 ${acaoTextClass}`}>
                <ShieldAlert className="size-4" />
                <p className="text-sm font-semibold">Ação recomendada pelo protocolo</p>
              </div>
              <span className="text-xs text-muted-foreground">
                Data/Hora: {teste.data}, {hora}
              </span>
            </div>
            <p className={`mt-2 text-sm font-medium ${acaoBodyClass}`}>{acaoRecomendada}</p>
          </div>

          {/* Alto ja bloqueia e baixo ja libera automaticamente -- so o
              medio ("Aguardando") exige essa decisao explicita do gestor. */}
          {teste.status === "medio" &&
            (decisaoAutorizacao ? (
              <div
                className={`rounded-xl border p-4 ${
                  decisaoAutorizacao.decisao === "autorizado"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <p
                  className={`font-semibold ${
                    decisaoAutorizacao.decisao === "autorizado" ? "text-emerald-800" : "text-red-800"
                  }`}
                >
                  Autorização para exercer a função{" "}
                  {decisaoAutorizacao.decisao === "autorizado" ? "concedida" : "negada"}
                </p>
                <p
                  className={`mt-1 text-sm ${
                    decisaoAutorizacao.decisao === "autorizado" ? "text-emerald-900" : "text-red-900"
                  }`}
                >
                  Decisão registrada por: <strong>{decisaoAutorizacao.autor}</strong>
                </p>
                {decisaoAutorizacao.observacao && (
                  <p
                    className={`mt-1 text-sm ${
                      decisaoAutorizacao.decisao === "autorizado" ? "text-emerald-900" : "text-red-900"
                    }`}
                  >
                    {decisaoAutorizacao.observacao}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Data/Hora: {decisaoAutorizacao.data}, {decisaoAutorizacao.hora}
                </p>
              </div>
            ) : (
              <AutorizacaoFuncaoDialog
                colaboradorNome={colaborador.nome}
                classificacao={teste.classificacao}
                onDecidir={(decisao) => {
                  teste.autorizacaoDecidida = decisao;
                  setDecisaoAutorizacao(decisao);
                }}
              />
            ))}
        </CardContent>
      </Card>

      {temCombinacaoCritica && (
        <TesteCombinacaoCritica colaboradorId={colaborador.id} dataTeste={teste.data} />
      )}

      <Collapsible defaultOpen className="w-full">
        <Card className="w-full gap-0 py-0 shadow-sm">
          <div className="flex flex-row items-center justify-between gap-4 px-6 py-5">
            <CardTitle className="text-lg">Gráfico de risco</CardTitle>
            <div className="flex items-center gap-4 text-sm">
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
              <CollapsibleTrigger className="group flex items-center text-muted-foreground hover:text-foreground">
                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
            </div>
          </div>
          <CollapsibleContent>
            <CardContent className="border-t px-6 py-5">
              <div className="h-[420px] w-full">
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
                    <Bar dataKey="nota" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      {resultados.map((r) => (
                        <Cell key={r.nome} fill={RISCO_HEX[classificarRiscoDT(r.nota)]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Resultados do Teste (esquerda) pareado com Perguntas puladas +
          Historico de tratativas empilhados (direita) -- Perguntas puladas
          costuma ser bem mais curto que Resultados do Teste, entao o
          Historico de tratativas preenche o espaco vazio que sobraria
          embaixo dele em vez de deixar a coluna da direita mais curta. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <Collapsible defaultOpen className="w-full">
          <Card className="w-full gap-0 py-0 shadow-sm">
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <CardTitle className="text-lg">Resultados do Teste</CardTitle>
                <p className="text-sm text-muted-foreground">Fatores que precisam de atenção neste teste</p>
              </div>
              <CollapsibleTrigger className="group flex items-center text-muted-foreground hover:text-foreground">
                <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <CardContent className="border-t px-6 py-5">
                {resultadosEmAtencao.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum fator em atenção — os 10 fatores estão em baixo risco neste teste.
                  </p>
                ) : (
                  <>
                    <Accordion type="multiple" defaultValue={resultadosEmAtencao.map((r) => r.nome)}>
                      {resultadosEmAtencao.map((r) => {
                        const risco = classificarRiscoDT(r.nota);
                        const Icon = risco === "alto" ? AlertCircle : AlertTriangle;
                        const boxClass =
                          risco === "alto"
                            ? "border-red-200 bg-red-50 text-red-800"
                            : "border-amber-200 bg-amber-50 text-amber-800";
                        return (
                          <AccordionItem key={r.nome} value={r.nome}>
                            <AccordionTrigger>
                              <span className="flex flex-1 items-center justify-between gap-3">
                                <span className="font-medium">{r.nome}</span>
                                <Icon className={`size-5 shrink-0 ${STATUS_TEXT_CLASS[risco]}`} />
                              </span>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className={`rounded-xl border p-4 ${boxClass}`}>
                                <p className="font-semibold">{RISCO_LABEL[risco]}</p>
                                <p className="mt-1 text-sm">{descricaoRiscoFator(r.nome, risco)}</p>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                    {quantidadeBaixo > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Os outros {quantidadeBaixo} fatores estão em baixo risco (veja o gráfico acima).
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="flex flex-col gap-6">
          <Collapsible defaultOpen className="w-full">
            <Card className="w-full gap-0 py-0 shadow-sm">
              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <CardTitle className="text-lg">Perguntas puladas</CardTitle>
                <CollapsibleTrigger className="group flex items-center text-muted-foreground hover:text-foreground">
                  <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <CardContent className="border-t px-6 py-5">
                  {perguntasPuladas.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma pergunta foi pulada neste teste.</p>
                  ) : (
                    <Accordion type="multiple" defaultValue={perguntasPuladas.map((_, i) => `pp-${i}`)}>
                      {perguntasPuladas.map((p, i) => (
                        <AccordionItem key={i} value={`pp-${i}`}>
                          <AccordionTrigger>{p.fator}</AccordionTrigger>
                          <AccordionContent>
                            <div className="rounded-xl bg-muted/40 p-4">
                              <p className="text-sm font-medium text-red-600">Pergunta pulada</p>
                              <p className="mt-1 text-sm">{p.pergunta}</p>
                              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                Motivo: {p.motivo}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

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
                onRegistrar={(t) => setTratativas((prev) => [t, ...prev])}
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
        </div>
      </div>

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
