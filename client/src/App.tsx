import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import Colaboradores from "./pages/Colaboradores";
import ColaboradorProfile from "./pages/ColaboradorProfile";
import NFuncionarios from "./pages/NFuncionarios";
import NFuncionarioProfile from "./pages/NFuncionarioProfile";
import Empresas from "./pages/Empresas";
import EmpresaOverview from "./pages/EmpresaOverview";
import Filiais from "./pages/Filiais";
import FilialDetail from "./pages/FilialDetail";
import Testes from "./pages/Testes";
import TesteDetail from "./pages/TesteDetail";
import NovoTesteDetail from "./pages/NovoTesteDetail";
import CombinacoesCriticas from "./pages/CombinacoesCriticas";
import TratativaCombinacao from "./pages/TratativaCombinacao";
import UsuariosAcessos from "./pages/UsuariosAcessos";
import UsuarioDetail from "./pages/UsuarioDetail";
import NovoUsuario from "./pages/NovoUsuario";
import DadosEmpresa from "./pages/DadosEmpresa";
import AplicarTeste from "./pages/AplicarTeste";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Empresas} />
      <Route path={"/funcionarios"} component={Colaboradores} />
      <Route path={"/funcionarios/:id"} component={ColaboradorProfile} />
      <Route path={"/nfuncionarios"} component={NFuncionarios} />
      <Route path={"/nfuncionarios/:id"} component={NFuncionarioProfile} />
      <Route path={"/empresas/:cid/filiais/:fid"} component={FilialDetail} />
      <Route path={"/empresas/:cid/filiais"} component={Filiais} />
      <Route path={"/empresas/:cid/testes/:colaboradorId/:testeId"} component={TesteDetail} />
      <Route path={"/empresas/:cid/ntestes/:colaboradorId/:testeId"} component={NovoTesteDetail} />
      <Route path={"/empresas/:cid/testes"} component={Testes} />
      <Route path={"/empresas/:cid/combinacoes/:kid"} component={TratativaCombinacao} />
      <Route path={"/empresas/:cid/combinacoes"} component={CombinacoesCriticas} />
      <Route path={"/empresas/:cid/usuarios/novo"} component={NovoUsuario} />
      <Route path={"/empresas/:cid/usuarios/:uid"} component={UsuarioDetail} />
      <Route path={"/empresas/:cid/usuarios"} component={UsuariosAcessos} />
      <Route path={"/empresas/:cid/dados"} component={DadosEmpresa} />
      <Route path={"/empresas/:cid/aplicar-teste"} component={AplicarTeste} />
      <Route path={"/empresas/:cid"} component={EmpresaOverview} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Bloqueio de rotas para o build compartilhado com stakeholders externos:
// mesmo que o item correspondente na Sidebar esteja travado com cadeado,
// nada impede alguem de digitar a URL direto na barra de enderecos -- este
// guard fecha essa brecha redirecionando qualquer rota fora da allowlist de
// volta para /funcionarios. So os testes acessados a partir do historico de
// um funcionario (nao a lista agregada em /empresas/:cid/testes) ficam
// liberados, por fazerem parte do proprio fluxo de Funcionarios.
// /nfuncionarios e a copia de /funcionarios usada pra iterar no fluxo em
// refinamento sem tocar na tela ja compartilhada -- nao tem link em lugar
// nenhum da UI, entao so quem sabe a URL exata chega nela (nao ha
// autenticacao real por tras, e so uma rota nao divulgada).
const ROTAS_PERMITIDAS = [
  /^\/funcionarios$/,
  /^\/funcionarios\/[^/]+$/,
  /^\/nfuncionarios$/,
  /^\/nfuncionarios\/[^/]+$/,
  /^\/empresas\/[^/]+\/testes\/[^/]+\/[^/]+$/,
];

function RouteGuard({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const permitida = ROTAS_PERMITIDAS.some((padrao) => padrao.test(location));

  useEffect(() => {
    if (!permitida) navigate("/funcionarios", { replace: true });
  }, [location, permitida, navigate]);

  if (!permitida) return null;
  return <>{children}</>;
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

// Em produção o build pode ser publicado sob um subcaminho (ex.: GitHub
// Pages serve em /nexus-dashboard/, nao na raiz do dominio como a Vercel) --
// import.meta.env.BASE_URL reflete o `base` configurado no build do Vite,
// entao o Router do wouter fica correto nos dois lugares sem precisar de
// nenhuma outra mudanca nas paginas (todo Link/navigate usa caminho absoluto
// e passa a ser relativo a esse base automaticamente).
const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "");

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <WouterRouter base={routerBase}>
            <ProfileProvider>
              <RouteGuard>
                <Router />
              </RouteGuard>
            </ProfileProvider>
          </WouterRouter>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
