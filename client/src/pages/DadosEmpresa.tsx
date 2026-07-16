import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import { getEmpresaById } from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

export default function DadosEmpresa() {
  const { cid } = useParams<{ cid: string }>();
  const empresa = getEmpresaById(cid ?? "");

  const [nome, setNome] = useState(empresa?.nome ?? "");
  const [cnpj, setCnpj] = useState(empresa?.cnpj ?? "");
  const [endereco, setEndereco] = useState(empresa?.endereco ?? "");
  const [cidade, setCidade] = useState(empresa?.cidade ?? "");
  const [estado, setEstado] = useState(empresa?.estado ?? "");

  if (!empresa) return <NotFound />;

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/" },
          { label: empresa.nome, href: `/empresas/${empresa.id}` },
          { label: "Dados da empresa" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dados da empresa</h1>
          <p className="text-sm text-muted-foreground">
            Cadastro e endereço de {empresa.nome}.
          </p>
        </div>
        <Button
          className="h-11 rounded-xl"
          onClick={() => toast("Protótipo: alterações salvas")}
        >
          <Save className="size-4" />
          Salvar
        </Button>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="nome-empresa">Nome da empresa</FieldLabel>
              <FieldContent>
                <Input id="nome-empresa" value={nome} onChange={(e) => setNome(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="cnpj-empresa">CNPJ</FieldLabel>
              <FieldContent>
                <Input id="cnpj-empresa" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="endereco-empresa">Endereço</FieldLabel>
              <FieldContent>
                <Input
                  id="endereco-empresa"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="cidade-empresa">Cidade</FieldLabel>
              <FieldContent>
                <Input
                  id="cidade-empresa"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="estado-empresa">Estado</FieldLabel>
              <FieldContent>
                <Input
                  id="estado-empresa"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </Layout>
  );
}
