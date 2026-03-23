import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";

export interface BasketProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
}

export interface ActiveBasket {
  id: string;
  name: string;
  price: number;
  products: BasketProduct[];
}

export function useActiveBasket() {
  return useQuery<ActiveBasket | null>({
    queryKey: ["active-basket"],
    queryFn: async () => {
      // 1. Busca a cesta ativa
      const { data: basket, error: bErr } = await supabase
        .from("baskets")
        .select("*")
        .eq("active", true)
        .limit(1)
        .maybeSingle();

      if (bErr) throw bErr;
      if (!basket) return null;

      // 2. Busca os itens com dados dos produtos via join
      const { data: items, error: iErr } = await supabase
        .from("basket_items")
        .select("quantity, products(id, name, price, image_url)")
        .eq("basket_id", basket.id);

      if (iErr) throw iErr;

      const products: BasketProduct[] = (items ?? []).map((item: any) => ({
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        image_url: item.products.image_url,
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
