import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Microscope } from "lucide-react";
import {
  casosDoColaborador,
  getCombinacaoCriticaById,
  NIVEL_BADGE_CLASS,
  NIVEL_LABEL,
  type CombinacaoCriticaCaso,
  type CombinacaoCriticaDef,
  type NivelCombinacao,
} from "@/lib/mock-empresas";

const ORDEM_NIVEL: Record<NivelCombinacao, number> = {
  ESPECIAL: 0,
  "CRÍTICO": 1,
  ALTA: 2,
};

// So a Triade (nivel mais severo do protocolo) troca as 3 acoes genericas de
// tratativa pelas 3 especificas pedidas no criterio de aceite -- as demais
// combinacoes continuam levando o gestor para a tela de tratativa completa,
// que mantem as acoes genericas (Encaminhar ao DT / Suspender operacao /
// Encaminhamento clinico).
const ACOES_ESPECIAL = ["Contato com a WeSafety", "Consulta com RH", "Encaminhamento especializado"];

type TesteCombinacaoCriticaProps = {
  colaboradorId: string;
  // Data (DD/MM/AAAA) do teste aberto no dialog de detalhe -- so mostramos a
  // combinacao critica cujo `detectadoEm` bate com esse teste especifico,
  // em vez de listar todos os casos ativos do funcionario.
  dataTeste: string;
};

export function TesteCombinacaoCritica({ colaboradorId, dataTeste }: TesteCombinacaoCriticaProps) {
  const casos = casosDoColaborador(colaboradorId)
    .filter((caso) => caso.detectadoEm === dataTeste)
    .map((caso) => ({ caso, def: getCombinacaoCriticaById(caso.combinacaoId) }))
    .filter(
      (item): item is { caso: CombinacaoCriticaCaso; def: CombinacaoCriticaDef } => item.def !== undefined
    )
    .sort((a, b) => ORDEM_NIVEL[a.def.nivel] - ORDEM_NIVEL[b.def.nivel]);

  if (casos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-red-600" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Combinação crítica detectada neste teste
        </h3>
      </div>
      <div className="space-y-3">
        {casos.map(({ caso, def }) => {
          const especial = def.nivel === "ESPECIAL";
          return (
            <div
              key={caso.id}
              className={`rounded-xl border p-4 shadow-sm ${
                especial ? "bg-slate-900 text-white" : "bg-card"
              }`}
            >
              <Badge
                variant="outline"
                className={`rounded-lg px-2 py-0.5 text-xs ${
                  especial ? "border-white/30 bg-white/10 text-white" : NIVEL_BADGE_CLASS[def.nivel]
                }`}
              >
                {NIVEL_LABEL[def.nivel]}
              </Badge>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {def.fatores.map((f) => (
                  <Badge
                    key={f}
                    variant="outline"
                    className={`rounded-lg px-2 py-0.5 text-xs ${
                      especial ? "border-white/30 bg-white/10 text-white" : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {f}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(220px,1fr)]">
                <div>
                  <p
                    className={`text-xs font-medium uppercase tracking-wide ${
                      especial ? "text-white/60" : "text-muted-foreground"
                    }`}
                  >
                    Vulnerabilidade identificada
                  </p>
                  <p className={`mt-1.5 text-sm leading-relaxed ${especial ? "text-white/90" : "text-foreground"}`}>
                    {def.vulnerabilidade}
                  </p>
                </div>
                <div className={`lg:border-l lg:pl-6 ${especial ? "border-white/20" : "border-primary/40"}`}>
                  <div
                    className={`flex items-center gap-2 border-b pb-2 ${
                      especial ? "border-white/30 text-white" : "border-primary/40 text-primary"
                    }`}
                  >
                    <Microscope className="size-4" />
                    <p className="text-sm font-semibold">Foco do DT</p>
                  </div>
                  <p className={`mt-2 text-sm ${especial ? "text-white/90" : "text-foreground"}`}>{def.focoDT}</p>
                </div>
              </div>

              {especial && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {ACOES_ESPECIAL.map((acao) => (
                    <Badge
                      key={acao}
                      variant="outline"
                      className="rounded-lg border-white/30 bg-white/10 px-2 py-0.5 text-xs text-white"
                    >
                      {acao}
                    </Badge>
                  ))}
                </div>
              )}

              <Button asChild size="sm" variant={especial ? "secondary" : "outline"} className="mt-3 rounded-xl">
                <Link href={`/empresas/${caso.empresaId}/combinacoes/${caso.id}`}>
                  Ver detalhes e registrar tratativa
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
