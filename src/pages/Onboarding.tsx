import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusiness } from "@/contexts/BusinessContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Package, Store, MapPin, Briefcase, CheckCircle2, ArrowLeft, ArrowRight,
  Mail, Lock, User as UserIcon,
} from "lucide-react";
import { BUSINESS_TYPE_OPTIONS, BusinessType } from "@/lib/themes";

const HIGHLIGHTS = [
  "Dedicated workspace & team accounts",
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal" />
      </div>
    );
  }

  // Authenticated super admin → super admin area
  if (user && isSuperAdmin) return <Navigate to="/super-admin" replace />;
  // Authenticated user with business → app
  if (user && !needsOnboarding) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-teal via-teal to-teal-deep text-teal-foreground">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-foreground/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-teal-foreground/10 blur-3xl" aria-hidden />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-3xl bg-teal-foreground/5 backdrop-blur-sm" aria-hidden />
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 rounded-full bg-teal-foreground/5 backdrop-blur-sm" aria-hidden />

        <Link to="/landing" className="relative flex items-center gap-2 text-teal-foreground/90 hover:text-teal-foreground transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to homepage
        </Link>

        <div className="relative max-w-md">
          <div className="h-14 w-14 rounded-2xl bg-teal-foreground/15 backdrop-blur-sm border border-teal-foreground/20 flex items-center justify-center mb-8">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl leading-tight tracking-tight mb-5">
            {user ? "Launch your business in minutes" : "Run your shop with confidence"}
          </h1>
          <p className="text-teal-foreground/80 leading-relaxed mb-10">
            {user
              ? "Get your own dedicated workspace with full inventory management, and everything you need to run your business."
              : "Create an account to access POS, inventory, sales, and accounting — purpose-built for Kenyan retail."}
          </p>

          <ul className="space-y-4 pt-6 border-t border-teal-foreground/20">
            {HIGHLIGHTS.map(h => (
              <li key={h} className="flex items-center gap-3 text-teal-foreground/95">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-teal-foreground/60">
          © {new Date().getFullYear()} StratusPOS. All rights reserved.
        </div>
      </aside>

      {/* Right panel — form */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-7">
          <Link to="/landing" className="lg:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-teal flex items-center justify-center">
              <Store className="h-5 w-5 text-teal-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">StratusPOS</span>
          </div>

          {user ? <BusinessStep /> : <AuthStep />}

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
        <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
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
        <TabsContent value="signup" className="mt-6">
          <SignUpForm submitting={submitting} setSubmitting={setSubmitting} />
        </TabsContent>
        <TabsContent value="login" className="mt-6">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signUp(email, password, fullName);
    if (error) toast.error(error.message);
    else toast.success("Account created! Please check your email to verify.");
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldWithIcon icon={UserIcon} id="su-name" label="Full name" placeholder="Jane Wanjiku">
        <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="pl-10 h-11 rounded-lg focus-visible:ring-teal" placeholder="Jane Wanjiku" />
      </FieldWithIcon>
      <FieldWithIcon icon={Mail} id="su-email" label="Email">
        <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 h-11 rounded-lg focus-visible:ring-teal" placeholder="you@business.com" />
      </FieldWithIcon>
      <FieldWithIcon icon={Lock} id="su-password" label="Password">
        <Input id="su-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 h-11 rounded-lg focus-visible:ring-teal" placeholder="At least 6 characters" />
      </FieldWithIcon>
      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-12 rounded-lg bg-gradient-to-r from-teal to-teal-deep hover:opacity-90 text-teal-foreground text-base shadow-md shadow-teal/20"
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldWithIcon icon={Mail} id="li-email" label="Email">
        <Input id="li-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 h-11 rounded-lg focus-visible:ring-teal" placeholder="you@business.com" />
      </FieldWithIcon>
      <FieldWithIcon icon={Lock} id="li-password" label="Password">
        <Input id="li-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10 h-11 rounded-lg focus-visible:ring-teal" placeholder="Your password" />
      </FieldWithIcon>
      <Button
        type="submit"
        disabled={submitting}
        className="w-full h-12 rounded-lg bg-gradient-to-r from-teal to-teal-deep hover:opacity-90 text-teal-foreground text-base shadow-md shadow-teal/20"
      >
        {submitting ? "Signing in..." : (<>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>)}
      </Button>
    </form>
  );
};

const FieldWithIcon = ({
  icon: Icon, id, label, children,
}: { icon: React.ElementType; id: string; label: string; placeholder?: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-foreground">{label}</Label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      {children}
    </div>
  </div>
);

/* ---------------- Business creation step ---------------- */

const BusinessStep = () => {
  const { createBusiness } = useBusiness();
  const [businessName, setBusinessName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filled = [!!businessName, !!businessType, !!locationName].filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await createBusiness(businessName, locationName, businessType);
    if (error) toast.error(error.message);
    else toast.success("Business created successfully!");
    setIsSubmitting(false);
  };

  return (
    <>
      <div>
        <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-2">
          Create your workspace
        </h2>
        <p className="text-muted-foreground text-sm">
          Set up your business and first location to get started.
        </p>
      </div>

      {/* Progress dashes */}
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < filled ? "bg-gradient-to-r from-teal to-teal-deep" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="business-name" className="text-foreground">Company name</Label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="business-name"
              placeholder="e.g. Mama Njeri's Shop"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="pl-10 h-11 rounded-lg focus-visible:ring-teal"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business-type" className="text-foreground">Business type</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
            <Select value={businessType} onValueChange={(v) => setBusinessType(v as BusinessType)}>
              <SelectTrigger id="business-type" className="pl-10 h-11 rounded-lg focus:ring-teal">
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

        <div className="space-y-2">
          <Label htmlFor="location-name" className="text-foreground">First location</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="location-name"
              placeholder="e.g. Main Branch"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="pl-10 h-11 rounded-lg focus-visible:ring-teal"
              required
            />
          </div>
          <p className="text-xs text-muted-foreground">You can add more warehouses and stores later.</p>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 rounded-lg bg-gradient-to-r from-teal to-teal-deep hover:opacity-90 text-teal-foreground text-base shadow-md shadow-teal/20"
        >
          {isSubmitting ? "Setting up..." : (<>Create workspace <ArrowRight className="ml-2 h-4 w-4" /></>)}
        </Button>
      </form>
    </>
  );
};

export default Onboarding;
