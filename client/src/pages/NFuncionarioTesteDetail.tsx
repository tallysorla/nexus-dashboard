import { useState } from "react";
import { Link, useParams, useSearchParams } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Layout } from "@/components/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AutorizacaoFuncaoDialog } from "@/components/AutorizacaoFuncaoDialog";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Ban,
  ChevronDown,
} from "lucide-react";
import {
  autorizacaoDoTeste,
  classificarRisco,
  duracaoDoTeste,
  getColaboradorById,
  horaDoTeste,
  perguntasPuladasDoTeste,
  resultadosCompletosDoTeste,
  type DecisaoAutorizacao,
  type RiskLevel,
} from "@/lib/mock-colaboradores";
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

// Textos literais do frame do Figma (node 40003340:11034) pra secao "Fatores
// com resultado negativo" -- diferentes (mais diretivos) dos textos
// genericos ja usados em descricaoRiscoFator() pro /funcionarios publico.
// Mantidos aqui, locais a essa pagina, pra nao alterar o texto ja aprovado
// da tela publica.
const DESCRICAO_FRAME: Record<"alto" | "medio", { titulo: string; texto: string }> = {
  alto: {
    titulo: "Alto Risco",
    texto:
      "Os resultados do teste indicam um alto nessa categoria. Por segurança, não recomendamos que dirija no momento. É fundamental buscar descanso e, se necessário, apoio médico ou psicológico antes de retornar à atividade. Sua segurança e a de todos na via dependem disso.",
  },
  medio: {
    titulo: "Médio risco",
    texto:
      "O teste identificou Médio risco nessa categoria. Este motorista não deve ser escalado para dirigir no momento. É fundamental que ele tenha um período de descanso e, se necessário, seja encaminhado para apoio médico ou psicológico antes de retornar às atividades.",
  },
};

