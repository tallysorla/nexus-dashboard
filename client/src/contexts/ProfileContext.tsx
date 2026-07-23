import React, { createContext, useContext, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "wouter";
import { ANDRADE_ID, FILIAL_MATRIZ_SP } from "@/lib/mock-empresas";

export type ProfileKey = "wesafety" | "empresa" | "filial" | "avaliador" | "stakeholder";

export type NavKey =
  | "overview"
  | "filiais"
  | "func"
  | "testes"
  | "risco"
  | "aplicar"
  | "usuarios"
  | "dados";

export type ProfileDef = {
  key: ProfileKey;
  label: string;
  scopeLabel: string;
  empresaId: string | null;
  filialId: string | null;
  nav: NavKey[];
  canExit: boolean;
};

export const PROFILES: Record<ProfileKey, ProfileDef> = {
  wesafety: {
    key: "wesafety",
    label: "Admin WeSafety",
    scopeLabel: "Global · todas as empresas",
    empresaId: null,
    filialId: null,
    nav: ["overview", "filiais", "func", "testes", "risco", "usuarios", "dados"],
    canExit: true,
  },
  empresa: {
    key: "empresa",
    label: "Admin Empresa",
    scopeLabel: "Toda a empresa",
    empresaId: ANDRADE_ID,
    filialId: null,
    nav: ["overview", "filiais", "func", "testes", "risco", "usuarios", "dados"],
    canExit: false,
  },
  filial: {
    key: "filial",
    label: "Admin Filial",
    scopeLabel: "Matriz · SP",
    empresaId: ANDRADE_ID,
    filialId: FILIAL_MATRIZ_SP,
    nav: ["overview", "func", "testes", "risco", "usuarios"],
    canExit: false,
  },
  avaliador: {
    key: "avaliador",
    label: "Avaliador",
    scopeLabel: "Matriz · SP",
    empresaId: ANDRADE_ID,
    filialId: FILIAL_MATRIZ_SP,
    nav: ["func", "aplicar"],
    canExit: false,
  },
  // Visualizacao para compartilhar com stakeholders externos: so Funcionarios
  // fica liberado, o resto do menu aparece bloqueado (ver Sidebar.tsx) e nao
  // ha como sair desse escopo (canExit false, sem "Ver como" no Header).
  stakeholder: {
    key: "stakeholder",
    label: "Visualização stakeholder",
    scopeLabel: "Transportadora Andrade",
    empresaId: ANDRADE_ID,
    filialId: null,
    nav: ["func"],
    canExit: false,
  },
};

// Matriz de permissoes por area, usada na tela de detalhe do usuario para
// mostrar o que cada perfil enxerga/faz. acesso=false as vezes vem com uma
// observacao "[Requer alinhamento]" -- ponto em aberto no proprio desenho do
// produto, preservado de proposito em vez de resolvido silenciosamente.
export type PermissaoArea = {
  area: string;
  acesso: boolean;
  observacao: string;
};

export const PERMS: Record<ProfileKey, PermissaoArea[]> = {
  wesafety: [
    { area: "Empresas (diretório global)", acesso: true, observacao: "Todas as empresas" },
    { area: "Visão geral", acesso: true, observacao: "" },
    { area: "Filiais / NOPs", acesso: true, observacao: "" },
    { area: "Funcionários", acesso: true, observacao: "Todas as empresas" },
    { area: "Testes", acesso: true, observacao: "" },
    { area: "Aplicar teste", acesso: true, observacao: "" },
    { area: "Combinações Críticas", acesso: true, observacao: "" },
    { area: "Usuários & acessos", acesso: true, observacao: "Todas as empresas" },
    { area: "Dados da empresa", acesso: true, observacao: "Cria e edita empresas" },
  ],
  empresa: [
    { area: "Empresas (diretório global)", acesso: false, observacao: "Acessa apenas a própria empresa" },
    { area: "Visão geral", acesso: true, observacao: "Empresa" },
    { area: "Filiais / NOPs", acesso: true, observacao: "Todas as filiais da empresa" },
    { area: "Funcionários", acesso: true, observacao: "Empresa" },
    { area: "Testes", acesso: true, observacao: "Empresa" },
    { area: "Aplicar teste", acesso: true, observacao: "" },
    { area: "Combinações Críticas", acesso: true, observacao: "Empresa" },
    { area: "Usuários & acessos", acesso: true, observacao: "Gerencia usuários da empresa" },
    { area: "Dados da empresa", acesso: true, observacao: "Edita" },
  ],
  filial: [
    { area: "Empresas (diretório global)", acesso: false, observacao: "" },
    { area: "Visão geral", acesso: true, observacao: "Apenas a própria filial" },
    { area: "Filiais / NOPs", acesso: false, observacao: "Vê somente a própria" },
    { area: "Funcionários", acesso: true, observacao: "Apenas a própria filial" },
    { area: "Testes", acesso: true, observacao: "Apenas a própria filial" },
    { area: "Aplicar teste", acesso: true, observacao: "" },
    { area: "Combinações Críticas", acesso: true, observacao: "Apenas a própria filial" },
    { area: "Usuários & acessos", acesso: true, observacao: "Apenas usuários da filial" },
    { area: "Dados da empresa", acesso: false, observacao: "Somente leitura — [Requer alinhamento]" },
  ],
  avaliador: [
    { area: "Empresas (diretório global)", acesso: false, observacao: "" },
    { area: "Visão geral", acesso: false, observacao: "" },
    { area: "Filiais / NOPs", acesso: false, observacao: "" },
    { area: "Funcionários", acesso: true, observacao: "Visualiza e cadastra — sem editar, deletar ou ver detalhes" },
    { area: "Testes", acesso: false, observacao: "Não visualiza detalhes nem resultados de testes" },
    { area: "Aplicar teste", acesso: true, observacao: "Função principal" },
    { area: "Combinações Críticas", acesso: false, observacao: "" },
    { area: "Usuários & acessos", acesso: false, observacao: "Não pode cadastrar outros avaliadores" },
    { area: "Dados da empresa", acesso: false, observacao: "" },
  ],
  stakeholder: [
    { area: "Empresas (diretório global)", acesso: false, observacao: "" },
    { area: "Visão geral", acesso: false, observacao: "" },
    { area: "Filiais / NOPs", acesso: false, observacao: "" },
    { area: "Funcionários", acesso: true, observacao: "Visualização externa, somente leitura" },
    { area: "Testes", acesso: false, observacao: "" },
    { area: "Aplicar teste", acesso: false, observacao: "" },
    { area: "Combinações Críticas", acesso: false, observacao: "" },
    { area: "Usuários & acessos", acesso: false, observacao: "" },
    { area: "Dados da empresa", acesso: false, observacao: "" },
  ],
};

function rotaPadrao(profile: ProfileDef): string {
  if (profile.key === "wesafety") return "/";
  if (profile.key === "stakeholder") return "/funcionarios";
  if (profile.nav.includes("overview")) return `/empresas/${profile.empresaId}`;
  if (profile.key === "avaliador") return `/empresas/${profile.empresaId}/aplicar-teste`;
  return `/empresas/${profile.empresaId}`;
}

type ProfileContextType = {
  profileKey: ProfileKey;
  profile: ProfileDef;
  setProfile: (key: ProfileKey) => void;
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // Build compartilhado externamente: comeca travado no perfil de
  // stakeholder (so Funcionarios) em vez de Admin WeSafety. Ver
  // Sidebar.tsx/App.tsx para o bloqueio de menu e rotas correspondente.
  const [profileKey, setProfileKey] = useState<ProfileKey>("stakeholder");
  const [, navigate] = useLocation();

  const setProfile = (key: ProfileKey) => {
    setProfileKey(key);
    navigate(rotaPadrao(PROFILES[key]));
  };

  const value = useMemo(
    () => ({ profileKey, profile: PROFILES[profileKey], setProfile }),
    [profileKey]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}

// Empresa ativa no momento: perfis presos a uma empresa (empresa/filial/
// avaliador) sempre usam a sua; o Admin WeSafety navega livremente, entao a
// gente le o cid da propria URL -- seja no path (/empresas/:cid/...) ou na
// query (/funcionarios?empresa=:cid, unica rota que nao vive sob /empresas
// porque o fluxo de funcionários é anterior a essa hierarquia). null = ainda
// no diretorio global, sem nenhuma empresa selecionada -- e o unico estado em
// que a sidebar completa nao faz sentido (ver Layout.tsx).
export function useEmpresaScope(): string | null {
  const [location] = useLocation();
  const [searchParams] = useSearchParams();
  const { profile } = useProfile();
  const cidNaUrl = location.match(/^\/empresas\/([^/]+)/)?.[1];
  const cidNaQuery = searchParams.get("empresa");
  return profile.empresaId ?? cidNaUrl ?? cidNaQuery ?? null;
}
