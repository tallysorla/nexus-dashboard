export type RiskLevel = "alto" | "medio" | "baixo";

export type Tendencia = "subindo" | "estavel" | "descendo";

export type TipoTeste = "EEA" | "DT";

// nota = 0-100, quanto maior pior (mesma escala do indice de risco geral).
// variacaoPercentual = sinal indica a direcao real: positivo = piorando,
// negativo = melhorando. tendencia e status sao sempre derivados dela, nunca
// digitados a mao, para nao correr o risco de um "+4%" aparecer como "Melhorando".
export type Fator = {
  rank: number;
  nome: string;
  nota: number;
  variacaoPercentual: number;
  origem: TipoTeste;
};

export function tendenciaDoFator(variacaoPercentual: number): Tendencia {
  if (variacaoPercentual >= 3) return "subindo";
  if (variacaoPercentual <= -3) return "descendo";
  return "estavel";
}

export function statusDoFator(tendencia: Tendencia): string {
  if (tendencia === "subindo") return "Piorando";
  if (tendencia === "descendo") return "Melhorando";
  return "Estável";
}

export function variacaoLabel(variacaoPercentual: number): string {
  return `${variacaoPercentual > 0 ? "+" : ""}${variacaoPercentual}%`;
}

export type PontoEea = {
  date: string;
  eea: number;
};

export type PontoDt = {
  date: string;
  dt: number;
};

export type TesteHistorico = {
  id: string;
  data: string;
  tipo: TipoTeste;
  pontuacao: number;
  classificacao: string;
  status: RiskLevel;
  fatores: string;
};

export type Tratativa = {
  id: string;
  data: string;
  tipo: string;
  autor: string;
  observacao: string;
};

export type Colaborador = {
  id: string;
  nome: string;
  cargo: string;
  setor: string;
  local: string;
  avatarSeed: string;
  eea: number;
  dt: number;
  evolucao: number;
  risco: RiskLevel;
  totalTestesEea: number;
  totalTestesDt: number;
  fatoresDestaque: Fator[];
  fatoresAdicionais: Fator[];
  serieEea: PontoEea[];
  serieDt: PontoDt[];
  historicoTestes: TesteHistorico[];
  historicoTratativas: Tratativa[];
};

export const RISCO_LABEL: Record<RiskLevel, string> = {
  alto: "Alto risco",
  medio: "Médio risco",
  baixo: "Baixo risco",
};

