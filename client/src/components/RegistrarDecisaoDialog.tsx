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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tratativa } from "@/lib/mock-colaboradores";

const DECISOES_TRATATIVA = [
  "Retorno apto",
  "Monitoramento",
  "Afastamento temporário",
  "Encaminhamento clínico",
] as const;

type CombinacaoRelacionada = { id: string; nome: string };

type RegistrarDecisaoDialogProps = {
  colaboradorNome: string;
  combinacoesRelacionadas: CombinacaoRelacionada[];
  // Retorna a tratativa (mesmo formato do historico simples) e os ids das
  // combinacoes marcadas, pra quem chama poder atualizar o status de cada
  // caso selecionado.
  onRegistrar: (tratativa: Tratativa, casosSelecionados: string[]) => void;
  className?: string;
};

export function RegistrarDecisaoDialog({
  colaboradorNome,
  combinacoesRelacionadas,
  onRegistrar,
  className,
}: RegistrarDecisaoDialogProps) {
  const [open, setOpen] = useState(false);
  const [decisao, setDecisao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(
    new Set(combinacoesRelacionadas.map((c) => c.id))
  );

  const isValid = decisao !== "" && observacao.trim().length > 0;

  function toggleCaso(id: string) {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSubmit() {
    if (!isValid) return;

    onRegistrar(
      {
        id: crypto.randomUUID(),
        data: new Intl.DateTimeFormat("pt-BR").format(new Date()),
        tipo: decisao,
        autor: "Você",
        observacao: observacao.trim(),
      },
      Array.from(selecionadas)
    );

    toast.success("Decisão da tratativa registrada", {
      description: `${decisao} para ${colaboradorNome}.`,
    });

    setDecisao("");
    setObservacao("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={cn("h-11 rounded-xl", className)}>
          <ClipboardCheck className="size-4" />
          Registrar decisão
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar decisão da tratativa</DialogTitle>
          <DialogDescription>
            Registre a decisão tomada para {colaboradorNome} a partir das combinações identificadas.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>Decisão tomada</FieldLabel>
            <FieldContent>
              <RadioGroup value={decisao} onValueChange={setDecisao}>
                {DECISOES_TRATATIVA.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={d} />
                    {d}
                  </label>
                ))}
              </RadioGroup>
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="decisao-observacao">Observações da tratativa</FieldLabel>
            <FieldContent>
              <Textarea
                id="decisao-observacao"
                placeholder="Registre as ações realizadas, informações relevantes e justificativa da decisão tomada."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={4}
              />
            </FieldContent>
          </Field>

          {combinacoesRelacionadas.length > 0 && (
            <Field>
              <FieldLabel>Combinações relacionadas</FieldLabel>
              <FieldContent className="space-y-2">
                {combinacoesRelacionadas.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={selecionadas.has(c.id)} onCheckedChange={() => toggleCaso(c.id)} />
                    {c.nome}
                  </label>
                ))}
              </FieldContent>
            </Field>
          )}
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            Salvar decisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
