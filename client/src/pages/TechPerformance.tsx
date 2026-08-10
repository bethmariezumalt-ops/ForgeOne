import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMemo } from "react";
import { Trophy, TrendingUp, Clock, DollarSign, Zap, Users } from "lucide-react";
import { TierBadge } from "./UserProfile";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const TIER_THRESHOLDS = [
  { tier: "titanium", minRevenue: 100000, color: "#475569" },
  { tier: "platinum", minRevenue: 75000, color: "#7c3aed" },
  { tier: "gold", minRevenue: 50000, color: "#d97706" },
  { tier: "silver", minRevenue: 30000, color: "#6b7280" },
  { tier: "bronze", minRevenue: 15000, color: "#c2410c" },
  { tier: "trainee", minRevenue: 0, color: "#16a34a" },
];

function getTierForRevenue(revenue: number): string {
  for (const t of TIER_THRESHOLDS) {
    if (revenue >= t.minRevenue) return t.tier;
  }
  return "trainee";
}

function getTierColor(tier: string): string {
  return TIER_THRESHOLDS.find(t => t.tier === tier)?.color || "#16a34a";
}

export default function TechPerformance() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const isAdmin = user?.role === "admin" || isOwner;

  const { data: stats = [], refetch } = trpc.techPerformance.stats.useQuery();
  const updateTier = trpc.techPerformance.updateTier.useMutation({
    onSuccess: () => { refetch(); toast.success("Tier updated!"); },
  });
  const updateLevel = trpc.techPerformance.updateLevel.useMutation({
    onSuccess: () => { refetch(); toast.success("Experience level updated!"); },
  });

  // Chart data
  const chartData = useMemo(() => {
    return (stats as any[]).map((tech: any) => ({
      name: tech.name || "Unknown",
      revenue: tech.totalRevenue,
      jobs: tech.completedJobs,
      tier: tech.performanceTier || getTierForRevenue(tech.totalRevenue),
    })).sort((a, b) => b.revenue - a.revenue);
  }, [stats]);

  // Summary
  const totalRevenue = useMemo(() => (stats as any[]).reduce((sum: number, t: any) => sum + t.totalRevenue, 0), [stats]);
  const totalJobs = useMemo(() => (stats as any[]).reduce((sum: number, t: any) => sum + t.completedJobs, 0), [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tech Performance</h1>
        <p className="text-muted-foreground mt-1">Track technician revenue generation and performance tiers</p>
      </div>

      {/* Tier Legend */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Tiers:</span>
            {TIER_THRESHOLDS.map(t => (
              <div key={t.tier} className="flex items-center gap-1.5">
                <TierBadge tier={t.tier} />
                <span className="text-xs text-muted-foreground">${(t.minRevenue / 1000).toFixed(0)}k+</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Total Techs</p>
            <p className="text-2xl font-bold mt-1">{stats.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Total Revenue</p>
            <p className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Completed Jobs</p>
            <p className="text-2xl font-bold mt-1">{totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Avg Revenue/Tech</p>
            <p className="text-2xl font-bold mt-1">${stats.length > 0 ? (totalRevenue / stats.length).toFixed(0) : "0"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Revenue by Technician
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getTierColor(entry.tier)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tech Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" /> Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(stats as any[]).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No technicians with completed work yet.</p>
            )}
            {(stats as any[])
              .sort((a: any, b: any) => b.totalRevenue - a.totalRevenue)
              .map((tech: any, idx: number) => {
                const suggestedTier = getTierForRevenue(tech.totalRevenue);
                const currentTier = tech.performanceTier || "trainee";
                return (
                  <div key={tech.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent/30 transition-colors">
                    <div className="text-2xl font-bold text-muted-foreground w-8 text-center">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{tech.name || "Unknown"}</p>
                        <TierBadge tier={currentTier} />
                        <Badge variant="secondary" className="text-xs capitalize">{tech.experienceLevel || "trainee"}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${tech.totalRevenue.toLocaleString()} revenue</span>
                        <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> {tech.completedJobs} jobs</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {tech.efficiency}% efficiency</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {isOwner && (
                        <Select
                          value={currentTier}
                          onValueChange={(val) => updateTier.mutate({ userId: tech.id, tier: val as any })}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="titanium">Titanium</SelectItem>
                            <SelectItem value="platinum">Platinum</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="bronze">Bronze</SelectItem>
                            <SelectItem value="trainee">Trainee</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {isAdmin && (
                        <Select
                          value={tech.experienceLevel || "trainee"}
                          onValueChange={(val) => updateLevel.mutate({ userId: tech.id, level: val as any })}
                        >
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue placeholder="Level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="expert">Expert</SelectItem>
                            <SelectItem value="master">Master</SelectItem>
                            <SelectItem value="senior">Senior</SelectItem>
                            <SelectItem value="journeyman">Journeyman</SelectItem>
                            <SelectItem value="apprentice">Apprentice</SelectItem>
                            <SelectItem value="trainee">Trainee</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    {!isAdmin && suggestedTier !== currentTier && (
                      <Badge variant="outline" className="text-xs">Suggested: {suggestedTier}</Badge>
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
