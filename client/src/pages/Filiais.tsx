import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight, Building2, Plus } from "lucide-react";
import { RISCO_BADGE_CLASS, RISCO_LABEL } from "@/lib/mock-colaboradores";
import { colaboradoresDaFilial, getEmpresaById, riscoDaFilial } from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

export default function Filiais() {
  const { cid } = useParams<{ cid: string }>();
  const empresa = getEmpresaById(cid ?? "");

  if (!empresa) return <NotFound />;

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/" },
          { label: empresa.nome, href: `/empresas/${empresa.id}` },
          { label: "Filiais / NOPs" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Filiais / NOPs</h1>
          <p className="text-sm text-muted-foreground">Unidades operacionais de {empresa.nome}.</p>
        </div>
        <Button
          className="h-11 rounded-xl"
          onClick={() => toast("Protótipo: nova filial")}
        >
          <Plus className="size-4" />
          Nova filial
        </Button>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardContent className="px-6 py-6">
          {empresa.filiais.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center">
              <Building2 className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Nenhuma filial cadastrada.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-12 px-4">Filial / NOP</TableHead>
                    <TableHead className="h-12 px-4">Cidade</TableHead>
                    <TableHead className="h-12 px-4 text-center">Funcionários</TableHead>
                    <TableHead className="h-12 px-4">Risco</TableHead>
                    <TableHead className="h-12 px-4 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresa.filiais.map((f) => {
                    const risco = riscoDaFilial(f.id);
                    return (
                      <TableRow key={f.id}>
                        <TableCell className="px-4 py-4 font-medium">{f.nome}</TableCell>
                        <TableCell className="px-4 py-4 text-muted-foreground">
                          {f.cidade}/{f.estado}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          {colaboradoresDaFilial(f.id).length}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge
                            variant="outline"
                            className={`rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[risco]}`}
                          >
                            {RISCO_LABEL[risco]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          <Button variant="ghost" size="sm" className="rounded-xl text-primary" asChild>
                            <Link href={`/empresas/${empresa.id}/filiais/${f.id}`}>
                              Ver filial
                              <ArrowRight className="size-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
