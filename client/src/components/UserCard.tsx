import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "wouter";
import type { Colaborador } from "@/lib/mock-colaboradores";

type UserCardProps = {
  colaborador: Colaborador;
  label?: string;
};

export function UserCard({ colaborador, label }: UserCardProps) {
  const initials = colaborador.nome
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="h-full justify-between overflow-hidden py-0 shadow-sm">
      <CardHeader className="items-center px-4 pt-4 text-center">
        {label && (
          <p className="w-full text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        )}
        <div className="flex flex-col items-center gap-2">
          <Avatar className="size-12 ring-2 ring-primary/10">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${colaborador.avatarSeed}`}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-semibold leading-tight">{colaborador.nome}</h3>
            <p className="mt-1 text-sm font-medium leading-tight text-primary">
              {colaborador.cargo}
            </p>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span>
                {colaborador.setor} · {colaborador.local}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardFooter className="px-4 pb-4">
        <Button
          variant="ghost"
          className="h-10 w-full justify-between rounded-xl px-3 text-primary"
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
