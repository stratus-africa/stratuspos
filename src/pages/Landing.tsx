import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check, Store, BarChart3, ShoppingCart, Package, Users, Shield,
  Smartphone, TrendingUp, ArrowRight, Sparkles, Globe, Star,
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

const TEAL = "hsl(var(--teal))";

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
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: TEAL }}>
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">RetailPOS</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-slate-900 transition-colors">Customers</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild className="text-slate-700 hover:bg-slate-100 hover:text-slate-900">
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild className="text-white shadow-sm" style={{ backgroundColor: TEAL }}>
              <Link to="/auth">Start Free <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero with image background */}
      <section className="relative">
        <div className="absolute inset-0 -z-0">
          <img
            src={heroImage}
            alt="RetailPOS in a modern retail boutique"
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/30" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-40">
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Badge className="mb-6 border text-slate-700 hover:bg-white" style={{ backgroundColor: "hsl(var(--teal-soft))", borderColor: TEAL, color: TEAL }}>
              <Sparkles className="h-3 w-3 mr-1.5" />
              Built for Kenyan Retail · 2026 Edition
            </Badge>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 text-slate-900">
              Run your shop
              <span className="block" style={{ color: TEAL }}>
                like a fortune 500.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-xl mb-8 leading-relaxed">
              The all-in-one POS, inventory, and accounting platform powering Kenya's smartest retailers. Accept M-Pesa, track stock, and grow with confidence.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="text-white h-12 px-6 text-base shadow-md" style={{ backgroundColor: TEAL }}>
                <Link to="/auth">Start 14-Day Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-white border-slate-300 text-slate-800 hover:bg-slate-50 h-12 px-6 text-base">
                View Pricing
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: TEAL }} /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: TEAL }} /> Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold" style={{ color: TEAL }}>
                {s.value}
              </div>
              <div className="text-sm text-slate-600 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Badge className="mb-4 border" style={{ backgroundColor: "hsl(var(--teal-soft))", borderColor: TEAL, color: TEAL }}>
              <Globe className="h-3 w-3 mr-1.5" />
              Everything you need
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight text-slate-900">
              One platform. Every workflow.
            </h2>
            <p className="text-slate-600 text-lg">
              Replace five tools with one. From the till to the boardroom.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLATFORM_FEATURES.map(f => (
              <div
                key={f.title}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-teal-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ ['--tw-border-opacity' as any]: 1 }}
              >
                <div className="rounded-xl w-12 h-12 flex items-center justify-center mb-4" style={{ backgroundColor: "hsl(var(--teal-soft))" }}>
                  <f.icon className="h-6 w-6" style={{ color: TEAL }} />
                </div>
                <h3 className="font-bold text-base mb-2 text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 border" style={{ backgroundColor: "hsl(var(--teal-soft))", borderColor: TEAL, color: TEAL }}>
              <Star className="h-3 w-3 mr-1.5" />
              Loved by retailers
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
              Don't take our word for it.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: TEAL }}>
                    {t.initial}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 border" style={{ backgroundColor: "hsl(var(--teal-soft))", borderColor: TEAL, color: TEAL }}>
              Simple Pricing
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight text-slate-900">
              Pricing that scales with you.
            </h2>
            <p className="text-slate-600 text-lg mb-8">No hidden fees. Cancel anytime.</p>
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                style={billingCycle === "monthly" ? { backgroundColor: TEAL } : undefined}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "yearly"
                    ? "text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                style={billingCycle === "yearly" ? { backgroundColor: TEAL } : undefined}
              >
                Yearly <span className="text-xs opacity-80">(save 20%)</span>
              </button>
            </div>
          </div>

          {packages.length === 0 ? (
            <p className="text-center text-slate-500">Pricing plans coming soon.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {packages.map((pkg, i) => {
                const featured = i === 1;
                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-2xl p-8 transition-all bg-white ${
                      featured
                        ? "border-2 shadow-xl lg:scale-105"
                        : "border border-slate-200 shadow-sm"
                    }`}
                    style={featured ? { borderColor: TEAL } : undefined}
                  >
                    {featured && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="text-white shadow" style={{ backgroundColor: TEAL }}>
                          <Sparkles className="h-3 w-3 mr-1" /> Most Popular
                        </Badge>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                    {pkg.description && <p className="text-sm text-slate-600 mt-1">{pkg.description}</p>}
                    <div className="mt-6 mb-6">
                      <span className="text-5xl font-extrabold tracking-tight text-slate-900">
                        {formatKES(billingCycle === "monthly" ? pkg.monthly_price : pkg.yearly_price)}
                      </span>
                      <span className="text-slate-500 ml-1">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                    </div>
                    <Button
                      className={`w-full mb-6 h-11 ${featured ? "text-white shadow-md" : "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"}`}
                      style={featured ? { backgroundColor: TEAL } : undefined}
                      asChild
                    >
                      <Link to="/auth">Start Free Trial</Link>
                    </Button>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: TEAL }} />
                        <span>{pkg.max_locations} location{pkg.max_locations > 1 ? "s" : ""}</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: TEAL }} />
                        <span>{pkg.max_products.toLocaleString()} products</span>
                      </li>
                      <li className="flex items-start gap-2.5 text-sm text-slate-700">
                        <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: TEAL }} />
                        <span>{pkg.max_users} team member{pkg.max_users > 1 ? "s" : ""}</span>
                      </li>
                      {pkg.features.map(f => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                          <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: TEAL }} />
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
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl p-12 sm:p-16 text-center" style={{ backgroundColor: TEAL }}>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
              Ready to transform your business?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join hundreds of Kenyan retailers running smarter shops with RetailPOS.
            </p>
            <Button size="lg" asChild className="bg-white text-slate-900 hover:bg-slate-100 h-12 px-8 text-base shadow-lg">
              <Link to="/auth">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: TEAL }}>
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900">RetailPOS</span>
          </div>
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} RetailPOS. Built in 🇰🇪 for Kenya.</p>
        </div>
      </footer>
    </div>
  );
}
