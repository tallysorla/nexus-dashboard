import { Link, useParams, useSearchParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  History,
  ShieldAlert,
  SkipForward,
  TrendingDown,
  TrendingUp,
  User,
} from "lucide-react";
import {
  RISCO_BADGE_CLASS,
  RISCO_LABEL,
  autorizacaoDoTeste,
  classificarRiscoDT,
  fatoresDoTeste,
  getColaboradorById,
  horaDoTeste,
  parseDataBr,
  perguntasPuladasDoTeste,
  proximaReavaliacaoDoTeste,
  recomendacaoDoTeste,
  resultadosCompletosDoTeste,
} from "@/lib/mock-colaboradores";
import { getEmpresaById, getFilialById, gestorResponsavelDoColaborador } from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

export default function TesteDetail() {
  const { cid, colaboradorId, testeId } = useParams<{
    cid: string;
    colaboradorId: string;
    testeId: string;
  }>();
  const [searchParams] = useSearchParams();

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
  const fatoresCriticos = fatoresDoTeste(teste);
  const resultados = resultadosCompletosDoTeste(teste);
  const perguntasPuladas = perguntasPuladasDoTeste(teste);
  const gestor = gestorResponsavelDoColaborador(colaborador);
  const hora = horaDoTeste(colaborador.id, teste.id);

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

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Resumo da avaliação</h1>
        <p className="text-sm text-muted-foreground">
          {colaborador.nome} · Teste {teste.tipo} · {teste.data} · {hora}
        </p>
      </div>

      <Card className="w-full shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p
                className={`text-lg font-semibold ${
                  autorizacao.autorizado ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {autorizacao.label}
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[teste.status]}`}>
                  {teste.classificacao}
                </Badge>
                <span className="text-2xl font-semibold">{teste.pontuacao}/100</span>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href={`/funcionarios/${colaborador.id}`}>
                <User className="size-4" />
                Ver perfil do funcionário
              </Link>
            </Button>
          </div>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recomendação principal
            </p>
            <p className="mt-1 text-sm">{recomendacaoDoTeste(teste)}</p>
          </div>

          {gestor && (
            <p className="text-sm text-muted-foreground">
              Gestor responsável: <span className="font-medium text-foreground">{gestor.nome}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Resumo rápido</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Principal fator crítico</dt>
              <dd className="text-sm font-medium">{fatoresCriticos[0] ?? "Nenhum fator em atenção"}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Evolução</dt>
              <dd className="flex items-center gap-1.5 text-sm font-medium">
                {variacao === null || variacao === 0 ? (
                  "Estável"
                ) : variacao > 0 ? (
                  <>
                    <TrendingUp className="size-4 text-red-600" />
                    Piorando
                  </>
                ) : (
                  <>
                    <TrendingDown className="size-4 text-emerald-600" />
                    Melhorando
                  </>
                )}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Comparação com último teste {teste.tipo}</dt>
              <dd className="text-sm font-medium">
                {anterior
                  ? `${anterior.pontuacao} → ${teste.pontuacao} (${variacao! > 0 ? "+" : ""}${variacao})`
                  : "Sem teste anterior para comparar"}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs text-muted-foreground">Próxima reavaliação</dt>
              <dd className="text-sm font-medium">{proximaReavaliacaoDoTeste(teste)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldAlert className="size-4.5 text-muted-foreground" />
            Fatores críticos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {fatoresCriticos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum fator crítico neste teste.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {fatoresCriticos.map((nome) => (
                <Badge
                  key={nome}
                  variant="outline"
                  className={`rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[teste.status]}`}
                >
                  {nome}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="size-4.5 text-muted-foreground" />
            Resultados completos
          </CardTitle>
          <p className="text-sm text-muted-foreground">Nota por fator neste teste, escala 0-75</p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {resultados.map((r) => {
              const risco = classificarRiscoDT(r.nota);
              return (
                <div
                  key={r.nome}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                    r.critico ? "bg-muted/30" : ""
                  }`}
                >
                  <p className="truncate text-sm font-medium">{r.nome}</p>
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
            <History className="size-4.5 text-muted-foreground" />
            Histórico
          </CardTitle>
          <p className="text-sm text-muted-foreground">Testes {teste.tipo} anteriores deste funcionário</p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Este é o primeiro teste {teste.tipo} registrado.</p>
          ) : (
            <div className="space-y-1">
              {historico.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/50">
                  <span className="text-sm text-muted-foreground">{t.data}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t.pontuacao}/100</span>
                    <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-xs ${RISCO_BADGE_CLASS[t.status]}`}>
                      {t.classificacao}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-lg">
            <SkipForward className="size-4.5 text-muted-foreground" />
            Perguntas puladas
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {perguntasPuladas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma pergunta foi pulada neste teste.</p>
          ) : (
            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted-foreground">
              {perguntasPuladas.map((pergunta) => (
                <li key={pergunta}>{pergunta}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Collapsible className="w-full">
        <Card className="w-full gap-0 py-0 shadow-sm">
          <CollapsibleTrigger className="group flex w-full items-center justify-between px-6 py-5 text-left">
            <span className="text-lg font-semibold">Detalhes do funcionário</span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid grid-cols-1 gap-4 border-t px-6 py-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Cargo</p>
                <p className="text-sm font-medium">{colaborador.cargo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Setor</p>
                <p className="text-sm font-medium">{colaborador.setor}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Local</p>
                <p className="text-sm font-medium">{colaborador.local}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Matrícula</p>
                <p className="text-sm font-medium">{colaborador.matricula}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CPF</p>
                <p className="text-sm font-medium">{colaborador.cpf}</p>
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
