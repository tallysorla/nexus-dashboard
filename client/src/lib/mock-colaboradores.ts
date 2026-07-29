export type RiskLevel = "alto" | "medio" | "baixo";

export type Tendencia = "subindo" | "estavel" | "descendo";

export type TipoTeste = "EEA" | "DT";

export type TipoJornada = "Diurna" | "Noturna";

// EEA e DT sao dois testes independentes, mas cada um avalia os MESMOS 10
// fatores psicossociais -- nao ha fatores exclusivos de um teste ou de
// outro. Por isso cada fator carrega duas notas, em escalas diferentes:
// notaEea (0-100, escala real do EEA) e notaDt (0-750, escala real do DT).
// Nas duas, quanto MAIOR a nota, PIOR o risco. O toggle EEA/DT na tela so
// troca QUAL nota e exibida, nunca esconde fatores.
// variacaoPercentual = sinal indica a direcao real da mudanca na nota bruta:
// positivo = a nota subiu (piorou), negativo = a nota caiu (melhorou).
// tendencia e status sao sempre derivados dela, nunca digitados a mao.
export type Fator = {
  rank: number;
  nome: string;
  notaEea: number;
  notaDt: number;
  variacaoPercentual: number;
};

export function tendenciaDoFator(variacaoPercentual: number): Tendencia {
  if (variacaoPercentual >= 3) return "subindo";
  if (variacaoPercentual <= -3) return "descendo";
  return "estavel";
}

// A nota bruta subindo agora significa PIORA (quanto maior, pior o risco) --
// "subindo" mapeia pra "Piorando", nao "Melhorando".
export function statusDoFator(tendencia: Tendencia): string {
  if (tendencia === "subindo") return "Piorando";
  if (tendencia === "descendo") return "Melhorando";
  return "Estável";
}

// Sem sinal de +/- -- "+12%" lia como algo negativo mesmo quando a tendencia
// e "Melhorando" (usuarios confundiram). O badge de status e a cor do valor ja
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
  tipoJornada: TipoJornada;
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

// EEA (0-100) e DT (0-750) sao escalas reais e diferentes -- quanto MAIOR a
// pontuacao, MAIOR o risco (o oposto de uma escala normalizada 0-10 onde
// maior seria mais seguro). Os limiares de cada funcao sao proporcionais
// (70%/40% do teto da escala), entao as duas classificam de forma
// equivalente apesar dos numeros absolutos diferentes.
export function classificarRiscoEea(pontuacao: number): RiskLevel {
  if (pontuacao >= 70) return "alto";
  if (pontuacao >= 40) return "medio";
  return "baixo";
}

export function classificarRiscoDt(pontuacao: number): RiskLevel {
  if (pontuacao >= 525) return "alto";
  if (pontuacao >= 300) return "medio";
  return "baixo";
}

// Dispatcher pra quando so se tem uma nota generica (ex.: nota de um fator,
// vinda de resultadosCompletosDoTeste) e o TipoTeste que a originou, sem
// saber de antemao qual das duas escalas usar.
export function classificarRiscoPorTipo(pontuacao: number, tipo: TipoTeste): RiskLevel {
  return tipo === "EEA" ? classificarRiscoEea(pontuacao) : classificarRiscoDt(pontuacao);
}

// Ordena os 10 fatores do mais critico pro menos critico, com base na nota
// do tipo de teste ativo (EEA ou DT) -- quanto MAIOR a nota, maior o risco.
// Em caso de empate na CLASSIFICACAO de risco (Alto/Medio/Baixo) entre dois
// ou mais fatores, eles sao ordenados entre si em ordem alfabetica (criterio
// de aceite explicito), independente da diferenca fina na nota numerica.
// Reatribui `rank` 1..10 pela posicao final, ja que o rank deixa de ser um
// valor fixo do mock e passa a ser sempre derivado desta ordenacao.
const ORDEM_RISCO: Record<RiskLevel, number> = { alto: 0, medio: 1, baixo: 2 };

