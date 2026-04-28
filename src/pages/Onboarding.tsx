import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Box, MapPin, Briefcase, CheckCircle2, ArrowLeft, ArrowRight,
  Mail, Lock, User as UserIcon, Eye, EyeOff, Building2, Zap, Tag, Loader2,
} from "lucide-react";
import { BUSINESS_TYPE_OPTIONS, BusinessType } from "@/lib/themes";

interface Plan {
  id: string;
  name: string;
  monthly_price_kes: number;
  yearly_price_kes: number;
  trial_days: number;
  max_products: number;
  max_users: number;
  max_locations: number;
}

const fmtKes = (n: number) =>
  `KES ${new Intl.NumberFormat("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)}`;

const HIGHLIGHTS = [
  "Dedicated workspace & database",
  "POS, inventory, purchases & sales",
  "Multi-warehouse & barcode support",
  "Ready in under 60 seconds",
];

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: bizLoading } = useBusiness();
  const { isSuperAdmin, loading: saLoading } = useSuperAdmin();

  if (authLoading || (user && (bizLoading || saLoading))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  // Authenticated super admin → super admin area
  if (user && isSuperAdmin) return <Navigate to="/super-admin" replace />;
  // Authenticated user with business → app
  if (user && !needsOnboarding) return <Navigate to="/" replace />;

  const isBusinessStep = !!user;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left: green gradient panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-white">
        <div className="absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full bg-white/15 blur-2xl" aria-hidden />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl" aria-hidden />
        <div className="absolute top-[55%] right-[28%] w-32 h-32 rounded-full bg-white/10" aria-hidden />
        <div className="absolute bottom-[18%] left-[25%] w-24 h-24 rounded-3xl bg-white/10" aria-hidden />

        <div />

        <div className="relative max-w-md">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-8 shadow-md">
            <Box className="h-7 w-7" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-5">
            {isBusinessStep ? "Launch your business in minutes" : "Run your shop with confidence"}
          </h1>
          <p className="text-white/85 leading-relaxed mb-10 text-base">
            {isBusinessStep
              ? "Get your own dedicated workspace with a custom subdomain, full inventory management, and everything you need to run your business."
              : "Create an account to access POS, inventory, sales, and accounting — purpose-built for Kenyan retail."}
          </p>

          <ul className="space-y-4 pt-8 border-t border-white/25">
            {HIGHLIGHTS.map(h => (
              <li key={h} className="flex items-center gap-3 text-white">
                <span className="h-7 w-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="text-[15px]">{h}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative" />
      </aside>

      {/* Right panel — form */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-6">
          <Link to="/landing" className="lg:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight">StratusPOS</span>
          </div>

          {user ? <BusinessStep /> : <AuthStep />}

          <Button asChild variant="outline" className="w-full h-11 rounded-lg font-medium">
            <Link to="/landing"><ArrowLeft className="mr-2 h-4 w-4" /> Back to homepage</Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            © {new Date().getFullYear()} StratusPOS. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

/* ---------------- Auth step (sign up / log in) ---------------- */

const AuthStep = () => {
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          {tab === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {tab === "signup"
            ? "Start your free trial — no credit card required."
            : "Sign in to continue to your workspace."}
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "signup" | "login")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
          <TabsTrigger value="login">Login</TabsTrigger>
        </TabsList>
        <TabsContent value="signup" className="mt-5">
          <SignUpForm submitting={submitting} setSubmitting={setSubmitting} />
        </TabsContent>
        <TabsContent value="login" className="mt-5">
          <LoginForm submitting={submitting} setSubmitting={setSubmitting} />
        </TabsContent>
      </Tabs>
    </>
  );
};

const SignUpForm = ({ submitting, setSubmitting }: { submitting: boolean; setSubmitting: (v: boolean) => void }) => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(email, password, fullName);
    if (error) toast.error(error.message);
    else toast.success("Account created! Please check your email to verify.");
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldWithIcon icon={UserIcon} id="su-name" label="Full name">
        <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="pl-10 h-11 rounded-lg focus-visible:ring-emerald-400 focus-visible:ring-offset-0" placeholder="Jane Wanjiku" />
      </FieldWithIcon>
      <FieldWithIcon icon={Mail} id="su-email" label="Admin email">
        <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 h-11 rounded-lg focus-visible:ring-emerald-400 focus-visible:ring-offset-0" placeholder="you@company.com" />
      </FieldWithIcon>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="su-pwd" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="su-pwd"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="pl-10 pr-9 h-11 rounded-lg focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
              placeholder="Min. 8 chars"
            />
            <button
              type="button"
              onClick={() => setShowPwd(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="su-confirm" className="text-sm font-medium">Confirm</Label>
          <div className="relative">
            <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="su-confirm"
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              className="pl-10 h-11 rounded-lg focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
              placeholder="Repeat"
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-11 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/20"
      >
        {submitting ? "Creating account..." : (<>Create account <ArrowRight className="ml-2 h-4 w-4" /></>)}
      </Button>
    </form>
  );
};

const LoginForm = ({ submitting, setSubmitting }: { submitting: boolean; setSubmitting: (v: boolean) => void }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FieldWithIcon icon={Mail} id="li-email" label="Email">
        <Input id="li-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 h-11 rounded-lg focus-visible:ring-emerald-400 focus-visible:ring-offset-0" placeholder="you@business.com" />
      </FieldWithIcon>
      <div className="space-y-1.5">
        <Label htmlFor="li-password" className="text-sm font-medium">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="li-password"
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10 pr-10 h-11 rounded-lg focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
            placeholder="Your password"
          />
          <button
            type="button"
            onClick={() => setShowPwd(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-11 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/20"
      >
        {submitting ? "Signing in..." : (<>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>)}
      </Button>
    </form>
  );
};

const FieldWithIcon = ({
  icon: Icon, id, label, children,
}: { icon: React.ElementType; id: string; label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      {children}
    </div>
  </div>
);

/* ---------------- Business creation step ---------------- */

const BusinessStep = () => {
  const { createBusiness } = useBusiness();
  const { user } = useAuth();
  const [businessName, setBusinessName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("general");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load active public plans for the signup picker.
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("subscription_packages")
        .select("id, name, monthly_price_kes, yearly_price_kes, trial_days, max_products, max_users, max_locations")
        .eq("is_active", true)
        .order("monthly_price_kes", { ascending: true });
      const list = (data as Plan[]) || [];
      setPlans(list);
      // Default to the cheapest non-zero plan, or the first available.
      const firstPaid = list.find(p => Number(p.monthly_price_kes) > 0) || list[0];
      if (firstPaid) setSelectedPlanId(firstPaid.id);
      setPlansLoading(false);
    })();
  }, []);

  const filled = [!!businessName, !!businessType, !!locationName, !!selectedPlanId].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (plans.length > 0 && !selectedPlanId) {
      toast.error("Please choose a plan to continue");
      return;
    }
    setIsSubmitting(true);
    const { error } = await createBusiness(businessName, locationName, businessType);
    if (error) {
      toast.error(error.message);
      setIsSubmitting(false);
      return;
    }
    // Persist the chosen plan as a trialing subscription so the tenant inherits its features.
    if (selectedPlanId && user) {
      const plan = plans.find(p => p.id === selectedPlanId);
      const trialDays = Math.max(0, plan?.trial_days ?? 14);
      const now = new Date();
      const trialEnd = new Date(now.getTime() + trialDays * 86400000);
      await supabase.from("subscriptions").insert({
        user_id: user.id,
        product_id: selectedPlanId,
        status: trialDays > 0 ? "trialing" : "active",
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        environment: "test",
      } as any);
    }
    toast.success("Business created successfully!");
    setIsSubmitting(false);
  };

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">
          Create your workspace
        </h2>
        <p className="text-muted-foreground text-sm">
          Set up your business, choose a plan, and we'll get you up and running.
        </p>
      </div>

      {/* Progress dashes */}
      <div className="flex gap-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < filled ? "bg-gradient-to-r from-emerald-500 to-teal-600" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWithIcon icon={Building2} id="business-name" label="Company name">
          <Input
            id="business-name"
            placeholder="Acme Inc."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="pl-10 h-11 rounded-lg focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
            required
          />
        </FieldWithIcon>

        <div className="space-y-1.5">
          <Label htmlFor="business-type" className="text-sm font-medium">Business type</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Select value={businessType} onValueChange={(v) => setBusinessType(v as BusinessType)}>
              <SelectTrigger id="business-type" className="pl-10 h-11 rounded-lg focus:ring-emerald-400 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {businessType === "pharmacy" && (
            <p className="text-xs text-muted-foreground">
              Batch tracking with expiry dates (FEFO) will be enabled for your products.
            </p>
          )}
        </div>

        <FieldWithIcon icon={MapPin} id="location-name" label="First location">
          <Input
            id="location-name"
            placeholder="e.g. Main Branch"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            className="pl-10 h-11 rounded-lg focus-visible:ring-emerald-400 focus-visible:ring-offset-0"
            required
          />
        </FieldWithIcon>

        {/* Plan picker — sourced from active subscription_packages */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            Choose a plan
          </Label>
          {plansLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
            </div>
          ) : plans.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No plans configured yet — you'll be set up on the default tier.
            </p>
          ) : (
            <div className="grid gap-2">
              {plans.map((p) => {
                const selected = selectedPlanId === p.id;
                const monthly = Number(p.monthly_price_kes || 0);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`text-left rounded-lg border p-3 transition-all flex items-center justify-between gap-3 ${
                      selected
                        ? "border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30"
                        : "border-border bg-white hover:border-emerald-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{p.name}</p>
                        {p.trial_days > 0 && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5">
                            {p.trial_days}-day trial
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {p.max_products < 0 ? "Unlimited" : p.max_products.toLocaleString()} products ·{" "}
                        {p.max_users < 0 ? "∞" : p.max_users} user{p.max_users === 1 ? "" : "s"} ·{" "}
                        {p.max_locations < 0 ? "∞" : p.max_locations} location{p.max_locations === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{monthly === 0 ? "Free" : fmtKes(monthly)}</p>
                      {monthly > 0 && <p className="text-[10px] text-muted-foreground">/ month</p>}
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full shrink-0 flex items-center justify-center ml-1 ${
                        selected ? "bg-emerald-600 text-white" : "border border-border"
                      }`}
                    >
                      {selected && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold shadow-md shadow-emerald-500/20"
        >
          {isSubmitting ? "Setting up..." : (<>Create workspace <ArrowRight className="ml-2 h-4 w-4" /></>)}
        </Button>
      </form>
    </>
  );
};

export default Onboarding;
