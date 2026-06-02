import { BusinessConfigForm } from "@/components/admin/BusinessConfigForm";

export default function NegocioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración del Negocio</h1>
        <p className="text-muted-foreground">Administra la información de tu negocio, contacto y SEO</p>
      </div>
      <BusinessConfigForm />
    </div>
  );
}
