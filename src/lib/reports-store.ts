import { wasteReports as seedReports, WasteReport } from "@/lib/mock-data";

/**
 * Temporary localStorage-backed store for waste reports.
 *
 * This exists to bridge ReportPage (which creates reports) and
 * WasteHistoryPage (which lists them) now that they need to share
 * state — previously WasteHistoryPage only ever showed the static
 * mock data and never reflected a newly submitted report.
 *
 * NOTE: this is a stopgap for the current localStorage-only prototype.
 * Once a real backend (e.g. Supabase) is wired up, this file should be
 * replaced with actual API calls and can be deleted.
 */

const STORAGE_KEY = "gb_reports";

// Coins awarded per kg of verified waste (matches the rate the
// in-app assistant already quotes to users).
export const COINS_PER_KG = 10;

function readAll(): WasteReport[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as WasteReport[];
    } catch {
      // Corrupt data — fall back to reseeding below.
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedReports));
  return seedReports;
}

export function getReports(): WasteReport[] {
  return readAll();
}

export function addReport(input: {
  type: WasteReport["type"];
  weight: number;
  image?: string;
}): WasteReport {
  const reports = readAll();
  const coins = Math.round(input.weight * COINS_PER_KG);

  const newReport: WasteReport = {
    id: Date.now().toString(),
    date: new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    type: input.type,
    weight: input.weight,
    // Auto-approved for now since there's no admin/moderation flow yet.
    status: "Approved",
    coins,
    image: input.image,
  };

  const updated = [newReport, ...reports];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newReport;
}

export function deleteReport(id: string): void {
  const reports = readAll().filter((r) => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}
