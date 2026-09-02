import { supabase } from "@/lib/supabase";

export interface WasteReport {
  id: string;
  date: string;
  type: "Plastic" | "Paper" | "Metal" | "Glass" | "Organic";
  weight: number;
  status: "Approved" | "Pending" | "Rejected";
  coins: number;
  photoUrl?: string;
}

// Coins awarded per kg of verified waste (matches the rate the
// in-app assistant already quotes to users). Reports go in as
// "Pending" — actual crediting happens only once an admin/reviewer
// approves them (see the `approve_report` follow-up work).
export const COINS_PER_KG = 10;

function mapRow(row: any): WasteReport {
  return {
    id: row.id,
    date: new Date(row.created_at).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
    type: row.type,
    weight: Number(row.weight),
    status: row.status,
    coins: row.coins,
    photoUrl: row.photo_url ?? undefined,
  };
}

export async function getReports(): Promise<WasteReport[]> {
  const { data, error } = await supabase
    .from("waste_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function addReport(input: {
  type: WasteReport["type"];
  weight: number;
  location: string;
  description?: string;
  photoFile?: File;
}): Promise<WasteReport> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  let photoPath: string | undefined;
  if (input.photoFile) {
    const ext = input.photoFile.name.split(".").pop() || "jpg";
    photoPath = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("report-photos")
      .upload(photoPath, input.photoFile);
    if (uploadError) throw uploadError;
  }

  const potentialCoins = Math.round(input.weight * COINS_PER_KG);

  const { data, error } = await supabase
    .from("waste_reports")
    .insert({
      user_id: user.id,
      type: input.type,
      weight: input.weight,
      location: input.location,
      description: input.description || null,
      photo_path: photoPath || null,
      status: "Pending",
      coins: potentialCoins, // coins earned IF approved; not yet credited to wallet
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function deleteReport(id: string): Promise<void> {
  const { error } = await supabase.from("waste_reports").delete().eq("id", id);
  if (error) throw error;
}
