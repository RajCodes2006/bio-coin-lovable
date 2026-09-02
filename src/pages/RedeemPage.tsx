import React, { useState } from "react";
import { redeemItems } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/PageHeader";
import { Coins, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const categories = ["All", "Government", "Private", "NGO"];

const RedeemPage: React.FC = () => {
  const { user, updateCoins } = useAuth();
  const [filter, setFilter] = useState("All");
  const [redeemed, setRedeemed] = useState<Set<string>>(new Set());

  const items = filter === "All" ? redeemItems : redeemItems.filter((i) => i.category === filter);

  const handleRedeem = (id: string, cost: number, title: string) => {
    if (!user || user.bioCoins < cost) {
      toast.error("Insufficient Bio Coins!");
      return;
    }
    updateCoins(-cost);
    setRedeemed((prev) => new Set(prev).add(id));
    toast.success(`Redeemed: ${title}!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Redeem Rewards" subtitle="Use your Bio Coins for real rewards" />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="gradient-coin rounded-xl p-5 mb-6 flex items-center justify-between shadow-card">
          <div>
            <p className="text-coin-foreground/70 text-sm">Available Balance</p>
            <p className="text-3xl font-bold text-coin-foreground">{user?.bioCoins.toLocaleString() ?? 0}</p>
          </div>
          <Coins size={40} className="text-coin-foreground/50" />
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === c ? "gradient-hero text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-card rounded-xl p-5 shadow-card border border-border hover:shadow-elevated transition-all animate-fade-in">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{item.description}</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 font-bold text-coin-foreground">
                  <Coins size={16} /> {item.cost}
                </span>
                {redeemed.has(item.id) ? (
                  <span className="flex items-center gap-1 text-success text-sm font-semibold">
                    <CheckCircle size={16} /> Redeemed
                  </span>
                ) : (
                  <button
                    onClick={() => handleRedeem(item.id, item.cost, item.title)}
                    disabled={!user || user.bioCoins < item.cost}
                    className="gradient-hero text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    Redeem
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default RedeemPage;
