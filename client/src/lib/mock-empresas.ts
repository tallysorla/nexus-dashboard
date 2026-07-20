import { colaboradores, parseDataBr, type Colaborador, type RiskLevel } from "./mock-colaboradores";

export type StatusEmpresa = "ativo" | "inativo";

export type Filial = {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
};

export type Empresa = {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  status: StatusEmpresa;
  filiais: Filial[];
};

export type PerfilAcesso = "Admin Empresa" | "Admin Filial" | "Gestor" | "Avaliador";

export type StatusConvite = "ativo" | "pendente";

export type Usuario = {
  id: string;
  empresaId: string;
  nome: string;
  perfil: PerfilAcesso;
  escopo: string;
  filialId: string | null;
  email: string;
  cpf: string;
  ultimoAcesso: string;
  statusConvite: StatusConvite;
};

export type NivelCombinacao = "ESPECIAL" | "CRÍTICO" | "ALTA";

export type CombinacaoCriticaDef = {
  id: string;
  nivel: NivelCombinacao;
  nome: string;
  fatores: string[];
  vulnerabilidade: string;
  focoDT: string;
  protocolo: string;
};

export type StatusCaso = "sem_tratativa" | "em_tratativa";

export type CombinacaoCriticaCaso = {
  id: string;
  empresaId: string;
  filialId: string;
  colaboradorId: string;
  combinacaoId: string;
  status: StatusCaso;
  // Data do DT que confirmou a combinacao (as 9 combinacoes sao apuradas a
  // partir do DT, nao do EEA -- ver focoDT em CombinacaoCriticaDef).
  detectadoEm: string;
};

// Mesma data simulada de "hoje" usada em mock-colaboradores.ts
// (DATA_FINAL_SERIE_EEA), para os calculos de "ha quantos dias" ficarem
// consistentes com o resto do app.
const HOJE_SIMULADO = new Date(2026, 6, 6);

export const SLA_DIAS_TRATATIVA = 3;

export function diasDesde(dataBr: string, hoje: Date = HOJE_SIMULADO): number {
  return Math.round((hoje.getTime() - parseDataBr(dataBr).getTime()) / 86_400_000);
}

// Empresa "cheia": Transportadora Andrade reaproveita os 5 colaboradores reais
// ja existentes. As filiais vem diretamente dos valores `local` que ja
// estavam no dado do colaborador -- nao inventamos uma hierarquia paralela.
export const ANDRADE_ID = "andrade";

export const FILIAL_MATRIZ_SP = "matriz-sp";
export const FILIAL_CAMPINAS = "filial-campinas";
export const FILIAL_GUARULHOS = "filial-guarulhos";

const andradeFiliais: Filial[] = [
  { id: FILIAL_MATRIZ_SP, nome: "Matriz", cidade: "São Paulo", estado: "SP" },
  { id: FILIAL_CAMPINAS, nome: "Filial Campinas", cidade: "Campinas", estado: "SP" },
  { id: FILIAL_GUARULHOS, nome: "Filial Guarulhos", cidade: "Guarulhos", estado: "SP" },
];

// Mapeia o campo `local` (ja existente em cada colaborador) para o id da
// filial acima, para nao duplicar a fonte de verdade de "quem esta em qual
// filial".
const LOCAL_PARA_FILIAL: Record<string, string> = {
  "Matriz SP": FILIAL_MATRIZ_SP,
  "Filial Campinas": FILIAL_CAMPINAS,
  "Filial Guarulhos": FILIAL_GUARULHOS,
};

export function filialIdDoColaborador(colaborador: Colaborador): string | undefined {
  return LOCAL_PARA_FILIAL[colaborador.local];
}

export function colaboradoresDaEmpresa(empresaId: string): Colaborador[] {
  return empresaId === ANDRADE_ID ? colaboradores : [];
}

export function colaboradoresDaFilial(filialId: string): Colaborador[] {
  return colaboradores.filter((c) => filialIdDoColaborador(c) === filialId);
}

export function testesRealizados(lista: Colaborador[]): number {
  return lista.reduce((soma, c) => soma + c.totalTestesEea + c.totalTestesDt, 0);
}

