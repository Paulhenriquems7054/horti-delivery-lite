import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";

export interface BasketProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  unit: string;
  quantity: number;
}

export interface ActiveBasket {
  id: string;
  name: string;
  price: number;
  products: BasketProduct[];
}

export function useActiveBasket(storeId?: string) {
  return useQuery<ActiveBasket | null>({
    queryKey: ["active-basket", storeId],
    queryFn: async () => {
      let targetStoreId = storeId;
      
      if (!targetStoreId) {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return null;
        const { data: store } = await (supabase as any).from("stores").select("id").eq("owner_id", authData.user.id).single();
        targetStoreId = store?.id;
      }

      if (!targetStoreId) return null;

      // 1. Busca a cesta ativa
      const { data: basket, error: bErr } = await (supabase as any)
        .from("baskets")
        .select("*")
        .eq("store_id", targetStoreId)
        .eq("active", true)
        .limit(1)
        .maybeSingle();

      if (bErr) throw bErr;
      if (!basket) return null;

      // 2. Busca os itens com dados dos produtos via join (incluindo unit e in_stock)
      const { data: items, error: iErr } = await supabase
        .from("basket_items")
        .select("quantity, products(id, name, price, image_url, unit, in_stock)")
        .eq("basket_id", basket.id);

      if (iErr) throw iErr;

      const products: BasketProduct[] = (items ?? [])
        .filter((item: any) => item.products?.in_stock !== false)
        .map((item: any) => ({
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        image_url: item.products.image_url,
        unit: item.products.unit || "un",
        quantity: item.quantity,
      }));

      return {
        id: basket.id,
        name: basket.name,
        price: basket.price,
        products,
      };
    },
    staleTime: 60_000,
  });
}
