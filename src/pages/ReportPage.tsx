import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/PageHeader";
import { Camera, MapPin, FileText, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const wasteTypes = ["Plastic", "Paper", "Metal", "Glass", "Organic"];

const ReportPage: React.FC = () => {
  const { updateCoins } = useAuth();
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !weight || !location) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitted(true);
    toast.success("Waste report submitted! Pending approval.");
    setTimeout(() => navigate("/waste-history"), 2000);
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
          <p className="text-sm text-muted-foreground mt-1">Bio Coins will be credited upon approval.</p>
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

            <div>
              <label className="text-sm font-medium mb-2 block">Waste Type *</label>
              <div className="flex flex-wrap gap-2">
                {wasteTypes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      type === t ? "gradient-hero text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Weight (kg) *</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 5.5"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                <MapPin size={14} /> Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Andheri West, Mumbai"
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Additional details about the waste..."
                className="w-full px-4 py-3 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                <Camera size={14} /> Photo Evidence
              </label>
              {image ? (
                <div className="relative">
                  <img src={image} alt="Waste" className="w-full h-48 object-cover rounded-lg" />
                  <button type="button" onClick={() => setImage(null)} className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs">Remove</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload size={24} className="text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full gradient-hero text-primary-foreground py-3.5 rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
          >
            Submit Report
          </button>
        </form>
      </main>
    </div>
  );
};

export default ReportPage;
