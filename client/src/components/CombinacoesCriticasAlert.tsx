import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CircleSlash2,
  FilePlus2,
  Headphones,
  HeartPulse,
  Star,
  Stethoscope,
  User,
  type LucideIcon,
} from "lucide-react";
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

// Cor de destaque da borda esquerda por nivel -- o mesmo semantico das
// badges (NIVEL_BADGE_CLASS), so que aplicado como acento em vez de
// preencher o card inteiro (mantem o card sempre claro/legivel, so o nivel
// mais severo (Especial) ganha destaque adicional via icone + tag).
const NIVEL_BORDA_CLASS: Record<NivelCombinacao, string> = {
  ESPECIAL: "border-l-slate-900",
  "CRÍTICO": "border-l-red-500",
  ALTA: "border-l-amber-500",
};

type Tratativa = { icon: LucideIcon; label: string };

// So o nivel Especial (a Triade de Vulnerabilidade Extrema) troca as
// tratativas genericas por essas 3 acoes especificas -- as demais
// combinacoes mantem as 3 genericas abaixo, que ja existem na tela de
// tratativa completa (nao duplicadas aqui, so citadas como preview).
const TRATATIVAS_ESPECIAL: Tratativa[] = [
  { icon: Headphones, label: "Entrar em contato com a WeSafety" },
  { icon: User, label: "Consultar o RH responsável" },
  { icon: FilePlus2, label: "Considerar encaminhamento especializado" },
];

const TRATATIVAS_GENERICAS: Tratativa[] = [
  { icon: Stethoscope, label: "Encaminhar ao DT" },
  { icon: CircleSlash2, label: "Suspender operação" },
  { icon: HeartPulse, label: "Encaminhamento clínico" },
];

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
//
// Hierarquia de informacao de cada card (nessa ordem, de cima pra baixo):
// nome + nivel de severidade -> fatores envolvidos / tratativas recomendadas
// lado a lado -> "por que esta combinacao foi acionada". So o nivel Especial
// ganha estrela + tag "Maior nivel de severidade", por ser o teto da escala.
export function CombinacoesCriticasAlert({ colaboradorId }: CombinacoesCriticasAlertProps) {
  const casos: CasoComDef[] = casosDoColaborador(colaboradorId)
    .map((caso) => ({ caso, def: getCombinacaoCriticaById(caso.combinacaoId) }))
    .filter((item): item is CasoComDef => item.def !== undefined)
    .sort((a, b) => ORDEM_NIVEL[a.def.nivel] - ORDEM_NIVEL[b.def.nivel]);

  if (casos.length === 0) return null;

  return (
    <div className="space-y-4">
      {casos.map(({ caso, def }) => {
        const especial = def.nivel === "ESPECIAL";
        const tratativas = especial ? TRATATIVAS_ESPECIAL : TRATATIVAS_GENERICAS;

        return (
          <div
            key={caso.id}
            className={`rounded-xl border border-l-4 bg-card p-5 shadow-sm ${NIVEL_BORDA_CLASS[def.nivel]}`}
          >
            {/* Nome da combinacao + nivel de severidade */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div className="flex flex-wrap items-center gap-2.5">
                {especial && <Star className="size-5 shrink-0 fill-amber-400 text-amber-400" />}
                <p className="text-lg font-bold">{def.nome}</p>
                {especial && (
                  <Badge variant="outline" className="rounded-full border-slate-300 bg-slate-100 px-3 py-1 text-xs text-slate-700">
                    Maior nível de severidade
                  </Badge>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm">
                <span className="text-muted-foreground">Severidade:</span>
                <Badge variant="outline" className={`rounded-md px-2.5 py-1 text-xs font-bold ${NIVEL_BADGE_CLASS[def.nivel]}`}>
                  {NIVEL_LABEL[def.nivel]}
                </Badge>
              </div>
            </div>

            {/* Fatores envolvidos | Tratativas recomendadas */}
            <div className="grid grid-cols-1 gap-6 border-b py-4 sm:grid-cols-2">
              <div>
                <p className="mb-2.5 text-sm font-semibold">Fatores envolvidos</p>
                <div className="flex flex-wrap gap-2">
                  {def.fatores.map((f) => (
                    <Badge
                      key={f}
                      variant="outline"
                      className="rounded-full border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-800"
                    >
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2.5 text-sm font-semibold">Tratativas recomendadas</p>
                <div className="space-y-2">
                  {tratativas.map((t) => (
                    <div key={t.label} className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                        <t.icon className="size-4" />
                      </div>
                      <p className="text-sm">{t.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Por que esta combinacao foi acionada */}
            <div className="pt-4">
              <p className="mb-1 text-sm font-semibold">Por que esta combinação foi acionada?</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{def.impactoOperacional}</p>
            </div>

            <Button asChild size="sm" variant="outline" className="mt-4 rounded-xl">
              <Link href={`/empresas/${caso.empresaId}/combinacoes/${caso.id}`}>
                Ver tratativa completa
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        );
      })}
    </div>
  );
}