export function ordenarFatoresPorRisco(fatores: Fator[], tipo: TipoTeste): Fator[] {
  const nota = (f: Fator) => (tipo === "EEA" ? f.notaEea : f.notaDt);
  return [...fatores]
    .sort((a, b) => {
      const riscoA = classificarRiscoPorTipo(nota(a), tipo);
      const riscoB = classificarRiscoPorTipo(nota(b), tipo);
      if (riscoA !== riscoB) return ORDEM_RISCO[riscoA] - ORDEM_RISCO[riscoB];
      return a.nome.localeCompare(b.nome, "pt-BR");
    })
    .map((f, i) => ({ ...f, rank: i + 1 }));
}

// EEA e feito todo dia pelo colaborador -> um ponto por dia dos ultimos 90
// dias, terminando exatamente no valor atual (colaborador.eea) para nao
// destoar do KPI "EEA atual" mostrado no topo da tela. Escala 0-100, quanto
// maior pior -- valorInicial comeca mais alto (pior) que valorAtual e
// converge pra ele, descrevendo uma melhora ao longo dos 90 dias.
const DIAS_SERIE_EEA = 90;
const DATA_FINAL_SERIE_EEA = new Date(2026, 6, 6);

function serieEea(valorAtual: number): PontoEea[] {
  const valorInicial = Math.min(95, valorAtual + 20);

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

// Variante de serieEea com oscilacao ampla o bastante pra cruzar as 3 faixas
// de risco (baixo/medio/alto) em dias diferentes dentro do mesmo grafico --
// serieEea() normal costuma ficar dentro de 1-2 faixas so, o que nao serve
// pra demonstrar o tooltip trocando de classificacao. Termina exatamente no
// valor atual no ultimo dia, igual a serieEea(), pra nao destoar do KPI.
function serieEeaVariada(valorAtual: number): PontoEea[] {
  const CENTRO = 50;
  const AMPLITUDE = 42; // alcanca perto de 8 (baixo) e 92 (alto)
  const PERIODO_DIAS = 17;

  return Array.from({ length: DIAS_SERIE_EEA }, (_, i) => {
    const dia = new Date(DATA_FINAL_SERIE_EEA);
    dia.setDate(dia.getDate() - (DIAS_SERIE_EEA - 1 - i));
    const date = `${String(dia.getDate()).padStart(2, "0")}/${String(dia.getMonth() + 1).padStart(2, "0")}`;

    const ehUltimoDia = i === DIAS_SERIE_EEA - 1;
    const onda = Math.sin((i / PERIODO_DIAS) * 2 * Math.PI) * AMPLITUDE;
    const eea = ehUltimoDia ? valorAtual : Math.max(3, Math.min(97, CENTRO + onda));

    return { date, eea: Math.round(eea) };
  });
}

// DT e feito raramente (cerca de uma vez por mes ou durante uma tratativa) ->
// 12 pontos mensais (para permitir o filtro de 3/6/12 meses), terminando
// exatamente no valor atual (colaborador.dt) para nao destoar do KPI "DT
// atual" mostrado no topo da tela. Escala 0-750, quanto maior pior.
const MESES_SERIE_DT = 12;
const DATA_FINAL_SERIE_DT = new Date(2026, 6, 6);

// pontosTratativa: indices (0 = ponto mais antigo, MESES_SERIE_DT - 1 = mais
// recente) que correspondem a um DT antecipado como tratativa, e nao ao ciclo
// mensal normal -- por exemplo, quando uma sequencia de EEA em alto risco leva
// o gestor a pedir um DT antes do previsto.
function serieDt(valorAtual: number, pontosTratativa: number[] = []): PontoDt[] {
  const valorInicial = Math.min(700, valorAtual + 260);

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

// Variante de serieDt com oscilacao bem mais ampla entre as 3 faixas de risco
// mes a mes (alto -> baixo -> medio, em ciclo) -- serieDt() normal faz um
// ramp suave que costuma ficar preso numa faixa so, o que nao demonstra bem o
// degrau "DT vigente" sobreposto no grafico de Evolucao do EEA nem a propria
// Evolucao do DT. Termina exatamente no valor atual no ultimo mes, igual a
// serieDt(), pra nao destoar do KPI.
function serieDtVariada(valorAtual: number): PontoDt[] {
  const CICLO = [600, 150, 400]; // alto, baixo, medio

  return Array.from({ length: MESES_SERIE_DT }, (_, i) => {
    const mes = new Date(DATA_FINAL_SERIE_DT);
    mes.setMonth(mes.getMonth() - (MESES_SERIE_DT - 1 - i));
    const date = `${String(mes.getDate()).padStart(2, "0")}/${String(mes.getMonth() + 1).padStart(2, "0")}`;

    const ehUltimoMes = i === MESES_SERIE_DT - 1;
    const dt = ehUltimoMes ? valorAtual : CICLO[i % CICLO.length];

    return { date, dt, origem: "mensal" as const };
  });
}

// Tendencia do EEA em relacao ao ultimo DT: o DT e o teste de referencia
// (mais profundo, feito com bem menos frequencia) -- os EEAs diarios feitos
// depois dele devem ser comparados contra esse baseline para indicar se o
// funcionario esta melhorando ou piorando desde a ultima avaliacao
// aprofundada, e nao contra a propria media historica do EEA. EEA (0-100) e
// DT (0-750) estao em escalas diferentes, entao a comparacao normaliza os
// dois pra fracao do proprio teto antes de calcular a variacao percentual.
// Como quanto maior = pior nas duas escalas, um resultado positivo significa
// que o EEA esta PIOR que a fracao de risco indicada pelo ultimo DT.
export function tendenciaEeaVsUltimoDt(eeaAtual: number, dtAtual: number): number {
  if (dtAtual === 0) return 0;
  const eeaFracao = eeaAtual / 100;
  const dtFracao = dtAtual / 750;
  if (dtFracao === 0) return 0;
  return Math.round(((eeaFracao - dtFracao) / dtFracao) * 100);
}

export function parseDataBr(data: string): Date {
  const [dia, mes, ano] = data.split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

// serieEea/serieDt guardam so "dd/mm" (sem ano) -- reconstroi o ano real mais
// proximo que nao seja posterior a hoje (DATA_FINAL_SERIE_EEA por padrao).
// Necessario pra series que cruzam a virada do ano, como os 12 meses de
// serieDt (que comecam ainda no ano anterior quando "hoje" e no meio do ano).
export function parseDataCurta(dataCurta: string, hoje: Date = DATA_FINAL_SERIE_EEA): Date {
  const [dia, mes] = dataCurta.split("/").map(Number);
  const candidato = new Date(hoje.getFullYear(), mes - 1, dia);
  return candidato.getTime() > hoje.getTime() ? new Date(hoje.getFullYear() - 1, mes - 1, dia) : candidato;
}

// Dias corridos entre uma data (DD/MM/AAAA) e a data "hoje" simulada usada
// no resto do app (DATA_FINAL_SERIE_EEA) -- ex.: "ha quantos dias foi o
// ultimo DT", pra dar ao gestor uma nocao de quao desatualizada esta a
// referencia usada na tendencia.
export function diasDesde(data: string): number {
  return Math.round((DATA_FINAL_SERIE_EEA.getTime() - parseDataBr(data).getTime()) / 86400000);
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

function gerarFatoresAdicionais(risco: RiskLevel, destaque: string[]): Fator[] {
  // Fatores fora do destaque tendem a ficar num nivel seguro (baixo/medio),
  // mesmo quando o colaborador em geral esta em risco alto -- baseNota e o
  // teto aproximado (0-100, quanto MAIOR pior) pra esses fatores.
  const baseNota = risco === "alto" ? 45 : risco === "medio" ? 35 : 25;
  return TODOS_FATORES.filter((nome) => !destaque.includes(nome)).map((nome, i) => {
    const variacaoPercentual = i % 3 === 0 ? -1 : i % 3 === 1 ? 2 + (i % 3) : -(3 + (i % 3));
    const notaEea = Math.max(5, baseNota - Math.floor(i / 2) * 4);
    // Pequena variacao deterministica entre as duas notas -- o DT e o teste
    // mais aprofundado, mas nao precisa bater exatamente com o EEA diario.
    // notaDt segue a mesma proporcao de notaEea na escala de 750 (x7.5).
    const notaDt = Math.max(0, Math.min(750, Math.round(notaEea * 7.5) + (i % 2 === 0 ? -15 : 15)));
    return {
      rank: 4 + i,
      nome,
      notaEea,
      notaDt,
      variacaoPercentual,
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
    tipoJornada: "Diurna",
    eea: 70,
    dt: 600,
    risco: "alto",
    totalTestesEea: 86,
    totalTestesDt: 7,
    fatoresDestaque: [
      { rank: 1, nome: "Inquietação", notaEea: 80, notaDt: 675, variacaoPercentual: -12 },
      { rank: 2, nome: "Cansaço", notaEea: 60, notaDt: 525, variacaoPercentual: -2 },
      { rank: 3, nome: "Insegurança", notaEea: 50, notaDt: 300, variacaoPercentual: 6 },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("alto", ["Inquietação", "Cansaço", "Insegurança"]),
    serieEea: serieEea(70),
    serieDt: serieDt(600, [MESES_SERIE_DT - 1]),
    historicoTestes: [
      { id: "t1", data: "03/07/2026", tipo: "DT", pontuacao: 600, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Inquietação, Cansaço, Preocupação excessiva" },
      { id: "t2", data: "26/06/2026", tipo: "EEA", pontuacao: 70, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Inquietação, Cansaço" },
      { id: "t3", data: "19/06/2026", tipo: "EEA", pontuacao: 60, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço, Preocupação excessiva" },
      { id: "t4", data: "12/06/2026", tipo: "EEA", pontuacao: 50, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Insegurança, Cansaço" },
      { id: "t5", data: "05/06/2026", tipo: "DT", pontuacao: 225, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t6", data: "29/05/2026", tipo: "EEA", pontuacao: 30, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t7", data: "22/05/2026", tipo: "EEA", pontuacao: 30, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
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
    tipoJornada: "Diurna",
    // EEA (diario) subiu pra alto risco enquanto o ultimo DT (mensal, mais
    // aprofundado) ainda registra medio -- cenario "em elevacao" no insight
    // da Evolucao do EEA (ver EeaChartSection), pra ter variedade entre os
    // colaboradores nesse card (nem todos "mantido").
    eea: 80,
    dt: 450,
    risco: "alto",
    totalTestesEea: 102,
    totalTestesDt: 5,
    fatoresDestaque: [
      { rank: 1, nome: "Preocupação excessiva", notaEea: 80, notaDt: 375, variacaoPercentual: -8 },
      { rank: 2, nome: "Cansaço", notaEea: 60, notaDt: 375, variacaoPercentual: -1 },
      { rank: 3, nome: "Insegurança", notaEea: 40, notaDt: 225, variacaoPercentual: 3 },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("alto", ["Preocupação excessiva", "Cansaço", "Insegurança"]),
    // serieEeaVariada/serieDtVariada (nao as versoes padrao) -- exemplos com
    // oscilacao ampla o bastante pra cruzar as 3 faixas de risco (EEA por
    // dia, DT por mes), pra verificar o tooltip e o degrau "DT vigente"
    // trocando de classificacao (Baixo/Medio/Alto risco) em vez de ficar
    // sempre no mesmo nivel.
    serieEea: serieEeaVariada(80),
    serieDt: serieDtVariada(450),
    historicoTestes: [
      { id: "t1", data: "01/07/2026", tipo: "DT", pontuacao: 450, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Preocupação excessiva, Qualidade do sono" },
      { id: "t2", data: "24/06/2026", tipo: "EEA", pontuacao: 80, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Preocupação excessiva, Cansaço" },
      { id: "t3", data: "17/06/2026", tipo: "EEA", pontuacao: 30, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t4", data: "10/06/2026", tipo: "EEA", pontuacao: 30, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t5", data: "03/06/2026", tipo: "DT", pontuacao: 150, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t6", data: "27/05/2026", tipo: "EEA", pontuacao: 20, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t7", data: "20/05/2026", tipo: "EEA", pontuacao: 20, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
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
    tipoJornada: "Diurna",
    // EEA (diario) caiu pra medio enquanto o ultimo DT (mensal) ainda registra
    // alto -- cenario "em reducao" no insight da Evolucao do EEA (ver
    // EeaChartSection), pra ter variedade entre os colaboradores nesse card
    // (nem todos "mantido"). `risco` continua "alto" pra nao subestimar o
    // rollup de risco da filial enquanto o DT (teste mais aprofundado) nao
    // reavaliar.
    eea: 50,
    dt: 675,
    risco: "alto",
    totalTestesEea: 74,
    totalTestesDt: 8,
    fatoresDestaque: [
      { rank: 1, nome: "Raiva ou irritabilidade", notaEea: 60, notaDt: 675, variacaoPercentual: -18 },
      { rank: 2, nome: "Preocupação excessiva", notaEea: 40, notaDt: 525, variacaoPercentual: -2 },
      { rank: 3, nome: "Cansaço", notaEea: 30, notaDt: 450, variacaoPercentual: -2 },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("alto", ["Raiva ou irritabilidade", "Preocupação excessiva", "Cansaço"]),
    serieEea: serieEea(50),
    serieDt: serieDt(675, [MESES_SERIE_DT - 1]),
    historicoTestes: [
      { id: "t1", data: "05/07/2026", tipo: "DT", pontuacao: 675, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Perda de foco, Raiva ou irritabilidade" },
      { id: "t2", data: "28/06/2026", tipo: "EEA", pontuacao: 50, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Raiva ou irritabilidade" },
      { id: "t3", data: "21/06/2026", tipo: "EEA", pontuacao: 80, classificacao: RISCO_LABEL.alto, status: "alto", fatores: "Raiva ou irritabilidade" },
      { id: "t4", data: "14/06/2026", tipo: "EEA", pontuacao: 60, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Preocupação excessiva" },
      { id: "t5", data: "07/06/2026", tipo: "DT", pontuacao: 450, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço" },
      { id: "t6", data: "31/05/2026", tipo: "EEA", pontuacao: 50, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Raiva ou irritabilidade" },
      { id: "t7", data: "24/05/2026", tipo: "EEA", pontuacao: 50, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço" },
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
    tipoJornada: "Noturna",
    eea: 30,
    dt: 150,
    risco: "baixo",
    totalTestesEea: 95,
    totalTestesDt: 4,
    fatoresDestaque: [
      { rank: 1, nome: "Cansaço", notaEea: 30, notaDt: 225, variacaoPercentual: -2 },
      { rank: 2, nome: "Insegurança", notaEea: 20, notaDt: 150, variacaoPercentual: 4 },
      { rank: 3, nome: "Qualidade do sono", notaEea: 10, notaDt: 75, variacaoPercentual: 5 },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("baixo", ["Cansaço", "Insegurança", "Qualidade do sono"]),
    serieEea: serieEea(30),
    serieDt: serieDt(150),
    historicoTestes: [
      { id: "t1", data: "02/07/2026", tipo: "EEA", pontuacao: 30, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t2", data: "25/06/2026", tipo: "EEA", pontuacao: 30, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t3", data: "18/06/2026", tipo: "EEA", pontuacao: 20, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t4", data: "11/06/2026", tipo: "DT", pontuacao: 150, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Qualidade do sono" },
      { id: "t5", data: "04/06/2026", tipo: "EEA", pontuacao: 20, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t6", data: "28/05/2026", tipo: "DT", pontuacao: 150, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t7", data: "21/05/2026", tipo: "EEA", pontuacao: 20, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Qualidade do sono" },
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
    tipoJornada: "Diurna",
    eea: 60,
    dt: 450,
    risco: "medio",
    totalTestesEea: 68,
    totalTestesDt: 6,
    fatoresDestaque: [
      { rank: 1, nome: "Cansaço", notaEea: 70, notaDt: 450, variacaoPercentual: -9 },
      { rank: 2, nome: "Cansaço mental", notaEea: 50, notaDt: 375, variacaoPercentual: -2 },
      { rank: 3, nome: "Insegurança", notaEea: 30, notaDt: 300, variacaoPercentual: -1 },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("medio", ["Cansaço", "Cansaço mental", "Insegurança"]),
    serieEea: serieEea(60),
    serieDt: serieDt(450),
    historicoTestes: [
      { id: "t1", data: "04/07/2026", tipo: "EEA", pontuacao: 60, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço, Cansaço mental" },
      { id: "t2", data: "27/06/2026", tipo: "DT", pontuacao: 450, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço mental, Desmotivação" },
      { id: "t3", data: "20/06/2026", tipo: "EEA", pontuacao: 60, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Cansaço mental" },
      { id: "t4", data: "13/06/2026", tipo: "EEA", pontuacao: 40, classificacao: RISCO_LABEL.medio, status: "medio", fatores: "Insegurança" },
      { id: "t5", data: "06/06/2026", tipo: "DT", pontuacao: 225, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço" },
      { id: "t6", data: "30/05/2026", tipo: "EEA", pontuacao: 30, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Insegurança" },
      { id: "t7", data: "23/05/2026", tipo: "EEA", pontuacao: 30, classificacao: RISCO_LABEL.baixo, status: "baixo", fatores: "Cansaço mental" },
    ],
    historicoTratativas: [],
  },
  {
    // Funcionario recem-admitido: ainda nao fez nenhum teste, nem EEA
    // (diario) nem DT (periodico) -- cenario real de blank state completo
    // (KPIs, fatores, graficos e listagem), nao so o card de Tendencia.
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
    tipoJornada: "Diurna",
    eea: 0,
    dt: 0,
    risco: "baixo",
    totalTestesEea: 0,
    totalTestesDt: 0,
    fatoresDestaque: [
      { rank: 1, nome: "Insegurança", notaEea: 20, notaDt: 150, variacaoPercentual: -2 },
      { rank: 2, nome: "Cansaço", notaEea: 20, notaDt: 150, variacaoPercentual: 1 },
      { rank: 3, nome: "Perda de foco", notaEea: 10, notaDt: 75, variacaoPercentual: -1 },
    ],
    fatoresAdicionais: gerarFatoresAdicionais("baixo", ["Insegurança", "Cansaço", "Perda de foco"]),
    serieEea: [],
    serieDt: [],
    historicoTestes: [],
    historicoTratativas: [],
  },
];

// Cargos distintos ja usados pelos colaboradores reais -- reaproveitado como
// opcoes do select de Cargo em "Dados pessoais" (FuncionarioDetailsDialog),
// sem inventar um catalogo de cargos separado.
export const CARGOS_DISPONIVEIS = Array.from(new Set(colaboradores.map((c) => c.cargo)));

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

// Nota por fator especifica deste teste, na MESMA escala do teste que a
// originou (0-100 pro EEA, 0-750 pro DT; quanto maior, pior): fatores
// marcados como em atencao ficam proximos da pontuacao geral do teste (o
// primeiro citado e o mais critico, entao recebe a nota mais alta), os
// demais recebem uma nota baixa/segura proporcional, so pra preencher a
// visao "resultados completos" sem inventar 10 valores por teste a mao.
export function resultadosCompletosDoTeste(
  teste: TesteHistorico
): { nome: string; nota: number; critico: boolean }[] {
  const criticos = fatoresDoTeste(teste);
  const maxEscala = teste.tipo === "EEA" ? 100 : 750;
  return TODOS_FATORES.map((nome, i) => {
    const rankCritico = criticos.indexOf(nome);
    if (rankCritico >= 0) {
      const nota = Math.max(
        Math.round(maxEscala * 0.5),
        Math.min(Math.round(maxEscala * 0.95), teste.pontuacao - rankCritico * Math.round(maxEscala * 0.05))
      );
      return { nome, nota, critico: true };
    }
    const nota = Math.max(
      Math.round(maxEscala * 0.05),
      Math.round(maxEscala * 0.15) - (i % 4) * Math.round(maxEscala * 0.02)
    );
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
// fator especifico em vez do teste inteiro. Nao repete o nome do fator nem o
// nivel de risco no texto -- o cabecalho do accordion e o badge "Medio
// risco"/"Alto risco" logo acima ja mostram isso, entao aqui so a orientacao
// pratica importa.
export function descricaoRiscoFator(risco: RiskLevel): string {
  if (risco === "alto") {
    return "Por segurança, não recomendamos que dirija no momento. É fundamental buscar descanso e, se necessário, apoio médico ou psicológico antes de retornar à atividade.";
  }
  if (risco === "medio") {
    return "Recomendamos cautela adicional e atenção ao bem-estar antes de novas atividades.";
  }
  return "Recomendamos manter os bons hábitos de descanso e atenção ao bem-estar físico e emocional.";
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