// Risco agregado da filial: alto se houver ao menos 1 colaborador em alto
// risco; medio se houver 2+ em medio risco; senao baixo. Espelha a mesma
// logica "o ponto mais critico define o nivel" ja usada em outras partes do
// produto (ver Regras de Negocio: score do colaborador = menor nota entre
// dimensoes).
export function riscoDaFilial(filialId: string): RiskLevel {
  const equipe = colaboradoresDaFilial(filialId);
  if (equipe.some((c) => c.risco === "alto")) return "alto";
  if (equipe.filter((c) => c.risco === "medio").length >= 2) return "medio";
  if (equipe.some((c) => c.risco === "medio")) return "medio";
  return "baixo";
}

export const empresas: Empresa[] = [
  {
    id: ANDRADE_ID,
    nome: "Transportadora Andrade",
    cnpj: "12.345.678/0001-90",
    endereco: "Av. das Nações, 1200",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
    filiais: andradeFiliais,
  },
  {
    id: "logistica-sul",
    nome: "Logística Sul Transportes",
    cnpj: "98.765.432/0001-21",
    endereco: "Rua do Porto, 88",
    cidade: "Porto Alegre",
    estado: "RS",
    status: "ativo",
    filiais: [{ id: "logistica-sul-matriz", nome: "Matriz", cidade: "Porto Alegre", estado: "RS" }],
  },
  {
    id: "frota-nordeste",
    nome: "Frota Nordeste Cargas",
    cnpj: "45.678.123/0001-55",
    endereco: "Av. Boa Viagem, 400",
    cidade: "Recife",
    estado: "PE",
    status: "ativo",
    filiais: [{ id: "frota-nordeste-matriz", nome: "Matriz", cidade: "Recife", estado: "PE" }],
  },
  {
    id: "rodoviario-brasil",
    nome: "Rodoviário Brasil",
    cnpj: "33.221.144/0001-08",
    endereco: "Rod. Anhanguera, km 90",
    cidade: "Campinas",
    estado: "SP",
    status: "inativo",
    filiais: [{ id: "rodoviario-brasil-matriz", nome: "Matriz", cidade: "Campinas", estado: "SP" }],
  },
  {
    id: "empresa-demonstracao",
    nome: "Empresa Demonstração",
    cnpj: "64.433.876/0001-04",
    endereco: "Rua Parazinho, 3",
    cidade: "São Paulo",
    estado: "SP",
    status: "ativo",
    filiais: [],
  },
];

export function getEmpresaById(id: string): Empresa | undefined {
  return empresas.find((e) => e.id === id);
}

export function getFilialById(empresa: Empresa, filialId: string): Filial | undefined {
  return empresa.filiais.find((f) => f.id === filialId);
}

