import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
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
// Variante B do teste A/B (validada com o usuario): card mais enxuto que a
// primeira versao -- nome + badge de severidade, fatores envolvidos em
// chips, o "porque" em texto corrido, e uma unica faixa vermelha de "Acao
// recomendada" no lugar da lista de tratativas + botao. Layout em grid de 2
// colunas (um do lado do outro), nao mais empilhado verticalmente. So o
// nivel Especial (teto da escala) ganha o subtitulo "Maior nivel de
// severidade" abaixo do nome.
export function CombinacoesCriticasAlert({ colaboradorId }: CombinacoesCriticasAlertProps) {
  const casos: CasoComDef[] = casosDoColaborador(colaboradorId)
    .map((caso) => ({ caso, def: getCombinacaoCriticaById(caso.combinacaoId) }))
    .filter((item): item is CasoComDef => item.def !== undefined)
    .sort((a, b) => ORDEM_NIVEL[a.def.nivel] - ORDEM_NIVEL[b.def.nivel]);

  if (casos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      {casos.map(({ caso, def }) => {
        const especial = def.nivel === "ESPECIAL";

        return (
          <div key={caso.id} className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-xl font-bold">{def.nome}</p>
              <Badge variant="outline" className={`shrink-0 rounded-full px-4 py-1 text-sm font-semibold ${NIVEL_BADGE_CLASS[def.nivel]}`}>
                {NIVEL_LABEL[def.nivel]}
              </Badge>
            </div>
            {especial && <p className="mt-1 text-muted-foreground">Maior nível de severidade</p>}

            <p className="mt-6 text-xs font-bold tracking-wide text-foreground uppercase">Fatores envolvidos</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {def.fatores.map((f) => (
                <Badge
                  key={f}
                  variant="outline"
                  className="rounded-full border-red-200 bg-red-50 px-4 py-1.5 text-sm text-red-700"
                >
                  {f}
                </Badge>
              ))}
            </div>

            <p className="mt-6 font-bold">Por que esta combinação foi acionada?</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">{def.impactoOperacional}</p>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-500 p-4 text-white">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <p className="leading-snug">
                <span className="font-bold">Ação recomendada:</span> {def.protocolo}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
