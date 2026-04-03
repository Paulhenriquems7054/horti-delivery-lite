import { supabase } from "@/integrations/supabase/client";

export async function logAuditEvent(
  action: "login" | "logout",
  storeId?: string,
  metadata?: Record<string, any>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await (supabase as any).from("audit_logs").insert({
      store_id: storeId || null,
      user_id: user?.id || null,
      action,
      metadata: metadata || null,
    });
  } catch {
    // Silently fail — audit log should never break the app
  }
}
