import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteReport,
  getReports,
  WasteReport,
} from "@/lib/reports-store";
import {
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  Leaf,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";

type StatusFilter =
  | "All Status"
  | "Pending"
  | "Approved"
  | "Rejected";

type TypeFilter =
  | "All Types"
  | "Plastic"
  | "Paper"
  | "Metal"
  | "Glass"
  | "Organic";

const statusColor: Record<
  WasteReport["status"],
  string
> = {
  Approved: "bg-success/15 text-success",
  Pending: "bg-warning/15 text-warning",
  Rejected: "bg-destructive/15 text-destructive",
};

const WasteHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>("All Types");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All Status");

  const [search, setSearch] = useState("");

  const [selectedReport, setSelectedReport] =
    useState<WasteReport | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const loadReports = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const data = await getReports();
        setReports(data);
      } catch (error) {
        console.error(error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't load your waste history."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesType =
        typeFilter === "All Types" ||
        report.type === typeFilter;

      const matchesStatus =
        statusFilter === "All Status" ||
        report.status === statusFilter;

      const matchesSearch =
        !query ||
        report.type.toLowerCase().includes(query) ||
        report.location.toLowerCase().includes(query) ||
        report.status.toLowerCase().includes(query) ||
        report.description
          ?.toLowerCase()
          .includes(query);

      return (
        matchesType &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    reports,
    search,
    statusFilter,
    typeFilter,
  ]);

  const approvedCount = reports.filter(
    (report) => report.status === "Approved"
  ).length;

  const pendingCount = reports.filter(
    (report) => report.status === "Pending"
  ).length;

  const rejectedCount = reports.filter(
    (report) => report.status === "Rejected"
  ).length;

  const totalWaste = reports
    .filter((report) => report.status === "Approved")
    .reduce(
      (sum, report) => sum + report.weight,
      0
    );

  const totalEarned = reports
    .filter((report) => report.status === "Approved")
    .reduce(
      (sum, report) => sum + report.coins,
      0
    );

  const handleDelete = async (
    report: WasteReport
  ) => {
    const confirmed = window.confirm(
      `Delete this ${report.type} report? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(report.id);

    try {
      await deleteReport(report.id);

      setReports((current) =>
        current.filter(
          (item) => item.id !== report.id
        )
      );

      if (selectedReport?.id === report.id) {
        setSelectedReport(null);
      }

      toast.success("Report deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Couldn't delete the report."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Waste History"
        subtitle="Track all of your waste reports"
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* ==================================================
            TOP
            ================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Your Reports
            </h1>

            <p className="text-muted-foreground text-sm mt-1">
              Track verification status and earned
              Bio-Coins.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                void loadReports(false)
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted font-semibold text-sm disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/report")
              }
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg gradient-hero text-primary-foreground font-semibold text-sm"
            >
              <Plus size={17} />
              New Report
            </button>
          </div>
        </div>

        {/* ==================================================
            SUMMARY
            ================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <SummaryCard
            icon={FileText}
            label="Total Reports"
            value={reports.length}
          />

          <SummaryCard
            icon={CheckCircle}
            label="Approved"
            value={approvedCount}
          />

          <SummaryCard
            icon={Clock}
            label="Pending"
            value={pendingCount}
          />

          <SummaryCard
            icon={Leaf}
            label="Waste Collected"
            value={`${totalWaste.toFixed(1)} kg`}
            positive
          />
        </div>

        {/* ==================================================
            FILTERS
            ================================================== */}
        <section className="bg-card border border-border rounded-xl p-4 mb-6 shadow-card">
          <div className="flex items-center gap-2 text-sm font-semibold mb-4">
            <Filter size={16} />
            Filters
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search reports..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target.value as TypeFilter
                )
              }
              className="px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20"
            >
              {[
                "All Types",
                "Plastic",
                "Paper",
                "Metal",
                "Glass",
                "Organic",
              ].map((type) => (
                <option key={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter
                )
              }
              className="px-4 py-2.5 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20"
            >
              {[
                "All Status",
                "Pending",
                "Approved",
                "Rejected",
              ].map((status) => (
                <option key={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* ==================================================
            REPORTS
            ================================================== */}
        <section className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
              <Loader2
                size={20}
                className="animate-spin"
              />
              Loading your reports...
            </div>
          ) : filteredReports.length === 0 ? (
            <EmptyState
              hasReports={reports.length > 0}
              onCreate={() =>
                navigate("/report")
              }
              onClearFilters={() => {
                setSearch("");
                setTypeFilter("All Types");
                setStatusFilter("All Status");
              }}
            />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-5 py-3 text-sm font-semibold text-muted-foreground">
                        Date
                      </th>

                      <th className="text-left px-5 py-3 text-sm font-semibold text-muted-foreground">
                        Type
                      </th>

                      <th className="text-left px-5 py-3 text-sm font-semibold text-muted-foreground">
                        Location
                      </th>

                      <th className="text-left px-5 py-3 text-sm font-semibold text-muted-foreground">
                        Weight
                      </th>

                      <th className="text-left px-5 py-3 text-sm font-semibold text-muted-foreground">
                        Status
                      </th>

                      <th className="text-left px-5 py-3 text-sm font-semibold text-muted-foreground">
                        Coins
                      </th>

                      <th className="text-right px-5 py-3 text-sm font-semibold text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredReports.map(
                      (report) => (
                        <tr
                          key={report.id}
                          className="border-t border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-5 py-4 text-sm">
                            {report.date}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold">
                              {report.type}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-muted-foreground max-w-xs truncate">
                            {report.location}
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {report.weight} kg
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[report.status]}`}
                            >
                              {report.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm font-bold">
                            {report.status ===
                            "Approved"
                              ? `+${report.coins}`
                              : "—"}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReport(
                                    report
                                  )
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-primary text-xs font-semibold"
                              >
                                <Eye size={15} />
                                View
                              </button>

                              {report.status ===
                                "Pending" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleDelete(
                                      report
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    report.id
                                  }
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold disabled:opacity-50"
                                >
                                  {deletingId ===
                                  report.id ? (
                                    <Loader2
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2
                                      size={15}
                                    />
                                  )}
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y divide-border">
                {filteredReports.map(
                  (report) => (
                    <div
                      key={report.id}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {report.type}
                            </span>

                            <span
                              className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusColor[report.status]}`}
                            >
                              {report.status}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1">
                            {report.weight} kg
                          </p>
                        </div>

                        {report.status ===
                          "Approved" && (
                          <span className="font-bold text-success">
                            +{report.coins}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                        <MapPin size={13} />
                        {report.location}
                      </div>

                      <p className="text-xs text-muted-foreground mt-1">
                        {report.date}
                      </p>

                      <div className="flex gap-2 mt-4">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReport(
                              report
                            )
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-border text-primary font-semibold text-xs"
                        >
                          <Eye size={15} />
                          View
                        </button>

                        {report.status ===
                          "Pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              void handleDelete(
                                report
                              )
                            }
                            disabled={
                              deletingId ===
                              report.id
                            }
                            className="px-3 py-2.5 rounded-lg border border-destructive/30 text-destructive font-semibold text-xs disabled:opacity-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              <div className="p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>
                  Showing {filteredReports.length} of{" "}
                  {reports.length} reports
                </span>

                <span>
                  Total approved earnings: +
                  {totalEarned.toLocaleString()} Bio-Coins
                </span>
              </div>
            </>
          )}
        </section>
      </main>

      {/* ======================================================
          DETAILS MODAL
          ====================================================== */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setSelectedReport(null);
            }
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-details-title"
          >
            <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card">
              <div>
                <h2
                  id="report-details-title"
                  className="text-xl font-bold"
                >
                  Report Details
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Submitted {selectedReport.date}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedReport(null)
                }
                className="p-2 rounded-lg hover:bg-muted"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {selectedReport.photoUrl && (
                <img
                  src={selectedReport.photoUrl}
                  alt={`${selectedReport.type} waste evidence`}
                  className="w-full h-64 object-cover rounded-xl border border-border"
                />
              )}

              <div className="grid grid-cols-2 gap-3">
                <DetailCard
                  label="Waste Type"
                  value={selectedReport.type}
                />

                <DetailCard
                  label="Weight"
                  value={`${selectedReport.weight} kg`}
                />

                <DetailCard
                  label="Status"
                  value={selectedReport.status}
                />

                <DetailCard
                  label="Potential Coins"
                  value={`+${selectedReport.coins}`}
                />
              </div>

              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <MapPin
                    size={17}
                    className="text-primary"
                  />

                  <p className="font-semibold">
                    Collection Location
                  </p>
                </div>

                <p className="text-sm text-muted-foreground mt-2">
                  {selectedReport.location}
                </p>
              </div>

              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <FileText
                    size={17}
                    className="text-primary"
                  />

                  <p className="font-semibold">
                    Description
                  </p>
                </div>

                <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                  {selectedReport.description ||
                    "No additional description provided."}
                </p>
              </div>

              <div
                className={`rounded-xl p-4 border ${
                  selectedReport.status ===
                  "Approved"
                    ? "bg-success/10 border-success/20"
                    : selectedReport.status ===
                        "Pending"
                      ? "bg-warning/10 border-warning/20"
                      : "bg-destructive/10 border-destructive/20"
                }`}
              >
                <p className="text-sm font-semibold">
                  {selectedReport.status ===
                    "Approved" &&
                    "Report verified — Bio-Coins were earned."}

                  {selectedReport.status ===
                    "Pending" &&
                    "Report is awaiting verification."}

                  {selectedReport.status ===
                    "Rejected" &&
                    "Report was not approved."}
                </p>
              </div>

              {selectedReport.status ===
                "Pending" && (
                <button
                  type="button"
                  onClick={() =>
                    void handleDelete(
                      selectedReport
                    )
                  }
                  disabled={
                    deletingId ===
                    selectedReport.id
                  }
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold disabled:opacity-50"
                >
                  {deletingId ===
                  selectedReport.id ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={17} />
                  )}

                  Delete Pending Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// SUMMARY CARD
// ============================================================

const SummaryCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string | number;
  positive?: boolean;
}> = ({
  icon: Icon,
  label,
  value,
  positive,
}) => (
  <div className="bg-card border border-border rounded-xl p-4 shadow-card">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon
        size={17}
        className={
          positive ? "text-primary" : ""
        }
      />

      <span className="text-xs font-medium">
        {label}
      </span>
    </div>

    <p className="text-xl sm:text-2xl font-bold mt-2">
      {value}
    </p>
  </div>
);

// ============================================================
// DETAIL CARD
// ============================================================

const DetailCard: React.FC<{
  label: string;
  value: string;
}> = ({ label, value }) => (
  <div className="bg-muted/30 border border-border rounded-xl p-4">
    <p className="text-xs text-muted-foreground">
      {label}
    </p>

    <p className="font-bold mt-1">
      {value}
    </p>
  </div>
);

// ============================================================
// EMPTY STATE
// ============================================================

const EmptyState: React.FC<{
  hasReports: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
}> = ({
  hasReports,
  onCreate,
  onClearFilters,
}) => (
  <div className="py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
      {hasReports ? (
        <Search
          size={28}
          className="text-primary"
        />
      ) : (
        <Leaf
          size={28}
          className="text-primary"
        />
      )}
    </div>

    <h3 className="font-bold text-lg mt-4">
      {hasReports
        ? "No matching reports"
        : "No waste reports yet"}
    </h3>

    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
      {hasReports
        ? "Try changing your search or filters."
        : "Submit your first waste report and start earning Bio-Coins."}
    </p>

    <div className="flex flex-col sm:flex-row justify-center gap-2 mt-5">
      {hasReports ? (
        <button
          type="button"
          onClick={onClearFilters}
          className="px-4 py-2.5 rounded-lg border border-border font-semibold text-sm hover:bg-muted"
        >
          Clear Filters
        </button>
      ) : null}

      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-hero text-primary-foreground font-semibold text-sm"
      >
        <Plus size={16} />
        Report Waste
      </button>
    </div>
  </div>
);

export default WasteHistoryPage;