import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Check, Store, BarChart3, ShoppingCart, Package, Users, Shield,
  Smartphone, TrendingUp, ArrowRight, Sparkles, Zap, Globe, Star,
} from "lucide-react";
import heroImage from "@/assets/landing-hero.jpg";

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
  { icon: ShoppingCart, title: "Point of Sale", description: "Lightning-fast checkout with barcode scanning and M-Pesa support." },
  { icon: Package, title: "Inventory Management", description: "Track stock across locations with low-stock alerts in real time." },
  { icon: BarChart3, title: "Reports & Analytics", description: "Real-time dashboards, profit & loss, and sales trends." },
  { icon: Users, title: "Team Management", description: "Role-based access for admins, managers, and cashiers." },
  { icon: Shield, title: "Multi-Location", description: "Manage multiple stores from a single elegant dashboard." },
  { icon: Smartphone, title: "Mobile Ready", description: "Works beautifully on desktop, tablet, or phone." },
  { icon: TrendingUp, title: "Banking & Expenses", description: "Track bank accounts, expenses, and purchase orders." },
  { icon: Store, title: "Tax Management", description: "Configure VAT rates, zero-rated, and exempt items." },
];

const STATS = [
  { value: "500+", label: "Active Retailers" },
  { value: "2M+", label: "Transactions Processed" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "47", label: "Counties Served" },
];

