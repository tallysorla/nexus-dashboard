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
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tratativa } from "@/lib/mock-colaboradores";

const TIPOS_TRATATIVA = ["Conversa", "Feedback", "Encaminhamento"] as const;

type TratativaDialogProps = {
  colaboradorNome: string;
  onRegistrar: (tratativa: Tratativa) => void;
  className?: string;
};

export function TratativaDialog({ colaboradorNome, onRegistrar, className }: TratativaDialogProps) {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<string>("");
  const [observacao, setObservacao] = useState("");

  const isValid = tipo !== "" && observacao.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;

    onRegistrar({
      id: crypto.randomUUID(),
      data: new Intl.DateTimeFormat("pt-BR").format(new Date()),
      tipo,
      autor: "Você",
      observacao: observacao.trim(),
    });

    toast.success("Tratativa registrada", {
      description: `${tipo} com ${colaboradorNome} adicionada ao histórico.`,
    });

    setTipo("");
    setObservacao("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("h-11 rounded-xl", className)}>
          <MessageSquarePlus className="size-4" />
          Registrar tratativa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar tratativa</DialogTitle>
          <DialogDescription>
            Registre a ação tomada com {colaboradorNome} a partir do risco identificado.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="tratativa-tipo">Tipo de tratativa</FieldLabel>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger id="tratativa-tipo" className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TIPOS_TRATATIVA.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="tratativa-observacao">Observações</FieldLabel>
            <FieldContent>
              <Textarea
                id="tratativa-observacao"
                placeholder="Descreva o que foi conversado ou encaminhado..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={4}
              />
            </FieldContent>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Salvar tratativa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
