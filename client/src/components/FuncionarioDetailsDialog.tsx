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
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  CARGOS_DISPONIVEIS,
  autorizacaoDoTeste,
  parseDataBr,
  type Colaborador,
  type TipoJornada,
} from "@/lib/mock-colaboradores";
import { ANDRADE_ID, filialIdDoColaborador, getEmpresaById, localDaFilial } from "@/lib/mock-empresas";

export type FuncionarioEditableFields = {
  nome: string;
  cargo: string;
  local: string;
  tipoJornada: TipoJornada;
};

type FuncionarioDetailsDialogProps = {
  colaborador: Colaborador;
  onSave: (updates: FuncionarioEditableFields) => void;
};

const DISABLED_FIELD_CLASS = "bg-muted disabled:cursor-default disabled:opacity-100";

export function FuncionarioDetailsDialog({ colaborador, onSave }: FuncionarioDetailsDialogProps) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nome, setNome] = useState(colaborador.nome);
  const [cargo, setCargo] = useState(colaborador.cargo);
  const [filialId, setFilialId] = useState(filialIdDoColaborador(colaborador) ?? "");
  const [tipoJornada, setTipoJornada] = useState<TipoJornada>(colaborador.tipoJornada);

  const empresa = getEmpresaById(ANDRADE_ID);
  const filiais = empresa?.filiais ?? [];
  const filialNome = filiais.find((f) => f.id === filialId)?.nome ?? colaborador.local;

  // Autorizacao para exercer a funcao nao e um campo editavel aqui -- reflete
  // o resultado do teste mais recente do funcionario (mesma logica usada nas
  // telas de detalhe do teste), so campo de leitura como Empresa/CPF/Matricula.
  const ultimoTeste = [...colaborador.historicoTestes].sort(
    (a, b) => parseDataBr(b.data).getTime() - parseDataBr(a.data).getTime()
  )[0];
  const autorizacaoLabel = ultimoTeste
    ? ultimoTeste.autorizacaoDecidida
      ? ultimoTeste.autorizacaoDecidida.decisao === "autorizado"
        ? "Autorizado"
        : "Não autorizado"
      : autorizacaoDoTeste(ultimoTeste.status).label
    : "-";

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
      setFilialId(filialIdDoColaborador(colaborador) ?? "");
      setTipoJornada(colaborador.tipoJornada);
      setEditing(false);
    }
    setOpen(next);
  }

  function handleSave() {
    onSave({
      nome: nome.trim() || colaborador.nome,
      cargo: cargo || colaborador.cargo,
      local: localDaFilial(filialId) ?? colaborador.local,
      tipoJornada,
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dados pessoais</DialogTitle>
          <DialogDescription>Informações cadastrais de {colaborador.nome}.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 sm:flex-row">
          <Avatar className="size-28 shrink-0 self-center rounded-2xl ring-2 ring-primary/10 sm:self-start">
            <AvatarImage src={colaborador.avatarUrl} className="object-cover" />
            <AvatarFallback className="rounded-2xl text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>
                Empresa <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Input disabled value={empresa?.nome ?? ""} className={DISABLED_FIELD_CLASS} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="fd-filial">
                Filial <span className="text-red-500">*</span>
              </FieldLabel>
              {editing ? (
                <Select value={filialId} onValueChange={setFilialId}>
                  <SelectTrigger id="fd-filial" className="w-full">
                    <SelectValue placeholder="Selecione a filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {filiais.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <FieldContent>
                  <Input disabled value={filialNome} className={DISABLED_FIELD_CLASS} />
                </FieldContent>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="fd-nome">
                Nome <span className="text-red-500">*</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="fd-nome"
                  value={nome}
                  disabled={!editing}
                  onChange={(e) => setNome(e.target.value)}
                  className={!editing ? DISABLED_FIELD_CLASS : undefined}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>CPF</FieldLabel>
              <FieldContent>
                <Input disabled value={colaborador.cpf} className={DISABLED_FIELD_CLASS} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Matrícula</FieldLabel>
              <FieldContent>
                <Input disabled value={colaborador.matricula} className={DISABLED_FIELD_CLASS} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>Autorização para exercer a função</FieldLabel>
              <FieldContent>
                <Input disabled value={autorizacaoLabel} className={DISABLED_FIELD_CLASS} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="fd-cargo">Cargo</FieldLabel>
              {editing ? (
                <Select value={cargo} onValueChange={setCargo}>
                  <SelectTrigger id="fd-cargo" className="w-full">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CARGOS_DISPONIVEIS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <FieldContent>
                  <Input disabled value={cargo} className={DISABLED_FIELD_CLASS} />
                </FieldContent>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="fd-jornada">Tipo de jornada</FieldLabel>
              {editing ? (
                <Select value={tipoJornada} onValueChange={(v) => setTipoJornada(v as TipoJornada)}>
                  <SelectTrigger id="fd-jornada" className="w-full">
                    <SelectValue placeholder="Selecione o tipo de jornada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="Diurna">Diurna</SelectItem>
                      <SelectItem value="Noturna">Noturna</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <FieldContent>
                  <Input disabled value={tipoJornada} className={DISABLED_FIELD_CLASS} />
                </FieldContent>
              )}
            </Field>
          </div>
        </div>

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
