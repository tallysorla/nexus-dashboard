import { useState } from "react";
import { Link, useParams, useSearchParams } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { AutorizacaoFuncaoDialog } from "@/components/AutorizacaoFuncaoDialog";
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  autorizacaoDoTeste,
  classificarRiscoPorTipo,
  duracaoDoTeste,
  getColaboradorById,
  horaDoTeste,
  perguntasPuladasDoTeste,
  resultadosCompletosDoTeste,
  type DecisaoAutorizacao,
  type RiskLevel,
} from "@/lib/mock-colaboradores";
import {
  COMBINACOES_CRITICAS,
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

// Cores exatas do frame do Figma (node 40003416:88835) pra secao "Fatores
// com resultado negativo" -- mais vivas que RISCO_BADGE_CLASS (usado no
// resto do app), reproduzidas aqui literalmente a pedido do usuario em vez
// de reaproveitar o token mais suave.
const FATOR_RISCO_STYLE: Record<"alto" | "medio", { badge: string; box: string; texto: string }> = {
  alto: {
    badge: "border-[#f53838] bg-[#f53838]/12 text-[#f53838]",
    box: "border-[#f23737] bg-[#fff2f2] text-[#666]",
    texto:
      "Os resultados do teste indicam um alto nessa categoria. Por segurança, não recomendamos que dirija no momento. É fundamental buscar descanso e, se necessário, apoio médico ou psicológico antes de retornar à atividade. Sua segurança e a de todos na via dependem disso.",
  },
  medio: {
    badge: "border-[#f59e0b] bg-[#f59e0b]/12 text-[#f59e0b]",
    box: "border-[#f39c12] bg-[#fffcf0] text-[#666]",
    texto:
      "O teste identificou Médio risco nessa categoria. Este motorista não deve ser escalado para dirigir no momento. É fundamental que ele tenha um período de descanso e, se necessário, seja encaminhado para apoio médico ou psicológico antes de retornar às atividades.",
  },
};

const FATOR_RISCO_LABEL: Record<"alto" | "medio", string> = {
  alto: "Alto risco",
  medio: "Médio risco",
};

// Cores da combinacao critica por nivel -- mesma paleta AAA ja usada no
// banner do perfil (NIVEL_BADGE_CLASS de mock-empresas.ts e um estilo mais
// claro, de outra variante visual; aqui reproduzimos o card de fundo solido
// do frame do Figma).
const NIVEL_COMBO_STYLE: Record<NivelCombinacao, { bg: string; ink: string; tagText: string }> = {
  ESPECIAL: { bg: "#5b21b6", ink: "text-white", tagText: "text-[#5b21b6]" },
  "CRÍTICO": { bg: "#991b1b", ink: "text-white", tagText: "text-[#991b1b]" },
  ALTA: { bg: "#f59e0b", ink: "text-black", tagText: "text-[#991b1b]" },
};

const ORDEM_NIVEL: Record<NivelCombinacao, number> = { ESPECIAL: 0, "CRÍTICO": 1, ALTA: 2 };

// Copia de TesteDetail.tsx pro fluxo privado /nfuncionarios, reconstruida
// pra reproduzir com fidelidade o frame do Figma (node 40003416:88835):
// cabecalho separado em link de volta + titulo, card principal sem a coluna
// de Pontuacao total e sem cor no valor de Autorizacao (so o Status usa
// cor), "Perguntas puladas" e "Fatores" trocando Accordion por grade sempre
// visivel de 2 colunas, e "Grafico de risco" sem Collapsible (so "Perguntas
// puladas" continua colapsavel).
//
// A combinacao critica deste teste e CALCULADA a partir dos proprios
// resultados dele (nao mais de um "caso" fixo casado por data no mock): uma
// combinacao das 9 do documento da Martha (COMBINACOES_CRITICAS) so aparece
// quando TODOS os fatores dela estao em medio/alto risco neste teste
// especifico. Isso evita a inconsistencia de um teste "Baixo risco" (ou um
// EEA) acionar um alerta que nao tem nenhum fator realmente sinalizado.
// Quando ha fator em atencao mas nenhuma combinacao bate, ou quando todos os
// 10 fatores estao em baixo risco, aparece o estado vazio "Nenhuma
// combinacao critica identificada" no lugar.
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

  const resultados = resultadosCompletosDoTeste(teste);
  const maxEscalaTeste = teste.tipo === "EEA" ? 100 : 750;
  const perguntasPuladas = perguntasPuladasDoTeste(teste);
  const hora = horaDoTeste(colaborador.id, teste.id);
  const duracao = duracaoDoTeste(colaborador.id, teste.id);

  const resultadosEmAtencao = resultados.filter((r) => classificarRiscoPorTipo(r.nota, teste.tipo) !== "baixo");

  const nomesEmAtencao = new Set(resultadosEmAtencao.map((r) => r.nome));
  const combinacoesDetectadas = COMBINACOES_CRITICAS.filter((def) =>
    def.fatores.every((f) => nomesEmAtencao.has(f))
  ).sort((a, b) => ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel]);

  return (
    <Layout>
      <Link
        href={perfilHref}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para funcionários
      </Link>

      <h2 className="text-lg font-semibold leading-none">Detalhes do teste</h2>

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

          <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-base text-muted-foreground">Autorização para exercer a função</p>
              <p className="text-xl font-bold text-slate-800">{autorizacaoLabel}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-base text-muted-foreground">Status</p>
              <p className={`text-xl font-bold ${STATUS_TEXT_CLASS[teste.status]}`}>{teste.classificacao}</p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-base text-muted-foreground">Duração do teste</p>
              <p className="text-xl font-bold text-slate-800">{duracao} min</p>
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

      <div className="w-full space-y-8 rounded-2xl border border-[#e8e8e8] bg-white p-4 shadow-sm">
        {resultadosEmAtencao.length > 0 && (
          <>
            <p className="text-base font-semibold tracking-[0.48px] text-[#2a2a2a]">
              Fatores com resultado negativo
            </p>
            <div className={`grid grid-cols-1 gap-6 ${resultadosEmAtencao.length > 1 ? "sm:grid-cols-2" : ""}`}>
              {resultadosEmAtencao.map((r) => {
                const risco = classificarRiscoPorTipo(r.nota, teste.tipo) as "alto" | "medio";
                const style = FATOR_RISCO_STYLE[risco];
                return (
                  <div key={r.nome} className="flex flex-col gap-6 rounded-lg border border-[#e9e9e9] p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex-1 text-sm font-medium text-[#2e2e2e]">{r.nome}</span>
                      <Badge variant="outline" className={`rounded-full px-2.5 py-1 ${style.badge}`}>
                        {FATOR_RISCO_LABEL[risco]}
                      </Badge>
                    </div>
                    <div className={`rounded-lg border px-6 py-4 text-xs ${style.box}`}>
                      {style.texto}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {combinacoesDetectadas.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#e2e8f0] px-12 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
              <Check className="size-6 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-slate-900">
                Nenhuma combinação crítica identificada
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Os 10 fatores acompanhados nos testes EEA e DT deste funcionário não formaram, até
                o momento, nenhuma das combinações de risco monitoradas pela Nexus.
              </p>
            </div>
          </div>
        )}

        {combinacoesDetectadas.map((def) => {
          const nivelStyle = NIVEL_COMBO_STYLE[def.nivel];
          return (
            <div key={def.id} className="w-full overflow-hidden rounded-2xl border border-[#e2e8f0]">
              <div
                className="flex items-center gap-3 px-5 py-4"
                style={{ backgroundColor: nivelStyle.bg }}
              >
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${nivelStyle.ink} ${nivelStyle.ink === "text-white" ? "border-white" : "border-black"}`}>
                  {def.nivel === "CRÍTICO" ? "Crítico" : def.nivel === "ESPECIAL" ? "Especial" : "Alta"}
                </span>
                <p className={`flex-1 text-sm font-bold ${nivelStyle.ink}`}>{def.nome}</p>
              </div>
              <div className="flex flex-col gap-4 bg-white p-5">
                <p className="text-[11px] font-semibold tracking-[0.44px] text-slate-600">
                  FATORES ENVOLVIDOS
                </p>
                <div className="flex flex-wrap gap-2">
                  {def.fatores.map((f) => (
                    <span
                      key={f}
                      className={`rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium ${nivelStyle.tagText}`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-900">Por que esta combinação foi acionada?</p>
                <p className="text-sm leading-relaxed text-slate-600">{def.impactoOperacional}</p>
                <div
                  className="flex items-start gap-2.5 rounded-xl px-4 py-3.5"
                  style={{ backgroundColor: nivelStyle.bg }}
                >
                  <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${nivelStyle.ink}`} />
                  <p className={`text-sm leading-relaxed ${nivelStyle.ink}`}>
                    <span className="font-bold">Ação recomendada: </span>
                    {def.protocolo}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="w-full gap-0 py-0 shadow-sm">
        <div className="flex flex-row items-center justify-between gap-4 px-6 py-5">
          <CardTitle className="text-base font-semibold tracking-[0.48px] text-[#2a2a2a]">Gráfico de risco</CardTitle>
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
          </div>
        </div>
        <CardContent className="border-t px-6 py-5">
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resultados} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.6} />
                <XAxis type="number" domain={[0, maxEscalaTeste]} hide />
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
                    <Cell key={r.nome} fill={RISCO_HEX[classificarRiscoPorTipo(r.nota, teste.tipo)]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Collapsible defaultOpen className="w-full">
        <Card className="w-full gap-0 py-0 shadow-sm">
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <CardTitle className="text-base font-semibold tracking-[0.48px] text-[#2a2a2a]">Perguntas puladas</CardTitle>
            <CollapsibleTrigger className="group flex items-center text-muted-foreground hover:text-foreground">
              <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <CardContent className="border-t px-6 py-5">
              {perguntasPuladas.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todas as perguntas foram respondidas.</p>
              ) : (
                <div className={`grid grid-cols-1 gap-4 ${perguntasPuladas.length > 1 ? "sm:grid-cols-2" : ""}`}>
                  {perguntasPuladas.map((p, i) => (
                    <div key={i} className="space-y-3 rounded-lg border border-[#f0f0f0] px-6 py-4">
                      <p className="text-sm font-medium text-[#2e2e2e]">{p.fator}</p>
                      <p className="text-sm text-muted-foreground">{p.pergunta}</p>
                      <div className="rounded-lg border border-[#e2e8f0] px-6 py-4 text-xs text-muted-foreground">
                        <span className="font-semibold">Motivo: </span>
                        {p.motivo}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </Layout>
  );
}
