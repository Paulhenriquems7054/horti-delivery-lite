import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
}

export function useStoreInfo(slug: string | undefined) {
  return useQuery({
    queryKey: ["store-info", slug],
    queryFn: async () => {
      if (!slug) throw new Error("Slug não fornecido");
      
      const { data, error } = await (supabase as any)
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      if (error) throw error;
      return data as StoreInfo | null;
    },
    enabled: !!slug,
  });
}
