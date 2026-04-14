import React from "react";
import { useSubscription, type SubscriptionTier } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  requiredTier: SubscriptionTier;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ requiredTier, children, fallback }: FeatureGateProps) {
  const { hasFeature, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading) return <>{children}</>;

  if (!hasFeature(requiredTier)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <Lock className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Upgrade Required</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This feature requires the {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} plan or higher.
        </p>
        <Button onClick={() => navigate("/settings?tab=subscription")}>
          View Plans
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

export function useFeatureLimit() {
  const { tier } = useSubscription();

  const maxProducts = tier === "free" ? 20 : Infinity;
  const maxLocations = tier === "pro" ? Infinity : 1;
  const canAccessReports = tier === "pro";
  const canAccessBanking = tier === "pro";
  const canAccessChartOfAccounts = tier === "pro";

  return { maxProducts, maxLocations, canAccessReports, canAccessBanking, canAccessChartOfAccounts, tier };
}
