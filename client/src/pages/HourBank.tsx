import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Banknote, TrendingUp, TrendingDown, Clock, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function HourBank() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const { data: myBalance } = trpc.hourBank.balance.useQuery(undefined);
  const { data: allBalances } = trpc.hourBank.allBalances.useQuery(undefined, { enabled: isAdmin });
  const { data: transactions, refetch: refetchTx } = trpc.hourBank.transactions.useQuery(undefined, { enabled: isAdmin });
  const { data: myTransactions, refetch: refetchMyTx } = trpc.hourBank.transactions.useQuery({ userId: user?.id }, { enabled: !!user });
  const { data: teamMembers } = trpc.user.list.useQuery(undefined, { enabled: isAdmin });

  const recordMutation = trpc.hourBank.record.useMutation({
    onSuccess: () => { refetchTx(); refetchMyTx(); toast.success("Hours recorded"); setRecordOpen(false); },
    onError: (err) => toast.error(err.message),
  });

  const [recordOpen, setRecordOpen] = useState(false);
  const [recordForm, setRecordForm] = useState({ userId: "", type: "banked" as string, hours: "", reason: "" });

  if (!user) return <Skeleton className="h-40" />;

  // Calculate team totals for graphs
  const totalBanked = allBalances?.reduce((sum, b) => sum + b.banked, 0) || 0;
  const totalBorrowed = allBalances?.reduce((sum, b) => sum + b.borrowed, 0) || 0;
  const totalBalance = totalBanked - totalBorrowed;

  // Build graph data for bar visualization
  const graphBars = (allBalances || []).map(b => ({
    name: b.userName || "Unknown",
    banked: b.banked,
    borrowed: b.borrowed,
    balance: b.balance,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hour Bank</h1>
          <p className="text-muted-foreground text-sm">
            {isOwner ? "Full hour banking overview with financial totals" : isAdmin ? "Team hour banking overview" : "Your banked hours balance"}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={recordOpen} onOpenChange={setRecordOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Record Hours</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Hour Bank Transaction</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Team Member</Label>
                  <Select value={recordForm.userId} onValueChange={v => setRecordForm(f => ({...f, userId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select team member" /></SelectTrigger>
                    <SelectContent>
                      {teamMembers?.filter((m: any) => ["technician", "admin", "owner"].includes(m.role)).map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.name || m.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={recordForm.type} onValueChange={v => setRecordForm(f => ({...f, type: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banked">Banked (job finished early)</SelectItem>
                      <SelectItem value="borrowed">Borrowed (job took longer / redo)</SelectItem>
                      <SelectItem value="adjustment">Manual Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hours</Label>
                  <Input type="number" step="0.25" value={recordForm.hours} onChange={e => setRecordForm(f => ({...f, hours: e.target.value}))} placeholder="e.g. 2.5" />
                </div>
                <div>
                  <Label>Reason</Label>
                  <Textarea value={recordForm.reason} onChange={e => setRecordForm(f => ({...f, reason: e.target.value}))} placeholder="Why are hours being banked/borrowed?" />
                </div>
                <Button className="w-full" onClick={() => recordMutation.mutate({ userId: parseInt(recordForm.userId), type: recordForm.type as any, hours: recordForm.hours, reason: recordForm.reason || undefined })} disabled={!recordForm.userId || !recordForm.hours || recordMutation.isPending}>
                  {recordMutation.isPending ? "Recording..." : "Record Transaction"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? "Team Banked" : "Your Banked"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {isAdmin ? totalBanked.toFixed(1) : (myBalance?.banked || 0).toFixed(1)}h
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? "Team Borrowed" : "Your Borrowed"}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {isAdmin ? totalBorrowed.toFixed(1) : (myBalance?.borrowed || 0).toFixed(1)}h
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? "Net Balance" : "Your Balance"}
                </p>
                <p className={`text-2xl font-bold ${(isAdmin ? totalBalance : (myBalance?.balance || 0)) >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                  {isAdmin ? totalBalance.toFixed(1) : (myBalance?.balance || 0).toFixed(1)}h
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Graph - Owner sees full details, Admin sees color graph */}
      {isAdmin && allBalances && allBalances.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {isOwner ? "Team Hour Bank Overview (with $ value)" : "Team Hour Bank Overview"}
            </CardTitle>
            <CardDescription>
              {isOwner ? "Banked vs borrowed hours per team member with financial impact" : "Banked vs borrowed hours per team member"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {graphBars.map((bar, i) => {
                const maxHours = Math.max(...graphBars.map(b => Math.max(b.banked, b.borrowed)), 1);
                const bankedWidth = (bar.banked / maxHours) * 100;
                const borrowedWidth = (bar.borrowed / maxHours) * 100;
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{bar.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-green-600 text-xs">+{bar.banked.toFixed(1)}h</span>
                        <span className="text-red-600 text-xs">-{bar.borrowed.toFixed(1)}h</span>
                        <Badge className={bar.balance >= 0 ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
                          {bar.balance >= 0 ? "+" : ""}{bar.balance.toFixed(1)}h
                        </Badge>
                        {isOwner && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (${(bar.balance * 75).toFixed(0)} value)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 h-5">
                      <div className="bg-green-400 rounded-sm transition-all" style={{ width: `${bankedWidth}%`, minWidth: bar.banked > 0 ? "4px" : "0" }} />
                      <div className="bg-red-400 rounded-sm transition-all" style={{ width: `${borrowedWidth}%`, minWidth: bar.borrowed > 0 ? "4px" : "0" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-400" /> Banked</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-400" /> Borrowed</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Balance Cards (Admin/Owner) */}
      {isAdmin && allBalances && allBalances.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Individual Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allBalances.map(b => (
                <div key={b.userId} className="p-3 rounded-lg border flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.userName || "Unknown"}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="text-green-600">+{b.banked.toFixed(1)}h</span>
                      <span className="text-red-600">-{b.borrowed.toFixed(1)}h</span>
                    </div>
                  </div>
                  <Badge className={`text-sm ${b.balance >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {b.balance >= 0 ? "+" : ""}{b.balance.toFixed(1)}h
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {(isAdmin ? transactions : myTransactions)?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hour bank transactions yet. Record hours when a job finishes early or takes longer than billed.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {(isAdmin ? transactions : myTransactions)?.slice(0, 20).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-2 rounded border text-sm">
                  <div className="flex items-center gap-2">
                    {tx.type === "banked" ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : tx.type === "borrowed" ? (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                    <div>
                      <span className="font-medium capitalize">{tx.type}</span>
                      {tx.reason && <span className="text-muted-foreground ml-2">— {tx.reason}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={tx.type === "banked" ? "bg-green-100 text-green-800" : tx.type === "borrowed" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                      {tx.type === "borrowed" ? "-" : "+"}{tx.hours}h
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Small Hour Bank widget for the Technician home page
 */
export function HourBankWidget() {
  const { data: balance } = trpc.hourBank.balance.useQuery(undefined);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Banknote className="h-4 w-4 text-blue-600" />
          Your Hour Bank
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Banked</span>
              <span className="text-xs font-medium text-green-600">+{(balance?.banked || 0).toFixed(1)}h</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full" style={{ width: `${Math.min((balance?.banked || 0) / Math.max((balance?.banked || 0) + (balance?.borrowed || 0), 1) * 100, 100)}%` }} />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Borrowed</span>
              <span className="text-xs font-medium text-red-600">-{(balance?.borrowed || 0).toFixed(1)}h</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-400 rounded-full" style={{ width: `${Math.min((balance?.borrowed || 0) / Math.max((balance?.banked || 0) + (balance?.borrowed || 0), 1) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-2 text-center">
          <span className={`text-lg font-bold ${(balance?.balance || 0) >= 0 ? "text-blue-600" : "text-orange-600"}`}>
            {(balance?.balance || 0) >= 0 ? "+" : ""}{(balance?.balance || 0).toFixed(1)}h
          </span>
          <span className="text-xs text-muted-foreground ml-1">net balance</span>
        </div>
      </CardContent>
    </Card>
  );
}
