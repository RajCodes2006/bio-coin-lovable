import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import {
  AlertCircle,
  CheckCircle,
  Coins,
  Gift,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type ReportStatus = "Pending" | "Approved" | "Rejected";

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

type Tab = "overview" | "reports" | "users" | "rewards" | "redemptions";

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

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

    const userIds = [...new Set((data ?? []).map((r) => r.user_id))];

    let emailMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .in("id", userIds);

      void profileData;
    }

    const rows: AdminReport[] = (data ?? []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      type: r.type,
      weight: Number(r.weight),
      location: r.location,
      description: r.description,
      photo_path: r.photo_path,
      status: r.status,
      coins: Number(r.coins),
      created_at: r.created_at,
      reviewed_at: r.reviewed_at,
      reporter_name: r.profiles?.name ?? "Unknown",
      reporter_email: emailMap[r.user_id] ?? "",
    }));

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
      (data ?? []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        item_id: r.item_id,
        coins_spent: Number(r.coins_spent),
        redeemed_at: r.redeemed_at,
        status: r.status,
        user_name: r.profiles?.name ?? "Unknown",
        reward_title: r.redeem_items?.title ?? "Unknown Reward",
      }))
    );
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);

    await Promise.all([
      loadReports(),
      loadUsers(),
      loadRewards(),
      loadRedemptions(),
    ]);

    setLoading(false);
  }, [loadReports, loadUsers, loadRewards, loadRedemptions]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
    };
  }, [reports, users, rewards, redemptions]);

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

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "reports", label: "Reports" },
    { key: "users", label: "Users" },
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
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage and monitor Green Bharat"
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Top actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Administration</h2>
            <p className="text-sm text-muted-foreground">
              Monitor users, reports, rewards and Bio-Coin activity.
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

        {/* Tabs */}
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
            </button>
          ))}
        </div>

        {/* ================= OVERVIEW ================= */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                sub={`${stats.totalCoinsHeld.toLocaleString()} currently held`}
              />

              <StatCard
                icon={Gift}
                label="Redemptions"
                value={stats.redemptions.toLocaleString()}
                sub={`${stats.totalRedeemed.toLocaleString()} coins spent`}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
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

                  {reports.filter((r) => r.status === "Pending")
                    .length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No pending reports.
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-bold">Top Users by Bio-Coins</h3>
                  <p className="text-sm text-muted-foreground">
                    Current wallet balances
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {[...users]
                    .filter((u) => u.role === "user")
                    .sort((a, b) => b.bio_coins - a.bio_coins)
                    .slice(0, 5)
                    .map((u, index) => (
                      <div
                        key={u.id}
                        className="p-4 flex items-center gap-4"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {u.city}
                          </p>
                        </div>

                        <span className="font-bold text-coin-foreground">
                          {u.bio_coins.toLocaleString()}
                        </span>
                      </div>
                    ))}

                  {users.filter((u) => u.role === "user").length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">
                      No users found.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </>
        )}

        {/* ================= REPORTS ================= */}
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

        {/* ================= USERS ================= */}
        {activeTab === "users" && (
          <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-lg">Users</h3>
                <p className="text-sm text-muted-foreground">
                  All application profiles.
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
                    <th className="px-5 py-3 font-semibold">Bio-Coins</th>
                    <th className="px-5 py-3 font-semibold">Joined</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30">
                      <td className="px-5 py-4 font-semibold">
                        {u.name}
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

                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(u.member_since).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
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

        {/* ================= REWARDS ================= */}
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

                  <h4 className="font-bold text-lg">{reward.title}</h4>

                  <p className="text-sm text-muted-foreground mt-1 min-h-10">
                    {reward.description || "No description available."}
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

        {/* ================= REDEMPTIONS ================= */}
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
                    <th className="px-5 py-3 font-semibold">User</th>
                    <th className="px-5 py-3 font-semibold">Reward</th>
                    <th className="px-5 py-3 font-semibold">Coins</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {redemptions.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
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
                        {new Date(r.redeemed_at).toLocaleString()}
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

    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
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