import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toggle } from "@/components/ui/toggle";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Microscope,
  Phone,
  Radar,
  ShieldAlert,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getColaboradorById, parseDataBr } from "@/lib/mock-colaboradores";
import {
  combinacoesCasos,
  diasDesde,
  getCombinacaoCriticaById,
  getEmpresaById,
  NIVEL_BADGE_CLASS,
  NIVEL_LABEL,
  SLA_DIAS_TRATATIVA,
  usuariosDaEmpresa,
} from "@/lib/mock-empresas";
import NotFound from "@/pages/NotFound";

type AcaoEncaminhamento = { id: string; label: string; icon: LucideIcon };

// A Triade (nivel ESPECIAL, o mais severo do protocolo) troca os 2
// encaminhamentos genericos pelos 3 proprios, conforme o criterio de aceite.
const ENCAMINHAMENTOS_PADRAO: AcaoEncaminhamento[] = [
  { id: "dt", label: "Encaminhar ao DT", icon: ClipboardList },
  { id: "clinico", label: "Encaminhamento clínico", icon: Stethoscope },
];

const ENCAMINHAMENTOS_ESPECIAL: AcaoEncaminhamento[] = [
  { id: "wesafety", label: "Contato com a WeSafety", icon: Phone },
  { id: "rh", label: "Consulta com RH", icon: Users },
  { id: "especializado", label: "Encaminhamento especializado", icon: Stethoscope },
];

const ACOES_OPERACIONAIS = [
  { id: "suspender", label: "Suspender operação", icon: ShieldAlert },
  { id: "monitorar", label: "Monitoramento", icon: Radar },
  { id: "liberar", label: "Liberar para atividade", icon: CheckCircle2 },
] as const;

