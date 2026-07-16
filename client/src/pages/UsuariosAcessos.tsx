import { Link, useParams } from "wouter";
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
import { ArrowRight, Plus, ShieldQuestion } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { getEmpresaById, usuariosDaEmpresa } from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

export default function UsuariosAcessos() {
  const { cid } = useParams<{ cid: string }>();
  const { profile } = useProfile();
  const empresa = getEmpresaById(cid ?? "");

  if (!empresa) return <NotFound />;

  const usuarios = usuariosDaEmpresa(empresa.id).filter(
    (u) => !profile.filialId || u.filialId === profile.filialId
  );

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/" },
          { label: empresa.nome, href: `/empresas/${empresa.id}` },
          { label: "Usuários & acessos" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Usuários & acessos</h1>
          <p className="text-sm text-muted-foreground">
            Quem opera a plataforma no escopo desta empresa.
          </p>
        </div>
        <Button className="h-11 rounded-xl" asChild>
          <Link href={`/empresas/${empresa.id}/usuarios/novo`}>
            <Plus className="size-4" />
            Novo usuário
          </Link>
        </Button>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardContent className="px-6 py-6">
          {usuarios.length === 0 ? (
            <div className="rounded-xl border border-dashed px-4 py-10 text-center">
              <ShieldQuestion className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Nenhum usuário cadastrado para este escopo.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-12 px-4">Nome</TableHead>
                    <TableHead className="h-12 px-4">Perfil</TableHead>
                    <TableHead className="h-12 px-4">Escopo</TableHead>
                    <TableHead className="h-12 px-4">E-mail</TableHead>
                    <TableHead className="h-12 px-4 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{u.nome}</span>
                          {u.statusConvite === "pendente" && (
                            <Badge
                              variant="outline"
                              className="rounded-lg border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] text-amber-700"
                            >
                              Pendente
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <Badge variant="secondary" className="rounded-lg px-2.5 py-1">
                          {u.perfil}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-muted-foreground">{u.escopo}</TableCell>
                      <TableCell className="px-4 py-4 text-primary">{u.email}</TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button variant="ghost" size="sm" className="rounded-xl text-primary" asChild>
                          <Link href={`/empresas/${empresa.id}/usuarios/${u.id}`}>
                            Ver
                            <ArrowRight className="size-4" />
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
