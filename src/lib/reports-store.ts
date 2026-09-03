import { supabase } from "@/lib/supabase";

export interface WasteReport {
  id: string;
  date: string;
  createdAt: string;
  type: "Plastic" | "Paper" | "Metal" | "Glass" | "Organic";
  weight: number;
  location: string;
  description: string | null;
  status: "Approved" | "Pending" | "Rejected";
  coins: number;
  photoUrl?: string;
}

export const COINS_PER_KG = 10;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

async function getSignedPhotoUrl(
  photoPath: string | null
): Promise<string | undefined> {
  if (!photoPath) return undefined;

  const { data, error } = await supabase.storage
    .from("report-photos")
    .createSignedUrl(photoPath, 60 * 60);

  if (error || !data?.signedUrl) {
    return undefined;
  }

  return data.signedUrl;
}

async function mapRow(row: any): Promise<WasteReport> {
  return {
    id: row.id,
    date: formatDate(row.created_at),
    createdAt: row.created_at,
    type: row.type,
    weight: Number(row.weight),
    location: row.location ?? "",
    description: row.description ?? null,
    status: row.status,
    coins: Number(row.coins ?? 0),
    photoUrl: await getSignedPhotoUrl(row.photo_path),
  };
}

export async function getReports(): Promise<WasteReport[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("waste_reports")
    .select(
      "id, created_at, type, weight, location, description, status, coins, photo_path"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return Promise.all((data ?? []).map(mapRow));
}

export async function addReport(input: {
  type: WasteReport["type"];
  weight: number;
  location: string;
  description?: string;
  photoFile?: File;
}): Promise<WasteReport> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in");
  }

  const location = input.location.trim();
  const description = input.description?.trim() ?? "";

  if (!location) {
    throw new Error("Location is required");
  }

  if (input.weight <= 0 || !Number.isFinite(input.weight)) {
    throw new Error("Please enter a valid weight");
  }

  if (input.photoFile) {
    if (!input.photoFile.type.startsWith("image/")) {
      throw new Error("Please upload a valid image file");
    }

    if (input.photoFile.size > MAX_IMAGE_BYTES) {
      throw new Error("Image must be 5MB or smaller");
    }
  }

  let photoPath: string | null = null;

  if (input.photoFile) {
    const extension =
      input.photoFile.name.split(".").pop()?.toLowerCase() || "jpg";

    photoPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("report-photos")
      .upload(photoPath, input.photoFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }
  }

  const potentialCoins = Math.round(
    input.weight * COINS_PER_KG
  );

  const { data, error } = await supabase
    .from("waste_reports")
    .insert({
      user_id: user.id,
      type: input.type,
      weight: input.weight,
      location,
      description: description || null,
      photo_path: photoPath,
      status: "Pending",
      coins: potentialCoins,
    })
    .select(
      "id, created_at, type, weight, location, description, status, coins, photo_path"
    )
    .single();

  if (error) {
    // Best-effort cleanup if DB insert fails after upload.
    if (photoPath) {
      await supabase.storage
        .from("report-photos")
        .remove([photoPath]);
    }

    throw error;
  }

  return mapRow(data);
}

export async function deleteReport(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not signed in");
  }

  const { data: report, error: fetchError } = await supabase
    .from("waste_reports")
    .select("id, photo_path, status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!report) {
    throw new Error("Report not found");
  }

  if (report.status !== "Pending") {
    throw new Error(
      "Only pending reports can be deleted"
    );
  }

  const { error } = await supabase
    .from("waste_reports")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "Pending");

  if (error) {
    throw error;
  }

  if (report.photo_path) {
    await supabase.storage
      .from("report-photos")
      .remove([report.photo_path]);
  }
}