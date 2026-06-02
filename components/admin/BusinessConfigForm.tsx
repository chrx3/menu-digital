"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getBusinessConfig,
  updateBusinessConfig,
} from "@/app/actions/business";
import { Loader2, Save, Plus, X } from "lucide-react";
import { ImagePicker } from "./ImagePicker";
import { useDirtyGuard } from "@/app/hooks/useDirtyGuard";

const LOCALE_OPTIONS = [
  { value: "es-CL", label: "Español (Chile)", currency: "CLP" },
  { value: "es-AR", label: "Español (Argentina)", currency: "ARS" },
  { value: "es-MX", label: "Español (México)", currency: "MXN" },
  { value: "es-CO", label: "Español (Colombia)", currency: "COP" },
  { value: "es-PE", label: "Español (Perú)", currency: "PEN" },
  { value: "es-ES", label: "Español (España)", currency: "EUR" },
  { value: "en-US", label: "English (US)", currency: "USD" },
];

export function BusinessConfigForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappGreeting, setWhatsappGreeting] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [locale, setLocale] = useState("es-CL");
  const [currency, setCurrency] = useState("CLP");
  const [lang, setLang] = useState("es");
  const [logoDesktop, setLogoDesktop] = useState("");
  const [logoMobile, setLogoMobile] = useState<string[]>([]);
  const [logoRotationInterval, setLogoRotationInterval] = useState(4000);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [year, setYear] = useState(2025);
  const [channelWhatsapp, setChannelWhatsapp] = useState(true);

  useDirtyGuard(dirty);

  async function loadConfig() {
    setLoading(true);
    const result = await getBusinessConfig();
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      const d = result.data;
      setName(d.name || "");
      setDescription(d.description || "");
      setWhatsappNumber(d.whatsapp_number || "");
      setWhatsappGreeting(d.whatsapp_greeting || "");
      setPhone(d.phone || "");
      setEmail(d.email || "");
      setAddress(d.address || "");
      setLocale(d.locale || "es-CL");
      setCurrency(d.currency || "CLP");
      setLang(d.lang || "es");
      setLogoDesktop(d.logo_desktop || "");
      setLogoMobile(d.logo_mobile || []);
      setLogoRotationInterval(d.logo_rotation_interval || 4000);
      setSeoTitle(d.seo_title || "");
      setSeoDescription(d.seo_description || "");
      setYear(d.year || 2025);
      if (d.order_channels) {
        setChannelWhatsapp(d.order_channels.whatsapp ?? true);
      }
    }
    setDirty(false);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadConfig);
  }, []);

  // Mark dirty on any tracked field change after initial load.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!loading) setDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    name,
    description,
    whatsappNumber,
    whatsappGreeting,
    phone,
    email,
    address,
    locale,
    currency,
    lang,
    logoDesktop,
    logoMobile,
    logoRotationInterval,
    seoTitle,
    seoDescription,
    year,
    channelWhatsapp,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleLocaleChange = (value: string | null) => {
    if (!value) return;
    setLocale(value);
    const opt = LOCALE_OPTIONS.find((o) => o.value === value);
    if (opt) setCurrency(opt.currency);
    setLang(value.split("-")[0] || "es");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("description", description);
    formData.set("whatsapp_number", whatsappNumber);
    formData.set("whatsapp_greeting", whatsappGreeting);
    formData.set("phone", phone);
    formData.set("email", email);
    formData.set("address", address);
    formData.set("logo_desktop", logoDesktop);
    formData.set("logo_mobile", JSON.stringify(logoMobile.filter(Boolean)));
    formData.set("logo_rotation_interval", String(logoRotationInterval));
    formData.set("seo_title", seoTitle);
    formData.set("seo_description", seoDescription);
    formData.set("year", String(year));
    formData.set("locale", locale);
    formData.set("currency", currency);
    formData.set("lang", lang);
    formData.set(
      "order_channels",
      JSON.stringify({
        whatsapp: channelWhatsapp,
        phone: false,
        telegram: false,
      }),
    );
    const result = await updateBusinessConfig(formData);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Configuración guardada correctamente");
      setDirty(false);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Identidad del Negocio</CardTitle>
          <CardDescription>Nombre, descripción y datos básicos</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="MC Tommy"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descripción corta</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Comida Rápida Chilena"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Región / idioma</Label>
              <Select value={locale} onValueChange={handleLocaleChange}>
                <SelectTrigger aria-label="Región e idioma">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Define el formato de precios. Moneda: {currency}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logos</CardTitle>
          <CardDescription>
            Usa rutas públicas o URLs copiadas desde Imágenes
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <ImagePicker
              value={logoDesktop}
              onChange={setLogoDesktop}
              bucket="logos"
              label="Logo Desktop"
              placeholder="/logos/mctommy.webp"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label>Logos Mobile</Label>
            {logoMobile.map((url, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1">
                  <ImagePicker
                    value={url}
                    onChange={(newUrl) =>
                      setLogoMobile((prev) =>
                        prev.map((u, i) => (i === index ? newUrl : u)),
                      )
                    }
                    bucket="logos"
                    placeholder="/logos/mctommy1.webp"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setLogoMobile((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="mt-6 shrink-0 text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setLogoMobile((prev) => [...prev, ""])}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Añadir logo mobile
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor="logoRotationInterval">
              Rotación Mobile (segundos)
            </Label>
            <Input
              id="logoRotationInterval"
              type="number"
              min={1}
              max={60}
              step={0.5}
              value={logoRotationInterval / 1000}
              onChange={(event) =>
                setLogoRotationInterval(
                  Math.round(Number(event.target.value) * 1000),
                )
              }
            />
            <p className="text-xs text-muted-foreground">
              Tiempo entre logos en la versión móvil.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
          <CardDescription>WhatsApp y datos de contacto</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="whatsapp">
              WhatsApp (código país + número, sin +)
            </Label>
            <Input
              id="whatsapp"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="56963725018"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="greeting">Saludo de WhatsApp</Label>
            <Input
              id="greeting"
              value={whatsappGreeting}
              onChange={(e) => setWhatsappGreeting(e.target.value)}
              placeholder="¡Hola! Quiero hacer un pedido en {name}."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 1234 5678"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@negocio.cl"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Dirección (opcional)</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Siempre Viva 742"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Canales de Pedido</CardTitle>
          <CardDescription>
            Activa o desactiva los canales por los que tus clientes pueden hacer
            pedidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={channelWhatsapp}
              onCheckedChange={(c) => setChannelWhatsapp(c === true)}
            />
            <span>
              <span className="block text-sm font-medium">WhatsApp</span>
              <span className="block text-xs text-muted-foreground">
                Los clientes envían su pedido como mensaje
              </span>
            </span>
          </Label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>Metadatos para buscadores</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="seoTitle">Título SEO</Label>
            <Input
              id="seoTitle"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="MC Tommy - Menú Digital"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="seoDesc">Descripción SEO</Label>
            <textarea
              id="seoDesc"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Menú digital interactivo…"
              rows={3}
              maxLength={320}
              className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              {seoDescription.length}/320 caracteres
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        {dirty && (
          <span className="text-xs text-muted-foreground">
            Tienes cambios sin guardar
          </span>
        )}
        <Button type="submit" disabled={saving || !dirty}>
          {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
          <Save className="mr-2 size-4" />
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
}
