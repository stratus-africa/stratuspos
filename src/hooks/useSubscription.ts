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

interface SubscriptionPackage {
  id: string;
  name: string;
  max_locations: number;
  max_products: number;
  max_users: number;
  paddle_product_id: string | null;
  paddle_monthly_price_id: string | null;
  paddle_yearly_price_id: string | null;
  sort_order: number;
}

interface PackageFeature {
  package_id: string;
  feature_key: string;
  enabled: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const environment = getPaddleEnvironment();

  const { data: subscription, isLoading: subLoading } = useQuery({
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

  // Load all active packages + their features (small dataset, cache long)
  const { data: packagesData, isLoading: pkgLoading } = useQuery({
    queryKey: ["subscription_packages_with_features"],
    queryFn: async () => {
      const [{ data: pkgs }, { data: feats }] = await Promise.all([
        supabase.from("subscription_packages").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("package_features").select("package_id, feature_key, enabled"),
      ]);
      return {
        packages: (pkgs || []) as SubscriptionPackage[],
        features: (feats || []) as PackageFeature[],
      };
    },
    staleTime: 60_000,
  });

  // Listen for realtime changes to subscription
  useEffect(() => {
    if (!user) return;
    const channelName = `subscription-changes-${user.id}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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

  const packages = packagesData?.packages ?? [];
  const features = packagesData?.features ?? [];

  // Resolve current package: matched by paddle_product_id when active subscription exists,
  // otherwise fall back to the lowest sort_order package (the entry-level "free/starter" tier).
  const currentPackage: SubscriptionPackage | null = (() => {
    if (isActive && subscription) {
      const byProduct = packages.find(p => p.paddle_product_id === subscription.product_id);
      if (byProduct) return byProduct;
      const byPrice = packages.find(p =>
        p.paddle_monthly_price_id === subscription.price_id ||
        p.paddle_yearly_price_id === subscription.price_id
      );
      if (byPrice) return byPrice;
    }
    return packages[0] ?? null;
  })();

  const enabledFeatureKeys = new Set(
    features.filter(f => f.package_id === currentPackage?.id && f.enabled).map(f => f.feature_key)
  );

  const hasFeatureKey = (key: string): boolean => {
    if (!currentPackage) return false;
    return enabledFeatureKeys.has(key);
  };

  // Legacy tier mapping kept for backwards-compat callers
  const tier: SubscriptionTier = isActive ? "pro" : "free";
  const hasFeature = (_requiredTier: SubscriptionTier): boolean => {
    // Deprecated tier API — defer to package features when possible
    return isActive;
  };

  return {
    subscription,
    isLoading: subLoading || pkgLoading,
    isActive,
    tier,
    hasFeature,
    hasFeatureKey,
    currentPackage,
    maxProducts: currentPackage?.max_products ?? 0,
    maxLocations: currentPackage?.max_locations ?? 1,
    maxUsers: currentPackage?.max_users ?? 1,
    isCanceling: subscription?.cancel_at_period_end ?? false,
  };
}
