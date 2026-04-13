import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Scale, Eye, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/contexts/TenantContext";
import { useRealtimeOrders, updateOrderStatus } from "@/hooks/useOrders";
import { WeighingModal } from "@/components/WeighingModal";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";

export default function AdminPreparation() {
  const navigate = useNavigate();
  const { store } = useTenant();
  const { orders, loading } = useRealtimeOrders(store?.id);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [weighingOrder, setWeighingOrder] = useState<any | null>(null);
  const [detailsOrder, setDetailsOrder] = useState<any | null>(null);

  const prepOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing");

  const handleStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      toast.success(status === "preparing" ? "Separação iniciada" : "Pedido pronto para entrega");
    } catch {
      toast.error("Erro ao atualizar pedido");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-hero px-4 py-5 shadow-md sticky top-0 z-20">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-white leading-tight">Separador / Balança</h1>
            <p className="text-xs text-white/75">Pedidos pendentes e em separação</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-16 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Carregando pedidos...</p>
          </div>
        )}

        {!loading && prepOrders.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="font-bold text-foreground">Nenhum pedido para separar agora</p>
          </div>
        )}

        {prepOrders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-foreground">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground font-mono">#{order.id.split("-")[0]}</p>
              </div>
              <span className="text-sm font-extrabold text-primary">R$ {order.total.toFixed(2)}</span>
            </div>

            <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg border border-border">{order.address}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setDetailsOrder(order)}
                className="h-10 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-200"
              >
                <Eye className="h-4 w-4" /> Ver
              </button>
              <button
                onClick={() => setWeighingOrder(order)}
                className="h-10 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-amber-200"
              >
                <Scale className="h-4 w-4" /> Pesar
              </button>
              {order.status === "pending" ? (
                <button
                  onClick={() => handleStatus(order.id, "preparing")}
                  disabled={updatingId === order.id}
                  className="h-10 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200 disabled:opacity-60"
                >
                  {updatingId === order.id ? "..." : "Iniciar"}
                </button>
              ) : (
                <button
                  onClick={() => handleStatus(order.id, "ready_for_delivery")}
                  disabled={updatingId === order.id}
                  className="h-10 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-200 disabled:opacity-60"
                >
                  <PackageCheck className="h-4 w-4" />
                  {updatingId === order.id ? "..." : "Pronto"}
                </button>
              )}
            </div>
          </div>
        ))}
      </main>

      <WeighingModal
        order={weighingOrder}
        onClose={() => setWeighingOrder(null)}
        onUpdate={() => {
          setWeighingOrder(null);
        }}
      />

      <OrderDetailsModal
        order={detailsOrder}
        onClose={() => setDetailsOrder(null)}
      />
    </div>
  );
}
