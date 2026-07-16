import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";

type NavCardProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
};

export function NavCard({ icon: Icon, title, subtitle, href }: NavCardProps) {
  return (
    <Link href={href}>
      <Card className="flex-row items-center gap-3 rounded-2xl p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{title}</p>
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </Card>
    </Link>
  );
}
