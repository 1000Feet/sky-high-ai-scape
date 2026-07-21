import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: orders, error } = await supabase
      .from("revideo_orders")
      .select("id")
      .eq("payment_status", "pending")
      .lt("created_at", cutoff);
    if (error) throw error;

    let deleted = 0;
    for (const o of orders || []) {
      const { data: assets } = await supabase.from("revideo_assets").select("storage_path").eq("order_id", o.id);
      for (const a of assets || []) {
        await supabase.storage.from("revideo-assets").remove([a.storage_path]);
      }
      await supabase.from("revideo_assets").delete().eq("order_id", o.id);
      await supabase.from("revideo_orders").delete().eq("id", o.id);
      deleted++;
    }

    return new Response(JSON.stringify({ deleted }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
