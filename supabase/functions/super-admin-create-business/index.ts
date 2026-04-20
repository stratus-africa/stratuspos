import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateBusinessBody {
  businessName: string;
  currency?: string;
  timezone?: string;
  taxRate?: number;
  ownerFullName: string;
  ownerEmail: string;
  ownerPassword: string;
  locationName?: string;
  packageId?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = claims.claims.sub as string;

    // Verify caller is super admin
    const { data: isSA } = await supabase.rpc("is_super_admin", { _user_id: callerId });
    if (!isSA) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as CreateBusinessBody;
    const requiredOk =
      body?.businessName?.trim() &&
      body?.ownerFullName?.trim() &&
      body?.ownerEmail?.trim() &&
      body?.ownerPassword &&
      body.ownerPassword.length >= 6;

    if (!requiredOk) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (business name, owner name/email, password ≥ 6 chars)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Create the auth user
    const { data: createdUser, error: userErr } = await admin.auth.admin.createUser({
      email: body.ownerEmail.trim().toLowerCase(),
      password: body.ownerPassword,
      email_confirm: true,
      user_metadata: { full_name: body.ownerFullName.trim() },
    });
    if (userErr || !createdUser?.user) {
      return new Response(
        JSON.stringify({ error: userErr?.message || "Failed to create user" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const newUserId = createdUser.user.id;

    // 2. Create the business
    const { data: biz, error: bizErr } = await admin
      .from("businesses")
      .insert({
        name: body.businessName.trim(),
        currency: body.currency || "KES",
        timezone: body.timezone || "Africa/Nairobi",
        tax_rate: body.taxRate ?? 16,
        owner_id: newUserId,
      })
      .select()
      .single();
    if (bizErr || !biz) {
      // rollback user
      await admin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: bizErr?.message || "Failed to create business" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Update profile to link business (the handle_new_user trigger created the row already)
    await admin.from("profiles").update({ business_id: biz.id }).eq("id", newUserId);

    // 4. Assign admin role
    await admin.from("user_roles").insert({
      user_id: newUserId,
      role: "admin",
      business_id: biz.id,
    });

    // 5. Create initial location
    await admin.from("locations").insert({
      business_id: biz.id,
      name: body.locationName?.trim() || "Main Store",
      type: "store",
    });

    // 6. Optional: create a comp/manual subscription so the business immediately gets a plan
    if (body.packageId) {
      const { data: pkg } = await admin
        .from("subscription_packages")
        .select("*")
        .eq("id", body.packageId)
        .maybeSingle();
      if (pkg) {
        const env = (Deno.env.get("PAYSTACK_SECRET_KEY") || "").startsWith("sk_test_")
          ? "sandbox"
          : "live";
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await admin.from("subscriptions").insert({
          user_id: newUserId,
          environment: env,
          status: "active",
          product_id: pkg.id,
          price_id: "manual_assign",
          paddle_customer_id: body.ownerEmail.trim().toLowerCase(),
          paddle_subscription_id: `manual_${Date.now()}`,
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd.toISOString(),
          cancel_at_period_end: false,
        });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        business: { id: biz.id, name: biz.name },
        owner: { id: newUserId, email: body.ownerEmail },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("super-admin-create-business error", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
