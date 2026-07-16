import { useParams } from "wouter";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Edit, Eye, Mail, MinusCircle, User } from "lucide-react";
import { PERMS, useProfile, type ProfileKey } from "@/contexts/ProfileContext";
import { getEmpresaById, getUsuarioById, type PerfilAcesso } from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

const PERFIL_PARA_CHAVE: Partial<Record<PerfilAcesso, ProfileKey>> = {
  "Admin Empresa": "empresa",
  "Admin Filial": "filial",
  Avaliador: "avaliador",
};

export default function UsuarioDetail() {
  const { cid, uid } = useParams<{ cid: string; uid: string }>();
  const { setProfile } = useProfile();
  const empresa = getEmpresaById(cid ?? "");
  const usuario = getUsuarioById(uid ?? "");

  if (!empresa || !usuario) return <NotFound />;

  const chavePerfil = PERFIL_PARA_CHAVE[usuario.perfil];
  const permissoes = chavePerfil ? PERMS[chavePerfil] : [];

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/" },
          { label: empresa.nome, href: `/empresas/${empresa.id}` },
          { label: "Usuários & acessos", href: `/empresas/${empresa.id}/usuarios` },
          { label: usuario.nome },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{usuario.nome}</h1>
          <Badge variant="secondary" className="rounded-lg px-2.5 py-1">
            {usuario.perfil}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => toast("Protótipo: e-mail de acesso reenviado")}
          >
            <Mail className="size-4" />
            Reenviar acesso
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => toast("Protótipo: editar usuário")}
          >
            <Edit className="size-4" />
            Editar
          </Button>
        </div>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardContent className="flex items-center gap-3 px-6 py-6">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="size-5" />
          </div>
          <div>
            <p className="font-medium">{usuario.nome}</p>
            <p className="text-sm text-muted-foreground">{usuario.email}</p>
          </div>
          <Badge
            variant="outline"
            className={`ml-auto rounded-lg px-2.5 py-1 ${
              usuario.statusConvite === "pendente"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {usuario.statusConvite === "pendente" ? "Convite pendente" : "Ativo"}
          </Badge>
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Dados de acesso</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 px-6 pb-6 sm:grid-cols-2">
          {[
            ["Perfil", usuario.perfil],
            ["Escopo de acesso", usuario.escopo],
            ["CPF", usuario.cpf],
            ["E-mail", usuario.email],
            ["Último acesso", usuario.ultimoAcesso],
            ["Autenticação", "Keycloak"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Permissões deste perfil</CardTitle>
          <p className="text-sm text-muted-foreground">
            O que um <span className="font-semibold">{usuario.perfil}</span> enxerga e faz na
            plataforma de gestão.
          </p>
        </CardHeader>
        <CardContent className="space-y-1 px-6 pb-6">
          {permissoes.map((p) => (
            <div key={p.area} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{p.area}</p>
                {p.observacao && (
                  <p
                    className={`text-xs ${
                      p.observacao.includes("[Requer") ? "text-amber-600" : "text-muted-foreground"
                    }`}
                  >
                    {p.observacao}
                  </p>
                )}
              </div>
              {p.acesso ? (
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
              ) : (
                <MinusCircle className="size-4 shrink-0 text-muted-foreground" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {chavePerfil ? (
        <Button className="h-11 w-fit rounded-xl" onClick={() => setProfile(chavePerfil)}>
          <Eye className="size-4" />
          Pré-visualizar como {usuario.perfil}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          A pré-visualização do perfil {usuario.perfil} ainda não está neste protótipo.
        </p>
      )}
    </Layout>
  );
}
