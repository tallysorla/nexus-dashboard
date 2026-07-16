import { Link, useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { KpiCard } from "@/components/MetricsCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Building2,
  ClipboardList,
  Edit,
  MapPin,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import {
  casosDaEmpresa,
  casosDaFilial,
  colaboradoresDaEmpresa,
  colaboradoresDaFilial,
  getCombinacaoCriticaById,
  getEmpresaById,
  getFilialById,
  testesRealizados,
  NIVEL_BADGE_CLASS,
  NIVEL_LABEL,
} from "@/lib/mock-empresas";
import { getColaboradorById } from "@/lib/mock-colaboradores";
import NotFound from "@/pages/NotFound";

export default function EmpresaOverview() {
  const { cid } = useParams<{ cid: string }>();
  const { profile } = useProfile();
  const empresa = getEmpresaById(cid ?? "");

  if (!empresa) return <NotFound />;

  const filial = profile.filialId ? getFilialById(empresa, profile.filialId) : undefined;
  const colaboradoresEscopo = filial
    ? colaboradoresDaFilial(filial.id)
    : colaboradoresDaEmpresa(empresa.id);
  const casos = filial ? casosDaFilial(filial.id) : casosDaEmpresa(empresa.id);
  const podeEditar = profile.nav.includes("dados");

  return (
    <Layout>
      <Breadcrumb items={[{ label: "Empresas", href: "/" }, { label: empresa.nome }]} />

      <Card className="w-full gap-4 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold leading-none">{empresa.nome}</h1>
                <Badge
                  variant="outline"
                  className={
                    empresa.status === "ativo"
                      ? "rounded-lg border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                      : "rounded-lg px-2 py-0.5 text-xs text-muted-foreground"
                  }
                >
                  {empresa.status === "ativo" ? "Ativo" : "Inativo"}
                </Badge>
                {filial && (
                  <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-xs">
                    <MapPin className="size-3" />
                    {filial.nome}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {empresa.cnpj} · {empresa.endereco} — {empresa.cidade}/{empresa.estado}
              </p>
            </div>
          </div>
          {podeEditar && (
            <Button variant="outline" size="sm" className="rounded-xl" asChild>
              <Link href={`/empresas/${empresa.id}/dados`}>
                <Edit className="size-4" />
                Editar
              </Link>
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {!filial && (
          <KpiCard
            icon={Building2}
            iconClassName="bg-primary/10 text-primary"
            label="Filiais / NOPs"
            value={String(empresa.filiais.length)}
          />
        )}
        <KpiCard
          icon={Users}
          iconClassName="bg-sky-500/10 text-sky-600"
          label="Funcionários"
          value={String(colaboradoresEscopo.length)}
        />
        <KpiCard
          icon={ClipboardList}
          iconClassName="bg-amber-500/10 text-amber-600"
          label="Testes realizados"
          value={testesRealizados(colaboradoresEscopo).toLocaleString("pt-BR")}
        />
        <KpiCard
          icon={AlertTriangle}
          iconClassName={casos.length > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"}
          label="Combinações críticas"
          value={String(casos.length)}
        />
      </div>

      {!filial && (
        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
            <CardTitle className="text-lg">Filiais / NOPs</CardTitle>
            {empresa.filiais.length > 0 && (
              <Button variant="ghost" size="sm" className="rounded-xl text-primary" asChild>
                <Link href={`/empresas/${empresa.id}/filiais`}>Ver todas</Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {empresa.filiais.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center">
                <Building2 className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  Esta empresa ainda não tem filiais cadastradas.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Os funcionários ficariam vinculados direto à empresa.{" "}
                  <span className="font-semibold text-amber-600">[Requer alinhamento]</span>
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {empresa.filiais.map((f) => {
                  const qtd = colaboradoresDaFilial(f.id).length;
                  return (
                    <Link
                      key={f.id}
                      href={`/empresas/${empresa.id}/filiais/${f.id}`}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted/50"
                    >
                      <MapPin className="size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{f.nome}</p>
                        <p className="truncate text-xs text-muted-foreground">{f.cidade}/{f.estado}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">{qtd} funcion.</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {casos.length > 0 && (
        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-red-600" />
              <CardTitle className="text-lg">Combinações Críticas</CardTitle>
            </div>
            <Badge variant="outline" className="rounded-lg border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
              {casos.filter((c) => c.status !== "em_tratativa").length} pendentes
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
                  <Badge
                    variant="outline"
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-xs ${NIVEL_BADGE_CLASS[def.nivel]}`}
                  >
                    {NIVEL_LABEL[def.nivel]}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{colaborador.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {colaborador.local} · {def.nome}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-medium ${
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
      )}
    </Layout>
  );
}
