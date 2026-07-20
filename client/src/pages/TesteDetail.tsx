import { Link, useParams, useSearchParams } from "wouter";
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { KpiCard } from "@/components/MetricsCards";
import { TesteCombinacaoCritica } from "@/components/TesteCombinacaoCritica";
import { useProfile } from "@/contexts/ProfileContext";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  History,
  PieChart as PieChartIcon,
  ShieldAlert,
  SkipForward,
  Target,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  autorizacaoDoTeste,
  classificarRiscoDT,
  getColaboradorById,
  horaDoTeste,
  parseDataBr,
  perguntasPuladasDoTeste,
  proximaReavaliacaoDoTeste,
  recomendacaoDoTeste,
  resultadosCompletosDoTeste,
  tempoNaEmpresa,
  type RiskLevel,
} from "@/lib/mock-colaboradores";
import { getEmpresaById, getFilialById, gestorResponsavelDoColaborador } from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

const RISCO_HEX: Record<RiskLevel, string> = {
  alto: "#dc2626",
  medio: "#d97706",
  baixo: "#059669",
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

  if (!empresa || !colaborador || !teste) return <NotFound />;

  const filialId = searchParams.get("filial");
  const filial = filialId ? getFilialById(empresa, filialId) : undefined;
  const voltarHref = `/empresas/${empresa.id}/testes${filial ? `?filial=${filial.id}` : ""}`;

  const mesmoTipo = [...colaborador.historicoTestes]
    .filter((t) => t.tipo === teste.tipo)
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime());
  const indiceAtual = mesmoTipo.findIndex((t) => t.id === teste.id);
  const anterior = mesmoTipo[indiceAtual + 1];
  const variacao = anterior ? teste.pontuacao - anterior.pontuacao : null;
  const historico = mesmoTipo.slice(indiceAtual + 1, indiceAtual + 6);

  const autorizacao = autorizacaoDoTeste(teste.status);
  const resultados = resultadosCompletosDoTeste(teste);
  const criticosOrdenados = resultados.filter((r) => r.critico).sort((a, b) => b.nota - a.nota);
  const principalFator = criticosOrdenados[0]?.nome ?? "Nenhum fator em atenção";
  const perguntasPuladas = perguntasPuladasDoTeste(teste);
  const gestor = gestorResponsavelDoColaborador(colaborador);
  const hora = horaDoTeste(colaborador.id, teste.id);

  const distribuicao = resultados.reduce(
    (acc, r) => {
      const risco = classificarRiscoDT(r.nota);
      acc[risco] += 1;
      return acc;
    },
    { alto: 0, medio: 0, baixo: 0 } as Record<RiskLevel, number>
  );
  const distribuicaoData: { nome: RiskLevel; valor: number }[] = [
    { nome: "alto", valor: distribuicao.alto },
    { nome: "medio", valor: distribuicao.medio },
    { nome: "baixo", valor: distribuicao.baixo },
  ];

  const historicoChart = historico
    .map((t) => ({ data: t.data, pontuacao: t.pontuacao, status: t.status, classificacao: t.classificacao }))
    .reverse();

  const gestorIniciais = gestor?.nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

      <Link
        href={voltarHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Resumo da avaliação</h1>
          <p className="text-sm text-muted-foreground">
            {colaborador.nome} · Teste {teste.tipo} · {teste.data} · {hora}
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/funcionarios/${colaborador.id}`}>
            <User className="size-4" />
            Ver perfil do funcionário
          </Link>
        </Button>
      </div>

      {/* Status: autorizacao | recomendacao | gestor, lado a lado num unico
          card -- reflete as 3 perguntas que o gestor faz na mesma olhada
          ("posso liberar?", "o que fazer?", "quem cuida disso?"). */}
      <Card className="w-full shadow-sm">
        <CardContent className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                autorizacao.autorizado ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {autorizacao.autorizado ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <AlertTriangle className="size-5" />
              )}
            </div>
            <div className="space-y-1.5">
              <p
                className={`font-semibold ${autorizacao.autorizado ? "text-emerald-700" : "text-red-700"}`}
              >
                {autorizacao.label}
              </p>
              <Badge variant="outline" className={`w-fit rounded-lg px-2.5 py-0.5 text-xs ${RISCO_BADGE_CLASS[teste.status]}`}>
                {teste.classificacao}
              </Badge>
              <div>
                <p className="text-xs text-muted-foreground">Pontuação</p>
                <p className="text-2xl font-semibold">{teste.pontuacao}/100</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 lg:border-x lg:px-6">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recomendação principal
              </p>
              <p className="text-sm">{recomendacaoDoTeste(teste)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Gestor responsável</p>
            {gestor ? (
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="text-xs font-medium">{gestorIniciais}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{gestor.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {gestor.perfil} · {gestor.escopo}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum gestor vinculado a esta filial.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {profile.nav.includes("risco") && (
        <TesteCombinacaoCritica colaboradorId={colaborador.id} dataTeste={teste.data} />
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Resumo rápido</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Target}
            iconClassName="bg-sky-500/10 text-sky-600"
            label="Principal fator crítico"
            value={<span className="text-base font-semibold">{principalFator}</span>}
          />
          <KpiCard
            icon={variacao !== null && variacao > 0 ? TrendingUp : TrendingDown}
            iconClassName={
              variacao !== null && variacao > 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
            }
            label={`Comparação com último teste ${teste.tipo}`}
            value={
              <span className="text-base font-semibold">
                {anterior ? `${anterior.pontuacao} → ${teste.pontuacao} (${variacao! > 0 ? "+" : ""}${variacao})` : "—"}
              </span>
            }
            sublabel={anterior ? undefined : "Sem teste anterior para comparar"}
          />
          <KpiCard
            icon={variacao !== null && variacao > 0 ? TrendingUp : TrendingDown}
            iconClassName={
              variacao === null || variacao === 0
                ? "bg-muted text-muted-foreground"
                : variacao > 0
                  ? "bg-red-500/10 text-red-600"
                  : "bg-emerald-500/10 text-emerald-600"
            }
            label="Evolução"
            value={
              <span className="text-base font-semibold">
                {variacao === null || variacao === 0 ? "Estável" : variacao > 0 ? "Piorando" : "Melhorando"}
              </span>
            }
          />
          <KpiCard
            icon={CalendarClock}
            iconClassName="bg-violet-500/10 text-violet-600"
            label="Próxima reavaliação"
            value={<span className="text-base font-semibold">{proximaReavaliacaoDoTeste(teste)}</span>}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="size-4.5 text-muted-foreground" />
              Fatores críticos
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {criticosOrdenados.length === 0
                ? "Nenhum fator crítico neste teste."
                : `Top ${Math.min(2, criticosOrdenados.length)} fatores que mais impactaram o resultado.`}
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {criticosOrdenados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum fator em atenção neste teste.</p>
            ) : (
              <div className="space-y-4">
                {criticosOrdenados.slice(0, 2).map((r, i) => (
                  <div key={r.nome} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {i + 1}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-sm font-medium">{r.nome}</p>
                      <span className="shrink-0 text-sm font-semibold">{r.nota}/75</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(r.nota / 75) * 100}%`, backgroundColor: RISCO_HEX[classificarRiscoDT(r.nota)] }}
                      />
                    </div>
                  </div>
                ))}
                {criticosOrdenados.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{criticosOrdenados.length - 2} outro(s) fator(es) em atenção neste teste.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChartIcon className="size-4.5 text-muted-foreground" />
              Distribuição geral dos fatores
            </CardTitle>
            <p className="text-sm text-muted-foreground">Nota por fator neste teste, escala 0-75</p>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-center gap-6 px-6 pb-6 sm:justify-start">
            <div className="relative flex size-36 shrink-0 items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribuicaoData}
                    dataKey="valor"
                    nameKey="nome"
                    innerRadius="66%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={2}
                  >
                    {distribuicaoData.map((d) => (
                      <Cell key={d.nome} fill={RISCO_HEX[d.nome]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold">{resultados.length}</span>
                <span className="text-xs text-muted-foreground">fatores</span>
              </div>
            </div>
            <div className="space-y-2">
              {(["alto", "medio", "baixo"] as const).map((nivel) => (
                <div key={nivel} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: RISCO_HEX[nivel] }} />
                  <span className="font-medium">{distribuicao[nivel]}</span>
                  <span className="text-muted-foreground">{RISCO_LABEL[nivel]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="size-4.5 text-muted-foreground" />
            Histórico de testes {teste.tipo}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Testes anteriores deste funcionário</p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {historicoChart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este é o primeiro teste {teste.tipo} registrado.</p>
          ) : (
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicoChart} margin={{ left: 8, right: 24, top: 8, bottom: 0 }}>
                  <XAxis
                    dataKey="data"
                    axisLine={false}
                    tickLine={false}
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis domain={[0, 100]} hide />
                  <Line
                    type="monotone"
                    dataKey="pontuacao"
                    stroke="var(--muted-foreground)"
                    strokeWidth={2}
                    dot={(props) => {
                      const { cx, cy, payload, key } = props as {
                        cx: number;
                        cy: number;
                        payload: (typeof historicoChart)[number];
                        key: string;
                      };
                      return (
                        <circle
                          key={key}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={RISCO_HEX[payload.status]}
                          stroke="var(--card)"
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1">
            {historicoChart.map((t) => (
              <div key={t.data} className="flex items-center gap-1.5 text-xs">
                <span className="size-2 rounded-full" style={{ backgroundColor: RISCO_HEX[t.status] }} />
                <span className="font-medium">{t.pontuacao}/100</span>
                <span className="text-muted-foreground">{t.classificacao}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="w-full py-0 shadow-sm" id="resultados-completos">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="size-4.5 text-muted-foreground" />
              Resultados completos
            </CardTitle>
            <p className="text-sm text-muted-foreground">Nota por fator neste teste, escala 0-75</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="divide-y">
              {resultados.map((r) => {
                const risco = classificarRiscoDT(r.nota);
                return (
                  <div key={r.nome} className="flex items-center justify-between gap-3 py-2.5">
                    <p className="min-w-0 flex-1 truncate text-sm">{r.nome}</p>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.nota}/75</span>
                      <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-xs ${RISCO_BADGE_CLASS[risco]}`}>
                        {RISCO_LABEL[risco]}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <SkipForward className="size-4.5 text-muted-foreground" />
              Perguntas puladas
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {perguntasPuladas.length === 0
                ? "Nenhuma pergunta pulada neste teste"
                : `${perguntasPuladas.length} pergunta${perguntasPuladas.length === 1 ? "" : "s"} pulada${perguntasPuladas.length === 1 ? "" : "s"} neste teste`}
            </p>
          </CardHeader>
          <CardContent className="space-y-2 px-6 pb-6">
            {perguntasPuladas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma pergunta foi pulada neste teste.</p>
            ) : (
              perguntasPuladas.map((pergunta) => (
                <div key={pergunta} className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                  {pergunta}
                </div>
              ))
            )}
          </CardContent>
        </Card>
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
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="font-medium">{colaborador.nome}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cargo</p>
                <p className="font-medium">{colaborador.cargo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CPF</p>
                <p className="font-medium">{colaborador.cpf}</p>
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
              <div>
                <p className="text-xs text-muted-foreground">Data de admissão</p>
                <p className="text-sm font-medium">{colaborador.dataAdmissao}</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </Layout>
  );
}

