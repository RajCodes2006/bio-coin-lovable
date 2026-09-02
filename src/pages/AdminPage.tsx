import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/PageHeader";
import { CheckCircle, XCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface AdminReportRow {
  id: string;
  type: string;
  weight: number;
  location: string;
  description: string | null;
  photo_path: string | null;
  status: "Pending" | "Approved" | "Rejected";
  coins: number;
  created_at: string;
  reporter_name: string;
}

const AdminPage: React.FC = () => {
  const [reports, setReports] = useState<AdminReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const loadReports = useCallback(async () => {
    setLoading(true);
    // Pull pending reports first, plus recent reviewed ones for context.
    const { data, error } = await supabase
      .from("waste_reports")
      .select("id, type, weight, location, description, photo_path, status, coins, created_at, profiles!waste_reports_user_id_fkey(name)")
      .order("status", { ascending: true }) // "Approved" < "Pending" < "Rejected" alphabetically isn't ideal, so re-sort below
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast.error("Couldn't load reports for review.");
      setLoading(false);
      return;
    }

    const rows: AdminReportRow[] = (data ?? []).map((r: any) => ({
      id: r.id,
      type: r.type,
      weight: Number(r.weight),
      location: r.location,
      description: r.description,
      photo_path: r.photo_path,
      status: r.status,
      coins: r.coins,
      created_at: r.created_at,
      reporter_name: r.profiles?.name ?? "Unknown",
    }));

    // Pending first, then everything else by most recent.
    rows.sort((a, b) => {
      if (a.status === "Pending" && b.status !== "Pending") return -1;
      if (a.status !== "Pending" && b.status === "Pending") return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setReports(rows);
    setLoading(false);

    // Resolve signed URLs for any photos (bucket is private).
    const paths = rows.filter((r) => r.photo_path).map((r) => r.photo_path!) as string[];
    if (paths.length > 0) {
      const urlMap: Record<string, string> = {};
      await Promise.all(
        paths.map(async (path) => {
          const { data: signed } = await supabase.storage
            .from("report-photos")
            .createSignedUrl(path, 60 * 10); // 10 min
          if (signed?.signedUrl) urlMap[path] = signed.signedUrl;
        })
      );
      setPhotoUrls(urlMap);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleReview = async (id: string, newStatus: "Approved" | "Rejected") => {
    setReviewingId(id);
    try {
      const { error } = await supabase.rpc("review_report", {
        p_report_id: id,
        p_new_status: newStatus,
      });
      if (error) {
        toast.error(error.message || "Review failed");
        return;
      }
      toast.success(`Report ${newStatus.toLowerCase()}`);
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } finally {
      setReviewingId(null);
    }
  };

  const pendingCount = reports.filter((r) => r.status === "Pending").length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Review Reports" subtitle={`${pendingCount} pending review`} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 size={18} className="animate-spin" /> Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            No reports yet.
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r.id}
                className="bg-card rounded-xl p-5 shadow-card border border-border flex flex-col sm:flex-row gap-4"
              >
                {r.photo_path && photoUrls[r.photo_path] ? (
                  <img
                    src={photoUrls[r.photo_path]}
                    alt={`${r.type} waste report`}
                    className="w-full sm:w-32 h-32 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-full sm:w-32 h-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 text-muted-foreground">
                    <ImageIcon size={24} />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="font-bold">
                      {r.type} — {r.weight} kg
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        r.status === "Approved"
                          ? "bg-success/15 text-success"
                          : r.status === "Rejected"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-warning/15 text-warning"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reported by {r.reporter_name} · {r.location}
                  </p>
                  {r.description && (
                    <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                  )}
                  <p className="text-sm font-semibold text-coin-foreground mt-2">
                    {r.coins} Bio-Coins {r.status === "Approved" ? "credited" : "if approved"}
                  </p>

                  {r.status === "Pending" && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleReview(r.id, "Approved")}
                        disabled={reviewingId === r.id}
                        className="flex items-center gap-1.5 bg-success text-success-foreground px-3 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        onClick={() => handleReview(r.id, "Rejected")}
                        disabled={reviewingId === r.id}
                        className="flex items-center gap-1.5 bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
