import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";
import type { BasketProduct } from "./useActiveBasket";

interface CreateOrderInput {
  customer_name: string;
  phone: string;
  address: string;
  total: number;
  products: BasketProduct[];
  storeId?: string;
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      // 1. Cria o pedido
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          customer_name: input.customer_name,
          phone: input.phone,
          address: input.address,
          total: input.total,
          status: "pending",
          store_id: input.storeId,
        })
        .select()
        .single();

      if (oErr) throw oErr;

      // 2. Cria os itens do pedido
      const orderItems = input.products.map((p) => ({
        order_id: order.id,
        product_id: p.id,
        quantity: p.quantity,
      }));

      const { error: iErr } = await supabase.from("order_items").insert(orderItems);

      if (iErr) throw iErr;

      return order;
    },
  });
}
