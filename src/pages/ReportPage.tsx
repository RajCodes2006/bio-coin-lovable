import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  addReport,
  COINS_PER_KG,
  WasteReport,
} from "@/lib/reports-store";
import PageHeader from "@/components/PageHeader";
import {
  Camera,
  CheckCircle,
  FileText,
  ImagePlus,
  Leaf,
  Loader2,
  MapPin,
  Trash2,
  Upload,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

const wasteTypes = [
  {
    value: "Plastic",
    emoji: "♻️",
    description: "Bottles, wrappers, packaging",
  },
  {
    value: "Paper",
    emoji: "📄",
    description: "Newspapers, cardboard, sheets",
  },
  {
    value: "Metal",
    emoji: "🥫",
    description: "Cans, tins, metal scraps",
  },
  {
    value: "Glass",
    emoji: "🍾",
    description: "Bottles and glass containers",
  },
  {
    value: "Organic",
    emoji: "🌿",
    description: "Food and biodegradable waste",
  },
] as const;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ReportPage: React.FC = () => {
  const navigate = useNavigate();

  const [type, setType] = useState<
    WasteReport["type"] | ""
  >("");

  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] =
    useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] =
    useState<WasteReport | null>(null);

  const estimatedCoins = useMemo(() => {
    const numericWeight = Number(weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0
    ) {
      return 0;
    }

    return Math.round(numericWeight * COINS_PER_KG);
  }, [weight]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(
        "Please upload a valid image file."
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error(
        "Image is too large. Maximum size is 5MB."
      );
      event.target.value = "";
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    const previewUrl = URL.createObjectURL(file);

    setPhotoFile(file);
    setPhotoPreview(previewUrl);
  };

  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const validateForm = () => {
    if (!type) {
      toast.error("Select a waste type.");
      return false;
    }

    const numericWeight = Number(weight);

    if (
      !Number.isFinite(numericWeight) ||
      numericWeight <= 0
    ) {
      toast.error(
        "Enter a valid waste weight greater than 0 kg."
      );
      return false;
    }

    if (numericWeight > 10000) {
      toast.error(
        "Weight cannot exceed 10,000 kg."
      );
      return false;
    }

    if (!location.trim()) {
      toast.error("Enter the waste collection location.");
      return false;
    }

    if (location.trim().length < 3) {
      toast.error(
        "Please provide a more specific location."
      );
      return false;
    }

    if (description.trim().length > 500) {
      toast.error(
        "Description must be 500 characters or less."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const report = await addReport({
        type: type as WasteReport["type"],
        weight: Number(weight),
        location: location.trim(),
        description: description.trim(),
        photoFile: photoFile ?? undefined,
      });

      setSubmitted(report);

      toast.success(
        "Report submitted successfully!"
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not submit the report."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader
          title="Report Submitted"
          subtitle="Your report is now awaiting verification"
        />

        <main className="max-w-xl mx-auto px-4 py-10">
          <div className="bg-card border border-border rounded-2xl shadow-card p-8 text-center animate-fade-in">
            <div className="w-20 h-20 gradient-hero rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle
                size={40}
                className="text-primary-foreground"
              />
            </div>

            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Submission received
            </p>

            <h1 className="text-3xl font-bold mt-2">
              Great job! 🌱
            </h1>

            <p className="text-muted-foreground mt-3">
              Your waste report is currently{" "}
              <strong>Pending</strong> verification.
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-muted/40 rounded-xl p-4 text-left">
                <p className="text-xs text-muted-foreground">
                  Waste
                </p>

                <p className="font-bold mt-1">
                  {submitted.type}
                </p>
              </div>

              <div className="bg-muted/40 rounded-xl p-4 text-left">
                <p className="text-xs text-muted-foreground">
                  Weight
                </p>

                <p className="font-bold mt-1">
                  {submitted.weight} kg
                </p>
              </div>
            </div>

            <div className="gradient-coin rounded-xl p-5 mt-4">
              <p className="text-xs text-coin-foreground/70">
                Potential reward
              </p>

              <div className="flex items-center justify-center gap-2 mt-1">
                <CoinsIcon />

                <span className="text-3xl font-bold text-coin-foreground">
                  +{submitted.coins}
                </span>
              </div>

              <p className="text-xs text-coin-foreground/70 mt-1">
                Bio-Coins after approval
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <button
                type="button"
                onClick={() =>
                  navigate("/waste-history")
                }
                className="flex-1 px-4 py-3 rounded-lg gradient-hero text-primary-foreground font-semibold"
              >
                View History
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(null);
                  setType("");
                  setWeight("");
                  setLocation("");
                  setDescription("");
                  removePhoto();
                }}
                className="flex-1 px-4 py-3 rounded-lg border border-border font-semibold hover:bg-muted transition-colors"
              >
                Submit Another
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Report Waste"
        subtitle="Submit a verified cleanliness activity"
      />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Intro */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-primary">
            <Leaf size={18} />

            <span className="text-sm font-semibold">
              Turn clean actions into Bio-Coins
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mt-2">
            Report your waste collection
          </h1>

          <p className="text-muted-foreground mt-2">
            Add accurate details and upload proof so the
            report can be verified.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* ==================================================
              WASTE TYPE
              ================================================== */}
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-card">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText
                  size={19}
                  className="text-primary"
                />
              </div>

              <div>
                <h2 className="font-bold">
                  1. Waste Details
                </h2>

                <p className="text-sm text-muted-foreground">
                  Choose the type and enter the weight.
                </p>
              </div>
            </div>

            <fieldset>
              <legend className="text-sm font-semibold mb-3">
                Waste Type *
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {wasteTypes.map((waste) => {
                  const selected =
                    type === waste.value;

                  return (
                    <button
                      key={waste.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setType(waste.value)
                      }
                      className={`text-left p-4 rounded-xl border transition-all ${
                        selected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-2xl">
                          {waste.emoji}
                        </span>

                        {selected && (
                          <CheckCircle
                            size={18}
                            className="text-primary"
                          />
                        )}
                      </div>

                      <p className="font-semibold mt-3">
                        {waste.value}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {waste.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-5">
              <label
                htmlFor="weight"
                className="text-sm font-semibold mb-2 block"
              >
                Weight (kg) *
              </label>

              <div className="relative">
                <input
                  id="weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0.1"
                  max="10000"
                  value={weight}
                  onChange={(event) =>
                    setWeight(event.target.value)
                  }
                  placeholder="e.g. 5.5"
                  className="w-full px-4 py-3 pr-16 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  kg
                </span>
              </div>

              {estimatedCoins > 0 && (
                <div className="flex items-center justify-between mt-3 px-4 py-3 rounded-lg bg-success/10 border border-success/20">
                  <span className="text-sm">
                    Estimated reward
                  </span>

                  <span className="font-bold text-success">
                    +{estimatedCoins} Bio-Coins
                  </span>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Current rate: {COINS_PER_KG} Bio-Coins per
                kg. Final reward is credited only after
                verification.
              </p>
            </div>
          </section>

          {/* ==================================================
              LOCATION
              ================================================== */}
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-card">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin
                  size={19}
                  className="text-primary"
                />
              </div>

              <div>
                <h2 className="font-bold">
                  2. Collection Location
                </h2>

                <p className="text-sm text-muted-foreground">
                  Tell us where the waste was collected.
                </p>
              </div>
            </div>

            <label
              htmlFor="location"
              className="text-sm font-semibold mb-2 block"
            >
              Location *
            </label>

            <input
              id="location"
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(event.target.value)
              }
              placeholder="e.g. Sector 14, Gurgaon"
              maxLength={150}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </section>

          {/* ==================================================
              DESCRIPTION
              ================================================== */}
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-card">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText
                  size={19}
                  className="text-primary"
                />
              </div>

              <div>
                <h2 className="font-bold">
                  3. Additional Information
                </h2>

                <p className="text-sm text-muted-foreground">
                  Add anything useful for verification.
                </p>
              </div>
            </div>

            <label
              htmlFor="description"
              className="text-sm font-semibold mb-2 block"
            >
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={4}
              maxLength={500}
              placeholder="Describe what you collected or cleaned..."
              className="w-full px-4 py-3 rounded-lg border border-input bg-background outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />

            <div className="text-right text-xs text-muted-foreground mt-1">
              {description.length}/500
            </div>
          </section>

          {/* ==================================================
              PHOTO
              ================================================== */}
          <section className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-card">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera
                  size={19}
                  className="text-primary"
                />
              </div>

              <div>
                <h2 className="font-bold">
                  4. Photo Evidence
                </h2>

                <p className="text-sm text-muted-foreground">
                  A clear photo makes verification easier.
                </p>
              </div>
            </div>

            {photoPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img
                  src={photoPreview}
                  alt="Waste evidence preview"
                  className="w-full h-64 object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 bg-black/50 p-3 flex items-center justify-between gap-3">
                  <span className="text-white text-xs truncate">
                    {photoFile?.name}
                  </span>

                  <button
                    type="button"
                    onClick={removePhoto}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-semibold"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="photo"
                className="flex flex-col items-center justify-center w-full min-h-44 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImagePlus
                    size={22}
                    className="text-primary"
                  />
                </div>

                <span className="text-sm font-semibold mt-3">
                  Upload photo evidence
                </span>

                <span className="text-xs text-muted-foreground mt-1">
                  JPG, PNG or other image · Max 5MB
                </span>

                <span className="inline-flex items-center gap-1.5 mt-4 px-3 py-2 rounded-lg bg-muted text-xs font-semibold">
                  <Upload size={14} />
                  Choose Image
                </span>

                <input
                  id="photo"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </section>

          {/* ==================================================
              FINAL REWARD INFO
              ================================================== */}
          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 flex items-start gap-3">
            <WalletCards
              size={19}
              className="text-primary mt-0.5"
            />

            <div>
              <p className="text-sm font-semibold">
                How your reward works
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                Your potential Bio-Coins are recorded with
                this submission. Coins are added to your
                wallet only after the report is approved.
              </p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full gradient-hero text-primary-foreground py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2
                  size={20}
                  className="animate-spin"
                />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Submit Report
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Please make sure your information is accurate
            before submitting.
          </p>
        </form>
      </main>
    </div>
  );
};

const CoinsIcon = () => (
  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-coin-foreground/10">
    <WalletCards
      size={16}
      className="text-coin-foreground"
    />
  </span>
);

export default ReportPage;