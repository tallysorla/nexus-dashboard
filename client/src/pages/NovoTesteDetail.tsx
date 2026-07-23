import { useState } from "react";
import { Link, useParams, useSearchParams } from "wouter";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProfile } from "@/contexts/ProfileContext";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  Flag,
  History,
  Stethoscope,
  User,
} from "lucide-react";
import {
  RISCO_LABEL,
  autorizacaoDoTeste,
  classificarRiscoDT,
  duracaoDoTeste,
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
type CasoComDef = { caso: CombinacaoCriticaCaso; def: CombinacaoCriticaDef };

function CombinacaoCard({
  caso,
  def,
  index,
  variant,
}: {
  caso: CombinacaoCriticaCaso;
  def: CombinacaoCriticaDef;
  index: number;
  variant: "compacta" | "completa";
}) {
  const especial = def.nivel === "ESPECIAL";
  const pendente = caso.status === "sem_tratativa";
  // A divisao lado a lado (diagnostico | acao) so cabe confortavelmente
  // quando o card ocupa a largura toda -- no card compacto (Visao geral)
  // ele vive numa coluna de metade da tela, entao fica sempre empilhado.
  const ladoALado = variant === "completa" ? "lg:flex-row" : "";

  return (
    <div className="overflow-hidden rounded-xl border shadow-sm">
      <div className={`flex items-center gap-3 p-4 ${especial ? "bg-slate-900 text-white" : "bg-card"}`}>
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            especial ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
          }`}
        >
          {especial ? <AlertTriangle className="size-4" /> : index + 1}
        </div>
        <p className="font-semibold">{def.nome}</p>
        <Badge
          variant="outline"
          className={`rounded-lg px-2 py-0.5 text-xs ${especial ? "border-white/30 bg-white/10 text-white" : NIVEL_BADGE_CLASS[def.nivel]}`}
        >
          {especial ? "Prioridade absoluta" : NIVEL_LABEL[def.nivel]}
        </Badge>
      </div>

      {/* Diagnostico (fatores + orientacao do protocolo) separado da acao
          (callout de encaminhamento ao DT) -- o gestor nao precisa ler os
          dois com o mesmo peso, so a acao exige destaque de cor. */}
      <div className={`flex flex-col ${ladoALado}`}>
        <div className="flex-1 space-y-3 p-4">
          <div>
            <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
              Fatores combinados
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {def.fatores.map((f) => (
                <Badge key={f} variant="outline" className="rounded border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                  {f}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="text-sm font-semibold">Orientação do protocolo</p>
            <p className="mt-1 text-sm text-muted-foreground">{def.protocolo}</p>
          </div>

          {variant === "completa" && (
            <Collapsible>
              <CollapsibleTrigger className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
                Ver explicação técnica
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="mt-2 text-sm text-foreground/80">{def.vulnerabilidade}</p>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        <div
          className={`w-full space-y-3 border-t p-4 lg:w-[300px] lg:border-t-0 lg:border-l ${
            especial ? "border-red-700 bg-red-600 text-white" : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className={`size-4 shrink-0 ${especial ? "text-white" : "text-red-600"}`} />
            <p className={`text-sm font-semibold ${especial ? "text-white" : "text-red-700"}`}>
              {especial ? "Afastamento imediato obrigatório" : "Necessário encaminhamento para teste DT"}
            </p>
          </div>
          <div className={`h-px w-full ${especial ? "bg-white/30" : "bg-red-200"}`} />
          <p className={`text-sm ${especial ? "text-white/90" : "text-red-900"}`}>{def.focoDT}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t p-4">
        <span className={`text-xs font-medium ${pendente ? "text-red-600" : "text-amber-600"}`}>
          Status: {pendente ? "Sem tratativa" : "Em tratativa"}
        </span>
        <Button asChild size="sm" variant={pendente ? "default" : "outline"} className="rounded-xl">
          <Link href={`/empresas/${caso.empresaId}/combinacoes/${caso.id}`}>
            Ver tratativa
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

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
  const [aba, setAba] = useState("visao-geral");

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
  const casos: CasoComDef[] = podeVerRisco
    ? casosDoColaborador(colaborador.id)
        .map((caso) => ({ caso, def: getCombinacaoCriticaById(caso.combinacaoId) }))
        .filter((item): item is CasoComDef => item.def !== undefined)
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
  // O teste aberto e sempre um dos dois (EEA ou DT) -- a coluna
  // correspondente mostra os dados DELE, nao o mais recente do historico
  // geral, para o cabecalho refletir o teste especifico que foi escolhido
  // (e nao "o que ha de mais novo" no funcionario).
  const eeaExibido = teste.tipo === "EEA" ? teste : testesEea[0];
  const dtExibido = teste.tipo === "DT" ? teste : testesDt[0];
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

  const proximaAcao =
    casosPendentes.length > 0 ? (
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
    );

  const resultadosDosFatores = (
    <Card className="w-full py-0 shadow-sm">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardList className="size-4.5 text-muted-foreground" />
          Resultados dos fatores (EEA)
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="divide-y">
          {resultados.map((r) => {
            const risco = classificarRiscoDT(r.nota);
            const relacionado = fatoresRelacionados.has(r.nome);
            return (
              <div key={r.nome} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2">
                  {relacionado && <span className="size-2 shrink-0 rounded-full bg-red-500" />}
                  <span className="truncate text-sm">{r.nome}</span>
                </span>
                <div className="flex w-36 items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(r.nota / 10) * 100}%`, backgroundColor: RISCO_HEX[risco] }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-xs text-muted-foreground">{r.nota}/10</span>
                </div>
                <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-xs ${STATUS_TEXT_CLASS[risco]}`}>
                  {RISCO_LABEL[risco]}
                </Badge>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
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
          {fatoresRelacionados.size > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500" />
              Fatores que compõem combinações detectadas
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

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

      {/* Cabecalho -- prioriza "o que precisa acontecer agora" em vez da
          pontuacao bruta do teste. */}
      <Card className="w-full shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold">{colaborador.nome}</h2>
                <Badge variant="outline" className="rounded-lg border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700">
                  Teste {teste.tipo}
                </Badge>
              </div>
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

          {/* Dados especificos deste teste -- nota, duracao e autorizacao,
              o que o usuario pediu de volta do formato antigo. */}
          <div className="grid grid-cols-2 gap-6 rounded-xl bg-muted/30 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Autorização para exercer a função</p>
              <p className={`mt-1 text-lg font-bold ${autorizacaoColorClass}`}>{autorizacaoLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pontuação total</p>
              <p className="mt-1 text-lg font-bold">{teste.pontuacao} / 100</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className={`mt-1 text-lg font-bold ${STATUS_TEXT_CLASS[teste.status]}`}>{teste.classificacao}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duração do teste</p>
              <p className="mt-1 text-lg font-bold">{duracaoDoTeste(colaborador.id, teste.id)} min</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-11 px-4">
                    <span className="flex items-center gap-1.5">
                      EEA
                      {teste.tipo === "EEA" && (
                        <Badge variant="outline" className="rounded-md border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                          Este teste
                        </Badge>
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="h-11 px-4">
                    <span className="flex items-center gap-1.5">
                      DT
                      {teste.tipo === "DT" && (
                        <Badge variant="outline" className="rounded-md border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] text-primary">
                          Este teste
                        </Badge>
                      )}
                    </span>
                  </TableHead>
                  <TableHead className="h-11 px-4">Última ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="px-4 py-3">
                    {eeaExibido ? `${eeaExibido.data} · ${horaDoTeste(colaborador.id, eeaExibido.id)}` : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {dtExibido ? `${dtExibido.data} · ${horaDoTeste(colaborador.id, dtExibido.id)}` : "Pendente"}
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

      <Tabs value={aba} onValueChange={setAba} className="w-full">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="combinacoes">Combinações detectadas</TabsTrigger>
          <TabsTrigger value="dt">DT</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            <div className="space-y-6">
              {podeVerRisco && casos.length > 0 && (
                <Card className="w-full py-0 shadow-sm">
                  <CardHeader className="px-6 pt-6">
                    <CardTitle className="text-lg">Combinações críticas identificadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    {casos.map(({ caso, def }, index) => (
                      <CombinacaoCard key={caso.id} caso={caso} def={def} index={index} variant="compacta" />
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="w-full py-0 shadow-sm">
                <CardHeader className="px-6 pt-6">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Flag className="size-4.5 text-muted-foreground" />
                    Próxima ação
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">{proximaAcao}</CardContent>
              </Card>

              {podeVerRisco && (
                <p className="text-xs text-muted-foreground">
                  Somente gestores têm acesso às combinações detectadas e à tratativa.
                </p>
              )}
            </div>

            <div className="space-y-6">
              {resultadosDosFatores}

              <Card className="w-full py-0 shadow-sm">
                <CardHeader className="px-6 pt-6">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="size-4.5 text-muted-foreground" />
                    Histórico da tratativa
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  {eventos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>
                  ) : (
                    <ol className="space-y-4">
                      {eventos.slice(0, 3).map((evento, index) => (
                        <li key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className="mt-1 size-2.5 shrink-0 rounded-full bg-primary" />
                            {index < Math.min(eventos.length, 3) - 1 && (
                              <span className="mt-1 w-px flex-1 bg-border" />
                            )}
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
                  <Button
                    variant="outline"
                    className="mt-4 w-full rounded-xl"
                    onClick={() => setAba("historico")}
                  >
                    Ver histórico completo
                    <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="combinacoes" className="space-y-3">
          {podeVerRisco && casos.length > 0 ? (
            casos.map(({ caso, def }, index) => (
              <CombinacaoCard key={caso.id} caso={caso} def={def} index={index} variant="completa" />
            ))
          ) : (
            <Card className="w-full py-0 shadow-sm">
              <CardContent className="px-6 py-8 text-center text-sm text-muted-foreground">
                Nenhuma combinação crítica identificada para este funcionário.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dt" className="space-y-6">
          {casosPendentes.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                {casosPendentes.length === 1
                  ? `A combinação ${casosPendentes[0].def.nome} precisa de um DT mais aprofundado.`
                  : `${casosPendentes.length} combinações precisam de um DT mais aprofundado.`}
              </p>
              <Button
                size="sm"
                className="rounded-xl"
                onClick={() => toast(`Iniciando novo DT para ${colaborador.nome}`)}
              >
                <Stethoscope className="size-4" />
                Iniciar novo DT
              </Button>
            </div>
          )}

          <Card className="w-full py-0 shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-lg">Testes DT realizados</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {testesDt.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum DT realizado ainda para este funcionário.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="h-11 px-4">Data</TableHead>
                        <TableHead className="h-11 px-4">Pontuação</TableHead>
                        <TableHead className="h-11 px-4">Classificação</TableHead>
                        <TableHead className="h-11 px-4" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testesDt.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="px-4 py-3">
                            {t.data} · {horaDoTeste(colaborador.id, t.id)}
                          </TableCell>
                          <TableCell className="px-4 py-3">{t.pontuacao} / 100</TableCell>
                          <TableCell className="px-4 py-3">
                            <span className={STATUS_TEXT_CLASS[t.status]}>{t.classificacao}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                            <Button asChild size="sm" variant="outline" className="rounded-xl">
                              <Link href={`/empresas/${empresa.id}/ntestes/${colaborador.id}/${t.id}`}>Ver</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-6">
          <Card className="w-full py-0 shadow-sm">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="size-4.5 text-muted-foreground" />
                Histórico da tratativa
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Combinações identificadas e ações registradas para {colaborador.nome}
              </p>
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
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-lg">Registrar tratativa simples</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="mb-3 text-sm text-muted-foreground">
                Para conversas e feedbacks pontuais, sem vínculo com uma combinação específica.
              </p>
              <TratativaDialog colaboradorNome={colaborador.nome} onRegistrar={registrarTratativaSimples} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
