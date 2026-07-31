import { Link, useParams, useSearchParams } from "wouter";
import { Layout } from "@/components/Layout";
import { TesteDetailCore } from "@/components/TesteDetailCore";
import { ArrowLeft } from "lucide-react";
import { getColaboradorById } from "@/lib/mock-colaboradores";
import NotFound from "@/pages/NotFound";

// Tela de detalhes do teste acessada a partir do historico de testes de um
// funcionario (ver TestHistoryTable/ColaboradorProfile). O miolo visual e
// identico ao de TesteDetail.tsx (acessado pelo menu Testes) -- as duas
// rotas mostram a mesma informacao da mesma forma, via TesteDetailCore; so o
// que fica fora do card principal (link de volta simples em vez de
// breadcrumb, sem Historico de tratativas/Detalhes do funcionario) e
// especifico desta tela, por ja estar dentro do contexto do funcionario.
export default function FuncionarioTesteDetail() {
  const { colaboradorId, testeId } = useParams<{ colaboradorId: string; testeId: string }>();
  const [searchParams] = useSearchParams();

  const colaborador = getColaboradorById(colaboradorId ?? "");
  const teste = colaborador?.historicoTestes.find((t) => t.id === testeId);

  if (!colaborador || !teste) return <NotFound />;

  const empresaEscopo = searchParams.get("empresa");
  const perfilHref = empresaEscopo
    ? `/funcionarios/${colaborador.id}?empresa=${empresaEscopo}`
    : `/funcionarios/${colaborador.id}`;

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

      <TesteDetailCore colaborador={colaborador} teste={teste} />
    </Layout>
  );
}
