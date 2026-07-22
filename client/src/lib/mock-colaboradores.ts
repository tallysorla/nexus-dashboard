export type RiskLevel = "alto" | "medio" | "baixo";

export type Tendencia = "subindo" | "estavel" | "descendo";

export type TipoTeste = "EEA" | "DT";

// nota = 0-75 por fator; os 10 fatores somados totalizam ate 750, a mesma
// escala do teste DT (o mais aprofundado), ja que os fatores em atencao sao
// apurados com base no ultimo DT realizado pelo colaborador, quanto maior
// pior. variacaoPercentual = sinal indica a direcao real: positivo =
// piorando, negativo = melhorando. tendencia e status sao sempre derivados
// dela, nunca digitados a mao, para nao correr o risco de um "+4%" aparecer
// como "Melhorando".
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

// Sem sinal de +/- -- "+12%" lia como algo positivo mesmo quando a tendencia
// e "Piorando" (usuarios confundiram). O badge de status e a cor do valor ja
// comunicam a direcao, entao aqui so a magnitude importa.
export function variacaoLabel(variacaoPercentual: number): string {
  return `${Math.abs(variacaoPercentual)}%`;
}

export type PontoEea = {
  date: string;
  eea: number;
};

// origem distingue um DT feito no ciclo mensal normal de um DT antecipado
// como tratativa (ex.: apos uma sequencia de EEA em alto risco) -- o gestor
// precisa saber qual dos dois motivou aquele teste especifico.
export type PontoDt = {
  date: string;
  dt: number;
  origem: "mensal" | "tratativa";
};

// Decisao manual do gestor quando o teste da risco medio ("Aguardando") --
// alto ja bloqueia automaticamente e baixo ja libera automaticamente, entao
// so o medio exige essa decisao explicita.
export type DecisaoAutorizacao = {
  decisao: "autorizado" | "nao_autorizado";
  observacao: string;
  autor: string;
  data: string;
  hora: string;
};

