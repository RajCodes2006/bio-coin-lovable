import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/green-bharat-logo.png";

import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Coins,
  FileText,
  Gift,
  History,
  Leaf,
  LogOut,
  Megaphone,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Trophy,
  XCircle,
} from "lucide-react";

interface ReportStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalWaste: number;
  coinsEarned: number;
}

interface CoinTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  amount: number | null;
  time: string;
  icon: React.ElementType;
}

const sections = [
  {
    title: "Waste History",
    desc: "Track your submitted waste reports",
    icon: History,
    path: "/waste-history",
    color: "gradient-hero",
  },
  {
    title: "City Ranking",
    desc: "See your position on the leaderboard",
    icon: Trophy,
    path: "/city-ranking",
    color: "gradient-hero",
  },
  {
    title: "Redeem Rewards",
    desc: "Use your Bio-Coins for rewards",
    icon: Gift,
    path: "/redeem",
    color: "gradient-coin",
  },
  {
    title: "Report Waste",
    desc: "Submit a new cleanliness report",
    icon: FileText,
    path: "/report",
    color: "gradient-hero",
  },
  {
    title: "Awareness",
    desc: "Learn and connect with the community",
    icon: Megaphone,
    path: "/awareness",
    color: "gradient-dark",
  },
];

const formatTransactionType = (type: string) => {
  switch (type) {
    case "REPORT_REWARD":
      return "Waste Report Reward";

    case "REDEMPTION":
      return "Reward Redemption";

    case "ADMIN_ADJUSTMENT":
      return "Account Adjustment";

    case "BONUS":
      return "Bonus";

    default:
      return type
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
};

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  if (diffHours < 24) {
    return `${diffHours} hr ago`;
  }

  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString();
};

const HomePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalWaste: 0,
    coinsEarned: 0,
  });

  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ----------------------------------------------------------
  // LOAD USER DASHBOARD DATA
  // ----------------------------------------------------------

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);

      const [reportsResult, transactionsResult] = await Promise.all([
        supabase
          .from("waste_reports")
          .select("id, weight, coins, status")
          .eq("user_id", user.id),

        supabase
          .from("coin_transactions")
          .select(
            "id, amount, transaction_type, description, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      if (reportsResult.error) {
        console.error(
          "Dashboard reports:",
          reportsResult.error
        );
      }

      if (transactionsResult.error) {
        console.error(
          "Dashboard transactions:",
          transactionsResult.error
        );
      }

      const reports = reportsResult.data ?? [];

      const approved = reports.filter(
        (report) => report.status === "Approved"
      );

      const pending = reports.filter(
        (report) => report.status === "Pending"
      );

      const rejected = reports.filter(
        (report) => report.status === "Rejected"
      );

      setStats({
        total: reports.length,
        approved: approved.length,
        pending: pending.length,
        rejected: rejected.length,

        totalWaste: approved.reduce(
          (sum, report) => sum + Number(report.weight ?? 0),
          0
        ),

        coinsEarned: approved.reduce(
          (sum, report) => sum + Number(report.coins ?? 0),
          0
        ),
      });

      setTransactions(
        (transactionsResult.data ?? []).map((transaction) => ({
          id: transaction.id,
          amount: Number(transaction.amount ?? 0),
          transaction_type: transaction.transaction_type,
          description: transaction.description,
          created_at: transaction.created_at,
        }))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    void loadDashboard();
  }, [user, navigate, loadDashboard]);

  // ----------------------------------------------------------
  // RECENT ACTIVITY
  // ----------------------------------------------------------

  const recentActivity = useMemo<ActivityItem[]>(() => {
    return transactions.map((transaction) => {
      const isPositive = transaction.amount > 0;

      let icon = isPositive ? TrendingUp : TrendingDown;

      if (transaction.transaction_type === "REDEMPTION") {
        icon = Gift;
      }

      if (transaction.transaction_type === "REPORT_REWARD") {
        icon = CheckCircle;
      }

      if (transaction.transaction_type === "ADMIN_ADJUSTMENT") {
        icon = ShieldCheck;
      }

      return {
        id: transaction.id,
        title: formatTransactionType(
          transaction.transaction_type
        ),
        description:
          transaction.description ||
          "Bio-Coin account activity",
        amount: transaction.amount,
        time: formatRelativeTime(transaction.created_at),
        icon,
      };
    });
  }, [transactions]);

  // ----------------------------------------------------------
  // LOGIN GUARD
  // ----------------------------------------------------------

  if (!user) {
    return null;
  }

  // ----------------------------------------------------------
  // COMPLETION / ENGAGEMENT
  // ----------------------------------------------------------

  const activityScore = Math.min(
    stats.total * 10 + stats.approved * 5,
    100
  );

  const visibleSections = user.isAdmin
    ? [
        ...sections,
        {
          title: "Admin Dashboard",
          desc: "Manage reports, users, rewards and flags",
          icon: ShieldCheck,
          path: "/admin",
          color: "gradient-dark",
        },
      ]
    : sections;

  // ----------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* ======================================================
          HEADER
          ====================================================== */}
      <header className="gradient-dark sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <button
              type="button"
              onClick={() => navigate("/home")}
              className="flex items-center gap-3"
            >
              <img
                src={logo}
                alt="Green Bharat"
                width={38}
                height={38}
                className="object-contain"
              />

              <div className="text-left">
                <p className="text-lg font-bold text-primary-foreground">
                  Green Bharat
                </p>

                <p className="text-[11px] text-primary-foreground/60">
                  Clean actions. Real impact.
                </p>
              </div>
            </button>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="gradient-coin px-3 py-1.5 rounded-full flex items-center gap-2">
                <Coins
                  size={16}
                  className="text-coin-foreground"
                />

                <span className="font-bold text-coin-foreground text-sm">
                  {user.bioCoins.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate("/", { replace: true });
                }}
                className="p-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                aria-label="Log out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN
          ====================================================== */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* ==================================================
            WELCOME HERO
            ================================================== */}
        <section className="gradient-hero rounded-2xl p-6 sm:p-8 shadow-elevated animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                <Leaf size={15} />
                Welcome back
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground mt-1">
                {user.name}
              </h1>

              <p className="text-primary-foreground/70 text-sm mt-2">
                {user.city}, India · Member since{" "}
                {user.memberSince}
              </p>

              <p className="text-primary-foreground/80 text-sm mt-4 max-w-xl">
                Every verified cleanup action helps make your
                city cleaner. Keep reporting, keep earning, keep
                making an impact.
              </p>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => navigate("/report")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-background text-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  <FileText size={17} />
                  Report Waste
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/redeem")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground font-semibold text-sm hover:bg-primary-foreground/20 transition-colors"
                >
                  <Gift size={17} />
                  Redeem
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="lg:min-w-[220px] text-center bg-black/10 rounded-2xl px-8 py-6">
              <p className="text-primary-foreground/60 text-xs uppercase tracking-wider">
                Your Bio-Coins
              </p>

              <div className="flex items-center justify-center gap-2 mt-2">
                <Coins
                  size={24}
                  className="text-coin"
                />

                <p className="text-4xl sm:text-5xl font-bold text-coin">
                  {user.bioCoins.toLocaleString()}
                </p>
              </div>

              <p className="text-primary-foreground/60 text-xs mt-2">
                Available balance
              </p>
            </div>
          </div>
        </section>

        {/* ==================================================
            IMPACT STATS
            ================================================== */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">
                Your Impact
              </h2>

              <p className="text-sm text-muted-foreground">
                Your contribution to a cleaner city.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ImpactCard
              icon={FileText}
              title="Total Reports"
              value={stats.total.toLocaleString()}
            />

            <ImpactCard
              icon={CheckCircle}
              title="Approved"
              value={stats.approved.toLocaleString()}
              positive
            />

            <ImpactCard
              icon={Leaf}
              title="Waste Collected"
              value={`${stats.totalWaste.toFixed(1)} kg`}
              positive
            />

            <ImpactCard
              icon={Coins}
              title="Coins Earned"
              value={`+${stats.coinsEarned.toLocaleString()}`}
              positive
            />
          </div>
        </section>

        {/* ==================================================
            PROGRESS
            ================================================== */}
        <section className="bg-card border border-border rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold">
                Clean City Progress
              </h3>

              <p className="text-sm text-muted-foreground mt-1">
                Keep submitting verified reports to increase
                your impact.
              </p>
            </div>

            <span className="text-lg font-bold text-primary">
              {activityScore}%
            </span>
          </div>

          <div className="w-full h-2.5 bg-muted rounded-full mt-4 overflow-hidden">
            <div
              className="h-full gradient-hero rounded-full transition-all duration-500"
              style={{ width: `${activityScore}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>
              {stats.approved} verified actions
            </span>

            <span>Goal: 100%</span>
          </div>
        </section>

        {/* ==================================================
            ACTIVITY + ACTION
            ================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <section className="lg:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3
                    size={20}
                    className="text-primary"
                  />
                  Recent Activity
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Your latest Bio-Coin activity.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/waste-history")}
                className="text-sm font-semibold text-primary hover:underline"
              >
                History
              </button>
            </div>

            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading activity...
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const Icon = activity.icon;

                  return (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Icon
                            size={18}
                            className="text-primary"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {activity.title}
                          </p>

                          <p className="text-xs text-muted-foreground truncate">
                            {activity.description}
                          </p>

                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {activity.time}
                          </p>
                        </div>
                      </div>

                      {activity.amount !== null && (
                        <span
                          className={`text-sm font-bold whitespace-nowrap ${
                            activity.amount > 0
                              ? "text-success"
                              : activity.amount < 0
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }`}
                        >
                          {activity.amount > 0 ? "+" : ""}
                          {activity.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-10 text-center">
                  <Clock
                    size={30}
                    className="mx-auto text-muted-foreground mb-3"
                  />

                  <p className="font-semibold">
                    No activity yet
                  </p>

                  <p className="text-sm text-muted-foreground mt-1">
                    Submit your first waste report to get
                    started.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/report")}
                    className="mt-4 px-4 py-2 rounded-lg gradient-hero text-primary-foreground text-sm font-semibold"
                  >
                    Report Waste
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Report Status */}
          <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="text-xl font-bold">
                Report Status
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                See how your reports are progressing.
              </p>
            </div>

            <div className="p-5 space-y-4">
              <StatusRow
                icon={CheckCircle}
                label="Approved"
                value={stats.approved}
                className="text-success"
              />

              <StatusRow
                icon={Clock}
                label="Pending"
                value={stats.pending}
                className="text-warning"
              />

              <StatusRow
                icon={XCircle}
                label="Rejected"
                value={stats.rejected}
                className="text-destructive"
              />

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate("/waste-history")
                  }
                  className="w-full px-4 py-2.5 rounded-lg border border-border hover:bg-muted font-semibold text-sm transition-colors"
                >
                  View All Reports
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ==================================================
            EXPLORE
            ================================================== */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold">
              Explore Green Bharat
            </h2>

            <p className="text-sm text-muted-foreground">
              Everything you need to participate and earn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleSections.map((section, index) => {
              const Icon = section.icon;

              return (
                <button
                  type="button"
                  key={section.title}
                  onClick={() => navigate(section.path)}
                  className="bg-card rounded-xl p-5 shadow-card hover:shadow-elevated transition-all duration-300 text-left group border border-border animate-fade-in"
                  style={{
                    animationDelay: `${index * 70}ms`,
                  }}
                >
                  <div
                    className={`w-12 h-12 ${section.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon
                      size={22}
                      className="text-primary-foreground"
                    />
                  </div>

                  <h3 className="font-semibold text-lg">
                    {section.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mt-1">
                    {section.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ==================================================
            ADMIN NOTICE
            ================================================== */}
        {user.isAdmin && (
          <section className="bg-card border border-primary/20 rounded-xl p-5 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShieldCheck
                    size={20}
                    className="text-primary"
                  />
                </div>

                <div>
                  <h3 className="font-bold">
                    Administrator Access
                  </h3>

                  <p className="text-sm text-muted-foreground mt-1">
                    You have access to the Green Bharat
                    administration dashboard.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="px-4 py-2.5 rounded-lg gradient-dark text-primary-foreground font-semibold text-sm"
              >
                Open Admin Dashboard
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

// ============================================================
// IMPACT CARD
// ============================================================

const ImpactCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
  positive?: boolean;
}> = ({ icon: Icon, title, value, positive }) => (
  <div className="bg-card border border-border rounded-xl p-4 shadow-card">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon
        size={17}
        className={positive ? "text-primary" : ""}
      />

      <span className="text-xs font-medium">
        {title}
      </span>
    </div>

    <p className="text-2xl font-bold mt-2">
      {value}
    </p>
  </div>
);

// ============================================================
// STATUS ROW
// ============================================================

const StatusRow: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  className: string;
}> = ({ icon: Icon, label, value, className }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Icon size={18} className={className} />

      <span className="text-sm font-medium">
        {label}
      </span>
    </div>

    <span className="font-bold">
      {value}
    </span>
  </div>
);

export default HomePage;