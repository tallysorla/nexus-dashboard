import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ClipboardList, IdCard, Search, UserCheck, UserX } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { colaboradoresDaEmpresa, colaboradoresDaFilial, getEmpresaById } from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

export default function AplicarTeste() {
  const { cid } = useParams<{ cid: string }>();
  const { profile } = useProfile();
  const empresa = getEmpresaById(cid ?? "");
  const [cpf, setCpf] = useState("");

  if (!empresa) return <NotFound />;

  const escopo = profile.filialId ? colaboradoresDaFilial(profile.filialId) : colaboradoresDaEmpresa(empresa.id);
  const cpfLimpo = cpf.trim();
  const encontrado = cpfLimpo ? escopo.find((c) => c.cpf === cpfLimpo) : undefined;
  const naoEncontrado = cpfLimpo && !encontrado;

  return (
    <Layout>
      <Breadcrumb items={[{ label: empresa.nome, href: `/empresas/${empresa.id}` }, { label: "Aplicar teste" }]} />

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Aplicar teste</h1>
        <p className="text-sm text-muted-foreground">
          Identifique o funcionário pelo CPF para iniciar a avaliação.
        </p>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 px-6 pt-6">
          <IdCard className="size-4 text-muted-foreground" />
          <CardTitle className="text-lg">Identificar funcionário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <IdCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-xl pl-9"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>
            <Button className="h-11 rounded-xl">
              <Search className="size-4" />
              Buscar funcionário
            </Button>
          </div>

          {!cpfLimpo && <p className="text-sm text-muted-foreground">Digite o CPF do funcionário.</p>}

          {naoEncontrado && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4">
              <UserX className="size-5 shrink-0 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700">Funcionário não encontrado</p>
                <p className="text-xs text-red-600">CPF não cadastrado nesta empresa.</p>
              </div>
            </div>
          )}

          {encontrado && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                <UserCheck className="size-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-emerald-700">{encontrado.nome}</p>
                  <p className="text-xs text-emerald-600">
                    {encontrado.cpf} · {encontrado.local}
                  </p>
                </div>
                <Badge variant="outline" className="rounded-lg border-emerald-200 bg-emerald-100 text-emerald-700">
                  Encontrado
                </Badge>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Selecione o tipo de avaliação:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="h-11 rounded-xl"
                    onClick={() => toast(`Iniciando Teste EEA para ${encontrado.nome}`)}
                  >
                    <ClipboardList className="size-4" />
                    Teste EEA
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl"
                    onClick={() => toast(`Iniciando DT para ${encontrado.nome}`)}
                  >
                    <ClipboardList className="size-4" />
                    Diagnóstico DT
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full border-primary/20 bg-primary/5 py-0 shadow-sm">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-lg">Tipos de avaliação disponíveis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6">
          <div>
            <p className="text-sm font-semibold">Teste EEA</p>
            <p className="text-sm text-muted-foreground">
              Estado Emocional Atual · avaliação pontual do momento
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Diagnóstico de Tendência (DT)</p>
            <p className="text-sm text-muted-foreground">Avaliação de padrões ao longo do tempo</p>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
