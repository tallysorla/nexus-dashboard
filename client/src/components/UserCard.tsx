import { useState } from "react";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FuncionarioDetailsDialog } from "@/components/FuncionarioDetailsDialog";
import type { Colaborador } from "@/lib/mock-colaboradores";

type UserCardProps = {
  colaborador: Colaborador;
};

export function UserCard({ colaborador }: UserCardProps) {
  const [current, setCurrent] = useState(colaborador);

  const initials = current.nome
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="h-full justify-between gap-2 overflow-hidden py-0 shadow-sm">
      <CardHeader className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 shrink-0 rounded-2xl ring-2 ring-primary/10">
            <AvatarImage src={current.avatarUrl} className="object-cover" />
            <AvatarFallback className="rounded-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight">{current.nome}</h3>
            <p className="mt-1 truncate text-sm font-semibold leading-tight text-primary">
              {current.cargo}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {current.setor} - {current.local}
            </p>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardFooter className="px-4 pb-4">
        <FuncionarioDetailsDialog
          colaborador={current}
          onSave={(updates) => setCurrent((prev) => ({ ...prev, ...updates }))}
        />
      </CardFooter>
    </Card>
  );
}
