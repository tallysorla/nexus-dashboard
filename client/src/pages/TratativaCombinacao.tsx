import { useState } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardList,
  Microscope,
  Stethoscope,
  ShieldAlert,
  PauseCircle,
  Phone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getColaboradorById } from "@/lib/mock-colaboradores";
import {
  combinacoesCasos,
  getCombinacaoCriticaById,
  getEmpresaById,
  NIVEL_BADGE_CLASS,
  NIVEL_LABEL,
} from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

type AcaoRapida = { label: string; icon: LucideIcon; toastMsg: string };

// A Triade (nivel ESPECIAL, o mais severo do protocolo) troca as 3 acoes
// genericas por 3 acoes proprias, conforme o criterio de aceite.
const ACOES_PADRAO: AcaoRapida[] = [
  { label: "Encaminhar ao DT", icon: ClipboardList, toastMsg: "Protótipo: DT agendado" },
  { label: "Suspender operação", icon: PauseCircle, toastMsg: "Protótipo: operação suspensa" },
  { label: "Encaminhamento clínico", icon: Stethoscope, toastMsg: "Protótipo: encaminhamento clínico registrado" },
];

const ACOES_ESPECIAL: AcaoRapida[] = [
  { label: "Contato com a WeSafety", icon: Phone, toastMsg: "Protótipo: contato com a WeSafety registrado" },
  { label: "Consulta com RH", icon: Users, toastMsg: "Protótipo: encaminhamento ao RH registrado" },
  { label: "Encaminhamento especializado", icon: Stethoscope, toastMsg: "Protótipo: encaminhamento especializado registrado" },
];

export default function TratativaCombinacao() {
  const { cid, kid } = useParams<{ cid: string; kid: string }>();
  const empresa = getEmpresaById(cid ?? "");
  const caso = combinacoesCasos.find((c) => c.id === kid);
  const [status, setStatus] = useState(caso?.status);
  const [observacao, setObservacao] = useState("");

  if (!empresa || !caso) return <NotFound />;

  const def = getCombinacaoCriticaById(caso.combinacaoId);
  const colaborador = getColaboradorById(caso.colaboradorId);
  if (!def || !colaborador) return <NotFound />;

  const acoesRapidas = def.nivel === "ESPECIAL" ? ACOES_ESPECIAL : ACOES_PADRAO;

  function salvarTratativa() {
    if (!observacao.trim()) {
      toast.error("Descreva a tratativa antes de salvar");
      return;
    }
    caso!.status = "em_tratativa";
    setStatus("em_tratativa");
    toast.success("Tratativa registrada (protótipo)");
  }

  return (
    <Layout>
      <Breadcrumb
        items={[
          { label: "Empresas", href: "/" },
          { label: empresa.nome, href: `/empresas/${empresa.id}` },
          { label: "Combinações Críticas", href: `/empresas/${empresa.id}/combinacoes` },
          { label: colaborador.nome },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{colaborador.nome}</h1>
        <Badge variant="outline" className={`rounded-lg px-2.5 py-1 ${NIVEL_BADGE_CLASS[def.nivel]}`}>
          {NIVEL_LABEL[def.nivel]}
        </Badge>
      </div>

      <Card
        className={`w-full border-l-4 py-0 shadow-sm ${
          def.nivel === "ESPECIAL"
            ? "border-l-slate-900"
            : def.nivel === "CRÍTICO"
            ? "border-l-red-500"
            : "border-l-amber-500"
        }`}
      >
        <CardContent className="space-y-3 px-6 py-6">
          <div>
            <p className="font-medium">{def.nome}</p>
            <p className="text-sm text-muted-foreground">{colaborador.local}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Fatores combinados
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {def.fatores.map((f) => (
                <Badge
                  key={f}
                  variant="outline"
                  className="rounded-lg border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700"
                >
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardContent className="space-y-4 px-6 py-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vulnerabilidade
            </p>
            <p className="mt-1.5 text-sm leading-relaxed">{def.vulnerabilidade}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-violet-50 p-4">
              <div className="flex items-center gap-2 text-violet-700">
                <Microscope className="size-4" />
                <p className="text-sm font-semibold">Foco do DT</p>
              </div>
              <p className="mt-1.5 text-sm text-violet-900">{def.focoDT}</p>
            </div>
            <div className="rounded-xl border-l-4 border-l-red-500 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="size-4" />
                <p className="text-sm font-semibold">Protocolo</p>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-red-700">{def.protocolo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
          <CardTitle className="text-lg">Registrar tratativa</CardTitle>
          <span
            className={`text-xs font-medium ${
              status === "em_tratativa" ? "text-amber-600" : "text-red-600"
            }`}
          >
            {status === "em_tratativa" ? "Em tratativa" : "Sem tratativa"}
          </span>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {acoesRapidas.map((acao) => (
              <Button
                key={acao.label}
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => toast(acao.toastMsg)}
              >
                <acao.icon className="size-4" />
                {acao.label}
              </Button>
            ))}
          </div>
          <Textarea
            placeholder="Descreva a ação de gestão tomada (encaminhamento, conversa, plano de ação)..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={4}
          />
          <Button className="h-11 rounded-xl" onClick={salvarTratativa}>
            Salvar tratativa
          </Button>
        </CardContent>
      </Card>
    </Layout>
  );
}