const TESTIMONIALS = [
  { name: "Jane Wanjiru", role: "Owner, Bidii Mart", quote: "Switching to RetailPOS cut my closing time in half. The M-Pesa integration just works.", initial: "J" },
  { name: "Samuel Kiprono", role: "Manager, Highland Stores", quote: "We went from spreadsheets to real reports overnight. My accountant loves it.", initial: "S" },
  { name: "Aisha Mohammed", role: "CEO, Coast Retail Co.", quote: "Multi-location stock tracking finally makes sense. Highly recommended.", initial: "A" },
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
    <div className="min-h-screen bg-sidebar text-sidebar-foreground overflow-x-hidden">
      {/* Decorative ambient glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-sidebar-primary/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="border-b border-sidebar-border/50 bg-sidebar/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-sidebar-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">RetailPOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-sidebar-foreground/70">
            <a href="#features" className="hover:text-sidebar-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-sidebar-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-sidebar-foreground transition-colors">Customers</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
              <Link to="/auth">Start Free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Badge className="mb-6 bg-sidebar-accent border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
                <Sparkles className="h-3 w-3 mr-1.5 text-primary" />
                Built for Kenyan Retail · 2026 Edition
              </Badge>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
                Run your shop
                <span className="block bg-gradient-to-r from-primary via-sidebar-primary to-primary bg-clip-text text-transparent">
                  like a fortune 500.
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-sidebar-foreground/70 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
                The all-in-one POS, inventory, and accounting platform powering Kenya's smartest retailers. Accept M-Pesa, track stock, and grow with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 h-12 px-6 text-base">
                  <Link to="/auth">Start 14-Day Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-transparent border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground h-12 px-6 text-base">
                  View Pricing
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-sidebar-foreground/60">
                <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No credit card</div>
                <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Cancel anytime</div>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/30 via-sidebar-primary/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-sidebar-border/60 shadow-2xl shadow-primary/20">
                <img
                  src={heroImage}
                  alt="RetailPOS dashboard preview showing sales, inventory, and analytics"
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                />
              </div>
              {/* Floating mini cards */}
              <div className="absolute -bottom-6 -left-6 bg-sidebar/90 backdrop-blur-xl border border-sidebar-border rounded-xl px-4 py-3 shadow-xl hidden sm:flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-sidebar-foreground/60">Today's Revenue</div>
                  <div className="font-bold">KES 142,580</div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 bg-sidebar/90 backdrop-blur-xl border border-sidebar-border rounded-xl px-4 py-3 shadow-xl hidden sm:flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-sidebar-foreground/60">Live</div>
                  <div className="font-bold">3 stores online</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-sidebar-border/40 rounded-2xl overflow-hidden border border-sidebar-border/40">
            {STATS.map(s => (
              <div key={s.label} className="bg-sidebar p-6 text-center">
                <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary to-sidebar-primary bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-sm text-sidebar-foreground/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Badge className="mb-4 bg-sidebar-accent border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
              <Globe className="h-3 w-3 mr-1.5 text-primary" />
              Everything you need
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
              One platform. Every workflow.
            </h2>
            <p className="text-sidebar-foreground/70 text-lg">
              Replace five tools with one. From the till to the boardroom.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLATFORM_FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative bg-sidebar-accent/30 backdrop-blur border border-sidebar-border/60 rounded-2xl p-6 hover:bg-sidebar-accent/60 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
                <div className="relative">
                  <div className="rounded-xl bg-gradient-to-br from-primary/20 to-sidebar-primary/10 w-12 h-12 flex items-center justify-center mb-4 border border-primary/20">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-sidebar-foreground/60 leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-sidebar-accent border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
              <Star className="h-3 w-3 mr-1.5 text-warning" />
              Loved by retailers
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Don't take our word for it.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-sidebar-accent/30 backdrop-blur border border-sidebar-border/60 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-warning text-warning" />)}
                </div>
                <p className="text-sidebar-foreground/80 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-sidebar-primary flex items-center justify-center font-bold text-primary-foreground">
                    {t.initial}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-sidebar-foreground/60">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-sidebar-accent border border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
              Simple Pricing
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">
              Pricing that scales with you.
            </h2>
            <p className="text-sidebar-foreground/70 text-lg mb-8">No hidden fees. Cancel anytime.</p>
            <div className="inline-flex items-center gap-1 rounded-full border border-sidebar-border bg-sidebar-accent/40 backdrop-blur p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "yearly"
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                }`}
              >
                Yearly <span className="text-xs opacity-80">(save 20%)</span>
              </button>
            </div>
          </div>

          {packages.length === 0 ? (
            <p className="text-center text-sidebar-foreground/60">Pricing plans coming soon.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {packages.map((pkg, i) => {
                const featured = i === 1;
                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-2xl p-8 transition-all ${
                      featured
                        ? "bg-gradient-to-b from-primary/20 to-sidebar-accent/40 border-2 border-primary shadow-2xl shadow-primary/30 lg:scale-105"
                        : "bg-sidebar-accent/30 backdrop-blur border border-sidebar-border/60"
                    }`}
                  >
                    {featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground shadow-lg">
                          <Sparkles className="h-3 w-3 mr-1" /> Most Popular
                        </Badge>
                      </div>
                    )}
                    <h3 className="text-xl font-bold">{pkg.name}</h3>
                    {pkg.description && <p className="text-sm text-sidebar-foreground/60 mt-1">{pkg.description}</p>}
                    <div className="mt-6 mb-6">
                      <span className="text-5xl font-extrabold tracking-tight">
                        {formatKES(billingCycle === "monthly" ? pkg.monthly_price : pkg.yearly_price)}
                      </span>
                      <span className="text-sidebar-foreground/60 ml-1">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                    </div>
                    <Button
                      className={`w-full mb-6 h-11 ${
                        featured
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                          : "bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border border-sidebar-border"
                      }`}
                      asChild
                    >
                      <Link to="/auth">Start Free Trial</Link>
                    </Button>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{pkg.max_locations} location{pkg.max_locations > 1 ? "s" : ""}</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{pkg.max_products.toLocaleString()} products</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{pkg.max_users} team member{pkg.max_users > 1 ? "s" : ""}</span>
                      </li>
                      {pkg.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-sidebar-primary to-primary p-12 sm:p-16 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.2),_transparent_70%)]" />
            <div className="relative">
              <h2 className="text-4xl sm:text-5xl font-extrabold text-primary-foreground mb-4 tracking-tight">
                Ready to transform your business?
              </h2>
              <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
                Join hundreds of Kenyan retailers running smarter shops with RetailPOS.
              </p>
              <Button size="lg" asChild className="bg-sidebar text-sidebar-foreground hover:bg-sidebar/90 h-12 px-8 text-base shadow-xl">
                <Link to="/auth">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sidebar-border/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-sidebar-primary flex items-center justify-center">
              <Store className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold">RetailPOS</span>
          </div>
          <p className="text-sm text-sidebar-foreground/60">© {new Date().getFullYear()} RetailPOS. Built in 🇰🇪 for Kenya.</p>
        </div>
      </footer>
    </div>
  );
}
