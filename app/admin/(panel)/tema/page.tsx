import { ThemeEditor } from "@/components/admin/ThemeEditor";

export default function TemaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tema</h1>
        <p className="text-muted-foreground">Personaliza los colores, tipografía y layout de tu landing</p>
      </div>
      <ThemeEditor />
    </div>
  );
}
