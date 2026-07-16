import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useProfile } from "@/contexts/ProfileContext";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  const { profile } = useProfile();

  // Perfis presos a uma unica empresa (canExit=false) nao devem ver um
  // caminho de volta ao diretorio global -- eles nem tem acesso a essa tela.
  const visiveis =
    !profile.canExit && items[0]?.label === "Empresas" ? items.slice(1) : items;

  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      {visiveis.map((item, index) => {
        const isLast = index === visiveis.length - 1;
        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="size-3.5 shrink-0" />}
            {isLast || !item.href ? (
              <span className={isLast ? "font-medium text-foreground" : ""}>{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-foreground hover:underline">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