export type TesteHistorico = {
  id: string;
  data: string;
  tipo: TipoTeste;
  pontuacao: number;
  classificacao: string;
  status: RiskLevel;
  fatores: string;
  autorizacaoDecidida?: DecisaoAutorizacao;
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
  avatarUrl: string;
  matricula: string;
  cpf: string;
  idade: number;
  dataAdmissao: string;
  eea: number;
  dt: number;
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

// Fatores em atencao usam 0-75 por fator (os 10 somados totalizam os 750 do
// teste DT). As faixas sao as mesmas proporcoes de classificarRisco
// (>=70%/40-69%/<40% de 75), para que um fator e o indice geral classifiquem
// o mesmo numero da mesma forma.
export function classificarRiscoDT(pontuacao: number): RiskLevel {
  if (pontuacao >= 52.5) return "alto";
  if (pontuacao >= 30) return "medio";
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
// 12 pontos mensais (para permitir o filtro de 3/6/12 meses), terminando
// exatamente no valor atual (colaborador.dt) para nao destoar do KPI "DT
// atual" mostrado no topo da tela.
const MESES_SERIE_DT = 12;
const DATA_FINAL_SERIE_DT = new Date(2026, 6, 6);

// pontosTratativa: indices (0 = ponto mais antigo, MESES_SERIE_DT - 1 = mais
// recente) que correspondem a um DT antecipado como tratativa, e nao ao ciclo
// mensal normal -- por exemplo, quando uma sequencia de EEA em alto risco leva
// o gestor a pedir um DT antes do previsto.
function serieDt(valorAtual: number, pontosTratativa: number[] = []): PontoDt[] {
  const valorInicial = Math.max(40, valorAtual - 260);

  return Array.from({ length: MESES_SERIE_DT }, (_, i) => {
    const mes = new Date(DATA_FINAL_SERIE_DT);
    mes.setMonth(mes.getMonth() - (MESES_SERIE_DT - 1 - i));
    const date = `${String(mes.getDate()).padStart(2, "0")}/${String(mes.getMonth() + 1).padStart(2, "0")}`;

    const progresso = i / (MESES_SERIE_DT - 1);
    const tendencia = valorInicial + (valorAtual - valorInicial) * progresso;
    const ehUltimoMes = i === MESES_SERIE_DT - 1;
    const ruido = ehUltimoMes ? 0 : Math.sin(i * 1.3) * 30 + Math.sin(i * 0.6) * 18;
    const dt = Math.max(0, Math.min(750, Math.round(tendencia + ruido)));
    const origem: "mensal" | "tratativa" = pontosTratativa.includes(i) ? "tratativa" : "mensal";

    return { date, dt, origem };
  });
}

// Tendencia do EEA em relacao ao ultimo DT: o DT e o teste de referencia
// (mais profundo, feito com bem menos frequencia) -- os EEAs diarios feitos
// depois dele devem ser comparados contra esse baseline para indicar se o
// funcionario esta piorando ou melhorando desde a ultima avaliacao
// aprofundada, e nao contra a propria media historica do EEA. Normaliza o DT
// (0-750) pra mesma escala do EEA (0-100) antes de comparar.
export function tendenciaEeaVsUltimoDt(eeaAtual: number, dtAtual: number): number {
  const dtBaseline = (dtAtual / 750) * 100;
  if (dtBaseline === 0) return 0;
  return Math.round(((eeaAtual - dtBaseline) / dtBaseline) * 100);
}

export function parseDataBr(data: string): Date {
  const [dia, mes, ano] = data.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

// Os 10 fatores de risco psicossocial acompanhados pelo Nexus.
// Cada colaborador tem 3 "em destaque" (maior variacao) e os 7 restantes
// ficam em "fatoresAdicionais", sem duplicar nomes.
export const TODOS_FATORES = [
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

// Fatores com nota >= 52.5 (70% de 75, alto risco) partem do princípio de que
// já foram confirmados por um teste DT (mais profundo); os demais são
// acompanhados pelo EEA (diário), que é quem normalmente detecta a variação
// primeiro.
function origemDaNota(nota: number): TipoTeste {
  return nota >= 52.5 ? "DT" : "EEA";
}

function gerarFatoresAdicionais(risco: RiskLevel, destaque: string[]): Fator[] {
  const baseNota = risco === "alto" ? 32 : risco === "medio" ? 23 : 14;
  return TODOS_FATORES.filter((nome) => !destaque.includes(nome)).map((nome, i) => {
    const variacaoPercentual = i % 3 === 0 ? 1 : i % 3 === 1 ? -(2 + (i % 3)) : 3 + (i % 3);
    const nota = Math.max(5, baseNota - i * 3);
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
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces&auto=format&q=80",
    matricula: "EMP-10234",
    cpf: "301.552.118-20",
    idade: 34,
    dataAdmissao: "12/03/2019",
    eea: 74,
    dt: 527,
    risco: "alto",
    totalTestesEea: 86,
    totalTestesDt: 7,
    fatoresDestaque: [
      { rank: 1, nome: "Inquietação", nota: 66, variacaoPercentual: 12, origem: "DT" },
      { rank: 2, nome: "Cansaço", nota: 48, variacaoPercentual: 2, origem: "EEA" },
      { rank: 3, nome: "Insegurança", nota: 35, variacaoPercentual: -6, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("alto", ["Inquietação", "Cansaço", "Insegurança"]),
    serieEea: serieEea(74),
    serieDt: serieDt(527, [MESES_SERIE_DT - 1]),
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
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&auto=format&q=80",
    matricula: "EMP-10891",
    cpf: "118.904.337-55",
    idade: 29,
    dataAdmissao: "04/07/2021",
    eea: 58,
    dt: 340,
    risco: "medio",
    totalTestesEea: 102,
    totalTestesDt: 5,
    fatoresDestaque: [
      { rank: 1, nome: "Preocupação excessiva", nota: 44, variacaoPercentual: 8, origem: "EEA" },
      { rank: 2, nome: "Cansaço", nota: 30, variacaoPercentual: 1, origem: "EEA" },
      { rank: 3, nome: "Insegurança", nota: 17, variacaoPercentual: -3, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("medio", ["Preocupação excessiva", "Cansaço", "Insegurança"]),
    serieEea: serieEea(58),
    serieDt: serieDt(340),
    historicoTestes: [
      { id: "t1", data: "01/07/2026", tipo: "DT", pontuacao: 58, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Preocupação excessiva, Qualidade do sono" },
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
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces&auto=format&q=80",
    matricula: "EMP-09587",
    cpf: "452.110.889-03",
    idade: 41,
    dataAdmissao: "22/09/2015",
    eea: 76,
    dt: 610,
    risco: "alto",
    totalTestesEea: 74,
    totalTestesDt: 8,
    fatoresDestaque: [
      { rank: 1, nome: "Raiva ou irritabilidade", nota: 68, variacaoPercentual: 18, origem: "DT" },
      { rank: 2, nome: "Preocupação excessiva", nota: 53, variacaoPercentual: 2, origem: "DT" },
      { rank: 3, nome: "Cansaço", nota: 45, variacaoPercentual: 2, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("alto", ["Raiva ou irritabilidade", "Preocupação excessiva", "Cansaço"]),
    serieEea: serieEea(76),
    serieDt: serieDt(610, [MESES_SERIE_DT - 1]),
    historicoTestes: [
      { id: "t1", data: "05/07/2026", tipo: "DT", pontuacao: 88, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Perda de foco, Raiva ou irritabilidade" },
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
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces&auto=format&q=80",
    matricula: "EMP-11042",
    cpf: "770.223.145-61",
    idade: 26,
    dataAdmissao: "08/01/2023",
    eea: 32,
    dt: 210,
    risco: "baixo",
    totalTestesEea: 95,
    totalTestesDt: 4,
    fatoresDestaque: [
      { rank: 1, nome: "Cansaço", nota: 23, variacaoPercentual: 2, origem: "EEA" },
      { rank: 2, nome: "Insegurança", nota: 14, variacaoPercentual: -4, origem: "EEA" },
      { rank: 3, nome: "Qualidade do sono", nota: 11, variacaoPercentual: -5, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("baixo", ["Cansaço", "Insegurança", "Qualidade do sono"]),
    serieEea: serieEea(32),
    serieDt: serieDt(210),
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
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces&auto=format&q=80",
    matricula: "EMP-10456",
    cpf: "509.317.662-84",
    idade: 37,
    dataAdmissao: "17/05/2018",
    eea: 69,
    dt: 480,
    risco: "medio",
    totalTestesEea: 68,
    totalTestesDt: 6,
    fatoresDestaque: [
      { rank: 1, nome: "Cansaço", nota: 50, variacaoPercentual: 9, origem: "EEA" },
      { rank: 2, nome: "Cansaço mental", nota: 41, variacaoPercentual: 2, origem: "EEA" },
      { rank: 3, nome: "Insegurança", nota: 25, variacaoPercentual: 1, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("medio", ["Cansaço", "Cansaço mental", "Insegurança"]),
    serieEea: serieEea(69),
    serieDt: serieDt(480),
    historicoTestes: [
      { id: "t1", data: "04/07/2026", tipo: "EEA", pontuacao: 66, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço, Cansaço mental" },
      { id: "t2", data: "27/06/2026", tipo: "DT", pontuacao: 63, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço mental, Desmotivação" },
      { id: "t3", data: "20/06/2026", tipo: "EEA", pontuacao: 59, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço mental" },
      { id: "t4", data: "13/06/2026", tipo: "EEA", pontuacao: 45, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Insegurança" },
      { id: "t5", data: "06/06/2026", tipo: "DT", pontuacao: 37, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t6", data: "30/05/2026", tipo: "EEA", pontuacao: 31, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t7", data: "23/05/2026", tipo: "EEA", pontuacao: 28, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço mental" },
    ],
    historicoTratativas: [],
  },
  {
    // Funcionario recem-admitido: ja fez EEA (diario, comeca no primeiro dia)
    // mas ainda nao teve nenhum DT (periodico/mais raro) -- cenario real de
    // blank state pro card de Tendencia em MetricsCards.tsx.
    id: "bruno-teixeira",
    nome: "Bruno Teixeira",
    cargo: "Auxiliar de Logística",
    setor: "Logística",
    local: "Matriz SP",
    avatarUrl:
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&h=200&fit=crop&crop=faces&auto=format&q=80",
    matricula: "EMP-11501",
    cpf: "203.884.771-09",
    idade: 22,
    dataAdmissao: "01/07/2026",
    eea: 22,
    dt: 0,
    risco: "baixo",
    totalTestesEea: 4,
    totalTestesDt: 0,
    fatoresDestaque: [
      { rank: 1, nome: "Insegurança", nota: 15, variacaoPercentual: 2, origem: "EEA" },
      { rank: 2, nome: "Cansaço", nota: 12, variacaoPercentual: -1, origem: "EEA" },
      { rank: 3, nome: "Perda de foco", nota: 9, variacaoPercentual: 1, origem: "EEA" },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("baixo", ["Insegurança", "Cansaço", "Perda de foco"]),
    serieEea: serieEea(22),
    serieDt: [],
    historicoTestes: [
      { id: "t1", data: "05/07/2026", tipo: "EEA", pontuacao: 22, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t2", data: "04/07/2026", tipo: "EEA", pontuacao: 19, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t3", data: "03/07/2026", tipo: "EEA", pontuacao: 16, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Perda de foco" },
      { id: "t4", data: "02/07/2026", tipo: "EEA", pontuacao: 14, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
    ],
    historicoTratativas: [],
  },
];

export function getColaboradorById(id: string): Colaborador | undefined {
  return colaboradores.find((c) => c.id === id);
}

// --- Detalhe do teste ---------------------------------------------------
// A partir daqui, tudo e derivado do que ja existe em TesteHistorico
// (status/pontuacao/tipo/data/fatores) -- nao adicionamos nenhum campo novo
// "inventado" por registro, pra nao ter que digitar a mao dezenas de valores
// para cada um dos testes ja cadastrados.

// O campo `fatores` de um teste guarda nomes mesmo quando o status e baixo
// (resquicio do dado bruto) -- a UI em outros lugares (ex.: dialog de
// TestHistoryTable) ja trata baixo risco como "sem fator em atencao", entao
// repetimos a mesma regra aqui pra manter consistencia.
export function fatoresDoTeste(teste: TesteHistorico): string[] {
  if (teste.status === "baixo") return [];
  return teste.fatores.split(", ");
}

// Autorizacao tem 3 estados (nao so autorizado/nao-autorizado): alto risco
// bloqueia de vez, medio risco fica pendente de decisao do gestor (nao e
// autorizado automaticamente so por nao ser alto), baixo risco autoriza.
export function autorizacaoDoTeste(
  status: RiskLevel
): { label: string; autorizado: boolean; pendente: boolean } {
  if (status === "alto") return { label: "Não autorizado", autorizado: false, pendente: false };
  if (status === "medio") return { label: "Aguardando", autorizado: false, pendente: true };
  return { label: "Autorizado", autorizado: true, pendente: false };
}

export function recomendacaoDoTeste(teste: TesteHistorico): string {
  if (teste.status === "baixo") {
    return "Nenhuma ação necessária no momento. Manter acompanhamento de rotina.";
  }
  const principal = fatoresDoTeste(teste)[0]?.toLowerCase() ?? "fatores em atenção";
  if (teste.status === "alto") {
    return `Encaminhamento prioritário ao RH/DT para avaliação de ${principal}, com suspensão condicional da atividade até nova avaliação.`;
  }
  return `Acompanhamento próximo recomendado devido a ${principal}. Reavaliar antes do próximo ciclo.`;
}

// EEA e diario -> proxima reavaliacao no dia seguinte; DT e mensal (ver
// serieDt/comentarios acima) -> proxima reavaliacao em 30 dias.
export function proximaReavaliacaoDoTeste(teste: TesteHistorico): string {
  const data = parseDataBr(teste.data);
  data.setDate(data.getDate() + (teste.tipo === "EEA" ? 1 : 30));
  return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}/${data.getFullYear()}`;
}

// Nota por fator especifica deste teste (0-75): fatores marcados como em
// atencao partem de uma fracao alta da pontuacao geral do teste (decrescente
// por ordem de citacao); os demais recebem uma nota baixa proporcional, so
// para preencher a visao "resultados completos" sem inventar 10 valores por
// teste a mao.
export function resultadosCompletosDoTeste(
  teste: TesteHistorico
): { nome: string; nota: number; critico: boolean }[] {
  const criticos = fatoresDoTeste(teste);
  return TODOS_FATORES.map((nome, i) => {
    const rankCritico = criticos.indexOf(nome);
    if (rankCritico >= 0) {
      const nota = Math.max(20, Math.min(75, Math.round(teste.pontuacao * 0.75) - rankCritico * 6));
      return { nome, nota, critico: true };
    }
    const nota = Math.max(5, Math.round(teste.pontuacao * 0.2) - (i % 4) * 2);
    return { nome, nota, critico: false };
  });
}

const PERGUNTAS_CANDIDATAS = [
  "Você se sentiu descansado ao acordar hoje?",
  "Teve dificuldade para se concentrar durante o turno?",
  "Sentiu irritação ou impaciência no trânsito?",
  "Teve pensamentos recorrentes sobre problemas pessoais durante a condução?",
];

const MOTIVOS_CANDIDATOS = [
  "Motorista não compreendeu a pergunta após explicação.",
  "Pergunta pulada por tempo esgotado durante a aplicação.",
  "Motorista se recusou a responder esta pergunta.",
  "Falha técnica interrompeu a exibição da pergunta.",
];

function hashString(valor: string): number {
  let hash = 0;
  for (const ch of valor) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash;
}

export type PerguntaPulada = { fator: string; pergunta: string; motivo: string };

// So testes baixo risco nao pulam nenhuma pergunta; medio pula 1, alto pula 2
// -- cada pergunta pulada fica associada a um dos fatores em atencao do
// proprio teste (fatoresDoTeste nunca fica vazio quando chegamos aqui, ja
// que so entramos neste branch para medio/alto). Indices deterministicos a
// partir do id do teste, sem repetir sempre as mesmas perguntas/motivos.
export function perguntasPuladasDoTeste(teste: TesteHistorico): PerguntaPulada[] {
  if (teste.status === "baixo") return [];
  const quantidade = teste.status === "alto" ? 2 : 1;
  const inicio = hashString(teste.id) % PERGUNTAS_CANDIDATAS.length;
  const criticos = fatoresDoTeste(teste);
  return Array.from({ length: quantidade }, (_, i) => ({
    fator: criticos[i % criticos.length],
    pergunta: PERGUNTAS_CANDIDATAS[(inicio + i) % PERGUNTAS_CANDIDATAS.length],
    motivo: MOTIVOS_CANDIDATOS[(inicio + i) % MOTIVOS_CANDIDATOS.length],
  }));
}

// Duracao do teste: como hora do teste, nao existe no dado bruto -- deriva
// um valor plausivel (5-24 min) e estavel a partir do id composto.
export function duracaoDoTeste(colaboradorId: string, testeId: string): number {
  const hash = hashString(`${colaboradorId}-${testeId}-duracao`);
  return 5 + (hash % 20);
}

// Texto generico de recomendacao por fator (usado no accordion "Resultados
// do teste"), no mesmo espirito de recomendacaoDoTeste mas focado num unico
// fator especifico em vez do teste inteiro.
export function descricaoRiscoFator(nome: string, risco: RiskLevel): string {
  if (risco === "alto") {
    return `Os resultados do teste indicam alto risco em ${nome}. Por segurança, não recomendamos que dirija no momento. É fundamental buscar descanso e, se necessário, apoio médico ou psicológico antes de retornar à atividade.`;
  }
  if (risco === "medio") {
    return `O teste identificou risco médio em ${nome}. Recomendamos cautela adicional e atenção ao bem-estar antes de novas atividades.`;
  }
  return `Os resultados do teste indicam baixo risco em ${nome}. Recomendamos manter os bons hábitos de descanso e atenção ao bem-estar físico e emocional.`;
}

// Tempo de casa a partir da data de admissao, ate a mesma data "hoje"
// simulada usada no resto do app (DATA_FINAL_SERIE_EEA).
export function tempoNaEmpresa(dataAdmissao: string, hoje: Date = DATA_FINAL_SERIE_EEA): string {
  const admissao = parseDataBr(dataAdmissao);
  let meses = (hoje.getFullYear() - admissao.getFullYear()) * 12 + (hoje.getMonth() - admissao.getMonth());
  if (hoje.getDate() < admissao.getDate()) meses -= 1;
  const anos = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  const partes: string[] = [];
  if (anos > 0) partes.push(`${anos} ano${anos === 1 ? "" : "s"}`);
  if (mesesRestantes > 0 || anos === 0) partes.push(`${mesesRestantes} ${mesesRestantes === 1 ? "mês" : "meses"}`);
  return partes.join(" e ");
}

// Horario do teste: nao faz parte do dado bruto (so a data), entao derivamos
// um horario comercial plausivel e estavel a partir do id composto
// colaborador+teste (sem precisar digitar 35 horarios a mao).
export function horaDoTeste(colaboradorId: string, testeId: string): string {
  const hash = hashString(`${colaboradorId}-${testeId}`);
  const hora = 7 + (hash % 12);
  const minuto = (hash >>> 3) % 60;
  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}
