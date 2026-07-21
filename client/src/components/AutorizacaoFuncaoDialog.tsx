import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import { toast } from "sonner";
import type { DecisaoAutorizacao } from "@/lib/mock-colaboradores";

type Tipo = "autorizar" | "nao_autorizar" | null;

type AutorizacaoFuncaoDialogProps = {
  colaboradorNome: string;
  // Ex.: "Médio risco" -- usado literalmente na pergunta do dialog.
  classificacao: string;
  onDecidir: (decisao: DecisaoAutorizacao) => void;
};

// So aparece quando o teste da risco medio ("Aguardando") -- alto ja
// bloqueia automaticamente pelo protocolo e baixo ja libera automaticamente,
// entao so o medio exige essa decisao explicita do gestor.
export function AutorizacaoFuncaoDialog({
  colaboradorNome,
  classificacao,
  onDecidir,
}: AutorizacaoFuncaoDialogProps) {
  const [tipo, setTipo] = useState<Tipo>(null);
  const [observacao, setObservacao] = useState("");

  const isAutorizar = tipo === "autorizar";
  const isValid = !isAutorizar || observacao.trim().length > 0;

  function fechar() {
    setTipo(null);
    setObservacao("");
  }

  function confirmar() {
    if (!tipo || !isValid) return;
    const agora = new Date();

    onDecidir({
      decisao: tipo === "autorizar" ? "autorizado" : "nao_autorizado",
      observacao: observacao.trim(),
      autor: "Você",
      data: new Intl.DateTimeFormat("pt-BR").format(agora),
      hora: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(agora),
    });

    toast.success(
      tipo === "autorizar"
        ? "Funcionário autorizado a exercer a função."
        : "Funcionário confirmado como não autorizado."
    );

    fechar();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-4">
        <Info className="size-4 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          Essa funcionalidade permite autorizar ou não este funcionário a exercer a função.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
            onClick={() => setTipo("nao_autorizar")}
          >
            Não autorizar
          </Button>
          <Button className="rounded-xl" onClick={() => setTipo("autorizar")}>
            Autorizar
          </Button>
        </div>
      </div>

      <Dialog open={tipo !== null} onOpenChange={(open) => !open && fechar()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              O funcionário {colaboradorNome} foi classificado como {classificacao.toLowerCase()} no teste
              psicossocial.
            </DialogTitle>
            <DialogDescription>
              {isAutorizar
                ? "Deseja autorizar a exercer sua função mesmo assim?"
                : "Deseja confirmá-lo como não autorizado a exercer sua função?"}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="autorizacao-observacao">
                Observações{isAutorizar ? "*" : " (Opcional)"}
              </FieldLabel>
              <FieldContent>
                <Textarea
                  id="autorizacao-observacao"
                  placeholder={
                    isAutorizar
                      ? "Ex: O funcionário pode exercer a função, mas precisa realizar algumas pausas entre o expediente."
                      : "Ex: O funcionário não pode exercer a função no momento devido ao risco identificado no teste."
                  }
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  rows={4}
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button variant="outline" onClick={fechar}>
              Voltar
            </Button>
            <Button
              onClick={confirmar}
              disabled={!isValid}
              className={isAutorizar ? "" : "bg-red-600 text-white hover:bg-red-700"}
            >
              {isAutorizar ? "Autorizado" : "Não Autorizado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
