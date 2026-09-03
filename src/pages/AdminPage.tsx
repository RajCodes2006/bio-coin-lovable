import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import AdminUserDetails from "@/components/admin/AdminUserDetails";
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

type RedemptionStatus =
  | "pending"
  | "approved"
  | "claimed"
  | "cancelled";

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
  status: RedemptionStatus;
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
  | "flags"
  | "rewards"
  | "redemptions";

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
  const [resolvingFlagId, setResolvingFlagId] = useState<string | null>(
    null
  );

  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  // User details
  const [selectedUserForDetails, setSelectedUserForDetails] =
    useState<AdminUser | null>(null);

  // Flag dialog
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [customFlagReason, setCustomFlagReason] = useState("");
  const [flagSeverity, setFlagSeverity] =
    useState<FlagSeverity>("medium");
  const [flagging, setFlagging] = useState(false);

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
      console.error("loadReports:", error);
      toast.error("Couldn't load reports.");
      return;
    }

    const rows: AdminReport[] = (data ?? []).map((row) => {
      const profile = row.profiles as
        | { name?: string | null }
        | null;

      return {
        id: row.id,
        user_id: row.user_id,
        type: String(row.type),
        weight: Number(row.weight),
        location: row.location,
        description: row.description,
        photo_path: row.photo_path,
        status: row.status as ReportStatus,
        coins: Number(row.coins),
        created_at: row.created_at,
        reviewed_at: row.reviewed_at,
        reporter_name: profile?.name ?? "Unknown User",
      };
    });

    setReports(rows);

    const paths = rows
      .map((row) => row.photo_path)
      .filter((path): path is string => Boolean(path));

    if (paths.length === 0) {
      setPhotoUrls({});
      return;
    }

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
      console.error("loadUsers:", error);
      toast.error("Couldn't load users.");
      return;
    }

    const rows: AdminUser[] = (data ?? []).map((user) => ({
      id: user.id,
      name: user.name ?? "Unnamed User",
      city: user.city ?? "Unknown",
      bio_coins: Number(user.bio_coins ?? 0),
      role: user.role === "admin" ? "admin" : "user",
      is_admin: Boolean(user.is_admin),
      member_since: user.member_since,
    }));

    setUsers(rows);
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
      console.error("loadRewards:", error);
      toast.error("Couldn't load rewards.");
      return;
    }

    setRewards(
      (data ?? []).map((reward) => ({
        id: reward.id,
        title: reward.title,
        description: reward.description,
        cost: Number(reward.cost),
        category: reward.category,
        icon: reward.icon,
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
      console.error("loadRedemptions:", error);
      toast.error("Couldn't load redemptions.");
      return;
    }

    setRedemptions(
      (data ?? []).map((row) => {
        const profile = row.profiles as
          | { name?: string | null }
          | null;

        const item = row.redeem_items as
          | { title?: string | null }
          | null;

        return {
          id: row.id,
          user_id: row.user_id,
          item_id: row.item_id,
          coins_spent: Number(row.coins_spent),
          redeemed_at: row.redeemed_at,
          status: row.status as RedemptionStatus,
          user_name: profile?.name ?? "Unknown User",
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
      console.error("loadFlags:", error);
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
    void loadAll();
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
  // FLAG DIALOG
  // ----------------------------------------------------------
  const openFlagDialog = (user: AdminUser) => {
    if (user.role === "admin") {
      toast.error("Admin accounts cannot be flagged.");
      return;
    }

    setSelectedUser(user);
    setFlagReason("");
    setCustomFlagReason("");
    setFlagSeverity("medium");
    setFlagDialogOpen(true);
  };

  const closeFlagDialog = () => {
    if (flagging) return;

    setFlagDialogOpen(false);
    setSelectedUser(null);
    setFlagReason("");
    setCustomFlagReason("");
    setFlagSeverity("medium");
  };

  // ----------------------------------------------------------
  // FLAG USER
  // ----------------------------------------------------------
  const handleFlagUser = async () => {
    if (!selectedUser) return;

    const finalReason =
      flagReason === "Other"
        ? customFlagReason.trim()
        : flagReason.trim();

    if (!finalReason) {
      toast.error("Please provide a flag reason.");
      return;
    }

    setFlagging(true);

    try {
      const { error } = await supabase.rpc("flag_user", {
        p_user_id: selectedUser.id,
        p_reason: finalReason,
        p_severity: flagSeverity,
      });

      if (error) {
        toast.error(error.message || "Could not flag user.");
        return;
      }

      toast.success(`${selectedUser.name} has been flagged.`);

      closeFlagDialog();
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
  // HELPERS
  // ----------------------------------------------------------
  const getUserById = useCallback(
    (userId: string) => users.find((user) => user.id === userId),
    [users]
  );

  const getActiveUserFlags = useCallback(
    (userId: string) =>
      flags.filter(
        (flag) =>
          flag.user_id === userId && flag.status === "active"
      ),
    [flags]
  );

  // ----------------------------------------------------------
  // STATS
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
      (sum, user) => sum + user.bio_coins,
      0
    );

    const totalRedeemed = redemptions.reduce(
      (sum, redemption) => sum + redemption.coins_spent,
      0
    );

    const activeFlags = flags.filter(
      (flag) => flag.status === "active"
    ).length;

    const highSeverityFlags = flags.filter(
      (flag) =>
        flag.status === "active" && flag.severity === "high"
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
  // USER SEARCH
  // ----------------------------------------------------------
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.city.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
    );
  }, [users, search]);

  // ----------------------------------------------------------
  // REPORT SEARCH
  // ----------------------------------------------------------
  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return reports;

    return reports.filter(
      (report) =>
        report.reporter_name.toLowerCase().includes(query) ||
        report.type.toLowerCase().includes(query) ||
        report.location.toLowerCase().includes(query) ||
        report.status.toLowerCase().includes(query)
    );
  }, [reports, search]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "reports", label: "Reports" },
    { key: "users", label: "Users" },
    { key: "flags", label: "Flags" },
    { key: "rewards", label: "Rewards" },
    { key: "redemptions", label: "Redemptions" },
  ];

  // ----------------------------------------------------------
  // LOADING
  // ----------------------------------------------------------
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
          {/* ==================================================
              HEADER
              ================================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">
                Administration
              </h2>

              <p className="text-sm text-muted-foreground">
                Manage users, verify reports, monitor rewards and
                handle moderation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadAll()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors text-sm font-semibold"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {/* ==================================================
              TABS
              ================================================== */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                type="button"
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

                {tab.key === "flags" &&
                  stats.activeFlags > 0 && (
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
                <section className="lg:col-span-2 bg-card border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">
                        Pending Reports
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Reports requiring verification
                      </p>
                    </div>

                    <button
                      type="button"
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
                      .map((report) => (
                        <div
                          key={report.id}
                          className="p-4 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {report.reporter_name}
                            </p>

                            <p className="text-sm text-muted-foreground truncate">
                              {report.type} · {report.weight} kg ·{" "}
                              {report.location}
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

                <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                  <div className="p-5 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">
                        User Flags
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        Active moderation alerts
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveTab("flags")}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      View all
                    </button>
                  </div>

                  <div className="divide-y divide-border">
                    {flags
                      .filter((flag) => flag.status === "active")
                      .slice(0, 5)
                      .map((flag) => {
                        const user = getUserById(flag.user_id);

                        return (
                          <div
                            key={flag.id}
                            className="p-4"
                          >
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
                  <h3 className="font-bold text-lg">
                    Waste Reports
                  </h3>

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
                {filteredReports.map((report) => (
                  <div key={report.id} className="p-5">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {report.photo_path &&
                      photoUrls[report.photo_path] ? (
                        <img
                          src={photoUrls[report.photo_path]}
                          alt={`${report.type} waste report`}
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
                            {report.type} — {report.weight} kg
                          </h4>

                          <StatusBadge
                            status={report.status}
                          />
                        </div>

                        <p className="text-sm text-muted-foreground mt-1">
                          Reported by{" "}
                          <strong>{report.reporter_name}</strong>{" "}
                          · {report.location}
                        </p>

                        {report.description && (
                          <p className="text-sm mt-3 text-muted-foreground">
                            {report.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 mt-3 text-sm">
                          <span className="font-semibold text-coin-foreground">
                            +{report.coins} Bio-Coins
                          </span>

                          <span className="text-muted-foreground">
                            {new Date(
                              report.created_at
                            ).toLocaleString()}
                          </span>
                        </div>

                        {report.status === "Pending" && (
                          <div className="flex gap-2 mt-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleReview(
                                  report.id,
                                  "Approved"
                                )
                              }
                              disabled={
                                reviewingId === report.id
                              }
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground font-semibold text-sm disabled:opacity-50"
                            >
                              {reviewingId === report.id ? (
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
                              type="button"
                              onClick={() =>
                                handleReview(
                                  report.id,
                                  "Rejected"
                                )
                              }
                              disabled={
                                reviewingId === report.id
                              }
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
                  <h3 className="font-bold text-lg">
                    User Management
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    View users, inspect activity, and flag suspicious accounts.
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
                      <th className="px-5 py-3 font-semibold">
                        Name
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        City
                      </th>

                      <th className="px-5 py-3 font-semibold">
                        Role
                      </th>

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
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {filteredUsers.map((user) => {
                      const activeFlags = getActiveUserFlags(
                        user.id
                      );

                      const hasActiveFlag =
                        activeFlags.length > 0;

                      return (
                        <tr
                          key={user.id}
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

                              {user.name}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-muted-foreground">
                            {user.city}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                user.role === "admin"
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>

                          <td className="px-5 py-4 font-bold text-coin-foreground">
                            {user.bio_coins.toLocaleString()}
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
                              user.member_since
                            ).toLocaleDateString()}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedUserForDetails(
                                    user
                                  )
                                }
                                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                              >
                                View
                              </button>

                              {user.role !== "admin" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openFlagDialog(user)
                                  }
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold text-xs transition-colors"
                                >
                                  <Flag size={14} />
                                  Flag
                                </button>
                              )}
                            </div>
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
                      Review and resolve moderation alerts.
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
                              {user?.city ?? "Unknown city"} ·
                              Flagged{" "}
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
                            type="button"
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

                    <p className="font-semibold">
                      No flags yet
                    </p>

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
                <h3 className="font-bold text-lg">
                  Redemptions
                </h3>

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
                    {redemptions.map((redemption) => (
                      <tr
                        key={redemption.id}
                        className="hover:bg-muted/30"
                      >
                        <td className="px-5 py-4 font-semibold">
                          {redemption.user_name}
                        </td>

                        <td className="px-5 py-4">
                          {redemption.reward_title}
                        </td>

                        <td className="px-5 py-4 font-bold text-coin-foreground">
                          -{redemption.coins_spent.toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <RedemptionStatus
                            status={redemption.status}
                          />
                        </td>

                        <td className="px-5 py-4 text-muted-foreground">
                          {new Date(
                            redemption.redeemed_at
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
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeFlagDialog();
            }
          }}
        >
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
                onClick={closeFlagDialog}
                disabled={flagging}
                className="p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                aria-label="Close flag dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
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
                  onChange={(event) =>
                    setFlagReason(event.target.value)
                  }
                  className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    Select a reason
                  </option>

                  {FLAG_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

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
                    value={customFlagReason}
                    onChange={(event) =>
                      setCustomFlagReason(event.target.value)
                    }
                    placeholder="Describe the issue..."
                    className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              )}

              <div>
                <p className="block text-sm font-semibold mb-2">
                  Severity
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {(
                    ["low", "medium", "high"] as const
                  ).map((severity) => (
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
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={closeFlagDialog}
                disabled={flagging}
                className="px-4 py-2.5 rounded-lg border border-border font-semibold text-sm hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleFlagUser()}
                disabled={
                  flagging ||
                  !flagReason ||
                  (flagReason === "Other" &&
                    !customFlagReason.trim())
                }
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground font-semibold text-sm disabled:opacity-50"
              >
                {flagging ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Flag size={16} />
                )}

                Flag User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          USER DETAILS
          ====================================================== */}
      {selectedUserForDetails && (
        <AdminUserDetails
          user={selectedUserForDetails}
          onClose={() => setSelectedUserForDetails(null)}
        />
      )}
    </>
  );
};

// ============================================================
// STAT CARD
// ============================================================

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

// ============================================================
// INFO CARD
// ============================================================

const InfoCard: React.FC<{
  title: string;
  value: string;
}> = ({ title, value }) => (
  <div className="bg-card border border-border rounded-xl p-5 shadow-card">
    <p className="text-sm text-muted-foreground">{title}</p>

    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

// ============================================================
// REPORT STATUS
// ============================================================

const StatusBadge: React.FC<{
  status: ReportStatus;
}> = ({ status }) => {
  const classes = {
    Pending: "bg-warning/15 text-warning",
    Approved: "bg-success/15 text-success",
    Rejected: "bg-destructive/15 text-destructive",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${classes[status]}`}
    >
      {status}
    </span>
  );
};

// ============================================================
// FLAG SEVERITY
// ============================================================

const FlagSeverityBadge: React.FC<{
  severity: FlagSeverity;
}> = ({ severity }) => {
  const classes = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-warning/15 text-warning",
    high: "bg-destructive/15 text-destructive",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${classes[severity]}`}
    >
      {severity}
    </span>
  );
};

// ============================================================
// FLAG STATUS
// ============================================================

const FlagStatusBadge: React.FC<{
  status: FlagStatus;
}> = ({ status }) => {
  const classes = {
    active: "bg-destructive/15 text-destructive",
    resolved: "bg-success/15 text-success",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${classes[status]}`}
    >
      {status}
    </span>
  );
};

// ============================================================
// REDEMPTION STATUS
// ============================================================

const RedemptionStatus: React.FC<{
  status: RedemptionStatus;
}> = ({ status }) => {
  const classes = {
    pending: "bg-warning/15 text-warning",
    approved: "bg-primary/15 text-primary",
    claimed: "bg-success/15 text-success",
    cancelled: "bg-destructive/15 text-destructive",
  };

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${classes[status]}`}
    >
      {status}
    </span>
  );
};

export default AdminPage;