export default function TratativaCombinacao() {
  const { cid, kid } = useParams<{ cid: string; kid: string }>();
  const empresa = getEmpresaById(cid ?? "");
  const caso = combinacoesCasos.find((c) => c.id === kid);
  const [status, setStatus] = useState(caso?.status);
  const [acaoOperacional, setAcaoOperacional] = useState("");
  const [encaminhamentos, setEncaminhamentos] = useState<Set<string>>(new Set());
  const [cienteContrarioProtocolo, setCienteContrarioProtocolo] = useState(false);
  const [responsavelId, setResponsavelId] = useState("");
  const [prazo, setPrazo] = useState("");
  const [observacao, setObservacao] = useState("");

  if (!empresa || !caso) return <NotFound />;

  const def = getCombinacaoCriticaById(caso.combinacaoId);
  const colaborador = getColaboradorById(caso.colaboradorId);
  if (!def || !colaborador) return <NotFound />;

  const encaminhamentosDisponiveis = def.nivel === "ESPECIAL" ? ENCAMINHAMENTOS_ESPECIAL : ENCAMINHAMENTOS_PADRAO;
  const responsaveis = usuariosDaEmpresa(empresa.id).filter((u) => u.perfil !== "Avaliador");

  const dias = diasDesde(caso.detectadoEm);
  const slaExcedido = status === "sem_tratativa" && dias > SLA_DIAS_TRATATIVA;

  // O protocolo das combinacoes Critico/Especial exige suspensao/afastamento
  // obrigatorio -- "Liberar para atividade" nesses niveis contraria a
  // recomendacao, entao exige uma confirmacao explicita antes de salvar.
  const nivelExigeSuspensao = def.nivel === "ESPECIAL" || def.nivel === "CRÍTICO";
  const liberarContrariaProtocolo = acaoOperacional === "liberar" && nivelExigeSuspensao;

  // Linha do tempo com dados reais do colaborador -- a combinacao e sempre
  // apurada a partir de um DT (nao do EEA, que so sinaliza risco antes
  // disso), entao o EEA anterior aparece como contexto, nao como a origem
  // da combinacao.
  const testesAntesDoDt = colaborador.historicoTestes
    .filter((t) => parseDataBr(t.data).getTime() < parseDataBr(caso.detectadoEm).getTime())
    .sort((a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime());
  const ultimoEeaAntes = testesAntesDoDt.find((t) => t.tipo === "EEA");
  const testeDt = colaborador.historicoTestes.find((t) => t.tipo === "DT" && t.data === caso.detectadoEm);

  const timeline = [
    ...(ultimoEeaAntes
      ? [{ data: ultimoEeaAntes.data, titulo: "EEA sinalizou risco", descricao: ultimoEeaAntes.classificacao }]
      : []),
    {
      data: caso.detectadoEm,
      titulo: "DT confirmou a combinação",
      descricao: testeDt ? testeDt.classificacao : def.nome,
    },
    { data: caso.detectadoEm, titulo: "Caso aberto para tratativa", descricao: `Nível ${NIVEL_LABEL[def.nivel]}` },
    {
      data: null,
      titulo: status === "em_tratativa" ? "Tratativa registrada" : "Aguardando decisão do gestor",
      descricao: null,
    },
  ];

  function toggleEncaminhamento(id: string) {
    setEncaminhamentos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function salvarTratativa() {
    if (!acaoOperacional) {
      toast.error("Selecione uma ação operacional");
      return;
    }
    if (!observacao.trim()) {
      toast.error("Descreva a justificativa antes de salvar");
      return;
    }
    if (!responsavelId) {
      toast.error("Selecione o responsável pela decisão");
      return;
    }
    if (liberarContrariaProtocolo && !cienteContrarioProtocolo) {
      toast.error("Confirme que está ciente de que essa decisão contraria o protocolo");
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{colaborador.nome}</h1>
            <Badge variant="outline" className={`rounded-lg px-2.5 py-1 ${NIVEL_BADGE_CLASS[def.nivel]}`}>
              {NIVEL_LABEL[def.nivel]}
            </Badge>
          </div>
          <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <span>{colaborador.local}</span>
            <span>·</span>
            <span>DT confirmado em {caso.detectadoEm}</span>
            <span>·</span>
            <span className={`font-medium ${status === "em_tratativa" ? "text-amber-600" : "text-red-600"}`}>
              {status === "em_tratativa"
                ? "Em tratativa"
                : `Sem tratativa há ${dias} dia${dias === 1 ? "" : "s"}${slaExcedido ? " · SLA excedido" : ""}`}
            </span>
          </p>
        </div>
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`/empresas/${empresa.id}/combinacoes`}>
            <ArrowLeft className="size-4" />
            Voltar para a lista
          </Link>
        </Button>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,1fr)]">
        <Card className="w-full py-0 shadow-sm">
          <CardContent className="space-y-4 px-6 py-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Vulnerabilidade identificada
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
                  <p className="text-sm font-semibold">Ação recomendada pelo protocolo</p>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-red-700">{def.protocolo}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full py-0 shadow-sm">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-base">Linha do tempo</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <ol className="space-y-4">
              {timeline.map((item, index) => {
                const alcancado = index < timeline.length - 1 || status === "em_tratativa";
                return (
                  <li key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1 size-2.5 shrink-0 rounded-full ${
                          alcancado ? "bg-primary" : "border-2 border-muted-foreground/40 bg-transparent"
                        }`}
                      />
                      {index < timeline.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-1">
                      {item.data && <p className="text-xs text-muted-foreground">{item.data}</p>}
                      <p className="text-sm font-medium">{item.titulo}</p>
                      {item.descricao && <p className="text-xs text-muted-foreground">{item.descricao}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4 px-6 pt-6">
          <CardTitle className="text-lg">Registrar decisão e tratativa</CardTitle>
          <span
            className={`text-xs font-medium ${
              status === "em_tratativa" ? "text-amber-600" : "text-red-600"
            }`}
          >
            {status === "em_tratativa" ? "Em tratativa" : "Sem tratativa"}
          </span>
        </CardHeader>
        <CardContent className="space-y-5 px-6 pb-6">
          <FieldGroup>
            <Field>
              <FieldLabel>Ação operacional</FieldLabel>
              <FieldContent>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={acaoOperacional}
                  onValueChange={(v) => v && setAcaoOperacional(v)}
                  className="w-full"
                >
                  {ACOES_OPERACIONAIS.map((acao) => (
                    <ToggleGroupItem key={acao.id} value={acao.id} className="h-11 gap-1.5 text-xs sm:text-sm">
                      <acao.icon className="size-4" />
                      {acao.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FieldContent>
            </Field>

            {liberarContrariaProtocolo && (
              <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2 text-amber-800">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p className="text-sm">
                    O protocolo recomenda <strong>{def.protocolo}</strong> para o nível {NIVEL_LABEL[def.nivel]}.
                    Liberar para atividade contraria essa recomendação.
                  </p>
                </div>
                <label className="flex items-start gap-2 text-sm text-amber-900">
                  <Checkbox
                    checked={cienteContrarioProtocolo}
                    onCheckedChange={(v) => setCienteContrarioProtocolo(v === true)}
                  />
                  Estou ciente e assumo a responsabilidade por essa decisão
                </label>
              </div>
            )}

            <Field>
              <FieldLabel>Encaminhamentos</FieldLabel>
              <FieldContent>
                <div className="flex flex-wrap gap-2">
                  {encaminhamentosDisponiveis.map((acao) => (
                    <Toggle
                      key={acao.id}
                      variant="outline"
                      pressed={encaminhamentos.has(acao.id)}
                      onPressedChange={() => toggleEncaminhamento(acao.id)}
                      className="h-10 gap-1.5 rounded-xl px-3"
                    >
                      <acao.icon className="size-4" />
                      {acao.label}
                    </Toggle>
                  ))}
                </div>
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="justificativa">Justificativa da decisão</FieldLabel>
              <FieldContent>
                <Textarea
                  id="justificativa"
                  placeholder="Descreva os motivos que levaram à decisão tomada..."
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={4}
                />
              </FieldContent>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="responsavel">Responsável pela decisão</FieldLabel>
                <FieldContent>
                  <Select value={responsavelId} onValueChange={setResponsavelId}>
                    <SelectTrigger id="responsavel" className="w-full">
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {responsaveis.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome} · {u.perfil}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor="prazo">Prazo para revisão (opcional)</FieldLabel>
                <FieldContent>
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="prazo"
                      type="date"
                      className="pl-9"
                      value={prazo}
                      onChange={(e) => setPrazo(e.target.value)}
                    />
                  </div>
                </FieldContent>
              </Field>
            </div>
          </FieldGroup>

          <div className="flex justify-end gap-2">
            <Button asChild variant="outline" className="h-11 rounded-xl">
              <Link href={`/empresas/${empresa.id}/combinacoes`}>Cancelar</Link>
            </Button>
            <Button className="h-11 rounded-xl" onClick={salvarTratativa}>
              Salvar decisão e tratativa
            </Button>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
