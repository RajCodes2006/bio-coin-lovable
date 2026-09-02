import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/green-bharat-logo.png";
import { Coins, History, Trophy, Gift, BarChart3, Megaphone, FileText, LogOut, Leaf, TrendingUp, Clock, ShieldCheck } from "lucide-react";

const sections = [
  { title: "Bio Coins", desc: "Your coin balance & earnings", icon: Coins, path: "/home", color: "gradient-coin" },
  { title: "Waste History", desc: "View waste collection reports", icon: History, path: "/waste-history", color: "gradient-hero" },
  { title: "City Ranking", desc: "See your city's ranking", icon: Trophy, path: "/city-ranking", color: "gradient-hero" },
  { title: "Redeem", desc: "Redeem your Bio Coins", icon: Gift, path: "/redeem", color: "gradient-coin" },
  { title: "Report Waste", desc: "Submit a new waste report", icon: FileText, path: "/report", color: "gradient-hero" },
  { title: "Awareness", desc: "Connect with climate workers", icon: Megaphone, path: "/awareness", color: "gradient-dark" },
];

const adminSection = {
  title: "Review Reports",
  desc: "Approve or reject pending waste reports",
  icon: ShieldCheck,
  path: "/admin",
  color: "gradient-dark",
};

const recentActivity = [
  { text: "Plastic waste report approved", coins: "+85 Bio Coins", time: "2 hours ago", icon: TrendingUp },
  { text: "Paper waste report pending", coins: "Submitted", time: "Yesterday", icon: Clock },
  { text: "Redeemed electricity discount", coins: "-500 Bio Coins", time: "3 days ago", icon: Gift },
];

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) { navigate("/"); return null; }

  const visibleSections = user.isAdmin ? [...sections, adminSection] : sections;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-dark sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Green Bharat" width={36} height={36} />
            <span className="text-lg font-bold text-primary-foreground">Green Bharat</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="gradient-coin px-3 py-1.5 rounded-full flex items-center gap-2">
              <Coins size={16} className="text-coin-foreground" />
              <span className="font-bold text-coin-foreground text-sm">{user.bioCoins.toLocaleString()}</span>
            </div>
            <button onClick={async () => { await logout(); navigate("/"); }} className="text-primary-foreground/70 hover:text-primary-foreground">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="gradient-hero rounded-2xl p-6 mb-8 shadow-elevated animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-primary-foreground/70 text-sm">Welcome back,</p>
              <h1 className="text-2xl font-bold text-primary-foreground">{user.name}</h1>
              <p className="text-primary-foreground/70 text-sm mt-1">
                <Leaf size={14} className="inline mr-1" />
                {user.city}, India · Member since {user.memberSince}
              </p>
            </div>
            <div className="text-center">
              <p className="text-primary-foreground/70 text-xs">Your Bio Coins</p>
              <p className="text-4xl font-bold text-coin">{user.bioCoins.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {visibleSections.map((s, i) => (
            <button
              key={s.title}
              onClick={() => navigate(s.path)}
              className="bg-card rounded-xl p-5 shadow-card hover:shadow-elevated transition-all duration-300 text-left group animate-fade-in border border-border"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <s.icon size={22} className="text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </button>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl p-6 shadow-card border border-border animate-fade-in" style={{ animationDelay: "500ms" }}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <a.icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{a.text}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${a.coins.startsWith("+") ? "text-success" : a.coins.startsWith("-") ? "text-destructive" : "text-muted-foreground"}`}>
                  {a.coins}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
