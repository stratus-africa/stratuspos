import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription, type SubscriptionTier } from "@/hooks/useSubscription";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { supabase } from "@/integrations/supabase/client";
import { getPaddleEnvironment } from "@/lib/paddle";
import { toast } from "sonner";
import { Check, Crown, Zap, Building2, Loader2, ExternalLink } from "lucide-react";

const plans: {
  id: SubscriptionTier;
  name: string;
  price: string;
  priceId?: string;
  yearlyPriceId?: string;
  yearlyPrice?: string;
  description: string;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    price: "KES 0/mo",
    description: "Get started with basic POS features",
    features: [
      "Up to 20 products",
      "Single location",
      "Basic POS",
      "Sales tracking",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: "$15/mo",
    yearlyPrice: "$150/yr",
    priceId: "basic_monthly",
    yearlyPriceId: "basic_yearly",
    description: "Full POS features for growing businesses",
    features: [
      "Unlimited products",
      "Single location",
      "Full POS features",
      "Inventory management",
      "Customer management",
      "Expense tracking",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "$39/mo",
    yearlyPrice: "$390/yr",
    priceId: "pro_monthly",
    yearlyPriceId: "pro_yearly",
    description: "Everything you need for multi-location retail",
    features: [
      "Everything in Basic",
      "Multi-location support",
      "Advanced reports",
      "Bank reconciliation",
      "Chart of accounts",
      "Priority support",
    ],
  },
];

const tierIcons: Record<SubscriptionTier, React.ReactNode> = {
  free: <Zap className="h-5 w-5" />,
  basic: <Building2 className="h-5 w-5" />,
  pro: <Crown className="h-5 w-5" />,
};

export function SubscriptionTab() {
  const { user } = useAuth();
  const { subscription, tier, isActive, isCanceling, isLoading } = useSubscription();
  const { openCheckout, loading: checkoutLoading } = usePaddleCheckout();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSubscribe = (priceId: string) => {
    if (!user) return;
    openCheckout({
      priceId,
      customerEmail: user.email,
      customData: { userId: user.id },
    });
  };

  const handleManageBilling = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const environment = getPaddleEnvironment();
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        body: { userId: user.id, environment },
      });
      if (error || !data?.url) throw new Error("Could not open billing portal");
      window.open(data.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tierIcons[tier]}
            Current Plan: {plans.find((p) => p.id === tier)?.name || "Free"}
          </CardTitle>
          <CardDescription>
            {isActive && subscription ? (
              <>
                {isCanceling ? (
                  <span className="text-orange-600">
                    Canceling — access until{" "}
                    {new Date(subscription.current_period_end!).toLocaleDateString()}
                  </span>
                ) : (
                  <span>
                    Next billing:{" "}
                    {subscription.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString()
                      : "—"}
                  </span>
                )}
              </>
            ) : (
              "You're on the free plan. Upgrade to unlock more features."
            )}
          </CardDescription>
        </CardHeader>
        {isActive && subscription && (
          <CardContent>
            <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading}>
              {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <ExternalLink className="mr-2 h-4 w-4" />
              Manage Billing
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Billing Toggle */}
      <div className="flex justify-center gap-2">
        <Button
          variant={billingInterval === "monthly" ? "default" : "outline"}
          size="sm"
          onClick={() => setBillingInterval("monthly")}
        >
          Monthly
        </Button>
        <Button
          variant={billingInterval === "yearly" ? "default" : "outline"}
          size="sm"
          onClick={() => setBillingInterval("yearly")}
        >
          Yearly (save ~17%)
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === tier;
          const priceId =
            billingInterval === "yearly" && plan.yearlyPriceId
              ? plan.yearlyPriceId
              : plan.priceId;
          const displayPrice =
            billingInterval === "yearly" && plan.yearlyPrice
              ? plan.yearlyPrice
              : plan.price;

          return (
            <Card
              key={plan.id}
              className={`relative ${isCurrent ? "border-primary ring-2 ring-primary/20" : ""}`}
            >
              {isCurrent && (
                <Badge className="absolute -top-2.5 left-4">Current Plan</Badge>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  {tierIcons[plan.id]}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <div className="text-2xl font-bold">{displayPrice}</div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.id === "free" ? (
                  <Button variant="outline" className="w-full" disabled>
                    {isCurrent ? "Current Plan" : "Downgrade"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    disabled={isCurrent || checkoutLoading || !priceId}
                    onClick={() => priceId && handleSubscribe(priceId)}
                  >
                    {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isCurrent ? "Current Plan" : "Subscribe"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
