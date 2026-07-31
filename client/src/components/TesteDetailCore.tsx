import { useState } from "react";
import { Link } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AutorizacaoFuncaoDialog } from "@/components/AutorizacaoFuncaoDialog";
import { AlertTriangle, ArrowRight, Ban, Check, CheckCircle2 } from "lucide-react";
import {
  RISCO_LABEL,
  autorizacaoDoTeste,
  classificarRiscoPorTipo,
  descricaoRiscoFator,
  duracaoDoTeste,
  horaDoTeste,
  perguntasPuladasDoTeste,
  recomendacaoDoTeste,
  resultadosCompletosDoTeste,
  type Colaborador,
  type DecisaoAutorizacao,
  type RiskLevel,
  type TesteHistorico,
} from "@/lib/mock-colaboradores";
import {
  casosDoColaborador,
  COMBINACOES_CRITICAS,
  NIVEL_LABEL,
  type NivelCombinacao,
} from "@/lib/mock-empresas";

// So a Triade (nivel mais severo) troca as 3 acoes genericas de tratativa
// pelas 3 especificas pedidas no criterio de aceite -- as demais combinacoes
// continuam levando o gestor pra tela de tratativa completa, que mantem as
// acoes genericas (Encaminhar ao DT / Suspender operacao / Encaminhamento
// clinico).
const ACOES_ESPECIAL = ["Contato com a WeSafety", "Consulta com RH", "Encaminhamento especializado"];

const ORDEM_NIVEL: Record<NivelCombinacao, number> = { ESPECIAL: 0, "CRÍTICO": 1, ALTA: 2 };

const NIVEL_HEADER_CLASS: Record<NivelCombinacao, string> = {
  ESPECIAL: "bg-slate-900",
  "CRÍTICO": "bg-[#d53131]",
  ALTA: "bg-amber-600",
};

const NIVEL_TAG_CLASS: Record<NivelCombinacao, string> = {
  ESPECIAL: "border-white/30 bg-white/10 text-white",
  "CRÍTICO": "border-[#fecaca] bg-[#fef2f2] text-[#d53131]",
  ALTA: "border-amber-200 bg-amber-50 text-amber-800",
};

const RISCO_HEX: Record<RiskLevel, string> = {
  alto: "#dc3545",
  medio: "#ffc107",
  baixo: "#28a745",
};

const STATUS_TEXT_CLASS: Record<RiskLevel, string> = {
  alto: "text-red-600",
  medio: "text-amber-600",
  baixo: "text-emerald-600",
};

type TesteDetailCoreProps = {
  colaborador: Colaborador;
  teste: TesteHistorico;
};

