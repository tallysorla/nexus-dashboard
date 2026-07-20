import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "wouter";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClipboardList, FileText } from "lucide-react";
import { RISCO_BADGE_CLASS, RISCO_LABEL, parseDataBr, type TipoTeste } from "@/lib/mock-colaboradores";
import {
  colaboradoresDaEmpresa,
  colaboradoresDaFilial,
  getEmpresaById,
  getFilialById,
} from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

export default function Testes() {
  const { cid } = useParams<{ cid: string }>();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<TipoTeste>("EEA");

  const empresa = getEmpresaById(cid ?? "");
  const filialId = searchParams.get("filial");
  const filial = empresa && filialId ? getFilialById(empresa, filialId) : undefined;

  if (!empresa) return <NotFound />;

  const colaboradoresEscopo = filial
    ? colaboradoresDaFilial(filial.id)
    : colaboradoresDaEmpresa(empresa.id);

  const linhas = useMemo(() => {
    return colaboradoresEscopo
      .flatMap((c) => c.historicoTestes.map((t) => ({ colaborador: c, teste: t })))
      .filter(({ teste }) => teste.tipo === tab)
      .sort((a, b) => parseDataBr(b.teste.data).getTime() - parseDataBr(a.teste.data).getTime());
  }, [colaboradoresEscopo, tab]);

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
          { label: "Testes" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Testes{filial ? ` · ${filial.nome}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground">
            {filial
              ? `Testes aplicados aos funcionários na ${filial.nome}.`
              : `Testes aplicados aos funcionários de ${empresa.nome}.`}
          </p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TipoTeste)}>
          <TabsList className="h-10 rounded-xl">
            <TabsTrigger value="EEA" className="rounded-lg px-4 text-xs">Teste EEA</TabsTrigger>
            <TabsTrigger value="DT" className="rounded-lg px-4 text-xs">Teste DT</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardContent className="px-6 py-6">
          {linhas.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center">
              <ClipboardList className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Nenhum teste {tab} encontrado.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-12 px-4">Nome</TableHead>
                    <TableHead className="h-12 px-4">CPF</TableHead>
                    <TableHead className="h-12 px-4">Data</TableHead>
                    <TableHead className="h-12 px-4">Autorização</TableHead>
                    <TableHead className="h-12 px-4">Classificação</TableHead>
                    <TableHead className="h-12 px-4 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map(({ colaborador, teste }) => (
                    <TableRow key={`${colaborador.id}-${teste.id}`}>
                      <TableCell className="px-4 py-4 font-medium">{colaborador.nome}</TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">{colaborador.cpf}</TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">{teste.data}</TableCell>
                      <TableCell className="px-4 py-4">
                        {teste.status === "alto" ? (
                          <span className="text-xs font-medium text-amber-600">Aguardando autorização</span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-600">Autorizado</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge
                          variant="outline"
                          className={`rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[teste.status]}`}
                        >
                          {RISCO_LABEL[teste.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          asChild
                          aria-label="Abrir detalhe do teste"
                          variant="ghost"
                          size="icon"
                          className="size-10 rounded-xl text-primary"
                        >
                          <Link
                            href={`/empresas/${empresa.id}/testes/${colaborador.id}/${teste.id}${
                              filial ? `?filial=${filial.id}` : ""
                            }`}
                          >
                            <FileText className="size-4" />
                          </Link>
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
    </Layout>
  );
}
