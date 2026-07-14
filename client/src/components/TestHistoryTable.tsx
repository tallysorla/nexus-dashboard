import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { FileText, Search } from "lucide-react";
import { RISCO_BADGE_CLASS, type RiskLevel, type TesteHistorico, type TipoTeste } from "@/lib/mock-colaboradores";

const PAGE_SIZE = 5;

type TestHistoryTableProps = {
  tests: TesteHistorico[];
};

export function TestHistoryTable({ tests }: TestHistoryTableProps) {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RiskLevel | "todos">("todos");
  const [tipoFilter, setTipoFilter] = useState<TipoTeste | "todos">("todos");
  const [selectedTest, setSelectedTest] = useState<TesteHistorico | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tests.filter((test) => {
      const matchesQuery =
        !q ||
        test.data.toLowerCase().includes(q) ||
        test.classificacao.toLowerCase().includes(q) ||
        test.fatores.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "todos" || test.status === statusFilter;
      const matchesTipo = tipoFilter === "todos" || test.tipo === tipoFilter;
      return matchesQuery && matchesStatus && matchesTipo;
    });
  }, [tests, query, statusFilter, tipoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleTests = filtered.slice(start, start + PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  function updateStatusFilter(value: RiskLevel | "todos") {
    setStatusFilter(value);
    setPage(1);
  }

  function updateTipoFilter(value: string) {
    if (!value) return; // radix toggle group emits "" when deselecting; keep current selection
    setTipoFilter(value as TipoTeste | "todos");
    setPage(1);
  }

  return (
    <Card className="w-full py-0 shadow-sm">
      <CardHeader className="flex flex-col gap-4 px-6 pt-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg">Histórico de testes realizados</CardTitle>
          <p className="text-sm text-muted-foreground">
            Resultados recentes, classificação e fatores associados
          </p>
        </div>

        <ToggleGroup
          type="single"
          variant="outline"
          value={tipoFilter}
          onValueChange={updateTipoFilter}
          className="h-11 rounded-xl bg-card"
        >
          <ToggleGroupItem value="todos" className="px-4 text-xs">Todos</ToggleGroupItem>
          <ToggleGroupItem value="EEA" className="px-4 text-xs">EEA</ToggleGroupItem>
          <ToggleGroupItem value="DT" className="px-4 text-xs">DT</ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent className="space-y-5 px-6 pb-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-xl pl-9"
              placeholder="Buscar por data, classificação ou fator..."
              value={query}
              onChange={(e) => updateQuery(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={(v) => updateStatusFilter(v as RiskLevel | "todos")}>
            <SelectTrigger className="h-11 w-full rounded-xl bg-card lg:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="alto">Alto risco</SelectItem>
                <SelectItem value="medio">Médio risco</SelectItem>
                <SelectItem value="baixo">Baixo risco</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-12 px-4">Data do teste</TableHead>
                <TableHead className="h-12 px-4">Tipo</TableHead>
                <TableHead className="h-12 px-4">Índice de risco</TableHead>
                <TableHead className="h-12 px-4">Classificação</TableHead>
                <TableHead className="h-12 px-4">Principais fatores</TableHead>
                <TableHead className="h-12 px-4 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="px-4 py-4 font-medium">
                    {test.data}
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant="outline" className="rounded px-1.5 py-0 text-[10px] font-medium">
                      {test.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 font-semibold">
                    {test.pontuacao}/100
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge
                      variant="outline"
                      className={`rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[test.status]}`}
                    >
                      {test.classificacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground">
                    {test.fatores}
                  </TableCell>
                  <TableCell className="px-4 py-4 text-right">
                    <Button
                      aria-label="Abrir relatório do teste"
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-xl text-primary"
                      onClick={() => setSelectedTest(test)}
                    >
                      <FileText className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {visibleTests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Nenhum teste encontrado para os filtros atuais.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {visibleTests.length} de {filtered.length} resultados
          </p>

          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(p);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </CardContent>

      <Dialog open={!!selectedTest} onOpenChange={(open) => !open && setSelectedTest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhe do teste</DialogTitle>
            <DialogDescription>
              Teste {selectedTest?.tipo} realizado em {selectedTest?.data}
            </DialogDescription>
          </DialogHeader>
          {selectedTest && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Índice de risco</p>
                  <p className="text-2xl font-semibold">{selectedTest.pontuacao}/100</p>
                </div>
                <Badge
                  variant="outline"
                  className={`rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[selectedTest.status]}`}
                >
                  {selectedTest.classificacao}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Principais fatores</p>
                <p className="text-sm">{selectedTest.fatores}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
