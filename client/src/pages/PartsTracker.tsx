import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Package, Plus, DollarSign, TrendingUp, ArrowRight } from "lucide-react";

const MARKUP_OPTIONS = [25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300];

export default function PartsTracker() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [partName, setPartName] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [markupPercent, setMarkupPercent] = useState("100");
  const [supplier, setSupplier] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");

  const { data: parts = [], refetch } = trpc.partsMarkup.list.useQuery({});
  const createPart = trpc.partsMarkup.create.useMutation({
    onSuccess: () => {
      refetch();
      setDialogOpen(false);
      setPartName(""); setPartNumber(""); setCostPrice(""); setSupplier(""); setWorkOrderId("");
      toast.success("Part added!");
    },
  });
  const updateStatus = trpc.partsMarkup.updateStatus.useMutation({ onSuccess: () => { refetch(); toast.success("Status updated"); } });

  const billedPrice = costPrice ? (parseFloat(costPrice) * (1 + parseInt(markupPercent) / 100)).toFixed(2) : "0.00";
  const profit = costPrice ? (parseFloat(billedPrice) - parseFloat(costPrice)).toFixed(2) : "0.00";

  // Summary stats
  const stats = useMemo(() => {
    let totalCost = 0, totalBilled = 0, totalProfit = 0;
    (parts as any[]).forEach((p: any) => {
      totalCost += parseFloat(p.costPrice || "0");
      totalBilled += parseFloat(p.billedPrice || "0");
    });
    totalProfit = totalBilled - totalCost;
    return { totalCost, totalBilled, totalProfit, count: parts.length };
  }, [parts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Parts Tracker</h1>
          <p className="text-muted-foreground mt-1">Track parts ordered with markup (25% – 300%)</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Part</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Part with Markup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Part Name *</Label>
                  <Input placeholder="e.g. Brake Pads" value={partName} onChange={(e) => setPartName(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Part Number</Label>
                    <Input placeholder="Optional" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Order ID *</Label>
                    <Input type="number" placeholder="WO #" value={workOrderId} onChange={(e) => setWorkOrderId(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Cost Price *</Label>
                    <Input type="number" step="0.01" placeholder="$0.00" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Markup %</Label>
                    <Select value={markupPercent} onValueChange={setMarkupPercent}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MARKUP_OPTIONS.map(m => (
                          <SelectItem key={m} value={String(m)}>{m}%</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Input placeholder="e.g. AutoZone" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
                </div>

                {/* Price Preview */}
                {costPrice && (
                  <div className="bg-muted/50 rounded-lg p-3 border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Cost:</span>
                      <span>${parseFloat(costPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Markup ({markupPercent}%):</span>
                      <span className="text-green-600 font-medium">+${profit}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1 pt-1 border-t font-semibold">
                      <span>Billed Price:</span>
                      <span>${billedPrice}</span>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => createPart.mutate({
                    workOrderId: parseInt(workOrderId),
                    partName,
                    partNumber: partNumber || undefined,
                    costPrice,
                    markupPercent: parseInt(markupPercent),
                    supplier: supplier || undefined,
                  })}
                  disabled={!partName || !costPrice || !workOrderId || createPart.isPending}
                >
                  Add Part
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Total Parts</p>
            <p className="text-2xl font-bold mt-1">{stats.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Total Cost</p>
            <p className="text-2xl font-bold mt-1">${stats.totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Total Billed</p>
            <p className="text-2xl font-bold mt-1">${stats.totalBilled.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase">Parts Profit</p>
            <p className="text-2xl font-bold mt-1 text-green-600">${stats.totalProfit.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Parts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Parts Ordered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(parts as any[]).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No parts tracked yet.</p>
            )}
            {(parts as any[]).map((part: any) => (
              <div key={part.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{part.partName}</p>
                    {part.partNumber && <span className="text-xs text-muted-foreground">#{part.partNumber}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>WO #{part.workOrderId}</span>
                    {part.supplier && <><span>•</span><span>{part.supplier}</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">${parseFloat(part.costPrice).toFixed(2)}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-semibold">${parseFloat(part.billedPrice).toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-green-600">+{part.markupPercent}% markup</p>
                  </div>
                  {isAdmin && (
                    <Select value={part.status} onValueChange={(val) => updateStatus.mutate({ id: part.id, status: val as any })}>
                      <SelectTrigger className="w-28 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ordered">Ordered</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="installed">Installed</SelectItem>
                        <SelectItem value="returned">Returned</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {!isAdmin && (
                    <Badge variant={part.status === "installed" ? "default" : part.status === "returned" ? "destructive" : "secondary"}>
                      {part.status}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
