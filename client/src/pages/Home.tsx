import { Layout } from "@/components/Layout";

export default function Home() {
  return (
    <Layout>
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <img
          src="/empty-state-funcionarios.svg"
          alt=""
          className="w-full max-w-md"
        />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Clique no menu funcionários
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Utilize o menu ao lado apertando na opção funcionários para iniciar o
          fluxo na plataforma
        </p>
      </div>
    </Layout>
  );
}
