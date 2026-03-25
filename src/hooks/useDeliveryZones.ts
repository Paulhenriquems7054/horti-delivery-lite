import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/services/supabase";

export interface DeliveryZone {
  id: string;
  neighborhood: string;
  fee: number;
}

export function useDeliveryZones(storeId?: string) {
  return useQuery({
    queryKey: ["delivery-zones", storeId],
    queryFn: async () => {
      let targetStoreId = storeId;
      
      // Modo Admin: se não passou storeId, buscar o store logado
      if (!targetStoreId) {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return [];
        const { data: store } = await (supabase as any).from("stores").select("id").eq("owner_id", authData.user.id).single();
        targetStoreId = store?.id;
      }

      if (!targetStoreId) return [];

      const { data, error } = await (supabase as any)
        .from("delivery_zones")
        .select("*")
        .eq("store_id", targetStoreId)
        .order("neighborhood");
      
      if (error) throw error;
      return data as DeliveryZone[];
    },
  });
}

export function useManageDeliveryZone() {
  const qc = useQueryClient();
  
  const addZone = useMutation({
    mutationFn: async (zone: Omit<DeliveryZone, "id">) => {
      const { data: store } = await (supabase as any).from("stores").select("id").limit(1).single();
      const storeId = store?.id || null;

      const { error } = await (supabase as any)
        .from("delivery_zones")
        .insert({ ...zone, store_id: storeId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-zones"] }),
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("delivery_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["delivery-zones"] }),
  });

  return { addZone, deleteZone };
}
