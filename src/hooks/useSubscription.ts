import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPaddleEnvironment } from "@/lib/paddle";

export type SubscriptionTier = "free" | "basic" | "pro";

interface Subscription {
  id: string;
  user_id: string;
  paddle_subscription_id: string;
  paddle_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
}

const productTierMap: Record<string, SubscriptionTier> = {
  basic_plan: "basic",
  pro_plan: "pro",
};

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const environment = getPaddleEnvironment();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", user?.id, environment],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("environment", environment)
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user,
  });

  // Listen for realtime changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["subscription", user.id, environment] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, environment, queryClient]);

  const isActive = subscription
    ? ["active", "trialing"].includes(subscription.status) &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())
    : false;

  const tier: SubscriptionTier = subscription && isActive
    ? productTierMap[subscription.product_id] || "free"
    : "free";

  const hasFeature = (requiredTier: SubscriptionTier): boolean => {
    const tierLevel: Record<SubscriptionTier, number> = { free: 0, basic: 1, pro: 2 };
    return tierLevel[tier] >= tierLevel[requiredTier];
  };

  return {
    subscription,
    isLoading,
    isActive,
    tier,
    hasFeature,
    isCanceling: subscription?.cancel_at_period_end ?? false,
  };
}
