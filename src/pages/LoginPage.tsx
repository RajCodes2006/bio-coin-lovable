import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/green-bharat-logo.png";
import heroBg from "@/assets/hero-bg.jpg";
import { Leaf, Eye, EyeOff } from "lucide-react";

const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();

  // Already signed in? Skip the login form.
  useEffect(() => {
    if (user) navigate("/home", { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        const result = await signup(name, email, password, city);
        if (result.ok) {
          setError("");
          setInfo("Account created! Check your email to confirm, then sign in.");
          setIsSignup(false);
        } else {
          setError(result.error ?? "Could not create account");
        }
      } else {
        const result = await login(email, password);
        if (result.ok) {
          navigate("/home");
        } else {
          setError(result.error ?? "Invalid credentials");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <img src={heroBg} alt="Green India" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-dark opacity-70" />
        <div className="relative z-10 p-12 text-center max-w-lg">
          <img src={logo} alt="Green Bharat" width={120} height={120} className="mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">Green Bharat</h1>
          <p className="text-lg text-primary-foreground/80">
            Earn Bio-Coins by keeping your city clean. Report waste, earn rewards, and make India greener!
          </p>
          <div className="flex gap-6 mt-8 justify-center text-primary-foreground/70 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-coin">12,548</p>
              <p>Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coin">48.7T</p>
              <p>Waste Collected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coin">3,842</p>
              <p>Rewards Redeemed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={logo} alt="Green Bharat" width={48} height={48} />
            <h1 className="text-2xl font-bold text-primary">Green Bharat</h1>
          </div>

          <h2 className="text-3xl font-bold mb-2">{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p className="text-muted-foreground mb-8">
            {isSignup ? "Join the movement for a cleaner India" : "Sign in to your Green Bharat account"}
          </p>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg mb-4 text-sm">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <label htmlFor="name" className="text-sm font-medium mb-1.5 block">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Rahul Sharma"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="city" className="text-sm font-medium mb-1.5 block">City</label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    autoComplete="address-level2"
                    placeholder="Mumbai"
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  />
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@email.com"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-hero text-primary-foreground py-3.5 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Leaf size={20} />
              {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignup(!isSignup); setError(""); setInfo(""); }}
              className="text-primary font-semibold hover:underline"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
