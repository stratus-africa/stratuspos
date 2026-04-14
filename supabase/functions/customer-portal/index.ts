import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import { getPaddleClient, type PaddleEnv } from '../_shared/paddle.ts';

const responseHeaders = {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Content-Type": "application/json",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, responseHeaders);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { userId, environment } = await req.json();
  if (!userId || !environment) {
    return new Response(JSON.stringify({ error: "userId and environment required" }), {
      status: 400,
      ...responseHeaders,
    });
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('paddle_customer_id, paddle_subscription_id')
    .eq('user_id', userId)
    .eq('environment', environment)
    .single();

  if (!sub) {
    return new Response(JSON.stringify({ error: "No subscription found" }), {
      status: 404,
      ...responseHeaders,
    });
  }

  const paddle = getPaddleClient(environment as PaddleEnv);
  const portalSession = await paddle.customerPortalSessions.create(
    sub.paddle_customer_id,
    [sub.paddle_subscription_id]
  );

  return new Response(JSON.stringify({ url: portalSession.urls.general.overview }), responseHeaders);
});