// Copia de TesteDetail.tsx pro fluxo privado /nfuncionarios, reconstruida
// para reproduzir fielmente as secoes e o conteudo do frame do Figma
// referenciado (node 40003340:11034): cabecalho, cartao principal (nome,
// CPF, badge do teste, as 4 metricas e o banner de autorizacao), grafico de
// risco, fatores com resultado negativo e perguntas puladas. Sem hierarquia
// empresas/filiais (nfuncionarios nao navega por ela), sem "Resumo da
// situacao", "Historico de tratativas" nem "Detalhes do funcionario" --
// nenhuma dessas secoes existe nesse frame. Combinacao critica de fatores
// saiu daqui e virou o banner CombinacoesCriticasAlert no topo do PERFIL
// (NFuncionarioProfile.tsx) -- o caso e vinculado ao colaborador em geral,
// nao a um teste especifico (ver doc de escopo), entao nao faz sentido
// filtrar por data do teste aberto.
export default function NFuncionarioTesteDetail() {
  const { colaboradorId, testeId } = useParams<{ colaboradorId: string; testeId: string }>();
  const [searchParams] = useSearchParams();

  const colaborador = getColaboradorById(colaboradorId ?? "");
  const teste = colaborador?.historicoTestes.find((t) => t.id === testeId);

  const [decisaoAutorizacao, setDecisaoAutorizacao] = useState<DecisaoAutorizacao | undefined>(
    teste?.autorizacaoDecidida
  );

  if (!colaborador || !teste) return <NotFound />;

  const empresaEscopo = searchParams.get("empresa");
  const perfilHref = empresaEscopo
    ? `/nfuncionarios/${colaborador.id}?empresa=${empresaEscopo}`
    : `/nfuncionarios/${colaborador.id}`;

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

  const resultados = resultadosCompletosDoTeste(teste);
  const perguntasPuladas = perguntasPuladasDoTeste(teste);
  const hora = horaDoTeste(colaborador.id, teste.id);
  const duracao = duracaoDoTeste(colaborador.id, teste.id);

  const resultadosEmAtencao = resultados.filter((r) => classificarRisco(r.nota) !== "baixo");

  return (
    <Layout>
      <Link
        href={perfilHref}
        className="inline-flex items-center gap-1.5 text-2xl font-semibold tracking-tight hover:text-muted-foreground"
      >
        <ArrowLeft className="size-5" />
        Detalhes do teste
      </Link>

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
              <p className="mt-1 text-xl font-bold">{teste.pontuacao} / 10</p>
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

          {/* Alto ja bloqueia e baixo ja libera automaticamente -- so o
              medio ("Aguardando") exige uma decisao explicita do gestor. */}
          {teste.status === "medio" &&
            (decisaoAutorizacao ? (
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 ${
                  decisaoAutorizacao.decisao === "autorizado"
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-red-300 bg-red-50"
                }`}
              >
                <div
                  className={`flex size-[61px] shrink-0 items-center justify-center rounded-lg ${
                    decisaoAutorizacao.decisao === "autorizado" ? "bg-emerald-100" : "bg-red-100"
                  }`}
                >
                  <Ban
                    className={`size-8 ${
                      decisaoAutorizacao.decisao === "autorizado" ? "text-emerald-600" : "text-red-500"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-foreground">
                    Autorização para exercer a função{" "}
                    {decisaoAutorizacao.decisao === "autorizado" ? "concedida" : "negada"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Decisão tomada pelo gestor(a):</span>{" "}
                    {decisaoAutorizacao.autor}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">Data/Hora:</span> {decisaoAutorizacao.data}, {decisaoAutorizacao.hora}
                  </p>
                </div>
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
                      domain={[0, 10]}
                      ticks={[0, 2, 4, 6, 8, 10]}
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
                        <Cell key={r.nome} fill={RISCO_HEX[classificarRisco(r.nota)]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible defaultOpen className="w-full">
        <Card className="w-full gap-0 py-0 shadow-sm">
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <CardTitle className="text-lg">Fatores com resultado negativo</CardTitle>
            <CollapsibleTrigger className="group flex items-center text-muted-foreground hover:text-foreground">
              <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <CardContent className="border-t px-6 py-5">
              {resultadosEmAtencao.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum fator com resultado negativo neste teste.
                </p>
              ) : (
                <Accordion type="multiple" defaultValue={resultadosEmAtencao.map((r) => r.nome)}>
                  {resultadosEmAtencao.map((r) => {
                    const risco = classificarRisco(r.nota) as "alto" | "medio";
                    const Icon = risco === "alto" ? AlertCircle : AlertTriangle;
                    const boxClass =
                      risco === "alto"
                        ? "border-red-300 bg-red-50 text-red-900"
                        : "border-amber-400 bg-amber-50/40 text-neutral-700";
                    const conteudo = DESCRICAO_FRAME[risco];
                    return (
                      <AccordionItem key={r.nome} value={r.nome}>
                        <AccordionTrigger>
                          <span className="flex flex-1 items-center justify-between gap-3">
                            <span className="font-medium">{r.nome}</span>
                            <Icon className={`size-5 shrink-0 ${STATUS_TEXT_CLASS[risco]}`} />
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className={`rounded-lg border p-4 ${boxClass}`}>
                            <p className="font-bold">{conteudo.titulo}</p>
                            <p className="mt-1 text-sm">{conteudo.texto}</p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
                <p className="text-sm text-muted-foreground">Todas as perguntas foram respondidas.</p>
              ) : (
                <Accordion type="multiple" defaultValue={perguntasPuladas.map((_, i) => `pp-${i}`)}>
                  {perguntasPuladas.map((p, i) => (
                    <AccordionItem key={i} value={`pp-${i}`}>
                      <AccordionTrigger>{p.fator}</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 rounded-lg bg-muted/30 p-4">
                          <p className="text-sm font-medium text-red-600">Pergunta pulada</p>
                          <p className="text-sm">{p.pergunta}</p>
                          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
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
    </Layout>
  );
}
