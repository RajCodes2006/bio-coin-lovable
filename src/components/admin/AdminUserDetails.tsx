import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  X,
  User,
  MapPin,
  Coins,
  Flag,
  FileText,
  Gift,
  History,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface AdminUserDetailsProps {
  user: {
    id: string;
    name: string;
    city: string;
    bio_coins: number;
    role: "user" | "admin";
    is_admin: boolean;
    member_since: string;
  } | null;
  onClose: () => void;
}

interface Report {
  id: string;
  type: string;
  weight: number;
  location: string;
  status: "Pending" | "Approved" | "Rejected";
  coins: number;
  created_at: string;
}

interface Redemption {
  id: string;
  coins_spent: number;
  redeemed_at: string;
  status: string;
  reward_title: string;
}

interface CoinTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface UserFlag {
  id: string;
  reason: string;
  severity: "low" | "medium" | "high";
  status: "active" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

type ReportStatus = "Pending" | "Approved" | "Rejected";

type FlagSeverity = "low" | "medium" | "high";

type FlagStatus = "active" | "resolved";

const AdminUserDetails: React.FC<AdminUserDetailsProps> = ({
  user,
  onClose,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [flags, setFlags] = useState<UserFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadUserData = async () => {
      setLoading(true);

      const [
        reportsResult,
        redemptionsResult,
        transactionsResult,
        flagsResult,
      ] = await Promise.all([
        supabase
          .from("waste_reports")
          .select(
            "id, type, weight, location, status, coins, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("redemptions")
          .select(
            `
              id,
              coins_spent,
              redeemed_at,
              status,
              redeem_items (
                title
              )
            `
          )
          .eq("user_id", user.id)
          .order("redeemed_at", { ascending: false }),

        supabase
          .from("coin_transactions")
          .select(
            "id, amount, transaction_type, description, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("user_flags")
          .select(
            "id, reason, severity, status, created_at, resolved_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (reportsResult.error) {
        console.error("Reports:", reportsResult.error);
      }

      if (redemptionsResult.error) {
        console.error("Redemptions:", redemptionsResult.error);
      }

      if (transactionsResult.error) {
        console.error("Transactions:", transactionsResult.error);
      }

      if (flagsResult.error) {
        console.error("Flags:", flagsResult.error);
      }

      setReports(
        (reportsResult.data ?? []).map((report) => ({
          id: report.id,
          type: report.type,
          weight: Number(report.weight),
          location: report.location,
          status: report.status as Report["status"],
          coins: Number(report.coins),
          created_at: report.created_at,
        }))
      );

      setRedemptions(
        (redemptionsResult.data ?? []).map((item) => {
          const reward = item.redeem_items as
            | { title?: string | null }
            | null;

          return {
            id: item.id,
            coins_spent: Number(item.coins_spent),
            redeemed_at: item.redeemed_at,
            status: item.status,
            reward_title: reward?.title ?? "Unknown Reward",
          };
        })
      );

      setTransactions(
        (transactionsResult.data ?? []).map((item) => ({
          id: item.id,
          amount: Number(item.amount),
          transaction_type: item.transaction_type,
          description: item.description,
          created_at: item.created_at,
        }))
      );

      setFlags(
        (flagsResult.data ?? []).map((flag) => ({
          id: flag.id,
          reason: flag.reason,
          severity: flag.severity as UserFlag["severity"],
          status: flag.status as UserFlag["status"],
          created_at: flag.created_at,
          resolved_at: flag.resolved_at,
        }))
      );

      setLoading(false);
    };

    loadUserData();
  }, [user]);

  if (!user) return null;

  const approvedReports = reports.filter(
    (report) => report.status === "Approved"
  );

  const rejectedReports = reports.filter(
    (report) => report.status === "Rejected"
  );

  const pendingReports = reports.filter(
    (report) => report.status === "Pending"
  );

  const totalWaste = approvedReports.reduce(
    (sum, report) => sum + report.weight,
    0
  );

  const totalEarned = reports
    .filter((report) => report.status === "Approved")
    .reduce((sum, report) => sum + report.coins, 0);

  const totalSpent = redemptions.reduce(
    (sum, redemption) => sum + redemption.coins_spent,
    0
  );

  const activeFlags = flags.filter(
    (flag) => flag.status === "active"
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden bg-card border border-border rounded-2xl shadow-2xl">
        {/* HEADER */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="text-primary" size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>

              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {user.city}
                </span>

                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    user.role === "admin"
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close user details"
          >
            <X size={22} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="overflow-y-auto max-h-[calc(90vh-88px)] p-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2 size={22} className="animate-spin" />
              Loading user activity...
            </div>
          ) : (
            <>
              {/* SUMMARY CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SummaryCard
                  icon={Coins}
                  title="Current Coins"
                  value={user.bio_coins.toLocaleString()}
                />

                <SummaryCard
                  icon={FileText}
                  title="Reports"
                  value={reports.length.toLocaleString()}
                />

                <SummaryCard
                  icon={Gift}
                  title="Redemptions"
                  value={redemptions.length.toLocaleString()}
                />

                <SummaryCard
                  icon={Flag}
                  title="Active Flags"
                  value={activeFlags.length.toLocaleString()}
                  danger={activeFlags.length > 0}
                />
              </div>

              {/* ACTIVITY STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MiniStat
                  title="Approved Reports"
                  value={approvedReports.length.toLocaleString()}
                  icon={CheckCircle}
                />

                <MiniStat
                  title="Pending Reports"
                  value={pendingReports.length.toLocaleString()}
                  icon={AlertTriangle}
                />

                <MiniStat
                  title="Rejected Reports"
                  value={rejectedReports.length.toLocaleString()}
                  icon={XCircle}
                />
              </div>

              {/* USER SUMMARY */}
              <section className="bg-muted/30 border border-border rounded-xl p-5">
                <h3 className="font-bold mb-4">User Summary</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <SummaryValue
                    label="Total Waste"
                    value={`${totalWaste.toFixed(1)} kg`}
                  />

                  <SummaryValue
                    label="Coins Earned"
                    value={`+${totalEarned.toLocaleString()}`}
                  />

                  <SummaryValue
                    label="Coins Spent"
                    value={`-${totalSpent.toLocaleString()}`}
                  />

                  <SummaryValue
                    label="Member Since"
                    value={new Date(
                      user.member_since
                    ).toLocaleDateString()}
                  />
                </div>
              </section>

              {/* FLAGS */}
              <section className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      <Flag size={18} />
                      Flag History
                    </h3>

                    <p className="text-sm text-muted-foreground mt-1">
                      Moderation history for this user.
                    </p>
                  </div>

                  {activeFlags.length > 0 && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-destructive/15 text-destructive font-semibold">
                      {activeFlags.length} active
                    </span>
                  )}
                </div>

                {flags.length > 0 ? (
                  <div className="divide-y divide-border">
                    {flags.map((flag) => (
                      <div
                        key={flag.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                              {flag.reason}
                            </p>

                            <FlagSeverityBadge
                              severity={flag.severity}
                            />

                            <FlagStatusBadge
                              status={flag.status}
                            />
                          </div>

                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(
                              flag.created_at
                            ).toLocaleString()}
                          </p>
                        </div>

                        {flag.resolved_at && (
                          <span className="text-xs text-muted-foreground">
                            Resolved{" "}
                            {new Date(
                              flag.resolved_at
                            ).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No flags for this user.
                  </div>
                )}
              </section>

              {/* REPORTS */}
              <section className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-bold flex items-center gap-2">
                    <FileText size={18} />
                    Waste Reports
                  </h3>

                  <p className="text-sm text-muted-foreground mt-1">
                    All submitted cleanliness reports.
                  </p>
                </div>

                {reports.length > 0 ? (
                  <div className="divide-y divide-border">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {report.type} · {report.weight} kg
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {report.location}
                          </p>

                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(
                              report.created_at
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-coin-foreground">
                            +{report.coins}
                          </span>

                          <StatusBadge status={report.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No waste reports.
                  </div>
                )}
              </section>

              {/* REDEMPTIONS */}
              <section className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-bold flex items-center gap-2">
                    <Gift size={18} />
                    Redemption History
                  </h3>
                </div>

                {redemptions.length > 0 ? (
                  <div className="divide-y divide-border">
                    {redemptions.map((redemption) => (
                      <div
                        key={redemption.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {redemption.reward_title}
                          </p>

                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(
                              redemption.redeemed_at
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-destructive">
                            -{redemption.coins_spent}
                          </span>

                          <span className="text-xs px-2.5 py-1 rounded-full bg-muted capitalize">
                            {redemption.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No redemption history.
                  </div>
                )}
              </section>

              {/* COIN TRANSACTIONS */}
              <section className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-bold flex items-center gap-2">
                    <History size={18} />
                    Coin Transactions
                  </h3>
                </div>

                {transactions.length > 0 ? (
                  <div className="divide-y divide-border">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold">
                            {formatTransactionType(
                              transaction.transaction_type
                            )}
                          </p>

                          {transaction.description && (
                            <p className="text-sm text-muted-foreground">
                              {transaction.description}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(
                              transaction.created_at
                            ).toLocaleString()}
                          </p>
                        </div>

                        <span
                          className={`font-bold ${
                            transaction.amount >= 0
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          {transaction.amount >= 0 ? "+" : ""}
                          {transaction.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    No coin transactions.
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{
  icon: React.ElementType;
  title: string;
  value: string;
  danger?: boolean;
}> = ({ icon: Icon, title, value, danger }) => (
  <div
    className={`rounded-xl border p-4 ${
      danger
        ? "border-destructive/30 bg-destructive/5"
        : "border-border bg-card"
    }`}
  >
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={17} />
      <span className="text-xs font-medium">{title}</span>
    </div>

    <p className="text-2xl font-bold mt-2">{value}</p>
  </div>
);

const MiniStat: React.FC<{
  title: string;
  value: string;
  icon: React.ElementType;
}> = ({ title, value, icon: Icon }) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon size={16} />
      <span className="text-sm">{title}</span>
    </div>

    <p className="text-xl font-bold mt-2">{value}</p>
  </div>
);

const SummaryValue: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="font-bold mt-1">{value}</p>
  </div>
);

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
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${classes[status]}`}
    >
      {status}
    </span>
  );
};

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
      className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${classes[severity]}`}
    >
      {severity}
    </span>
  );
};

const FlagStatusBadge: React.FC<{
  status: FlagStatus;
}> = ({ status }) => {
  const classes = {
    active: "bg-destructive/15 text-destructive",
    resolved: "bg-success/15 text-success",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${classes[status]}`}
    >
      {status}
    </span>
  );
};

function formatTransactionType(type: string): string {
  switch (type) {
    case "REPORT_REWARD":
      return "Waste Report Reward";

    case "REDEMPTION":
      return "Reward Redemption";

    case "ADMIN_ADJUSTMENT":
      return "Admin Adjustment";

    case "BONUS":
      return "Bonus";

    default:
      return type.replace(/_/g, " ");
  }
}

export default AdminUserDetails;