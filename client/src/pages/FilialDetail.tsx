import { useParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { KpiCard } from "@/components/MetricsCards";
import { NavCard } from "@/components/NavCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ClipboardList, MapPin, ShieldAlert, Users } from "lucide-react";
import {
  casosDaFilial,
  colaboradoresDaFilial,
  getCombinacaoCriticaById,
  getEmpresaById,
  getFilialById,
  testesRealizados,
  NIVEL_BADGE_CLASS,
  NIVEL_LABEL,
} from "@/lib/mock-empresas";
import { getColaboradorById } from "@/lib/mock-colaboradores";
import { Link } from "wouter";
import NotFound from "@/pages/NotFound";

export default function FilialDetail() {
  const { cid, fid } = useParams<{ cid: string; fid: string }>();
  const empresa = getEmpresaById(cid ?? "");
  const filial = empresa && fid ? getFilialById(empresa, fid) : undefined;

  if (!empresa || !filial) return <NotFound />;

  const equipe = colaboradoresDaFilial(filial.id);
  const emRiscoAlto = equipe.filter((c) => c.risco === "alto").length;
  const casos = casosDaFilial(filial.id);

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/" },
          { label: empresa.nome, href: `/empresas/${empresa.id}` },
          { label: "Filiais / NOPs", href: `/empresas/${empresa.id}/filiais` },
          { label: filial.nome },
        ]}
      />

      <Card className="w-full gap-4 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-semibold leading-none">{filial.nome}</h1>
                <Badge variant="outline" className="rounded-lg border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                  Ativa
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {filial.cidade}/{filial.estado} · {empresa.nome}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Users}
          iconClassName="bg-sky-500/10 text-sky-600"
          label="Funcionários"
          value={String(equipe.length)}
        />
        <KpiCard
          icon={ClipboardList}
          iconClassName="bg-amber-500/10 text-amber-600"
          label="Testes realizados"
          value={testesRealizados(equipe).toLocaleString("pt-BR")}
        />
        <KpiCard
          icon={AlertTriangle}
          iconClassName={emRiscoAlto > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"}
          label="Em risco alto"
          value={String(emRiscoAlto)}
        />
        <KpiCard
          icon={ShieldAlert}
          iconClassName={casos.length > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"}
          label="Combinações críticas"
          value={String(casos.length)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <NavCard
          icon={Users}
          title="Funcionários"
          subtitle={`${equipe.length} cadastrados`}
          href="/funcionarios"
        />
        <NavCard
          icon={ClipboardList}
          title="Testes"
          subtitle={`${testesRealizados(equipe).toLocaleString("pt-BR")} realizados`}
          href={`/empresas/${empresa.id}/testes?filial=${filial.id}`}
        />
        <NavCard
          icon={ShieldAlert}
          title="Combinações Críticas"
          subtitle={casos.length > 0 ? `${casos.length} combinação(ões)` : "Sem pendências"}
          href={`/empresas/${empresa.id}/combinacoes?filial=${filial.id}`}
        />
      </div>

      {casos.length > 0 && (
        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-lg">Combinações Críticas</CardTitle>
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
                    <p className="truncate text-xs text-muted-foreground">{def.nome}</p>
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
