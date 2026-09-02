import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { WasteReport, getReports, deleteReport } from "@/lib/reports-store";
import { Plus, Trash2, Eye, Filter, Loader2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";

const statusColor: Record<string, string> = {
  Approved: "bg-success/15 text-success",
  Pending: "bg-warning/15 text-warning",
  Rejected: "bg-destructive/15 text-destructive",
};

const WasteHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Types");

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      setReports(await getReports());
    } catch {
      toast.error("Couldn't load your waste history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const filtered = filter === "All Types" ? reports : reports.filter((r) => r.type === filter);

  const handleDelete = async (id: string) => {
    try {
      await deleteReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Report deleted");
    } catch {
      toast.error("Couldn't delete that report. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Waste History" subtitle="View your waste collection reports" />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground" />
            {["All Types", "Plastic", "Paper", "Metal", "Glass", "Organic"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  filter === t ? "gradient-hero text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate("/report")}
          className="gradient-hero text-primary-foreground px-4 py-2.5 rounded-lg font-semibold flex items-center gap-2 mb-6 hover:opacity-90 transition-opacity"
        >
          <Plus size={18} /> New Report
        </button>

        <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 size={18} className="animate-spin" /> Loading reports...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p>No waste reports yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Weight</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Coins</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">{r.date}</td>
                      <td className="px-4 py-3 text-sm font-medium">{r.type}</td>
                      <td className="px-4 py-3 text-sm">{r.weight} kg</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[r.status]}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-success">
                        {r.status === "Approved" ? `+${r.coins}` : "-"}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button aria-label={`View report from ${r.date}`} className="text-primary hover:text-primary/80">
                          <Eye size={16} />
                        </button>
                        {r.status === "Pending" && (
                          <button
                            aria-label={`Delete report from ${r.date}`}
                            onClick={() => handleDelete(r.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WasteHistoryPage;
