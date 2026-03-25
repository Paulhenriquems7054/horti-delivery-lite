import { useEffect, useState } from "react";
import { supabase } from "@/services/supabase";

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  status: string;
  total: number;
  created_at: string;
}

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel: any = null;

    const setupOrders = async () => {
      // 1. Pega usuário logado
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setLoading(false);
        return;
      }

      // 2. Descobre a loja do usuário
      const { data: store } = await (supabase as any)
        .from("stores")
        .select("id")
        .eq("owner_id", authData.user.id)
        .single();
        
      if (!store) {
        setLoading(false);
        return;
      }

      // 3. Busca pedidos apenas dessa loja
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("*")
        .eq("store_id", store.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setOrders((data as Order[]) ?? []);
      }
      setLoading(false);

      // 4. Assina o realtime filtrando apenas por esta loja (Isolamento de Tenant / SaaS)
      channel = (supabase as any)
        .channel("orders-realtime")
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "orders",
            filter: `store_id=eq.${store.id}`
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setOrders((prev) => [payload.new as Order, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setOrders((prev) =>
                prev.map((o) =>
                  o.id === (payload.new as Order).id ? (payload.new as Order) : o
                )
              );
            } else if (payload.eventType === "DELETE") {
              setOrders((prev) =>
                prev.filter((o) => o.id !== (payload.old as Order).id)
              );
            }
          }
        )
        .subscribe();
    };

    setupOrders();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return { orders, loading };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) throw error;
}
