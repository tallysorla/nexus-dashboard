import { useState } from "react";
import { Link, useParams, useSearchParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TesteDetailCore } from "@/components/TesteDetailCore";
import { TratativaDialog } from "@/components/TratativaDialog";
import { useProfile } from "@/contexts/ProfileContext";
import { ArrowLeft, User } from "lucide-react";
import { getColaboradorById, type Tratativa } from "@/lib/mock-colaboradores";
import { getEmpresaById, getFilialById } from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

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

  const [tratativas, setTratativas] = useState<Tratativa[]>(colaborador?.historicoTratativas ?? []);

  if (!empresa || !colaborador || !teste) return <NotFound />;

  const filialId = searchParams.get("filial");
  const filial = filialId ? getFilialById(empresa, filialId) : undefined;
  const voltarHref = `/empresas/${empresa.id}/testes${filial ? `?filial=${filial.id}` : ""}`;

  return (
    <Layout>
      {profile.key !== "stakeholder" && (
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
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <Link
          href={profile.key === "stakeholder" ? `/funcionarios/${colaborador.id}` : voltarHref}
          className="inline-flex items-center gap-1.5 text-2xl font-semibold tracking-tight hover:text-muted-foreground"
        >
          <ArrowLeft className="size-5" />
          Detalhes do teste
        </Link>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/funcionarios/${colaborador.id}`}>
            <User className="size-4" />
            Ver perfil do funcionário
          </Link>
        </Button>
      </div>

      <TesteDetailCore colaborador={colaborador} teste={teste} />

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
          <div>
            <CardTitle className="text-lg">Histórico de tratativas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Conversas, feedbacks e encaminhamentos registrados para {colaborador.nome}
            </p>
          </div>
          <TratativaDialog
            colaboradorNome={colaborador.nome}
            onRegistrar={(t) => setTratativas((prev) => [t, ...prev])}
          />
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {tratativas.length === 0 ? (
            <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma tratativa registrada ainda. Use "Registrar tratativa" para
              documentar a primeira ação com este funcionário.
            </p>
          ) : (
            <ul className="space-y-4">
              {tratativas.map((t) => (
                <li key={t.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="secondary" className="rounded-lg px-2.5 py-1">
                      {t.tipo}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t.data} · {t.autor}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{t.observacao}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
