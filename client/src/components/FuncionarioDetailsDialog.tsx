import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ArrowRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { Colaborador } from "@/lib/mock-colaboradores";

export type FuncionarioEditableFields = {
  nome: string;
  cargo: string;
  setor: string;
  idade: number;
};

type FuncionarioDetailsDialogProps = {
  colaborador: Colaborador;
  onSave: (updates: FuncionarioEditableFields) => void;
};

export function FuncionarioDetailsDialog({ colaborador, onSave }: FuncionarioDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(colaborador.nome);
  const [cargo, setCargo] = useState(colaborador.cargo);
  const [setor, setSetor] = useState(colaborador.setor);
  const [idade, setIdade] = useState(String(colaborador.idade));

  const initials = colaborador.nome
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handleOpenChange(next: boolean) {
    if (next) {
      setNome(colaborador.nome);
      setCargo(colaborador.cargo);
      setSetor(colaborador.setor);
      setIdade(String(colaborador.idade));
      setEditing(false);
    }
    setOpen(next);
  }

  function handleSave() {
    const idadeNum = Number(idade);
    onSave({
      nome: nome.trim() || colaborador.nome,
      cargo: cargo.trim() || colaborador.cargo,
      setor: setor.trim() || colaborador.setor,
      idade: Number.isFinite(idadeNum) && idadeNum > 0 ? idadeNum : colaborador.idade,
    });
    toast.success("Dados atualizados", {
      description: `As informações de ${nome.trim() || colaborador.nome} foram salvas.`,
    });
    setEditing(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="mx-auto h-10 rounded-xl px-3 text-base font-semibold text-primary"
        >
          Ver mais informações
          <ArrowRight className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dados do funcionário</DialogTitle>
          <DialogDescription>Informações cadastrais de {colaborador.nome}.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Avatar className="size-16 shrink-0 rounded-2xl ring-2 ring-primary/10">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${colaborador.avatarSeed}`}
            />
            <AvatarFallback className="rounded-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-semibold">{nome}</p>
            <p className="truncate text-sm text-muted-foreground">{colaborador.matricula}</p>
          </div>
        </div>

        {editing ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-nome">Nome completo</FieldLabel>
              <FieldContent>
                <Input id="edit-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-cargo">Cargo</FieldLabel>
              <FieldContent>
                <Input id="edit-cargo" value={cargo} onChange={(e) => setCargo(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-area">Área</FieldLabel>
              <FieldContent>
                <Input id="edit-area" value={setor} onChange={(e) => setSetor(e.target.value)} />
              </FieldContent>
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-idade">Idade</FieldLabel>
              <FieldContent>
                <Input
                  id="edit-idade"
                  type="number"
                  min={0}
                  value={idade}
                  onChange={(e) => setIdade(e.target.value)}
                />
              </FieldContent>
            </Field>
          </FieldGroup>
        ) : (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Nome completo</dt>
              <dd className="font-medium">{nome}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Matrícula</dt>
              <dd className="font-medium">{colaborador.matricula}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Cargo</dt>
              <dd className="font-medium">{cargo}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Área</dt>
              <dd className="font-medium">{setor}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Idade</dt>
              <dd className="font-medium">{idade} anos</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Data de admissão</dt>
              <dd className="font-medium">{colaborador.dataAdmissao}</dd>
            </div>
          </dl>
        )}

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Editar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
