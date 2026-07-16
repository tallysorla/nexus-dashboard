import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, MinusCircle, Send, ShieldQuestion } from "lucide-react";
import { PERMS, type ProfileKey } from "@/contexts/ProfileContext";
import { getEmpresaById, type PerfilAcesso } from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

const PERFIS: PerfilAcesso[] = ["Admin Empresa", "Admin Filial", "Gestor", "Avaliador"];

const PERFIL_PARA_CHAVE: Partial<Record<PerfilAcesso, ProfileKey>> = {
  "Admin Empresa": "empresa",
  "Admin Filial": "filial",
  Avaliador: "avaliador",
};

function precisaFilial(perfil: PerfilAcesso | ""): boolean {
  return perfil === "Admin Filial" || perfil === "Gestor" || perfil === "Avaliador";
}

export default function NovoUsuario() {
  const { cid } = useParams<{ cid: string }>();
  const [, navigate] = useLocation();
  const empresa = getEmpresaById(cid ?? "");

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [perfil, setPerfil] = useState<PerfilAcesso | "">("");
  const [filialId, setFilialId] = useState("");

  if (!empresa) return <NotFound />;

  const chavePerfil = perfil ? PERFIL_PARA_CHAVE[perfil] : undefined;
  const permissoes = chavePerfil ? PERMS[chavePerfil] : [];

  function enviarConvite() {
    if (!nome.trim() || !cpf.trim() || !email.trim()) {
      toast.error("Preencha nome, CPF e e-mail");
      return;
    }
    if (!perfil) {
      toast.error("Selecione o perfil de acesso");
      return;
    }
    if (precisaFilial(perfil) && !filialId) {
      toast.error("Selecione a filial deste perfil");
      return;
    }
    toast.success(`Convite enviado para ${email.trim()}`);
    navigate(`/empresas/${empresa!.id}/usuarios`);
  }

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/" },
          { label: empresa.nome, href: `/empresas/${empresa.id}` },
          { label: "Usuários & acessos", href: `/empresas/${empresa.id}/usuarios` },
          { label: "Novo usuário" },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Novo usuário</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre o acesso e defina o perfil dentro de {empresa.nome}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-lg">Dados de acesso</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="nome">Nome completo</FieldLabel>
                <FieldContent>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                <FieldContent>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <FieldContent>
                  <Input
                    id="email"
                    placeholder="email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="perfil">Perfil de acesso</FieldLabel>
                <Select value={perfil} onValueChange={(v) => setPerfil(v as PerfilAcesso)}>
                  <SelectTrigger id="perfil" className="w-full">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PERFIS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              {precisaFilial(perfil) && (
                <Field>
                  <FieldLabel htmlFor="filial">Filial / NOP</FieldLabel>
                  <Select value={filialId} onValueChange={setFilialId}>
                    <SelectTrigger id="filial" className="w-full">
                      <SelectValue placeholder="Selecione a filial" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {empresa.filiais.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome} — {f.cidade}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </FieldGroup>
          </CardContent>
        </Card>

        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-lg">Permissões deste perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Escopo: </span>
              <span className="font-medium">
                {!perfil
                  ? "—"
                  : precisaFilial(perfil) && !filialId
                  ? "Selecione uma filial"
                  : precisaFilial(perfil)
                  ? empresa.filiais.find((f) => f.id === filialId)?.nome
                  : "Toda a empresa"}
              </span>
            </div>

            {!perfil ? (
              <div className="rounded-xl border border-dashed px-4 py-8 text-center">
                <ShieldQuestion className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Selecione um perfil para ver o que essa pessoa poderá acessar.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {permissoes.map((p) => (
                  <div key={p.area} className="flex items-center gap-3 rounded-xl px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{p.area}</p>
                      {p.observacao.includes("[Requer") && (
                        <p className="text-xs text-amber-600">⚠ {p.observacao}</p>
                      )}
                    </div>
                    {p.acesso ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <MinusCircle className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-sm text-primary">
              <Send className="mt-0.5 size-4 shrink-0" />
              <p>
                Ao enviar, a pessoa recebe um e-mail para criar a própria senha (Keycloak). O
                acesso fica como <span className="font-semibold">Convite pendente</span> até o
                primeiro login.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() => navigate(`/empresas/${empresa.id}/usuarios`)}
        >
          Cancelar
        </Button>
        <Button className="h-11 rounded-xl" onClick={enviarConvite}>
          <Send className="size-4" />
          Enviar convite
        </Button>
      </div>
    </Layout>
  );
}
