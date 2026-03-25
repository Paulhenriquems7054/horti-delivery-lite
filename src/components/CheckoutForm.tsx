import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, User, Phone, MapPin, Truck } from "lucide-react";
import { useDeliveryZones, type DeliveryZone } from "@/hooks/useDeliveryZones";

interface Props {
  loading: boolean;
  basketName: string;
  basketPrice: number;
  storeId?: string;
  onSubmit: (data: { customer_name: string; phone: string; address: string; total_with_fee: number; neighborhood_id?: string }) => void;
  onBack: () => void;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function CheckoutForm({ loading, basketName, basketPrice, storeId, onSubmit, onBack }: Props) {
  const { data: zones } = useDeliveryZones(storeId);
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [touched, setTouched] = useState({ name: false, phone: false, address: false, zone: false });

  // Carregar histórico local do cliente (Fase 3: Retenção LocalStorage)
  useEffect(() => {
    const savedCustomer = localStorage.getItem("horti_customer_profile");
    if (savedCustomer) {
      const parsed = JSON.parse(savedCustomer);
      if (parsed.name) setName(parsed.name);
      if (parsed.phone) setPhone(parsed.phone);
      if (parsed.address) setAddress(parsed.address);
      if (parsed.zone) setSelectedZone(parsed.zone);
    }
  }, []);

  const currentZoneData = zones?.find(z => z.id === selectedZone);
  const deliveryFee = currentZoneData ? currentZoneData.fee : 0;
  const finalTotal = basketPrice + deliveryFee;

  const errors = {
    name: name.trim().length < 2 ? "Informe seu nome completo" : "",
    phone: phone.replace(/\D/g, "").length < 10 ? "Informe um telefone válido" : "",
    address: address.trim().length < 5 ? "Informe a rua e número" : "",
    zone: zones?.length && !selectedZone ? "Selecione seu bairro" : ""
  };

  const isValid = !errors.name && !errors.phone && !errors.address && !errors.zone;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, address: true, zone: true });
    
    if (!isValid) return;

    // Salvar no Histórico Local para a próxima compra do cliente
    localStorage.setItem("horti_customer_profile", JSON.stringify({
      name: name.trim(),
      phone,
      address: address.trim(),
      zone: selectedZone
    }));

    const finalAddressInfo = currentZoneData 
      ? `${address.trim()} (${currentZoneData.neighborhood})` 
      : address.trim();

    onSubmit({ 
      customer_name: name.trim(), 
      phone, 
      address: finalAddressInfo,
      total_with_fee: finalTotal,
      neighborhood_id: selectedZone || undefined
    });
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-foreground">Finalizar Pedido</h2>
          <p className="text-sm text-muted-foreground">{basketName}</p>
        </div>
      </div>

      <div className="rounded-2xl gradient-card border border-primary/20 p-4 mb-6 flex flex-col gap-1">
        <div className="flex justify-between text-sm font-semibold text-muted-foreground">
          <span>Subtotal:</span>
          <span>R$ {basketPrice.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex justify-between text-sm font-semibold text-muted-foreground mb-1">
          <span>Taxa de Entrega:</span>
          <span>+ R$ {deliveryFee.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-primary/20">
          <span className="text-base font-bold text-foreground">Total do pedido</span>
          <span className="text-2xl font-extrabold text-primary">
            R$ {finalTotal.toFixed(2).replace(".", ",")}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Campo Nome */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <User className="h-4 w-4 text-primary" /> Nome completo
          </label>
          <input
            type="text"
            placeholder="Ex: Maria da Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            className={`w-full h-12 rounded-xl border px-4 text-base font-semibold bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${touched.name && errors.name ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
          />
        </div>

        {/* Campo Telefone */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-primary" /> WhatsApp
          </label>
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            className={`w-full h-12 rounded-xl border px-4 text-base font-semibold bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${touched.phone && errors.phone ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
          />
        </div>

        {/* Campo Bairro (Dinâmico) */}
        {zones && zones.length > 0 && (
          <div className="space-y-1">
            <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-primary" /> Bairro / Taxa de Entrega
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, zone: true }))}
              className={`w-full h-12 rounded-xl border px-4 text-base font-semibold bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${touched.zone && errors.zone ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
            >
              <option value="" disabled>Selecione seu bairro...</option>
              {zones.map(z => (
                <option key={z.id} value={z.id}>
                  {z.neighborhood} - R$ {z.fee.toFixed(2).replace(".", ",")}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Campo Endereço */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" /> Rua, Número e Referência
          </label>
          <input
            type="text"
            placeholder="Ex: Rua das Flores, 123"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, address: true }))}
            className={`w-full h-12 rounded-xl border px-4 text-base font-semibold bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${touched.address && errors.address ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
          />
        </div>

        {/* Botão submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl gradient-hero text-white text-lg font-extrabold shadow-button flex items-center justify-center gap-2 transition-opacity active:opacity-90 disabled:opacity-60 mt-4"
        >
          {loading ? (
             <Loader2 className="h-5 w-5 animate-spin-slow" />
          ) : (
            "✅ Confirmar Pedido"
          )}
        </button>
      </form>
    </div>
  );
}
