import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Layout } from "@/components/Layout";
import { KpiCard } from "@/components/MetricsCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  Filter,
  Plus,
  Search,
  ShieldX,
  Users,
} from "lucide-react";
import { colaboradoresDaEmpresa, empresas, testesRealizados } from "@/lib/mock-empresas";

type FiltroStatus = "todos" | "ativo" | "inativo";

const PROXIMO_FILTRO: Record<FiltroStatus, FiltroStatus> = {
  todos: "ativo",
  ativo: "inativo",
  inativo: "todos",
};

const FILTRO_LABEL: Record<FiltroStatus, string> = {
  todos: "Todos",
  ativo: "Ativo",
  inativo: "Inativo",
};

export default function Empresas() {
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");

  const linhas = useMemo(
    () =>
      empresas.map((e) => ({
        empresa: e,
        funcionarios: colaboradoresDaEmpresa(e.id).length,
        testes: testesRealizados(colaboradoresDaEmpresa(e.id)),
      })),
    []
  );

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return linhas.filter(({ empresa }) => {
      const matchStatus = filtro === "todos" || empresa.status === filtro;
      const matchQuery =
        !q || empresa.nome.toLowerCase().includes(q) || empresa.cnpj.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [linhas, query, filtro]);

  const ativas = empresas.filter((e) => e.status === "ativo").length;
  const inativas = empresas.filter((e) => e.status === "inativo").length;
  const funcionariosAvaliados = linhas.reduce((soma, l) => soma + l.funcionarios, 0);
  const testesTotais = linhas.reduce((soma, l) => soma + l.testes, 0);

  return (
    <Layout>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-sm text-muted-foreground">
            Selecione uma empresa para acessar seus funcionários, testes e riscos.
          </p>
        </div>
        <Button
          className="h-11 rounded-xl"
          onClick={() => toast("Protótipo: cadastro de nova empresa")}
        >
          <Plus className="size-4" />
          Nova empresa
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Building2}
          iconClassName="bg-primary/10 text-primary"
          label="Empresas ativas"
          value={String(ativas)}
        />
        <KpiCard
          icon={Users}
          iconClassName="bg-sky-500/10 text-sky-600"
          label="Funcionários avaliados"
          value={funcionariosAvaliados.toLocaleString("pt-BR")}
        />
        <KpiCard
          icon={ClipboardList}
          iconClassName="bg-amber-500/10 text-amber-600"
          label="Testes realizados"
          value={testesTotais.toLocaleString("pt-BR")}
        />
        <KpiCard
          icon={ShieldX}
          iconClassName={inativas > 0 ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground"}
          label="Empresas inativas"
          value={String(inativas)}
        />
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardContent className="space-y-5 px-6 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-xl pl-9"
                placeholder="Buscar por nome da empresa, CNPJ..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltro(PROXIMO_FILTRO[filtro])}
              className="flex h-11 items-center gap-2 rounded-xl border bg-card px-3 text-sm font-medium hover:bg-muted/50"
            >
              <Filter className="size-4 text-muted-foreground" />
              Status: {FILTRO_LABEL[filtro]}
            </button>
          </div>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-12 px-4">Empresa</TableHead>
                  <TableHead className="h-12 px-4 text-center">Filiais</TableHead>
                  <TableHead className="h-12 px-4 text-center">Funcionários</TableHead>
                  <TableHead className="h-12 px-4 text-center">Testes</TableHead>
                  <TableHead className="h-12 px-4">Status</TableHead>
                  <TableHead className="h-12 px-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map(({ empresa, funcionarios, testes }) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="px-4 py-4">
                      <p className="font-medium">{empresa.nome}</p>
                      <p className="text-xs text-muted-foreground">{empresa.cnpj}</p>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">{empresa.filiais.length}</TableCell>
                    <TableCell className="px-4 py-4 text-center">{funcionarios}</TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      {testes.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={
                          empresa.status === "ativo"
                            ? "rounded-lg border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700"
                            : "rounded-lg px-2.5 py-1 text-muted-foreground"
                        }
                      >
                        {empresa.status === "ativo" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <Button variant="ghost" size="sm" className="rounded-xl text-primary" asChild>
                        <Link href={`/empresas/${empresa.id}`}>
                          Ver empresa
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtradas.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Nenhuma empresa encontrada com esses filtros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            Mostrando {filtradas.length} de {empresas.length} empresas
          </p>
        </CardContent>
      </Card>
    </Layout>
  );
}