// As 9 combinacoes de risco psicossocial que acionam encaminhamento ao DT.
// Conteudo de referencia (nome/fatores/vulnerabilidade/foco/protocolo)
// preservado conforme definido no protocolo original de direcionamento.
export const COMBINACOES_CRITICAS: CombinacaoCriticaDef[] = [
  {
    id: "CC1",
    nivel: "CRÍTICO",
    nome: "A Combinação do Microsono",
    fatores: ["Qualidade do sono", "Cansaço mental"],
    vulnerabilidade:
      "A privação de sono compromete os mecanismos de vigilância cortical, enquanto o cansaço mental elimina os estímulos cognitivos que manteriam o motorista alerta. Resultado: microsono involuntário — episódios de 3 a 15 segundos de perda de consciência imperceptíveis ao próprio motorista. A 90 km/h, 5 segundos equivalem a 125 metros percorridos sem controle.",
    focoDT:
      "Identificar o fator raiz da perda de qualidade de sono (ansiedade, TEPT, sobrecarga) e mapear o grau de desengajamento cognitivo da tarefa de dirigir.",
    protocolo: "Suspensão imediata da operação até conclusão do DT.",
  },
  {
    id: "CC2",
    nivel: "CRÍTICO",
    nome: "A Combinação do Colapso Psicomotor",
    fatores: ["Qualidade do sono", "Cansaço"],
    vulnerabilidade:
      "Ambos os fatores causam lentidão psicomotora — redução do tempo de reação e processamento lento de estímulos. Combinados, criam um estado de rebaixamento funcional que o próprio motorista não percebe, pois o cansaço profundo compromete a autoconsciência da deterioração. Há ainda risco latente de indiferença passiva à própria segurança.",
    focoDT:
      "Diferenciar cansaço reativo (situacional) de padrão mais profundo; verificar presença de pensamentos de risco que exijam acompanhamento clínico.",
    protocolo: "Suspensão imediata. DT + encaminhamento clínico se Cansaço também estiver alto.",
  },
  {
    id: "CC3",
    nivel: "CRÍTICO",
    nome: "A Combinação da Hipervigilância Paralisante",
    fatores: ["Cicatrizes Invisíveis", "Inquietação"],
    vulnerabilidade:
      "Este fator cria um sistema em modo permanente de ameaça. A Inquietação amplifica isso com tendências a maximizar problemas. O efeito no volante é duplo e contraditório: reação exagerada e abrupta a estímulos inesperados (freada brusca, bloqueios...) ou congelamento decisório em situações de emergência. Risco elevado de crises dissociativas ao volante em rotas similares ao contexto do trauma.",
    focoDT:
      "Mapear se o trauma tem relação com acidentes de trânsito anteriores. Nesse caso, a reexposição à tarefa de dirigir funciona como gatilho contínuo.",
    protocolo: "Suspensão imediata. Encaminhamento a psicólogo antes de qualquer decisão de retorno.",
  },
  {
    id: "CC4",
    nivel: "CRÍTICO",
    nome: "A Combinação da Indiferença ao Risco",
    fatores: ["Cansaço", "Desmotivação"],
    vulnerabilidade:
      "Isolados, cansaço e desmotivação são fatores sérios. Combinados, produzem algo mais crítico: o motorista perde a referência de valor da própria preservação. Não é impulsividade — é ausência de motivação para se proteger. Maior correlação com colisões por ausência de esquiva (não desviar de obstáculo, não frear com antecedência suficiente).",
    focoDT:
      "Identificar presença de ideação passiva de risco e nível de desligamento do propósito profissional e familiar — âncoras que influenciam diretamente o protocolo de suporte.",
    protocolo: "Suspensão imediata. DT + avaliação clínica obrigatória antes de retorno.",
  },
  {
    id: "CC5",
    nivel: "ALTA",
    nome: "A Combinação da Condução Agressiva",
    fatores: ["Perda de foco", "Raiva ou irritabilidade"],
    vulnerabilidade:
      "A perda de foco crônica rebaixa o limiar de tolerância à frustração. A raiva transforma isso em comportamento: ultrapassagens de risco, reações a outros motoristas, decisões impulsivas. O mecanismo é uma resposta emocional irresponsável pelo risco envolvido. Este motorista pode decidir com 0,3s quando a situação exige algo próximo ou acima de 1,5s.",
    focoDT:
      "Mapear a origem da perda de foco (ocupacional, financeiro, familiar) e da raiva (crônica vs. reativa) para direcionar intervenções específicas.",
    protocolo: "Encaminhamento imediato ao DT. Operação condicional com monitoramento.",
  },
  {
    id: "CC6",
    nivel: "ALTA",
    nome: "A Combinação da Impulsividade Amplificada",
    fatores: ["Qualidade do sono", "Raiva ou irritabilidade"],
    vulnerabilidade:
      "A privação de sono reduz diretamente a capacidade de análise e síntese, portanto de tomada de decisão e reações diante de situações inusitadas. Combinada com alta irritabilidade, o resultado é um motorista que reage antes de processar, interpreta ambiguidades como ameaças e tem respostas de magnitude desproporcional. 24h de privação de sono produzem desempenho equivalente a 0,10% de álcool no sangue — o dobro do permitido por lei.",
    focoDT:
      "A insônia pode ser consequência direta da raiva não processada. O DT desvela essa relação causal e orienta a sequência de intervenção.",
    protocolo: "Encaminhamento imediato ao DT. Operação condicional.",
  },
  {
    id: "CC7",
    nivel: "ALTA",
    nome: "A Combinação do Burnout Operacional",
    fatores: ["Preocupação excessiva", "Qualidade do sono"],
    vulnerabilidade:
      "A preocupação excessiva somada à privação de sono faz com que o organismo entre em falência de recursos adaptativos — o motorista não consegue mais compensar um fator com o outro. A fadiga emocional afeta diretamente a capacidade de sustentação da atenção por longos períodos, que é exatamente a demanda central da condução profissional.",
    focoDT:
      "Identificar o estágio do burnout (exaustão inicial, colapso funcional ou despersonalização) — os protocolos de retorno são completamente diferentes em cada fase.",
    protocolo: "Encaminhamento imediato ao DT. Avaliação de carga de trabalho antes de retorno.",
  },
  {
    id: "CC8",
    nivel: "ALTA",
    nome: "A Combinação do Piloto Automático Permanente",
    fatores: ["Cansaço mental", "Desmotivação"],
    vulnerabilidade:
      "Cansaço mental e desmotivação criam desengajamento duplo: o ambiente não estimula e o profissional não quer ser estimulado. Resultado: condução em modo absolutamente automático, sem presença executiva real na tarefa. Episódios de quilômetros fantasma (percorrer distâncias sem memória do trajeto) são característicos desta combinação.",
    focoDT:
      "Verificar se a desmotivação crônica se dá por cansaço profundo ou outra razão — o DT identifica a progressão e previne o agravamento.",
    protocolo: "Encaminhamento prioritário ao DT. Operação com monitoramento de rota.",
  },
  {
    id: "CC9",
    nivel: "ESPECIAL",
    nome: "Tríade de Vulnerabilidade Extrema",
    fatores: ["Qualidade do sono", "Cansaço", "Cicatrizes Invisíveis"],
    vulnerabilidade:
      "Quando estes três fatores coexistem em pontuação elevada, estamos diante de um sistema de alerta máximo: a perda de qualidade do sono alimenta as Cicatrizes Invisíveis (pesadelos, hipervigilância), as Cicatrizes Invisíveis alimentam o cansaço profundo (desesperança aprendida pós-trauma), e o cansaço aprofunda a perda de sono. Não se resolve com tempo ou descanso sem intervenção especializada.",
    focoDT:
      "Mapeamento completo de todos os 10 fatores com aplicação integral do DT. Prioridade absoluta para avaliação psicológica antes de qualquer decisão de retorno à operação.",
    protocolo: "Afastamento imediato obrigatório. Avaliação psicológica clínica. Retorno condicionado a laudo.",
  },
];

