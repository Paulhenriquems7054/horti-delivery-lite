import { useState } from "react";
import { Loader2, ArrowLeft, User, Phone, MapPin } from "lucide-react";

interface Props {
  loading: boolean;
  basketName: string;
  basketPrice: number;
  onSubmit: (data: { customer_name: string; phone: string; address: string }) => void;
  onBack: () => void;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function CheckoutForm({ loading, basketName, basketPrice, onSubmit, onBack }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [touched, setTouched] = useState({ name: false, phone: false, address: false });

  const errors = {
    name: name.trim().length < 2 ? "Informe seu nome completo" : "",
    phone: phone.replace(/\D/g, "").length < 10 ? "Informe um telefone válido" : "",
    address: address.trim().length < 5 ? "Informe o endereço completo" : "",
  };

  const isValid = !errors.name && !errors.phone && !errors.address;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, address: true });
    if (!isValid) return;
    onSubmit({ customer_name: name.trim(), phone, address: address.trim() });
  };

  return (
    <div className="animate-slide-up">
      {/* Header do checkout */}
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

      {/* Resumo do preço */}
      <div className="rounded-2xl gradient-card border border-primary/20 p-4 mb-6 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">Total do pedido</span>
        <span className="text-2xl font-extrabold text-primary">
          R$ {basketPrice.toFixed(2).replace(".", ",")}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Campo Nome */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <User className="h-4 w-4 text-primary" />
            Nome completo
          </label>
          <input
            type="text"
            placeholder="Ex: Maria da Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            className={`w-full h-12 rounded-xl border px-4 text-base font-semibold bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all
              ${touched.name && errors.name ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
          />
          {touched.name && errors.name && (
            <p className="text-xs text-destructive font-semibold pl-1">{errors.name}</p>
          )}
        </div>

        {/* Campo Telefone */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Phone className="h-4 w-4 text-primary" />
            WhatsApp / Telefone
          </label>
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
            className={`w-full h-12 rounded-xl border px-4 text-base font-semibold bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all
              ${touched.phone && errors.phone ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
          />
          {touched.phone && errors.phone && (
            <p className="text-xs text-destructive font-semibold pl-1">{errors.phone}</p>
          )}
        </div>

        {/* Campo Endereço */}
        <div className="space-y-1">
          <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" />
            Endereço de entrega
          </label>
          <input
            type="text"
            placeholder="Rua, número, bairro, cidade"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, address: true }))}
            className={`w-full h-12 rounded-xl border px-4 text-base font-semibold bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all
              ${touched.address && errors.address ? "border-destructive ring-1 ring-destructive/30" : "border-border"}`}
          />
          {touched.address && errors.address && (
            <p className="text-xs text-destructive font-semibold pl-1">{errors.address}</p>
          )}
        </div>

        {/* Botão submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-14 rounded-2xl gradient-hero text-white text-lg font-extrabold shadow-button flex items-center justify-center gap-2 transition-opacity active:opacity-90 disabled:opacity-60 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin-slow" />
              Enviando pedido...
            </>
          ) : (
            "✅ Confirmar Pedido"
          )}
        </button>
      </form>
    </div>
  );
}
