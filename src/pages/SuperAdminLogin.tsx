import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Store } from "lucide-react";

export default function SuperAdminLogin() {
  const { user, loading, signIn } = useAuth();
  const { isSuperAdmin, loading: saLoading } = useSuperAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !saLoading && user && isSuperAdmin) {
    return <Navigate to="/super-admin" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error.message);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: green gradient panel */}
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-teal via-teal to-teal-deep text-teal-foreground">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-foreground/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-teal-foreground/10 blur-3xl" aria-hidden />
        <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-3xl bg-teal-foreground/5 backdrop-blur-sm" aria-hidden />
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 rounded-full bg-teal-foreground/5 backdrop-blur-sm" aria-hidden />

        <Link to="/landing" className="relative flex items-center gap-2 text-teal-foreground/90 hover:text-teal-foreground transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to homepage
        </Link>

        <div className="relative max-w-md">
          <div className="h-14 w-14 rounded-2xl bg-teal-foreground/15 backdrop-blur-sm border border-teal-foreground/20 flex items-center justify-center mb-8">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl leading-tight tracking-tight mb-5">
            Manage your entire platform from one place
          </h1>
          <p className="text-teal-foreground/80 leading-relaxed mb-10">
            Access tenant management, billing, subscriptions, and analytics through the super admin dashboard.
          </p>

          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-teal-foreground/20">
            <div>
              <div className="font-serif text-3xl">100%</div>
              <div className="text-xs uppercase tracking-wider text-teal-foreground/70 mt-1">Secure</div>
            </div>
            <div>
              <div className="font-serif text-3xl">24/7</div>
              <div className="text-xs uppercase tracking-wider text-teal-foreground/70 mt-1">Access</div>
            </div>
            <div>
              <div className="font-serif text-3xl">Real-time</div>
              <div className="text-xs uppercase tracking-wider text-teal-foreground/70 mt-1">Analytics</div>
            </div>
          </div>
        </div>

        <div className="relative text-xs text-teal-foreground/60">
          © {new Date().getFullYear()} StratusPOS. All rights reserved.
        </div>
      </aside>

      {/* Right: login form */}
      <main className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile back link */}
          <Link to="/landing" className="lg:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-teal flex items-center justify-center">
              <Store className="h-5 w-5 text-teal-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">StratusPOS</span>
          </div>

          <div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-2">Welcome back</h2>
            <p className="text-muted-foreground text-sm">
              Sign in to the super admin dashboard to manage your platform.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sa-email" className="text-foreground">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sa-email"
                  type="email"
                  placeholder="Enter Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-lg focus-visible:ring-teal"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sa-password" className="text-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="sa-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-lg focus-visible:ring-teal"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
                Remember me
              </label>
              <Link to="/onboarding" className="text-sm font-medium text-teal hover:text-teal-deep">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-lg bg-gradient-to-r from-teal to-teal-deep hover:opacity-90 text-teal-foreground text-base shadow-md shadow-teal/20"
            >
              {submitting ? "Signing in..." : (<>Sign in <ArrowRight className="ml-2 h-4 w-4" /></>)}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-background px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full h-11 rounded-lg">
            <Link to="/landing"><ArrowLeft className="mr-2 h-4 w-4" /> Back to homepage</Link>
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            © {new Date().getFullYear()} StratusPOS. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