export function getCombinacaoCriticaById(id: string): CombinacaoCriticaDef | undefined {
  return COMBINACOES_CRITICAS.find((c) => c.id === id);
}

// Casos ativos ligados aos colaboradores reais: cada caso usa a combinacao
// cujos fatores melhor batem com os fatoresDestaque reais daquele
// colaborador, para nao inventar dado desconectado do que ja existe.
// Joao (baixo risco em todos os fatores) fica de fora de proposito.
export const combinacoesCasos: CombinacaoCriticaCaso[] = [
  {
    id: "caso-renata-cc5",
    empresaId: ANDRADE_ID,
    filialId: FILIAL_CAMPINAS,
    colaboradorId: "renata-alves",
    combinacaoId: "CC5",
    status: "sem_tratativa",
    detectadoEm: "05/07/2026",
  },
  {
    id: "caso-carlos-cc7",
    empresaId: ANDRADE_ID,
    filialId: FILIAL_MATRIZ_SP,
    colaboradorId: "carlos-silva",
    combinacaoId: "CC7",
    status: "em_tratativa",
    detectadoEm: "01/07/2026",
  },
  {
    id: "caso-mariana-cc8",
    empresaId: ANDRADE_ID,
    filialId: FILIAL_MATRIZ_SP,
    colaboradorId: "mariana-costa",
    combinacaoId: "CC8",
    detectadoEm: "27/06/2026",
    status: "sem_tratativa",
  },
];

