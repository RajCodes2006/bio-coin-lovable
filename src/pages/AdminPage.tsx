import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import {
  AlertCircle,
  CheckCircle,
  Coins,
  Flag,
  Gift,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type ReportStatus = "Pending" | "Approved" | "Rejected";

type FlagSeverity = "low" | "medium" | "high";
type FlagStatus = "active" | "resolved";

interface AdminReport {
  id: string;
  user_id: string;
  type: string;
  weight: number;
  location: string;
  description: string | null;
  photo_path: string | null;
  status: ReportStatus;
  coins: number;
  created_at: string;
  reviewed_at: string | null;
  reporter_name: string;
  reporter_email: string;
}

interface AdminUser {
  id: string;
  name: string;
  city: string;
  bio_coins: number;
  role: "user" | "admin";
  is_admin: boolean;
  member_since: string;
}

interface RewardItem {
  id: string;
  title: string;
  description: string | null;
  cost: number;
  category: string;
  icon: string | null;
}

interface Redemption {
  id: string;
  user_id: string;
  item_id: string;
  coins_spent: number;
  redeemed_at: string;
  status: "pending" | "approved" | "claimed" | "cancelled";
  user_name: string;
  reward_title: string;
}

interface UserFlag {
  id: string;
  user_id: string;
  flagged_by: string;
  reason: string;
  severity: FlagSeverity;
  status: FlagStatus;
  created_at: string;
  resolved_at: string | null;
}

type Tab =
  | "overview"
  | "reports"
  | "users"
  | "rewards"
  | "redemptions"
  | "flags";

const FLAG_REASONS = [
  "Fake / misleading waste report",
  "Duplicate report",
  "Suspicious activity",
  "Incorrect waste details",
  "Abusive behavior",
  "Reward abuse",
  "Other",
] as const;

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [flags, setFlags] = useState<UserFlag[]>([]);

  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  // Flag dialog
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagSeverity, setFlagSeverity] =
    useState<FlagSeverity>("medium");
  const [flagging, setFlagging] = useState(false);

  // Resolve flag
  const [resolvingFlagId, setResolvingFlagId] = useState<string | null>(
    null
  );

  // ----------------------------------------------------------
  // LOAD REPORTS
  // ----------------------------------------------------------
  const loadReports = useCallback(async () => {
    const { data, error } = await supabase
      .from("waste_reports")
      .select(
        `
          id,
          user_id,
          type,
          weight,
          location,
          description,
          photo_path,
          status,
          coins,
          created_at,
          reviewed_at,
          profiles!waste_reports_user_id_fkey (
            name
          )
        `
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      toast.error("Couldn't load reports.");
      return;
    }

    const rows: AdminReport[] = (data ?? []).map((r) => {
      const profile = r.profiles as
        | { name?: string | null }
        | null;

      return {
        id: r.id,
        user_id: r.user_id,
        type: String(r.type),
        weight: Number(r.weight),
        location: r.location,
        description: r.description,
        photo_path: r.photo_path,
        status: r.status as ReportStatus,
        coins: Number(r.coins),
        created_at: r.created_at,
        reviewed_at: r.reviewed_at,
        reporter_name: profile?.name ?? "Unknown",
        reporter_email: "",
      };
    });

    setReports(rows);

    const paths = rows
      .filter((r) => r.photo_path)
      .map((r) => r.photo_path as string);

    if (paths.length > 0) {
      const urlMap: Record<string, string> = {};

      await Promise.all(
        paths.map(async (path) => {
          const { data: signed } = await supabase.storage
            .from("report-photos")
            .createSignedUrl(path, 60 * 10);

          if (signed?.signedUrl) {
            urlMap[path] = signed.signedUrl;
          }
        })
      );

      setPhotoUrls(urlMap);
    }
  }, []);

  // ----------------------------------------------------------
  // LOAD USERS
  // ----------------------------------------------------------
  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, name, city, bio_coins, role, is_admin, member_since"
      )
      .order("member_since", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      toast.error("Couldn't load users.");
      return;
    }

    setUsers(
      (data ?? []).map((u) => ({
        id: u.id,
        name: u.name ?? "Unnamed User",
        city: u.city ?? "Unknown",
        bio_coins: Number(u.bio_coins ?? 0),
        role: u.role === "admin" ? "admin" : "user",
        is_admin: Boolean(u.is_admin),
        member_since: u.member_since,
      }))
    );
  }, []);

  // ----------------------------------------------------------
  // LOAD REWARDS
  // ----------------------------------------------------------
  const loadRewards = useCallback(async () => {
    const { data, error } = await supabase
      .from("redeem_items")
      .select("id, title, description, cost, category, icon")
      .order("cost", { ascending: true });

    if (error) {
      console.error(error);
      toast.error("Couldn't load rewards.");
      return;
    }

    setRewards(
      (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        cost: Number(r.cost),
        category: r.category,
        icon: r.icon,
      }))
    );
  }, []);

  // ----------------------------------------------------------
  // LOAD REDEMPTIONS
  // ----------------------------------------------------------
  const loadRedemptions = useCallback(async () => {
    const { data, error } = await supabase
      .from("redemptions")
      .select(
        `
          id,
          user_id,
          item_id,
          coins_spent,
          redeemed_at,
          status,
          profiles!redemptions_user_id_fkey (
            name
          ),
          redeem_items!redemptions_item_id_fkey (
            title
          )
        `
      )
      .order("redeemed_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      toast.error("Couldn't load redemptions.");
      return;
    }

    setRedemptions(
      (data ?? []).map((r) => {
        const profile = r.profiles as
          | { name?: string | null }
          | null;

        const item = r.redeem_items as
          | { title?: string | null }
          | null;

        return {
          id: r.id,
          user_id: r.user_id,
          item_id: r.item_id,
          coins_spent: Number(r.coins_spent),
          redeemed_at: r.redeemed_at,
          status: r.status,
          user_name: profile?.name ?? "Unknown",
          reward_title: item?.title ?? "Unknown Reward",
        };
      })
    );
  }, []);

  // ----------------------------------------------------------
  // LOAD FLAGS
  // ----------------------------------------------------------
  const loadFlags = useCallback(async () => {
    const { data, error } = await supabase
      .from("user_flags")
      .select(
        "id, user_id, flagged_by, reason, severity, status, created_at, resolved_at"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error(error);
      toast.error("Couldn't load user flags.");
      return;
    }

    setFlags(
      (data ?? []).map((flag) => ({
        id: flag.id,
        user_id: flag.user_id,
        flagged_by: flag.flagged_by,
        reason: flag.reason,
        severity: flag.severity as FlagSeverity,
        status: flag.status as FlagStatus,
        created_at: flag.created_at,
        resolved_at: flag.resolved_at,
      }))
    );
  }, []);

  // ----------------------------------------------------------
  // LOAD EVERYTHING
  // ----------------------------------------------------------
  const loadAll = useCallback(async () => {
    setLoading(true);

    await Promise.all([
      loadReports(),
      loadUsers(),
      loadRewards(),
      loadRedemptions(),
      loadFlags(),
    ]);

    setLoading(false);
  }, [
    loadReports,
    loadUsers,
    loadRewards,
    loadRedemptions,
    loadFlags,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ----------------------------------------------------------
  // REVIEW REPORT
  // ----------------------------------------------------------
  const handleReview = async (
    id: string,
    newStatus: "Approved" | "Rejected"
  ) => {
    setReviewingId(id);

    try {
      const { error } = await supabase.rpc("review_report", {
        p_report_id: id,
        p_new_status: newStatus,
      });

      if (error) {
        toast.error(error.message || "Review failed.");
        return;
      }

      toast.success(`Report ${newStatus.toLowerCase()}.`);

      await Promise.all([loadReports(), loadUsers()]);
    } finally {
      setReviewingId(null);
    }
  };

  // ----------------------------------------------------------
  // OPEN FLAG DIALOG
  // ----------------------------------------------------------
  const openFlagDialog = (user: AdminUser) => {
    if (user.role === "admin") {
      toast.error("Admin accounts cannot be flagged.");
      return;
    }

    setSelectedUser(user);
    setFlagReason("");
    setFlagSeverity("medium");
    setFlagDialogOpen(true);
  };

  // ----------------------------------------------------------
  // FLAG USER
  // ----------------------------------------------------------
  const handleFlagUser = async () => {
    if (!selectedUser) return;

    if (!flagReason.trim()) {
      toast.error("Please select or enter a reason.");
      return;
    }

    setFlagging(true);

    try {
      const { error } = await supabase.rpc("flag_user", {
        p_user_id: selectedUser.id,
        p_reason: flagReason,
        p_severity: flagSeverity,
      });

      if (error) {
        toast.error(error.message || "Could not flag user.");
        return;
      }

      toast.success(`${selectedUser.name} has been flagged.`);

      setFlagDialogOpen(false);
      setSelectedUser(null);
      setFlagReason("");
      setFlagSeverity("medium");

      await loadFlags();
    } finally {
      setFlagging(false);
    }
  };

  // ----------------------------------------------------------
  // RESOLVE FLAG
  // ----------------------------------------------------------
  const handleResolveFlag = async (flagId: string) => {
    setResolvingFlagId(flagId);

    try {
      const { error } = await supabase.rpc("resolve_user_flag", {
        p_flag_id: flagId,
      });

      if (error) {
        toast.error(error.message || "Could not resolve flag.");
        return;
      }

      toast.success("Flag resolved.");

      await loadFlags();
    } finally {
      setResolvingFlagId(null);
    }
  };

  // ----------------------------------------------------------
  // STATISTICS
  // ----------------------------------------------------------
  const stats = useMemo(() => {
    const pendingReports = reports.filter(
      (r) => r.status === "Pending"
    ).length;

    const approvedReports = reports.filter(
      (r) => r.status === "Approved"
    ).length;

    const rejectedReports = reports.filter(
      (r) => r.status === "Rejected"
    ).length;

    const totalWaste = reports
      .filter((r) => r.status === "Approved")
      .reduce((sum, r) => sum + r.weight, 0);

    const coinsDistributed = reports
      .filter((r) => r.status === "Approved")
      .reduce((sum, r) => sum + r.coins, 0);

    const totalCoinsHeld = users.reduce(
      (sum, u) => sum + u.bio_coins,
      0
    );

    const totalRedeemed = redemptions.reduce(
      (sum, r) => sum + r.coins_spent,
      0
    );

    const activeFlags = flags.filter(
      (f) => f.status === "active"
    ).length;

    const highSeverityFlags = flags.filter(
      (f) => f.status === "active" && f.severity === "high"
    ).length;

    return {
      totalUsers: users.filter((u) => u.role === "user").length,
      totalAdmins: users.filter((u) => u.role === "admin").length,
      pendingReports,
      approvedReports,
      rejectedReports,
      totalWaste,
      coinsDistributed,
      totalCoinsHeld,
      totalRedeemed,
      rewards: rewards.length,
      redemptions: redemptions.length,
      activeFlags,
      highSeverityFlags,
    };
  }, [reports, users, rewards, redemptions, flags]);

  // ----------------------------------------------------------
  // FILTER USERS
  // ----------------------------------------------------------
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return users;

    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  // ----------------------------------------------------------
  // FILTER REPORTS
  // ----------------------------------------------------------
  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return reports;

    return reports.filter(
      (r) =>
        r.reporter_name.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
    );
  }, [reports, search]);

  // ----------------------------------------------------------
  // FLAG HELPERS
  // ----------------------------------------------------------
  const getUserById = (userId: string) =>
    users.find((user) => user.id === userId);

  const getUserFlags = (userId: string) =>
    flags.filter((flag) => flag.user_id === userId);

  const getActiveUserFlags = (userId: string) =>
    getUserFlags(userId).filter((flag) => flag.status === "active");

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "reports", label: "Reports" },
    { key: "users", label: "Users" },
    { key: "flags", label: "Flags" },
    { key: "rewards", label: "Rewards" },
    { key: "redemptions", label: "Redemptions" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Green Bharat administration"
        />

        <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
          <Loader2 size={20} className="animate-spin" />
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Admin Dashboard"
          subtitle="Manage and monitor Green Bharat"
        />

        <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          {/* TOP */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Administration</h2>
              <p className="text-sm text-muted-foreground">
                Monitor users, reports, rewards, flags and Bio-Coin
                activity.
              </p>
            </div>

            <button
              onClick={loadAll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-semibold"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {/* TABS */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearch("");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? "gradient-hero text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}

                {tab.key === "flags" && stats.activeFlags > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px]">
                    {stats.activeFlags}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ==================================================
              OVERVIEW
              ================================================== */}
          {activeTab === "overview" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  icon={Users}
                  label="Users"
                  value={stats.totalUsers.toLocaleString()}
                  sub={`${stats.totalAdmins} admins`}
                />

                <StatCard
                  icon={AlertCircle}
                  label="Pending Reports"
                  value={stats.pendingReports.toLocaleString()}
                  sub={`${stats.approvedReports} approved`}
                />

                <StatCard
                  icon={Coins}
                  label="Coins Distributed"
                  value={stats.coinsDistributed.toLocaleString()}
                  sub={`${stats.totalCoinsHeld.toLocaleString()} held`}
                />

                <StatCard
                  icon={Gift}
                  label="Redemptions"
                  value={stats.redemptions.toLocaleString()}
                  sub={`${stats.totalRedeemed.toLocaleString()} spent`}
                />

                <StatCard
                  icon={Flag}
                  label="Active Flags"
                  value={stats.activeFlags.toLocaleString()}
                  sub={`${stats.highSeverityFlags} high severity`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard
                  title="Approved Waste"
                  value={`${stats.totalWaste.toFixed(1)} kg`}
                />

                <InfoCard
                  title="Available Rewards"
                  value={stats.rewards.toLocaleString()}
                />

                <InfoCard
                  title="Rejected Reports"
                  value={stats.rejectedReports.toLocaleString()}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Reports */}
                <section className="lg:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Pending Reports</h3>
                      <p className="text-sm text-muted-foreground">
                        Reports requiring verification
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("reports")}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      View all
                    </button>
                  </div>

                  <div className="divide-y divide-border">
                    {reports
                      .filter((r) => r.status === "Pending")
                      .slice(0, 5)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="p-4 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {r.reporter_name}
                            </p>

                            <p className="text-sm text-muted-foreground truncate">
                              {r.type} · {r.weight} kg · {r.location}
                            </p>
                          </div>

                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/15 text-warning">
                            Pending
                          </span>
                        </div>
                      ))}

                    {stats.pendingReports === 0 && (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        No pending reports.
                      </div>
                    )}
                  </div>
                </section>

                {/* Flags */}
                <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">User Flags</h3>
                      <p className="text-sm text-muted-foreground">
                        Active moderation alerts
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("flags")}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      View all
                    </button>
                  </div>

                  <div className="divide-y divide-border">
                    {flags
                      .filter((f) => f.status === "active")
                      .slice(0, 5)
                      .map((flag) => {
                        const user = getUserById(flag.user_id);

                        return (
                          <div key={flag.id} className="p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-semibold truncate">
                                  {user?.name ?? "Unknown User"}
                                </p>

                                <p className="text-xs text-muted-foreground truncate">
                                  {flag.reason}
                                </p>
                              </div>

                              <FlagSeverityBadge
                                severity={flag.severity}
                              />
                            </div>
                          </div>
                        );
                      })}

                    {stats.activeFlags === 0 && (
                      <div className="p-8 text-center text-sm text-muted-foreground">
                        No active flags.
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ==================================================
              REPORTS
              ================================================== */}
          {activeTab === "reports" && (
            <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-lg">Waste Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Verify citizen cleanliness reports.
                  </p>
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search reports..."
                  className="w-full sm:w-72 px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="divide-y divide-border">
                {filteredReports.map((r) => (
                  <div key={r.id} className="p-5">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {r.photo_path && photoUrls[r.photo_path] ? (
                        <img
                          src={photoUrls[r.photo_path]}
                          alt={`${r.type} waste report`}
                          className="w-full lg:w-40 h-40 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full lg:w-40 h-40 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                          <ImageIcon size={28} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="font-bold text-lg">
                            {r.type} — {r.weight} kg
                          </h4>

                          <StatusBadge status={r.status} />
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          Reported by <strong>{r.reporter_name}</strong> ·{" "}
                          {r.location}
                        </p>

                        {r.description && (
                          <p className="text-sm mt-3 text-muted-foreground">
                            {r.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <span className="font-semibold text-coin-foreground">
                            +{r.coins} Bio-Coins
                          </span>

                          <span className="text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()}
                          </span>
                        </div>

                        {r.status === "Pending" && (
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() =>
                                handleReview(r.id, "Approved")
                              }
                              disabled={reviewingId === r.id}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground font-semibold text-sm disabled:opacity-50"
                            >
                              {reviewingId === r.id ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <CheckCircle size={16} />
                              )}
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                handleReview(r.id, "Rejected")
                              }
                              disabled={reviewingId === r.id}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm disabled:opacity-50"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredReports.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    No reports found.
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ==================================================
              USERS
              ================================================== */}
          {activeTab === "users" && (
            <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-lg">Users</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage users and monitor moderation status.
                  </p>
                </div>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full sm:w-72 px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">City</th>
                      <th className="px-5 py-3 font-semibold">Role</th>
                      <th className="px-5 py-3 font-semibold">
                        Bio-Coins
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        Flags
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        Joined
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((u) => {
                      const activeFlags = getActiveUserFlags(u.id);
                      const hasActiveFlag = activeFlags.length > 0;

                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-muted/30 ${
                            hasActiveFlag
                              ? "bg-destructive/5"
                              : ""
                          }`}
                        >
                          <td className="px-5 py-4 font-semibold">
                            <div className="flex items-center gap-2">
                              {hasActiveFlag && (
                                <Flag
                                  size={15}
                                  className="text-destructive"
                                />
                              )}
                              {u.name}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-muted-foreground">
                            {u.city}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                u.role === "admin"
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-bold text-coin-foreground">
                            {u.bio_coins.toLocaleString()}
                          </td>

                          <td className="px-5 py-4">
                            {hasActiveFlag ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-destructive/15 text-destructive text-xs font-semibold">
                                <Flag size={12} />
                                {activeFlags.length} active
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                None
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-muted-foreground">
                            {new Date(
                              u.member_since
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-4">
                            {u.role === "admin" ? (
                              <span className="text-xs text-muted-foreground">
                                Protected
                              </span>
                            ) : (
                              <button
                                onClick={() => openFlagDialog(u)}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold text-xs transition-colors"
                              >
                                <Flag size={14} />
                                Flag User
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  No users found.
                </div>
              )}
            </section>
          )}

          {/* ==================================================
              FLAGS
              ================================================== */}
          {activeTab === "flags" && (
            <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">
                      User Flags
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Review suspicious or problematic user activity.
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-destructive">
                      {stats.activeFlags}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      active
                    </p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-border">
                {flags.map((flag) => {
                  const user = getUserById(flag.user_id);

                  return (
                    <div key={flag.id} className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-lg ${
                              flag.status === "active"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Flag size={18} />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold">
                                {user?.name ?? "Unknown User"}
                              </h4>

                              <FlagSeverityBadge
                                severity={flag.severity}
                              />

                              <FlagStatusBadge
                                status={flag.status}
                              />
                            </div>

                            <p className="text-sm mt-1">
                              {flag.reason}
                            </p>

                            <p className="text-xs text-muted-foreground mt-1">
                              {user?.city ?? "Unknown city"} · Flagged{" "}
                              {new Date(
                                flag.created_at
                              ).toLocaleString()}
                            </p>

                            {flag.resolved_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Resolved{" "}
                                {new Date(
                                  flag.resolved_at
                                ).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {flag.status === "active" && (
                          <button
                            onClick={() =>
                              handleResolveFlag(flag.id)
                            }
                            disabled={
                              resolvingFlagId === flag.id
                            }
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground text-sm font-semibold disabled:opacity-50"
                          >
                            {resolvingFlagId === flag.id ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {flags.length === 0 && (
                  <div className="p-12 text-center text-muted-foreground">
                    <ShieldCheck
                      size={36}
                      className="mx-auto mb-3 opacity-50"
                    />
                    <p className="font-semibold">No flags yet</p>
                    <p className="text-sm mt-1">
                      Flagged users will appear here.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ==================================================
              REWARDS
              ================================================== */}
          {activeTab === "rewards" && (
            <section>
              <div className="mb-4">
                <h3 className="font-bold text-lg">Rewards</h3>
                <p className="text-sm text-muted-foreground">
                  Current redeemable rewards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="bg-card border border-border rounded-xl p-5 shadow-card"
                  >
                    <div className="text-4xl mb-3">
                      {reward.icon || "🎁"}
                    </div>

                    <h4 className="font-bold text-lg">
                      {reward.title}
                    </h4>

                    <p className="text-sm text-muted-foreground mt-1">
                      {reward.description ||
                        "No description available."}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted">
                        {reward.category}
                      </span>

                      <span className="font-bold text-coin-foreground">
                        {reward.cost.toLocaleString()} coins
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {rewards.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                  No rewards found.
                </div>
              )}
            </section>
          )}

          {/* ==================================================
              REDEMPTIONS
              ================================================== */}
          {activeTab === "redemptions" && (
            <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-bold text-lg">Redemptions</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor user reward redemptions.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-5 py-3 font-semibold">
                        User
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        Reward
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        Coins
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        Status
                      </th>
                      <th className="px-5 py-3 font-semibold">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {redemptions.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-muted/30"
                      >
                        <td className="px-5 py-4 font-semibold">
                          {r.user_name}
                        </td>

                        <td className="px-5 py-4">
                          {r.reward_title}
                        </td>

                        <td className="px-5 py-4 font-bold text-coin-foreground">
                          -{r.coins_spent.toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <RedemptionStatus status={r.status} />
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {new Date(
                            r.redeemed_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {redemptions.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  No redemptions yet.
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* ======================================================
          FLAG USER MODAL
          ====================================================== */}
      {flagDialogOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flag-user-title"
          >
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3
                  id="flag-user-title"
                  className="font-bold text-lg"
                >
                  Flag User
                </h3>

                <p className="text-sm text-muted-foreground mt-1">
                  {selectedUser.name} · {selectedUser.city}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFlagDialogOpen(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Reason */}
              <div>
                <label
                  htmlFor="flag-reason"
                  className="block text-sm font-semibold mb-2"
                >
                  Reason
                </label>

                <select
                  id="flag-reason"
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select a reason</option>

                  {FLAG_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom reason */}
              {flagReason === "Other" && (
                <div>
                  <label
                    htmlFor="custom-flag-reason"
                    className="block text-sm font-semibold mb-2"
                  >
                    Additional details
                  </label>

                  <textarea
                    id="custom-flag-reason"
                    rows={4}
                    placeholder="Describe the issue..."
                    value={
                      flagReason === "Other"
                        ? ""
                        : flagReason
                    }
                    onChange={(e) =>
                      setFlagReason(
                        e.target.value || "Other"
                      )
                    }
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              )}

              {/* Severity */}
              <div>
                <p className="block text-sm font-semibold mb-2">
                  Severity
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map(
                    (severity) => (
                      <button
                        type="button"
                        key={severity}
                        onClick={() =>
                          setFlagSeverity(severity)
                        }
                        className={`px-3 py-2.5 rounded-lg border text-sm font-semibold capitalize transition-colors ${
                          flagSeverity === severity
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        {severity}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFlagDialogOpen(false)}
                disabled={flagging}
                className="px-4 py-2.5 rounded-lg border border-border font-semibold text-sm hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleFlagUser}
                disabled={flagging || !flagReason}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm disabled:opacity-50"
              >
                {flagging ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Flag size={16} />
                )}
                Flag User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}> = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-card border border-border rounded-xl p-5 shadow-card">
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      <Icon size={18} className="text-primary" />
      <span className="text-sm">{label}</span>
    </div>

    <p className="text-2xl font-bold">{value}</p>

    <p className="text-xs text-muted-foreground mt-1">
      {sub}
    </p>
  </div>
);

const InfoCard: React.FC<{
  title: string;
  value: string;
}> = ({ title, value }) => (
  <div className="bg-card border border-border rounded-xl p-5 shadow-card">
    <p className="text-sm text-muted-foreground">{title}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

const StatusBadge: React.FC<{ status: ReportStatus }> = ({
  status,
}) => {
  const config = {
    Pending: "bg-warning/15 text-warning",
    Approved: "bg-success/15 text-success",
    Rejected: "bg-destructive/15 text-destructive",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config[status]}`}
    >
      {status}
    </span>
  );
};

const FlagSeverityBadge: React.FC<{
  severity: FlagSeverity;
}> = ({ severity }) => {
  const config = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-warning/15 text-warning",
    high: "bg-destructive/15 text-destructive",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${config[severity]}`}
    >
      {severity}
    </span>
  );
};

const FlagStatusBadge: React.FC<{
  status: FlagStatus;
}> = ({ status }) => {
  const config = {
    active: "bg-destructive/15 text-destructive",
    resolved: "bg-success/15 text-success",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${config[status]}`}
    >
      {status}
    </span>
  );
};

const RedemptionStatus: React.FC<{
  status: Redemption["status"];
}> = ({ status }) => {
  const config = {
    pending: "bg-warning/15 text-warning",
    approved: "bg-primary/15 text-primary",
    claimed: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${config[status]}`}
    >
      {status}
    </span>
  );
};

export default AdminPage;