export const RISCO_BADGE_CLASS: Record<RiskLevel, string> = {
  alto: "border-red-200 bg-red-50 text-red-700",
  medio: "border-amber-200 bg-amber-50 text-amber-700",
  baixo: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

// Pontuacao/nota = indice de risco normalizado (0-100, quanto maior pior).
// Faixas usadas de forma consistente em toda a aplicacao (indice geral e fatores):
//   >= 70 -> alto risco, 40-69 -> medio risco, < 40 -> baixo risco
export function classificarRisco(pontuacao: number): RiskLevel {
  if (pontuacao >= 70) return "alto";
  if (pontuacao >= 40) return "medio";
  return "baixo";
}

// EEA e feito todo dia pelo colaborador -> um ponto por dia dos ultimos 90
// dias, terminando exatamente no valor atual (colaborador.eea) para nao
// destoar do KPI "EEA atual" mostrado no topo da tela.
const DIAS_SERIE_EEA = 90;
const DATA_FINAL_SERIE_EEA = new Date(2026, 6, 6);

function serieEea(valorAtual: number): PontoEea[] {
  const valorInicial = Math.max(5, valorAtual - 20);

  return Array.from({ length: DIAS_SERIE_EEA }, (_, i) => {
    const dia = new Date(DATA_FINAL_SERIE_EEA);
    dia.setDate(dia.getDate() - (DIAS_SERIE_EEA - 1 - i));
    const date = `${String(dia.getDate()).padStart(2, "0")}/${String(dia.getMonth() + 1).padStart(2, "0")}`;

    const progresso = i / (DIAS_SERIE_EEA - 1);
    const tendencia = valorInicial + (valorAtual - valorInicial) * progresso;
    const ehUltimoDia = i === DIAS_SERIE_EEA - 1;
    const ruido = ehUltimoDia ? 0 : Math.sin(i * 1.7) * 2.5 + Math.sin(i * 0.35) * 1.5;
    const eea = Math.max(0, Math.min(100, Math.round(tendencia + ruido)));

    return { date, eea };
  });
}

// DT e feito raramente (cerca de uma vez por mes ou durante uma tratativa) ->
// poucos pontos espacados, para nao forcar uma linha continua onde nao ha dado.
function serieDt(base: number): PontoDt[] {
  const dates = ["04/04", "02/05", "30/05", "06/07"];
  return dates.map((date, i) => ({
    date,
    dt: Math.round(base + i * 45),
  }));
}

// Os 10 fatores de risco psicossocial acompanhados pelo Nexus.
// Cada colaborador tem 3 "em destaque" (maior variacao) e os 7 restantes
// ficam em "fatoresAdicionais", sem duplicar nomes.
const TODOS_FATORES = [
  "Perda de foco",
  "Inquietação",
  "Cansaço",
  "Preocupação excessiva",
  "Qualidade do sono",
  "Cansaço mental",
  "Cicatrizes Invisíveis",
  "Raiva ou irritabilidade",
  "Insegurança",
  "Desmotivação",
] as const;

// Fatores com nota >= 70 (alto risco) partem do princípio de que já foram
// confirmados por um teste DT (mais profundo); os demais são acompanhados
// pelo EEA (diário), que é quem normalmente detecta a variação primeiro.
function origemDaNota(nota: number): TipoTeste {
  return nota >= 70 ? "DT" : "EEA";
}

function gerarFatoresAdicionais(risco: RiskLevel, destaque: string[]): Fator[] {
  const baseNota = risco === "alto" ? 42 : risco === "medio" ? 30 : 18;
  return TODOS_FATORES.filter((nome) => !destaque.includes(nome)).map((nome, i) => {
    const variacaoPercentual = i % 3 === 0 ? 1 : i % 3 === 1 ? -(2 + (i % 3)) : 3 + (i % 3);
    const nota = Math.max(6, baseNota - i * 4);
    return {
      rank: 4 + i,
      nome,
      nota,
      variacaoPercentual,
      origem: origemDaNota(nota),
    };
  });
}

export const colaboradores: Colaborador[] = [
  {
    id: "patricia-lopes",
    nome: "Patrícia Lopes",
    cargo: "Técnica de Manutenção",
    setor: "Operações",
    local: "Matriz SP",
    avatarSeed: "Patricia",
    eea: 74,
    dt: 527,
    evolucao: 13,
    risco: "alto",
    totalTestesEea: 86,
    totalTestesDt: 7,
    fatoresDestaque: [
      { rank: 1, nome: "Inquietação", nota: 88, variacaoPercentual: 12, origem: "DT" },
      { rank: 2, nome: "Cansaço", nota: 64, variacaoPercentual: 2, origem: "EEA" },
      { rank: 3, nome: "Insegurança", nota: 46, variacaoPercentual: -6, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("alto", ["Inquietação", "Cansaço", "Insegurança"]),
    serieEea: serieEea(74),
    serieDt: serieDt(300),
    historicoTestes: [
      { id: "t1", data: "03/07/2026", tipo: "DT", pontuacao: 82, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Inquietação, Cansaço, Preocupação excessiva" },
      { id: "t2", data: "26/06/2026", tipo: "EEA", pontuacao: 75, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Inquietação, Cansaço" },
      { id: "t3", data: "19/06/2026", tipo: "EEA", pontuacao: 61, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço, Preocupação excessiva" },
      { id: "t4", data: "12/06/2026", tipo: "EEA", pontuacao: 55, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Insegurança, Cansaço" },
      { id: "t5", data: "05/06/2026", tipo: "DT", pontuacao: 38, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t6", data: "29/05/2026", tipo: "EEA", pontuacao: 34, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t7", data: "22/05/2026", tipo: "EEA", pontuacao: 29, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
    ],
    historicoTratativas: [
      {
        id: "tr1",
        data: "27/06/2026",
        tipo: "Conversa",
        autor: "Você",
        observacao: "Conversa inicial sobre carga de trabalho após pico de inversão de turno.",
      },
    ],
  },
  {
    id: "carlos-silva",
    nome: "Carlos Silva",
    cargo: "Analista de Logística",
    setor: "Logística",
    local: "Matriz SP",
    avatarSeed: "Carlos",
    eea: 58,
    dt: 340,
    evolucao: 4,
    risco: "medio",
    totalTestesEea: 102,
    totalTestesDt: 5,
    fatoresDestaque: [
      { rank: 1, nome: "Preocupação excessiva", nota: 58, variacaoPercentual: 8, origem: "EEA" },
      { rank: 2, nome: "Cansaço", nota: 40, variacaoPercentual: 1, origem: "EEA" },
      { rank: 3, nome: "Insegurança", nota: 22, variacaoPercentual: -3, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("medio", ["Preocupação excessiva", "Cansaço", "Insegurança"]),
    serieEea: serieEea(58),
    serieDt: serieDt(200),
    historicoTestes: [
      { id: "t1", data: "01/07/2026", tipo: "DT", pontuacao: 58, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Preocupação excessiva, Cansaço" },
      { id: "t2", data: "24/06/2026", tipo: "EEA", pontuacao: 52, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Preocupação excessiva" },
      { id: "t3", data: "17/06/2026", tipo: "EEA", pontuacao: 33, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t4", data: "10/06/2026", tipo: "EEA", pontuacao: 28, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t5", data: "03/06/2026", tipo: "DT", pontuacao: 25, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t6", data: "27/05/2026", tipo: "EEA", pontuacao: 22, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t7", data: "20/05/2026", tipo: "EEA", pontuacao: 19, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
    ],
    historicoTratativas: [],
  },
  {
    id: "renata-alves",
    nome: "Renata Alves",
    cargo: "Supervisora de Qualidade",
    setor: "Qualidade",
    local: "Filial Campinas",
    avatarSeed: "Renata",
    eea: 76,
    dt: 610,
    evolucao: -9,
    risco: "alto",
    totalTestesEea: 74,
    totalTestesDt: 8,
    fatoresDestaque: [
      { rank: 1, nome: "Raiva ou irritabilidade", nota: 91, variacaoPercentual: 18, origem: "DT" },
      { rank: 2, nome: "Preocupação excessiva", nota: 70, variacaoPercentual: 2, origem: "DT" },
      { rank: 3, nome: "Cansaço", nota: 60, variacaoPercentual: 2, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("alto", ["Raiva ou irritabilidade", "Preocupação excessiva", "Cansaço"]),
    serieEea: serieEea(76),
    serieDt: serieDt(420),
    historicoTestes: [
      { id: "t1", data: "05/07/2026", tipo: "DT", pontuacao: 88, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Raiva ou irritabilidade, Preocupação excessiva" },
      { id: "t2", data: "28/06/2026", tipo: "EEA", pontuacao: 84, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Raiva ou irritabilidade, Cansaço" },
      { id: "t3", data: "21/06/2026", tipo: "EEA", pontuacao: 79, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Raiva ou irritabilidade" },
      { id: "t4", data: "14/06/2026", tipo: "EEA", pontuacao: 65, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Preocupação excessiva" },
      { id: "t5", data: "07/06/2026", tipo: "DT", pontuacao: 60, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço" },
      { id: "t6", data: "31/05/2026", tipo: "EEA", pontuacao: 52, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Raiva ou irritabilidade" },
      { id: "t7", data: "24/05/2026", tipo: "EEA", pontuacao: 47, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço" },
    ],
    historicoTratativas: [
      {
        id: "tr1",
        data: "29/06/2026",
        tipo: "Encaminhamento",
        autor: "Você",
        observacao: "Encaminhada para apoio psicossocial após relato de conflito recorrente com a equipe.",
      },
      {
        id: "tr2",
        data: "22/06/2026",
        tipo: "Feedback",
        autor: "Você",
        observacao: "Feedback sobre redistribuição de prazos no período de fechamento mensal.",
      },
    ],
  },
  {
    id: "joao-pereira",
    nome: "João Pereira",
    cargo: "Motorista",
    setor: "Logística",
    local: "Filial Guarulhos",
    avatarSeed: "Joao",
    eea: 32,
    dt: 210,
    evolucao: 6,
    risco: "baixo",
    totalTestesEea: 95,
    totalTestesDt: 4,
    fatoresDestaque: [
      { rank: 1, nome: "Cansaço", nota: 30, variacaoPercentual: 2, origem: "EEA" },
      { rank: 2, nome: "Insegurança", nota: 18, variacaoPercentual: -4, origem: "EEA" },
      { rank: 3, nome: "Qualidade do sono", nota: 14, variacaoPercentual: -5, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("baixo", ["Cansaço", "Insegurança", "Qualidade do sono"]),
    serieEea: serieEea(32),
    serieDt: serieDt(150),
    historicoTestes: [
      { id: "t1", data: "02/07/2026", tipo: "EEA", pontuacao: 30, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t2", data: "25/06/2026", tipo: "EEA", pontuacao: 27, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t3", data: "18/06/2026", tipo: "EEA", pontuacao: 24, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t4", data: "11/06/2026", tipo: "DT", pontuacao: 22, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Qualidade do sono" },
      { id: "t5", data: "04/06/2026", tipo: "EEA", pontuacao: 21, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t6", data: "28/05/2026", tipo: "DT", pontuacao: 19, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t7", data: "21/05/2026", tipo: "EEA", pontuacao: 18, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Qualidade do sono" },
    ],
    historicoTratativas: [],
  },
  {
    id: "mariana-costa",
    nome: "Mariana Costa",
    cargo: "Assistente Administrativa",
    setor: "Administrativo",
    local: "Matriz SP",
    avatarSeed: "Mariana",
    eea: 69,
    dt: 480,
    evolucao: -2,
    risco: "medio",
    totalTestesEea: 68,
    totalTestesDt: 6,
    fatoresDestaque: [
      { rank: 1, nome: "Cansaço", nota: 66, variacaoPercentual: 9, origem: "EEA" },
      { rank: 2, nome: "Cansaço mental", nota: 54, variacaoPercentual: 2, origem: "EEA" },
      { rank: 3, nome: "Insegurança", nota: 33, variacaoPercentual: 1, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("medio", ["Cansaço", "Cansaço mental", "Insegurança"]),
    serieEea: serieEea(69),
    serieDt: serieDt(280),
    historicoTestes: [
      { id: "t1", data: "04/07/2026", tipo: "EEA", pontuacao: 66, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço, Cansaço mental" },
      { id: "t2", data: "27/06/2026", tipo: "DT", pontuacao: 63, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço" },
      { id: "t3", data: "20/06/2026", tipo: "EEA", pontuacao: 59, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço mental" },
      { id: "t4", data: "13/06/2026", tipo: "EEA", pontuacao: 45, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Insegurança" },
      { id: "t5", data: "06/06/2026", tipo: "DT", pontuacao: 37, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t6", data: "30/05/2026", tipo: "EEA", pontuacao: 31, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t7", data: "23/05/2026", tipo: "EEA", pontuacao: 28, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço mental" },
    ],
    historicoTratativas: [],
  },
];

export function getColaboradorById(id: string): Colaborador | undefined {
  return colaboradores.find((c) => c.id === id);
}

export const colaboradorDestaque = colaboradores[0];