export function casosDaEmpresa(empresaId: string): CombinacaoCriticaCaso[] {
  return combinacoesCasos.filter((c) => c.empresaId === empresaId);
}

export function casosDaFilial(filialId: string): CombinacaoCriticaCaso[] {
  return combinacoesCasos.filter((c) => c.filialId === filialId);
}

export function casosDoColaborador(colaboradorId: string): CombinacaoCriticaCaso[] {
  return combinacoesCasos.filter((c) => c.colaboradorId === colaboradorId);
}

export const NIVEL_LABEL: Record<NivelCombinacao, string> = {
  ESPECIAL: "Especial",
  "CRÍTICO": "Crítico",
  ALTA: "Alta",
};

export const NIVEL_BADGE_CLASS: Record<NivelCombinacao, string> = {
  ESPECIAL: "border-slate-700 bg-slate-900 text-white",
  "CRÍTICO": "border-red-200 bg-red-50 text-red-700",
  ALTA: "border-amber-200 bg-amber-50 text-amber-700",
};

// Usuarios & acessos: pessoas que operam a plataforma (gestores), diferente
// dos colaboradores avaliados. Cobrem os 4 perfis de acesso documentados.
export const usuariosAcesso: Usuario[] = [
  {
    id: "u1",
    empresaId: ANDRADE_ID,
    nome: "Marina Andrade",
    perfil: "Admin Empresa",
    escopo: "Toda a empresa",
    filialId: null,
    email: "marina@andrade.com",
    cpf: "301.552.118-20",
    ultimoAcesso: "27/06/2026, 09:14h",
    statusConvite: "ativo",
  },
  {
    id: "u2",
    empresaId: ANDRADE_ID,
    nome: "Paulo Reis",
    perfil: "Admin Filial",
    escopo: "Matriz · SP",
    filialId: FILIAL_MATRIZ_SP,
    email: "paulo@andrade.com",
    cpf: "118.904.337-55",
    ultimoAcesso: "26/06/2026, 17:02h",
    statusConvite: "ativo",
  },
  {
    id: "u3",
    empresaId: ANDRADE_ID,
    nome: "Sofia Lima",
    perfil: "Avaliador",
    escopo: "Filial Campinas · SP",
    filialId: FILIAL_CAMPINAS,
    email: "sofia@andrade.com",
    cpf: "452.110.889-03",
    ultimoAcesso: "25/06/2026, 11:40h",
    statusConvite: "ativo",
  },
  {
    id: "u4",
    empresaId: ANDRADE_ID,
    nome: "Henrique Sá",
    perfil: "Avaliador",
    escopo: "Matriz · SP",
    filialId: FILIAL_MATRIZ_SP,
    email: "henrique@andrade.com",
    cpf: "770.223.145-61",
    ultimoAcesso: "27/06/2026, 08:33h",
    statusConvite: "pendente",
  },
];

export function usuariosDaEmpresa(empresaId: string): Usuario[] {
  return usuariosAcesso.filter((u) => u.empresaId === empresaId);
}

export function getUsuarioById(uid: string): Usuario | undefined {
  return usuariosAcesso.find((u) => u.id === uid);
}

// Gestor responsavel por um colaborador: o Avaliador da filial dele (quem de
// fato aplica/acompanha os testes no dia a dia); se nao houver, cai pro
// primeiro usuario da propria filial e por ultimo pro Admin da empresa.
export function gestorResponsavelDoColaborador(colaborador: Colaborador): Usuario | undefined {
  const filialId = filialIdDoColaborador(colaborador);
  const daEmpresa = usuariosDaEmpresa(ANDRADE_ID);
  const daFilial = daEmpresa.filter((u) => u.filialId === filialId);
  return (
    daFilial.find((u) => u.perfil === "Avaliador") ??
    daFilial[0] ??
    daEmpresa.find((u) => u.perfil === "Admin Empresa")
  );
}
