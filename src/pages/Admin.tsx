import { useRealtimeOrders, updateOrderStatus } from "@/hooks/useOrders";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import {
  Leaf,
  Package,
  Truck,
  CheckCircle,
  Clock,
  PhoneCall,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, DollarSign } from "lucide-react";

type StatusFilter = "all" | "pending" | "preparing" | "delivered";

export default function Admin() {
  const { orders, loading } = useRealtimeOrders();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await updateOrderStatus(id, status);
      const label = status === "preparing" ? "Preparando 🍳" : "Entregue ✅";
      toast.success(`Status atualizado: ${label}`);
    } catch {
      toast.error("Erro ao atualizar o status. Tente novamente.");
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const FILTERS: { value: StatusFilter; label: string; emoji: string }[] = [
    { value: "all", label: "Todos", emoji: "📋" },
    { value: "pending", label: "Pendentes", emoji: "⏳" },
    { value: "preparing", label: "Preparando", emoji: "🍳" },
    { value: "delivered", label: "Entregues", emoji: "✅" },
  ];

  const totalRevenue = orders
    .filter((o) => o.status === "delivered")
    .reduce((acc, current) => acc + current.total, 0);

  const pendingRevenue = orders
    .filter((o) => o.status !== "delivered")
    .reduce((acc, current) => acc + current.total, 0);

  return (
    <div className="min-h-screen bg-[hsl(120,12%,95%)]">
      {/* Header */}
      <header className="gradient-hero px-4 py-5 shadow-md sticky top-0 z-20">
        <div className="mx-auto max-w-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white leading-tight">Painel Admin</h1>
              <p className="text-xs text-white/75">HortiDelivery Lite · Tempo real</p>
            </div>
          </div>
          {/* Indicador live e Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse-dot" />
              <span className="text-xs font-bold text-white hidden sm:inline">Ao vivo</span>
            </div>
            <button
              onClick={handleLogout}
              className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 pb-12">
        {/* Resumo de Vendas */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider">Receita Concluída</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">
              R$ {totalRevenue.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{counts.delivered} pedidos entregues</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider">A Receber</span>
            </div>
            <p className="text-2xl font-extrabold text-foreground">
              R$ {pendingRevenue.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {counts.pending + counts.preparing} pedidos em andamento
            </p>
          </div>
        </div>
        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-bold transition-all
                ${filter === f.value
                  ? "gradient-hero text-white shadow-button"
                  : "bg-white border border-border text-muted-foreground hover:bg-accent"
                }`}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
              <span
                className={`ml-0.5 h-5 w-5 rounded-full text-xs flex items-center justify-center
                  ${filter === f.value ? "bg-white/25 text-white" : "bg-muted text-muted-foreground"}`}
              >
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-16">
            <RefreshCw className="h-5 w-5 text-primary animate-spin-slow" />
            <p className="text-muted-foreground font-semibold">Carregando pedidos...</p>
          </div>
        )}

        {/* Sem pedidos */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="mx-auto h-14 w-14 mb-3 opacity-30" />
            <p className="font-bold text-lg">Nenhum pedido{filter !== "all" ? " neste filtro" : ""}</p>
            <p className="text-sm mt-1">
              {filter === "all"
                ? "Os pedidos aparecerão aqui em tempo real 🔄"
                : "Tente outro filtro"}
            </p>
          </div>
        )}

        {/* Lista de pedidos */}
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-card border border-border/60 overflow-hidden transition-all"
            >
              {/* Cabeçalho do card */}
              <div className="flex items-start justify-between gap-2 p-4 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🧺</span>
                  </div>
                  <div>
                    <p className="font-extrabold text-foreground leading-tight">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              {/* Detalhes */}
              <div className="px-4 pb-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PhoneCall className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-semibold">{order.phone}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{order.address}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(order.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="text-lg font-extrabold text-primary">
                    R$ {order.total.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>

              {/* Ações */}
              {order.status !== "delivered" && (
                <div className="border-t border-border/60 px-4 py-3 flex gap-2">
                  {order.status === "pending" && (
                    <button
                      id={`btn-preparar-${order.id}`}
                      disabled={updating === order.id}
                      onClick={() => handleStatus(order.id, "preparing")}
                      className="flex-1 h-10 rounded-xl gradient-hero text-white text-sm font-bold flex items-center justify-center gap-1.5 shadow-button disabled:opacity-60 transition-opacity active:opacity-80"
                    >
                      {updating === order.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin-slow" />
                      ) : (
                        <Truck className="h-4 w-4" />
                      )}
                      Preparar
                    </button>
                  )}
                  <button
                    id={`btn-entregue-${order.id}`}
                    disabled={updating === order.id}
                    onClick={() => handleStatus(order.id, "delivered")}
                    className="flex-1 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60 transition-colors hover:bg-emerald-100 active:bg-emerald-200"
                  >
                    {updating === order.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin-slow" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Entregue
                  </button>
                </div>
              )}

              {/* Entregue */}
              {order.status === "delivered" && (
                <div className="border-t border-emerald-100 bg-emerald-50 px-4 py-2.5 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-600">
                    Pedido entregue com sucesso 🎉
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
