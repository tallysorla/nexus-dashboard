import { Link, useParams, useSearchParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { KpiCard } from "@/components/MetricsCards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { getColaboradorById } from "@/lib/mock-colaboradores";
import {
  COMBINACOES_CRITICAS,
  casosDaEmpresa,
  casosDaFilial,
  getCombinacaoCriticaById,
  getEmpresaById,
  getFilialById,
  NIVEL_BADGE_CLASS,
  NIVEL_LABEL,
} from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

export default function CombinacoesCriticas() {
  const { cid } = useParams<{ cid: string }>();
  const [searchParams] = useSearchParams();
  const empresa = getEmpresaById(cid ?? "");
  const filialId = searchParams.get("filial");
  const filial = empresa && filialId ? getFilialById(empresa, filialId) : undefined;

  if (!empresa) return <NotFound />;

  const casos = filial ? casosDaFilial(filial.id) : casosDaEmpresa(empresa.id);
  const especial = casos.filter((c) => getCombinacaoCriticaById(c.combinacaoId)?.nivel === "ESPECIAL").length;
  const critico = casos.filter((c) => getCombinacaoCriticaById(c.combinacaoId)?.nivel === "CRÍTICO").length;
  const alta = casos.filter((c) => getCombinacaoCriticaById(c.combinacaoId)?.nivel === "ALTA").length;
  const semTratativa = casos.filter((c) => c.status !== "em_tratativa").length;

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

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Combinações Críticas{filial ? ` · ${filial.nome}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">Protocolo de Direcionamento · Fluxo EEA → DT</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={ShieldCheck}
          iconClassName={especial > 0 ? "bg-slate-900/10 text-slate-900" : "bg-muted text-muted-foreground"}
          label="Especial"
          value={String(especial)}
        />
        <KpiCard
          icon={ShieldCheck}
          iconClassName={critico > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"}
          label="Crítico"
          value={String(critico)}
        />
        <KpiCard
          icon={ShieldCheck}
          iconClassName={alta > 0 ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}
          label="Alta"
          value={String(alta)}
        />
        <KpiCard
          icon={ShieldCheck}
          iconClassName={semTratativa > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"}
          label="Sem tratativa"
          value={String(semTratativa)}
        />
      </div>

      {casos.length > 0 ? (
        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
            <CardTitle className="text-lg">Casos ativos</CardTitle>
            <Badge variant="outline" className="rounded-lg border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
              {casos.length} caso(s)
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1 px-6 pb-6">
            {casos.map((caso) => {
              const def = getCombinacaoCriticaById(caso.combinacaoId);
              const colaborador = getColaboradorById(caso.colaboradorId);
              if (!def || !colaborador) return null;
              return (
                <Link
                  key={caso.id}
                  href={`/empresas/${empresa.id}/combinacoes/${caso.id}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{colaborador.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {colaborador.local} · {def.nome}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-xs ${NIVEL_BADGE_CLASS[def.nivel]}`}
                  >
                    {NIVEL_LABEL[def.nivel]}
                  </Badge>
                  <span
                    className={`w-32 shrink-0 text-right text-xs font-medium ${
                      caso.status === "em_tratativa" ? "text-amber-600" : "text-red-600"
                    }`}
                  >
                    {caso.status === "em_tratativa" ? "Em tratativa" : "Sem tratativa"}
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full py-0 shadow-sm">
          <CardContent className="px-6 py-10 text-center">
            <ShieldCheck className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Nenhuma combinação crítica em aberto neste escopo.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">9 combinações definidas — Referência</CardTitle>
          <p className="text-sm text-muted-foreground">
            Qualquer combinação de risco médio nos fatores abaixo aciona encaminhamento ao DT
          </p>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6">
          {COMBINACOES_CRITICAS.map((def) => (
            <div
              key={def.id}
              className={`rounded-xl border-l-4 bg-muted/20 p-3 ${
                def.nivel === "ESPECIAL"
                  ? "border-l-slate-900"
                  : def.nivel === "CRÍTICO"
                  ? "border-l-red-500"
                  : "border-l-amber-500"
              }`}
            >
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
        </CardContent>
      </Card>
    </Layout>
  );
}
