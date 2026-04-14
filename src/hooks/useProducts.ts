import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  active: boolean;
  store_id?: string;
  unit?: string;
  sell_by?: string;
  price_per_kg?: number;
}

/**
 * useProducts — always scoped to a store_id (tenant).
 * If storeId is omitted, resolves from the authenticated user's store.
 */
export function useProducts(storeId?: string) {
  return useQuery({
    queryKey: ["products", storeId],
    queryFn: async () => {
      let targetStoreId = storeId;

      // Resolve from auth if not provided
      if (!targetStoreId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const { data: store } = await (supabase as any)
          .from("stores").select("id").eq("user_id", user.id).maybeSingle();
        targetStoreId = store?.id;
      }

      let query = supabase.from("products").select("*").order("name");
      if (targetStoreId) {
        query = query.eq("store_id", targetStoreId) as any;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Product, "id">) => {
      let payload = { ...input };

      // Garantir store_id para satisfazer RLS no insert
      if (!payload.store_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { data: store, error: storeError } = await (supabase as any)
          .from("stores")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (storeError) throw storeError;
        if (!store?.id) throw new Error("Loja não encontrada para o usuário");
        payload = { ...payload, store_id: store.id };
      }

      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Product> & { id: string }) => {
      const { error } = await supabase.from("products").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
