import { ParticleIconManager } from "@/components/admin/ParticleIconManager";

export default function ParticulasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Partículas</h1>
        <p className="text-muted-foreground">
          Elige qué íconos flotan en el fondo de tu menú digital
        </p>
      </div>
      <ParticleIconManager />
    </div>
  );
}
