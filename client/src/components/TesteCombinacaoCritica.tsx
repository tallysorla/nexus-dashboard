import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowRight, CalendarClock, ChevronDown } from "lucide-react";
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
    <Collapsible defaultOpen className="w-full">
      <Card className="w-full gap-0 py-0 shadow-sm">
        <div className="flex items-center justify-between gap-4 px-6 py-5">
          <CardTitle className="text-lg">Combinação críticas de fatores</CardTitle>
          <CollapsibleTrigger className="group flex items-center text-muted-foreground hover:text-foreground">
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <CardContent className="space-y-3 border-t px-6 py-5">
            {casos.map(({ caso, def }) => {
              const especial = def.nivel === "ESPECIAL";
              return (
                <div
                  key={caso.id}
                  className={`rounded-xl border p-4 shadow-sm ${especial ? "bg-slate-900 text-white" : "bg-card"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`rounded-lg px-2 py-0.5 text-xs ${
                          especial ? "border-white/30 bg-white/10 text-white" : NIVEL_BADGE_CLASS[def.nivel]
                        }`}
                      >
                        {NIVEL_LABEL[def.nivel]}
                      </Badge>
                      {def.fatores.map((f) => (
                        <Badge
                          key={f}
                          variant="outline"
                          className={`rounded-lg px-2 py-0.5 text-xs ${
                            especial
                              ? "border-white/30 bg-white/10 text-white"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {f}
                        </Badge>
                      ))}
                    </div>
                    <Badge
                      variant="outline"
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                        especial ? "border-white/30 bg-white/10 text-white" : "border-amber-300 bg-amber-100 text-amber-900"
                      }`}
                    >
                      <CalendarClock className="size-3.5" />
                      Teste DT obrigatório
                    </Badge>
                  </div>

                  <div className={`mt-3 rounded-lg border p-3 ${especial ? "border-white/20 bg-white/5" : "bg-card"}`}>
                    <p className={`text-sm font-semibold ${especial ? "text-white" : "text-foreground"}`}>
                      Vulnerabilidade
                    </p>
                    <p className={`mt-1 text-sm leading-relaxed ${especial ? "text-white/90" : "text-muted-foreground"}`}>
                      {def.vulnerabilidade}
                    </p>
                  </div>

                  <div
                    className={`mt-3 rounded-lg border p-3 ${
                      especial ? "border-white/20 bg-white/10" : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <p className={`text-sm font-semibold ${especial ? "text-white" : "text-amber-900"}`}>Protocolo</p>
                    <p className={`mt-1 text-sm leading-relaxed ${especial ? "text-white/90" : "text-amber-900"}`}>
                      {def.protocolo}
                    </p>
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
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
