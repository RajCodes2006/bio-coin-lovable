import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addReport, WasteReport } from "@/lib/reports-store";
import PageHeader from "@/components/PageHeader";
import { Camera, MapPin, FileText, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const wasteTypes = ["Plastic", "Paper", "Metal", "Glass", "Organic"] as const;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<WasteReport | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image is too large. Please upload a photo under 5MB.");
      e.target.value = "";
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !weight || !location) {
      toast.error("Please fill all required fields");
      return;
    }
    const weightKg = parseFloat(weight);
    if (Number.isNaN(weightKg) || weightKg <= 0) {
      toast.error("Please enter a valid weight");
      return;
    }

    setSubmitting(true);
    try {
      const report = await addReport({
        type: type as WasteReport["type"],
        weight: weightKg,
        location,
        description,
        photoFile: photoFile ?? undefined,
      });
      setSubmitted(report);
      toast.success("Report submitted for review!");
      setTimeout(() => navigate("/waste-history"), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Report Waste" />
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
          <div className="w-20 h-20 gradient-hero rounded-full flex items-center justify-center mb-4 animate-pulse-green">
            <CheckCircle size={40} className="text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
          <p className="text-muted-foreground">Your report is pending municipal verification.</p>
          <p className="text-sm text-muted-foreground mt-1">
            {submitted.coins} Bio-Coins will be credited once approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Report Waste" subtitle="Submit a new waste collection report" />
      <main className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-card rounded-xl p-6 shadow-card border border-border space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText size={20} className="text-primary" /> Waste Details
            </h2>

            <fieldset>
              <legend className="text-sm font-medium mb-2 block">Waste Type *</legend>
              <div className="flex flex-wrap gap-2">
                {wasteTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={type === t}
                    onClick={() => setType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      type === t ? "gradient-hero text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="weight" className="text-sm font-medium mb-1.5 block">Weight (kg) *</label>
              <input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 5.5"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>

            <div>
              <label htmlFor="location" className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                <MapPin size={14} /> Location *
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Andheri West, Mumbai"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Additional details about the waste..."
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label htmlFor="photo" className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                <Camera size={14} /> Photo Evidence
              </label>
              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Waste" className="w-full h-48 object-cover rounded-lg" />
                  <button type="button" onClick={removePhoto} className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs">Remove</button>
                </div>
              ) : (
                <label htmlFor="photo" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload size={24} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                  <span className="text-xs text-muted-foreground/70 mt-1">JPG or PNG, up to 5MB</span>
                  <input id="photo" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full gradient-hero text-primary-foreground py-3.5 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ReportPage;
