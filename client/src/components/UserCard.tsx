import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Colaborador } from "@/lib/mock-colaboradores";

type UserCardProps = {
  colaborador: Colaborador;
};

export function UserCard({ colaborador }: UserCardProps) {
  const initials = colaborador.nome
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="h-full justify-between overflow-hidden py-0 shadow-sm">
      <CardHeader className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 shrink-0 rounded-2xl ring-2 ring-primary/10">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${colaborador.avatarSeed}`}
            />
            <AvatarFallback className="rounded-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h3 className="truncate font-bold leading-tight">{colaborador.nome}</h3>
            <p className="mt-1 truncate text-sm font-semibold leading-tight text-primary">
              {colaborador.cargo}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {colaborador.setor} - {colaborador.local}
            </p>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardFooter className="px-4 pb-4">
        <Button
          variant="ghost"
          className="mx-auto h-10 rounded-xl px-3 text-base font-semibold text-primary"
          asChild
        >
          <Link href={`/colaboradores/${colaborador.id}`}>
            Ver mais informações
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
