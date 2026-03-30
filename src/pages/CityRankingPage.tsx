import React from "react";
import { cityRankings, cityStats } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import PageHeader from "@/components/PageHeader";
import { Trophy, TrendingUp, TrendingDown, Minus, Users, Scale, Gift } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(152,55%,34%)", "hsl(82,45%,55%)", "hsl(45,90%,55%)", "hsl(200,80%,50%)", "hsl(35,85%,45%)"];
const trendIcon = { up: TrendingUp, down: TrendingDown, same: Minus };

const CityRankingPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="City Ranking" subtitle="Community cleanliness leaderboard" />
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: "Active Users", value: cityStats.activeUsers.toLocaleString(), sub: "+1,240 this month" },
            { icon: Scale, label: "Waste Collected", value: `${cityStats.wasteCollected} tons`, sub: "+5.2 tons this week" },
            { icon: Gift, label: "Rewards Redeemed", value: cityStats.rewardsRedeemed.toLocaleString(), sub: "Total value: ₹3,768" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl p-5 shadow-card border border-border animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={18} className="text-primary" />
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <div className="bg-card rounded-xl p-6 shadow-card border border-border">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Trophy size={20} className="text-coin" /> City Leaderboard
            </h2>
            <div className="space-y-2">
              {cityRankings.map((c) => {
                const TIcon = trendIcon[c.trend as keyof typeof trendIcon];
                const isUser = user?.city === c.city;
                return (
                  <div key={c.rank} className={`flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors ${isUser ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${c.rank <= 3 ? "gradient-coin text-coin-foreground" : "bg-muted text-muted-foreground"}`}>
                        {c.rank}
                      </span>
                      <span className="font-medium">{c.city}</span>
                      {isUser && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{c.score}</span>
                      <TIcon size={14} className={c.trend === "up" ? "text-success" : c.trend === "down" ? "text-destructive" : "text-muted-foreground"} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <h2 className="text-lg font-bold mb-4">Waste Types Collected</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={cityStats.wasteTypes} dataKey="percentage" nameKey="type" cx="50%" cy="50%" outerRadius={80} label={({ type, percentage }) => `${type} ${percentage}%`}>
                    {cityStats.wasteTypes.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card border border-border">
              <h2 className="text-lg font-bold mb-4">Monthly Collection (tons)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cityStats.monthlyTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="hsl(152,55%,34%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CityRankingPage;
