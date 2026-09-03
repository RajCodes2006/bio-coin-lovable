import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/green-bharat-logo.png";
import heroBg from "@/assets/hero-bg.jpg";
import { Eye, EyeOff, Leaf, Loader2 } from "lucide-react";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, login, signup } = useAuth();

  const [isSignup, setIsSignup] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ----------------------------------------------------------
  // Redirect authenticated users based on their role
  // ----------------------------------------------------------
  useEffect(() => {
    if (authLoading || !user) return;

    if (user.role === "admin") {
      navigate("/admin", { replace: true });
    } else {
      navigate("/home", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // ----------------------------------------------------------
  // Reset form state when switching between login/signup
  // ----------------------------------------------------------
  const switchMode = () => {
    setIsSignup((prev) => !prev);

    setEmail("");
    setPassword("");
    setName("");
    setCity("");

    setError("");
    setInfo("");

    setShowPassword(false);
  };

  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitting) return;

    setError("");
    setInfo("");
    setSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim();
      const normalizedCity = city.trim();

      // -----------------------------
      // SIGN UP
      // -----------------------------
      if (isSignup) {
        if (!normalizedName) {
          setError("Please enter your full name.");
          return;
        }

        if (!normalizedCity) {
          setError("Please enter your city.");
          return;
        }

        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }

        const result = await signup(
          normalizedName,
          normalizedEmail,
          password,
          normalizedCity
        );

        if (!result.ok) {
          setError(result.error ?? "Could not create your account.");
          return;
        }

        setInfo(
          "Account created successfully. Check your email to confirm your account, then sign in."
        );

        // Switch back to login
        setIsSignup(false);
        setPassword("");
        setName("");
        setCity("");
        setShowPassword(false);

        return;
      }

      // -----------------------------
      // LOGIN
      // -----------------------------
      const result = await login(normalizedEmail, password);

      if (!result.ok) {
        setError(result.error ?? "Invalid email or password.");
        return;
      }

      /*
       * DO NOT manually navigate here.
       *
       * AuthContext updates `user`, then the useEffect above
       * checks the user's role:
       *
       * admin -> /admin
       * user  -> /home
       */
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------------
  // Loading screen while existing session is being restored
  // ----------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2
            size={32}
            className="animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-sm">Checking your session...</p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------
  return (
    <div className="min-h-screen flex">
      {/* =====================================================
          LEFT SIDE — HERO
          ===================================================== */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <img
          src={heroBg}
          alt="Clean and green India"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div
          className="absolute inset-0 gradient-dark opacity-70"
          aria-hidden="true"
        />

        <div className="relative z-10 p-12 text-center max-w-lg">
          <img
            src={logo}
            alt="Green Bharat logo"
            width={120}
            height={120}
            className="mx-auto mb-6 object-contain"
          />

          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            Green Bharat
          </h1>

          <p className="text-lg text-primary-foreground/80 leading-relaxed">
            Earn Bio-Coins by keeping your city clean. Report waste, earn
            rewards, and make India greener!
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

      {/* =====================================================
          RIGHT SIDE — AUTH FORM
          ===================================================== */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img
              src={logo}
              alt="Green Bharat logo"
              width={48}
              height={48}
              className="object-contain"
            />

            <h1 className="text-2xl font-bold text-primary">Green Bharat</h1>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>

            <p className="text-muted-foreground">
              {isSignup
                ? "Join the movement for a cleaner India"
                : "Sign in to your Green Bharat account"}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-4 text-sm"
            >
              {error}
            </div>
          )}

          {/* Success/info */}
          {info && (
            <div
              role="status"
              className="bg-success/10 border border-success/20 text-success px-4 py-3 rounded-lg mb-4 text-sm"
            >
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* =================================================
                SIGNUP FIELDS
                ================================================= */}
            {isSignup && (
              <>
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    placeholder="Raj Kumar"
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* City */}
                <div>
                  <label
                    htmlFor="city"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    City
                  </label>

                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    autoComplete="address-level2"
                    placeholder="Ranchi"
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </>
            )}

            {/* =================================================
                EMAIL
                ================================================= */}
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium mb-1.5 block"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@email.com"
                disabled={submitting}
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* =================================================
                PASSWORD
                ================================================= */}
            <div>
              <label
                htmlFor="password"
                className="text-sm font-medium mb-1.5 block"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                  placeholder="••••••••"
                  disabled={submitting}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showPassword}
                  disabled={submitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff size={20} aria-hidden="true" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                </button>
              </div>

              {isSignup && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Password must contain at least 6 characters.
                </p>
              )}
            </div>

            {/* =================================================
                SUBMIT BUTTON
                ================================================= */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full gradient-hero text-primary-foreground py-3.5 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                    aria-hidden="true"
                  />
                  {isSignup ? "Creating Account..." : "Signing In..."}
                </>
              ) : (
                <>
                  <Leaf size={20} aria-hidden="true" />
                  {isSignup ? "Create Account" : "Sign In"}
                </>
              )}
            </button>
          </form>

          {/* =================================================
              SWITCH LOGIN / SIGNUP
              ================================================= */}
          <p className="text-center mt-6 text-sm text-muted-foreground">
            {isSignup
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              disabled={submitting}
              className="text-primary font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
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