// Miolo visual da tela de detalhes de um teste -- compartilhado pelas duas
// rotas que levam pra ela (TesteDetail via menu Testes, FuncionarioTesteDetail
// via historico do proprio funcionario). As duas telas ja mostraram a mesma
// informacao de formas visualmente diferentes uma vez; centralizar aqui evita
// que voltem a divergir. So o que fica FORA do card principal (breadcrumb,
// link de volta, Historico de tratativas, Detalhes do funcionario) e
// especifico de cada pagina.
export function TesteDetailCore({ colaborador, teste }: TesteDetailCoreProps) {
  const [decisaoAutorizacao, setDecisaoAutorizacao] = useState<DecisaoAutorizacao | undefined>(
    teste.autorizacaoDecidida
  );

  const initials = colaborador.nome
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

  // O Gráfico de risco logo acima já mostra os 10 fatores visualmente -- a
  // secao "Fatores com resultado negativo" so precisa detalhar em texto os
  // que exigem atencao, sem repetir os 10 de novo (a maioria fica baixo
  // risco na pratica).
  const maxEscalaTeste = teste.tipo === "EEA" ? 100 : 750;
  const resultadosEmAtencao = resultados.filter((r) => classificarRiscoPorTipo(r.nota, teste.tipo) !== "baixo");

  // Regra de negocio: uma combinacao critica esta ativa NESTE teste quando
  // TODOS os fatores que ela exige estao em resultado negativo (medio/alto)
  // nos resultados deste teste especifico -- calculado a partir dos dados
  // reais do teste, nao de um "caso" pre-associado por coincidencia de data
  // (a lista estatica combinacoesCasos serve outro proposito: o banner de
  // nivel de perfil em NFuncionarioProfile/CombinacoesCriticasAlert).
  const nomesEmAtencao = new Set(resultadosEmAtencao.map((r) => r.nome));
  const combinacoesAtivas = COMBINACOES_CRITICAS.filter((def) =>
    def.fatores.every((f) => nomesEmAtencao.has(f))
  ).sort((a, b) => ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel]);
  const temCombinacaoCritica = combinacoesAtivas.length > 0;
  // Caso real (se existir) da combinacao mais severa, so pra linkar o botao
  // "Iniciar tratativa recomendada" a uma tratativa de verdade -- quando a
  // combinacao foi detectada so pela regra de fatores, sem caso registrado
  // pra ela, o botao nao aparece.
  const casoDaPrincipal = combinacoesAtivas[0]
    ? casosDoColaborador(colaborador.id).find((c) => c.combinacaoId === combinacoesAtivas[0].id)
    : undefined;

  // Quando ha combinacao critica, o protocolo dela e mais especifico e
  // urgente que a recomendacao generica do teste -- mostrar as duas ao
  // mesmo tempo dava a impressao de duas orientacoes conflitantes (uma de
  // rotina, outra de encaminhamento imediato). Uma unica acao prevalece (a
  // da combinacao mais severa, quando ha mais de uma ativa).
  const acaoRecomendada = combinacoesAtivas[0] ? combinacoesAtivas[0].protocolo : recomendacaoDoTeste(teste);

  return (
    <>
      <Card className="w-full shadow-sm">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-12 shrink-0">
                <AvatarImage src={colaborador.avatarUrl} className="object-cover" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-base font-bold">{colaborador.nome}</h2>
                <p className="text-xs text-muted-foreground">CPF: {colaborador.cpf}</p>
              </div>
            </div>
            <Badge variant="outline" className="rounded-lg border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              Teste {teste.tipo}
            </Badge>
          </div>

          <div className="border-t" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-base text-muted-foreground">Autorização para exercer a função</p>
              <p className={`mt-1 text-xl font-bold leading-tight ${autorizacaoColorClass}`}>{autorizacaoLabel}</p>
            </div>
            <div>
              <p className="text-base text-muted-foreground">Status</p>
              <p className={`mt-1 text-xl font-bold leading-tight ${STATUS_TEXT_CLASS[teste.status]}`}>
                {teste.classificacao}
              </p>
            </div>
            <div>
              <p className="text-base text-muted-foreground">Duração do teste</p>
              <p className="mt-1 text-xl font-bold leading-tight">{duracao} min</p>
            </div>
          </div>

          {/* Um unico alerta, no lugar de tres empilhados ("Atenção: risco
              detectado" + "Ação recomendada pelo protocolo" + a decisao do
              gestor) -- o Figma so mostra um alerta por vez: a decisao do
              gestor (quando ja existe) prevalece e substitui os outros dois,
              em vez de conviver com eles. */}
          {teste.status === "medio" && decisaoAutorizacao ? (
            <div
              className={`flex items-center gap-4 rounded-lg border p-4 shadow-sm ${
                decisaoAutorizacao.decisao === "autorizado"
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-[#e65959] bg-[#fff2f2]"
              }`}
            >
              <div
                className={`flex size-[61px] shrink-0 items-center justify-center rounded-lg ${
                  decisaoAutorizacao.decisao === "autorizado" ? "bg-emerald-100" : "bg-[#ffdbdb]"
                }`}
              >
                {decisaoAutorizacao.decisao === "autorizado" ? (
                  <CheckCircle2 className="size-8 text-emerald-600" />
                ) : (
                  <Ban className="size-8 text-[#e65959]" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-bold">
                  Autorização para exercer a função{" "}
                  {decisaoAutorizacao.decisao === "autorizado" ? "concedida" : "negada"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Funcionário autorizado pelo gestor(a): </span>
                  {decisaoAutorizacao.autor}
                </p>
                {decisaoAutorizacao.observacao && (
                  <p className="text-sm text-muted-foreground">{decisaoAutorizacao.observacao}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Data/Hora: </span>
                  {decisaoAutorizacao.data}, {decisaoAutorizacao.hora}
                </p>
              </div>
            </div>
          ) : teste.status === "baixo" ? (
            <div className="flex items-center gap-4 rounded-lg border border-emerald-300 bg-emerald-50 p-4 shadow-sm">
              <div className="flex size-[61px] shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <CheckCircle2 className="size-8 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="font-bold">Nenhum risco relevante identificado</p>
                <p className="text-sm text-muted-foreground">
                  Os resultados do teste não indicam fatores que exijam atenção imediata.
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`flex items-center gap-4 rounded-lg border p-4 shadow-sm ${
                teste.status === "alto" ? "border-[#e65959] bg-[#fff2f2]" : "border-amber-300 bg-amber-50"
              }`}
            >
              <div
                className={`flex size-[61px] shrink-0 items-center justify-center rounded-lg ${
                  teste.status === "alto" ? "bg-[#ffdbdb]" : "bg-amber-100"
                }`}
              >
                {teste.status === "alto" ? (
                  <Ban className="size-8 text-[#e65959]" />
                ) : (
                  <AlertTriangle className="size-8 text-amber-600" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-bold">
                  {teste.status === "alto"
                    ? "Autorização para exercer a função negada"
                    : "Autorização para exercer a função aguardando decisão"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Ação recomendada: </span>
                  {acaoRecomendada}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Data/Hora: </span>
                  {teste.data}, {hora}
                </p>
              </div>
            </div>
          )}

          {/* Alto ja bloqueia e baixo ja libera automaticamente -- so o
              medio ("Aguardando") exige essa decisao explicita do gestor. */}
          {teste.status === "medio" && !decisaoAutorizacao && (
            <AutorizacaoFuncaoDialog
              colaboradorNome={colaborador.nome}
              classificacao={teste.classificacao}
              onDecidir={(decisao) => {
                teste.autorizacaoDecidida = decisao;
                setDecisaoAutorizacao(decisao);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Fatores com resultado negativo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          {resultadosEmAtencao.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum fator em atenção — os 10 fatores estão em baixo risco neste teste.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resultadosEmAtencao.map((r) => {
                const risco = classificarRiscoPorTipo(r.nota, teste.tipo);
                const badgeClass =
                  risco === "alto"
                    ? "border-[#f53838] bg-[rgba(245,56,56,0.12)] text-[#f53838]"
                    : "border-[#f59e0b] bg-[rgba(245,158,11,0.12)] text-[#f59e0b]";
                const boxClass =
                  risco === "alto"
                    ? "border-[#f23737] bg-[#fff2f2] text-[#666]"
                    : "border-[#f39c12] bg-[#fffcf0] text-[#666]";
                return (
                  <div key={r.nome} className="rounded-lg border border-[#e9e9e9] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{r.nome}</p>
                      <Badge variant="outline" className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${badgeClass}`}>
                        {RISCO_LABEL[risco]}
                      </Badge>
                    </div>
                    <div className={`mt-3 rounded-lg border p-3 text-sm ${boxClass}`}>
                      {descricaoRiscoFator(risco)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!temCombinacaoCritica ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 px-12 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-50">
                <Check className="size-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-slate-900">Nenhuma combinação crítica identificada</p>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  Os 10 fatores acompanhados nos testes EEA e DT deste funcionário não formaram, até o
                  momento, nenhuma das combinações de risco monitoradas pela Nexus.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {combinacoesAtivas.map((def) => {
                const especial = def.nivel === "ESPECIAL";
                const caso =
                  def.id === combinacoesAtivas[0].id
                    ? casoDaPrincipal
                    : casosDoColaborador(colaborador.id).find((c) => c.combinacaoId === def.id);
                return (
                  <div key={def.id} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className={`flex items-center gap-3 px-5 py-4 ${NIVEL_HEADER_CLASS[def.nivel]}`}>
                      <Badge variant="outline" className="rounded-full border-white bg-transparent px-2.5 py-1 text-xs font-semibold text-white">
                        {NIVEL_LABEL[def.nivel]}
                      </Badge>
                      <p className="font-bold text-white">{def.nome}</p>
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
                          Fatores envolvidos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {def.fatores.map((f) => (
                            <Badge
                              key={f}
                              variant="outline"
                              className={`rounded-full px-3 py-1.5 text-xs font-medium ${NIVEL_TAG_CLASS[def.nivel]}`}
                            >
                              {f}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900">Por que esta combinação foi acionada?</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{def.impactoOperacional}</p>
                      </div>
                      <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3.5 ${NIVEL_HEADER_CLASS[def.nivel]}`}>
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-white" />
                        <p className="text-[13px] text-white">
                          <strong className="font-bold">Ação recomendada: </strong>
                          {def.protocolo}
                        </p>
                      </div>
                      {especial && (
                        <div className="flex flex-wrap gap-1.5">
                          {ACOES_ESPECIAL.map((acao) => (
                            <Badge
                              key={acao}
                              variant="outline"
                              className="rounded-lg border-slate-300 bg-slate-100 px-2 py-0.5 text-xs text-slate-800"
                            >
                              {acao}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {caso && (
                        <Button asChild size="sm" variant="outline" className="rounded-xl">
                          <Link href={`/empresas/${caso.empresaId}/combinacoes/${caso.id}`}>
                            Iniciar tratativa recomendada
                            <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full gap-0 py-0 shadow-sm">
        <div className="flex flex-row items-center justify-between gap-4 px-6 py-5">
          <CardTitle className="text-lg">Gráfico de risco</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: RISCO_HEX.baixo }} />
              Baixo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: RISCO_HEX.medio }} />
              Médio
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ backgroundColor: RISCO_HEX.alto }} />
              Alto
            </span>
          </div>
        </div>
        <CardContent className="border-t px-6 py-5">
          <p className="mb-3 text-xs text-muted-foreground">
            Cada fator é classificado independentemente em baixo, médio ou alto risco.
          </p>
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

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Perguntas puladas</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {perguntasPuladas.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="size-4 shrink-0" />
              Todas as perguntas foram respondidas.
            </p>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm font-medium text-amber-700">
                <AlertTriangle className="size-4 shrink-0" />
                {perguntasPuladas.length} pergunta{perguntasPuladas.length > 1 ? "s" : ""} não respondida
                {perguntasPuladas.length > 1 ? "s" : ""} — considere isso ao avaliar o resultado.
              </p>
              <Accordion type="multiple" defaultValue={perguntasPuladas.map((_, i) => `pp-${i}`)} className="mt-2">
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
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
