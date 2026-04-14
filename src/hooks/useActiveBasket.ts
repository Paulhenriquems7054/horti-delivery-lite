import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BasketProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  unit: string;
  quantity: number;
  in_stock?: boolean;
  description?: string;
  category_id?: string;
  sell_by: "unit" | "weight" | "both";
  price_per_kg?: number;
  min_weight?: number;
  step_weight?: number;
  average_weight?: number;
  weight_variance?: number;
  price_per_unit?: number;
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
      // 1. Busca a cesta ativa — tenta filtrar por store_id se disponível,
      //    mas cai no fallback global se não encontrar nada
      let basket: any = null;

      if (storeId) {
        const { data, error } = await supabase
          .from("baskets")
          .select("*")
          .eq("store_id", storeId)
          .eq("active", true)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        basket = data;
      }

      // Fallback: pega qualquer cesta ativa (sem filtro de loja)
      if (!basket) {
        const { data, error } = await supabase
          .from("baskets")
          .select("*")
          .eq("active", true)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        basket = data;
      }

      if (!basket) return null;

      // 2. Busca os itens com dados dos produtos
      const { data: items, error: iErr } = await supabase
        .from("basket_items")
        .select("quantity, products(id, name, price, image_url, unit, description, category_id, active, in_stock, sell_by, price_per_kg, min_weight, step_weight, average_weight, weight_variance, price_per_unit)")
        .eq("basket_id", basket.id);

      if (iErr) throw iErr;

      const products: BasketProduct[] = (items ?? [])
        .filter((item: any) => item.products != null && item.products.active !== false)
        .map((item: any) => ({
          id: item.products.id,
          name: item.products.name,
          price: item.products.price,
          image_url: item.products.image_url,
          unit: item.products.unit || "un",
          quantity: item.quantity,
          in_stock: item.products.in_stock,
          description: item.products.description,
          category_id: item.products.category_id,
          sell_by: item.products.sell_by || "unit",
          price_per_kg: item.products.price_per_kg,
          min_weight: item.products.min_weight || 0.25,
          step_weight: item.products.step_weight || 0.25,
          average_weight: item.products.average_weight,
          weight_variance: item.products.weight_variance ?? 0.15,
          price_per_unit: item.products.price_per_unit,
        }));

      return {
        id: basket.id,
        name: basket.name,
        price: basket.price,
        products,
      };
    },
    staleTime: 30_000,
  });
}
