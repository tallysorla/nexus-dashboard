import { useState } from "react";
import { Link, useParams, useSearchParams } from "wouter";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { KpiCard } from "@/components/MetricsCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Download, Search, ShieldCheck } from "lucide-react";
import { getColaboradorById } from "@/lib/mock-colaboradores";
import {
  COMBINACOES_CRITICAS,
  casosDaEmpresa,
  casosDaFilial,
  diasDesde,
  getCombinacaoCriticaById,
  getEmpresaById,
  getFilialById,
  NIVEL_BADGE_CLASS,
  NIVEL_LABEL,
  SLA_DIAS_TRATATIVA,
  type NivelCombinacao,
  type StatusCaso,
} from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

export default function CombinacoesCriticas() {
  const { cid } = useParams<{ cid: string }>();
  const [searchParams] = useSearchParams();
  const empresa = getEmpresaById(cid ?? "");
  const filialId = searchParams.get("filial");
  const filial = empresa && filialId ? getFilialById(empresa, filialId) : undefined;

  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | StatusCaso>("todos");
  const [criticidadeFiltro, setCriticidadeFiltro] = useState<"todas" | NivelCombinacao>("todas");

  if (!empresa) return <NotFound />;

  const casos = filial ? casosDaFilial(filial.id) : casosDaEmpresa(empresa.id);

  // Cada caso junto com sua definicao e o colaborador -- feito uma vez so,
  // reaproveitado tanto pelos KPIs quanto pelos filtros e pela lista.
  const casosComDados = casos
    .map((caso) => ({
      caso,
      def: getCombinacaoCriticaById(caso.combinacaoId),
      colaborador: getColaboradorById(caso.colaboradorId),
    }))
    .filter(
      (item): item is { caso: typeof item.caso; def: NonNullable<typeof item.def>; colaborador: NonNullable<typeof item.colaborador> } =>
        !!item.def && !!item.colaborador
    );

  const especial = casosComDados.filter((c) => c.def.nivel === "ESPECIAL").length;
  const critico = casosComDados.filter((c) => c.def.nivel === "CRÍTICO").length;
  const alta = casosComDados.filter((c) => c.def.nivel === "ALTA").length;
  const semTratativa = casosComDados.filter((c) => c.caso.status === "sem_tratativa").length;

  const casosSemTratativa = casosComDados.filter((c) => c.caso.status === "sem_tratativa");
  const tempoMedioSemTratativa =
    casosSemTratativa.length > 0
      ? Math.round(
          casosSemTratativa.reduce((soma, c) => soma + diasDesde(c.caso.detectadoEm), 0) /
            casosSemTratativa.length
        )
      : 0;
  const slaExcedidos = casosSemTratativa.filter((c) => diasDesde(c.caso.detectadoEm) > SLA_DIAS_TRATATIVA).length;

  const buscaNormalizada = busca.trim().toLowerCase();
  const casosFiltrados = casosComDados
    .filter((c) => !buscaNormalizada || c.colaborador.nome.toLowerCase().includes(buscaNormalizada))
    .filter((c) => statusFiltro === "todos" || c.caso.status === statusFiltro)
    .filter((c) => criticidadeFiltro === "todas" || c.def.nivel === criticidadeFiltro)
    .sort((a, b) => diasDesde(b.caso.detectadoEm) - diasDesde(a.caso.detectadoEm));

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
          { label: "Combinações Críticas" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Combinações Críticas{filial ? ` · ${filial.nome}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">Protocolo de Direcionamento · Fluxo EEA → DT</p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => toast("Protótipo: relatório exportado")}
        >
          <Download className="size-4" />
          Exportar relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ShieldCheck}
          iconClassName={especial > 0 ? "bg-slate-900/10 text-slate-900" : "bg-muted text-muted-foreground"}
          label="Especial"
          value={String(especial)}
          sublabel="Ação imediata"
        />
        <KpiCard
          icon={ShieldCheck}
          iconClassName={critico > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"}
          label="Crítico"
          value={String(critico)}
          sublabel="Atenção máxima"
        />
        <KpiCard
          icon={ShieldCheck}
          iconClassName={alta > 0 ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}
          label="Alta"
          value={String(alta)}
          sublabel="Atenção alta"
        />
        <KpiCard
          icon={ShieldCheck}
          iconClassName={semTratativa > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"}
          label="Sem tratativa"
          value={String(semTratativa)}
          sublabel="Aguardando ação"
        />
      </div>

      {/* Metricas operacionais em tratamento mais leve que os KPIs de
          severidade acima -- sao uteis pra dar senso de urgencia (SLA), mas
          nao competem em peso visual com "quantos casos graves existem". */}
      {casosSemTratativa.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-muted/20 px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            Tempo médio sem tratativa:{" "}
            <strong className="font-semibold text-foreground">{tempoMedioSemTratativa} dia(s)</strong>
            <span className="text-muted-foreground"> · SLA: {SLA_DIAS_TRATATIVA} dias</span>
          </span>
          {slaExcedidos > 0 && (
            <span className="flex items-center gap-1.5 font-medium text-red-600">
              <AlertTriangle className="size-3.5" />
              {slaExcedidos} caso(s) com SLA excedido
            </span>
          )}
        </div>
      )}

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
          <CardTitle className="text-lg">Casos ativos</CardTitle>
          <Badge variant="outline" className="rounded-lg border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
            {casosFiltrados.length} caso(s)
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-10 rounded-xl pl-9"
                placeholder="Buscar colaborador..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as typeof statusFiltro)}>
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Status: Todos</SelectItem>
                <SelectItem value="sem_tratativa">Sem tratativa</SelectItem>
                <SelectItem value="em_tratativa">Em tratativa</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={criticidadeFiltro}
              onValueChange={(v) => setCriticidadeFiltro(v as typeof criticidadeFiltro)}
            >
              <SelectTrigger className="h-10 w-full rounded-xl sm:w-44">
                <SelectValue placeholder="Criticidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Criticidade: Todas</SelectItem>
                <SelectItem value="ESPECIAL">Especial</SelectItem>
                <SelectItem value="CRÍTICO">Crítico</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {casosFiltrados.length > 0 ? (
            <div className="space-y-1">
              {casosFiltrados.map(({ caso, def, colaborador }) => {
                const dias = diasDesde(caso.detectadoEm);
                const slaExcedido = caso.status === "sem_tratativa" && dias > SLA_DIAS_TRATATIVA;
                return (
                  <Link
                    key={caso.id}
                    href={`/empresas/${empresa.id}/combinacoes/${caso.id}`}
                    className={`flex flex-col gap-2 rounded-xl px-3 py-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-3 ${
                      slaExcedido ? "bg-red-50/60" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{colaborador.nome}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {colaborador.local} · {def.nome}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {def.fatores.map((f) => (
                          <Badge key={f} variant="secondary" className="rounded-md px-1.5 py-0 text-[11px] font-normal">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`w-fit shrink-0 rounded-lg px-2 py-0.5 text-xs ${NIVEL_BADGE_CLASS[def.nivel]}`}
                    >
                      {NIVEL_LABEL[def.nivel]}
                    </Badge>
                    <div className="w-40 shrink-0 text-left text-xs sm:text-right">
                      <p className={`font-medium ${caso.status === "em_tratativa" ? "text-amber-600" : "text-red-600"}`}>
                        {caso.status === "em_tratativa" ? "Em tratativa" : "Sem tratativa"}
                      </p>
                      <p className="text-muted-foreground">
                        há {dias} dia{dias === 1 ? "" : "s"}
                        {slaExcedido && <span className="ml-1 text-red-600">· SLA excedido</span>}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center">
              <ShieldCheck className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Nenhum caso encontrado para os filtros atuais.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">9 combinações definidas — Referência</CardTitle>
          <p className="text-sm text-muted-foreground">
            Qualquer combinação de risco médio nos fatores abaixo aciona encaminhamento ao DT
          </p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="divide-y rounded-xl border">
            {COMBINACOES_CRITICAS.map((def) => (
              <div key={def.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-xs ${NIVEL_BADGE_CLASS[def.nivel]}`}>
                    {NIVEL_LABEL[def.nivel]}
                  </Badge>
                  <p className="font-medium">{def.nome}</p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {def.fatores.map((f) => (
                    <Badge key={f} variant="secondary" className="rounded-lg px-2 py-0.5 text-xs">
                      {f}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{def.protocolo}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
