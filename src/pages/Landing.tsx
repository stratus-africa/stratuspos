import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Store, BarChart3, ShoppingCart, Package, Users, Shield, Smartphone, TrendingUp, ArrowRight } from "lucide-react";

interface PkgDisplay {
  id: string;
  name: string;
  description: string | null;
  monthly_price: number;
  yearly_price: number;
  max_locations: number;
  max_products: number;
  max_users: number;
  features: string[];
}

const PLATFORM_FEATURES = [
  { icon: ShoppingCart, title: "Point of Sale", description: "Fast, intuitive checkout with barcode scanning and M-Pesa support." },
  { icon: Package, title: "Inventory Management", description: "Track stock across locations with low-stock alerts and barcode scanning." },
  { icon: BarChart3, title: "Reports & Analytics", description: "Real-time dashboards, profit & loss, and sales trends." },
  { icon: Users, title: "Team Management", description: "Role-based access for admins, managers, and cashiers." },
  { icon: Shield, title: "Multi-Location", description: "Manage multiple stores from a single dashboard." },
  { icon: Smartphone, title: "Mobile Ready", description: "Works on any device — desktop, tablet, or phone." },
  { icon: TrendingUp, title: "Banking & Expenses", description: "Track bank accounts, expenses, and purchase orders." },
  { icon: Store, title: "Tax Management", description: "Configure VAT rates, zero-rated, and exempt items." },
];

export default function Landing() {
  const [packages, setPackages] = useState<PkgDisplay[]>([]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    const fetch = async () => {
      const { data: pkgs } = await supabase
        .from("subscription_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (!pkgs || pkgs.length === 0) return;

      const { data: feats } = await supabase
        .from("package_features")
        .select("*")
        .eq("enabled", true);

      const result: PkgDisplay[] = (pkgs as any[]).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        monthly_price: p.monthly_price,
        yearly_price: p.yearly_price,
        max_locations: p.max_locations,
        max_products: p.max_products,
        max_users: p.max_users,
        features: (feats as any[] || [])
          .filter(f => f.package_id === p.id)
          .map(f => f.feature_label),
      }));
      setPackages(result);
    };
    fetch();
  }, []);

  const formatKES = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Store className="h-7 w-7" />
            <span className="text-xl font-bold">RetailPOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link to="/auth">Login</Link></Button>
            <Button asChild><Link to="/auth">Get Started</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
          <Badge variant="secondary" className="mb-4">🇰🇪 Built for Kenyan Retail</Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
            The Modern POS for
            <span className="text-primary block">Growing Businesses</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Manage sales, inventory, expenses, and team — all in one place. Accept M-Pesa, track stock across locations, and grow with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/auth">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>
              View Pricing
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Everything You Need to Run Your Shop</h2>
            <p className="text-muted-foreground text-lg">Powerful tools designed for Kenyan retail businesses</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_FEATURES.map(f => (
              <Card key={f.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="rounded-lg bg-primary/10 w-10 h-10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg mb-6">Choose the plan that fits your business</p>
            <div className="inline-flex items-center gap-2 rounded-lg border p-1">
              <Button
                variant={billingCycle === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </Button>
              <Button
                variant={billingCycle === "yearly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly
              </Button>
            </div>
          </div>

          {packages.length === 0 ? (
            <p className="text-center text-muted-foreground">Pricing plans coming soon.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {packages.map((pkg, i) => (
                <Card key={pkg.id} className={`relative ${i === 1 ? "border-primary shadow-lg scale-105" : ""}`}>
                  {i === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    {pkg.description && <p className="text-sm text-muted-foreground">{pkg.description}</p>}
                    <div className="mt-4">
                      <span className="text-4xl font-extrabold">
                        {formatKES(billingCycle === "monthly" ? pkg.monthly_price : pkg.yearly_price)}
                      </span>
                      <span className="text-muted-foreground">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {pkg.max_locations} location{pkg.max_locations > 1 ? "s" : ""}
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {pkg.max_products} products
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        {pkg.max_users} team member{pkg.max_users > 1 ? "s" : ""}
                      </li>
                      {pkg.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={i === 1 ? "default" : "outline"} asChild>
                      <Link to="/auth">Start Free Trial</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-primary-foreground/80 text-lg mb-8">
            Join hundreds of Kenyan retailers using RetailPOS. Start your free trial today.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Store className="h-5 w-5" />
            <span className="font-semibold">RetailPOS</span>
          </div>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} RetailPOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
