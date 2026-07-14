import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "wouter";
import { RISCO_BADGE_CLASS, RISCO_LABEL, type Colaborador } from "@/lib/mock-colaboradores";

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
      <CardHeader className="px-4 pt-4">
        {label && (
          <p className="w-full text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Avatar className="size-12 shrink-0 ring-2 ring-primary/10">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${colaborador.avatarSeed}`}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">{colaborador.nome}</h3>
            <p className="mt-1 truncate text-sm font-medium leading-tight text-primary">
              {colaborador.cargo}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {colaborador.setor} · {colaborador.local}
              </span>
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`mt-3 w-fit rounded-lg px-2.5 py-1 ${RISCO_BADGE_CLASS[colaborador.risco]}`}
        >
          {RISCO_LABEL[colaborador.risco]}
        </Badge>
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
