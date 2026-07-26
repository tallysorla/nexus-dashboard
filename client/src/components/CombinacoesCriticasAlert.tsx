import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
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

// So o nivel Especial (a Triade de Vulnerabilidade Extrema) troca as tratativas
// genericas por essas 3 acoes especificas -- as demais combinacoes mantem
// "Encaminhar ao DT / Suspender operacao / Encaminhamento clinico", que ja
// existem na tela de tratativa (nao duplicadas aqui).
const ACOES_ESPECIAL = ["Contato com a WeSafety", "Consulta com RH", "Encaminhamento especializado"];

type CasoComDef = { caso: CombinacaoCriticaCaso; def: CombinacaoCriticaDef };

type CombinacoesCriticasAlertProps = {
  colaboradorId: string;
};

// Banner no topo do perfil do funcionario com as combinacoes criticas
// detectadas -- o caso e vinculado ao colaborador em geral (nao a um teste
// especifico, ver casosDoColaborador), entao aparece aqui independente de
// qual teste esta sendo visto. Nenhuma combinacao e escondida atras de aba,
// paginacao ou "ver mais"; a secao inteira desaparece quando nao ha nenhum
// caso ativo (silencio e a resposta correta nesse cenario).
export function CombinacoesCriticasAlert({ colaboradorId }: CombinacoesCriticasAlertProps) {
  const casos: CasoComDef[] = casosDoColaborador(colaboradorId)
    .map((caso) => ({ caso, def: getCombinacaoCriticaById(caso.combinacaoId) }))
    .filter((item): item is CasoComDef => item.def !== undefined)
    .sort((a, b) => ORDEM_NIVEL[a.def.nivel] - ORDEM_NIVEL[b.def.nivel]);

  if (casos.length === 0) return null;

  return (
    <div className="space-y-3">
      {casos.map(({ caso, def }) => {
        const especial = def.nivel === "ESPECIAL";
        return (
          <div
            key={caso.id}
            className={`rounded-xl border p-4 shadow-sm sm:p-5 ${
              especial ? "border-slate-800 bg-slate-900 text-white" : "bg-card"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              {especial && <Star className="size-4 shrink-0 fill-current" />}
              <Badge
                variant="outline"
                className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                  especial ? "border-white/30 bg-white/10 text-white" : NIVEL_BADGE_CLASS[def.nivel]
                }`}
              >
                {NIVEL_LABEL[def.nivel]}
              </Badge>
              <p className="font-semibold">{def.nome}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {def.fatores.map((f) => (
                <Badge
                  key={f}
                  variant="outline"
                  className={`rounded-full px-3 py-1 text-xs ${
                    especial ? "border-white/30 bg-white/10 text-white" : "border-amber-200 bg-amber-50 text-amber-800"
                  }`}
                >
                  {f}
                </Badge>
              ))}
            </div>

            <p className={`mt-3 text-sm leading-relaxed ${especial ? "text-white/90" : "text-muted-foreground"}`}>
              {def.protocolo}
            </p>

            {especial && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ACOES_ESPECIAL.map((acao) => (
                  <Badge
                    key={acao}
                    variant="outline"
                    className="rounded-full border-white/30 bg-white/10 px-3 py-1 text-xs text-white"
                  >
                    {acao}
                  </Badge>
                ))}
              </div>
            )}

            <Button asChild size="sm" variant={especial ? "secondary" : "outline"} className="mt-4 rounded-xl">
              <Link href={`/empresas/${caso.empresaId}/combinacoes/${caso.id}`}>
                Ver tratativa
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
