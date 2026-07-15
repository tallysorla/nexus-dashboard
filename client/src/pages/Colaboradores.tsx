import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ArrowRight, Search } from "lucide-react";
import { RISCO_BADGE_CLASS, RISCO_LABEL, colaboradores } from "@/lib/mock-colaboradores";

export default function Colaboradores() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colaboradores;
    return colaboradores.filter((c) =>
      [c.nome, c.cargo, c.setor, c.local].some((field) =>
        field.toLowerCase().includes(q)
      )
    );
  }, [query]);

  return (
    <Layout>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Funcionários</h1>
        <p className="text-sm text-muted-foreground">
          Listagem de funcionários e classificação de risco atual
        </p>
      </div>

      <Card className="w-full py-0 shadow-sm">
        <CardContent className="space-y-5 px-6 py-6">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-11 rounded-xl pl-9"
              placeholder="Buscar por nome, cargo ou setor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-12 px-4">Funcionário</TableHead>
                  <TableHead className="h-12 px-4">Setor</TableHead>
                  <TableHead className="h-12 px-4">EEA</TableHead>
                  <TableHead className="h-12 px-4">DT</TableHead>
                  <TableHead className="h-12 px-4">Classificação</TableHead>
                  <TableHead className="h-12 px-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={c.avatarUrl} className="object-cover" />
                          <AvatarFallback>
                            {c.nome
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.nome}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {c.cargo}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-muted-foreground">
                      {c.setor} · {c.local}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-medium">
                      {c.eea}/100
                    </TableCell>
                    <TableCell className="px-4 py-4 font-medium">
                      {c.dt}/750
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={`rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[c.risco]}`}
                      >
                        {RISCO_LABEL[c.risco]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-primary"
                        asChild
                      >
                        <Link href={`/funcionarios/${c.id}`}>
                          Ver perfil
                          <ArrowRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      Nenhum funcionário encontrado para "{query}".
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
