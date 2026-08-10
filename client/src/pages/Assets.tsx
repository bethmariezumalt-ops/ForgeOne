import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Anchor, Plane, Truck, Home, Ship, ChevronDown, ChevronUp, DollarSign, Calendar, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ASSET_TYPES = [
  { value: "house", label: "House / Property", icon: Home },
  { value: "car", label: "Car", icon: Truck },
  { value: "truck", label: "Truck", icon: Truck },
  { value: "boat", label: "Boat", icon: Ship },
  { value: "jet_ski", label: "Jet Ski", icon: Anchor },
  { value: "trailer", label: "Trailer", icon: Truck },
  { value: "airplane", label: "Airplane", icon: Plane },
  { value: "motorcycle", label: "Motorcycle", icon: Truck },
  { value: "rv", label: "RV / Motorhome", icon: Truck },
  { value: "equipment", label: "Equipment", icon: Truck },
  { value: "other", label: "Other", icon: Truck },
];

const ASSET_CATEGORIES = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
  { value: "investment", label: "Investment" },
];

export default function Assets() {
  const { data: assets, isLoading } = trpc.assets.list.useQuery();
  const trpcUtils = trpc.useUtils();
  const createAsset = trpc.assets.create.useMutation({
    onSuccess: () => { trpcUtils.assets.list.invalidate(); setCreateOpen(false); resetForm(); toast.success("Asset added"); },
    onError: (e) => toast.error(e.message),
  });
  const updateAsset = trpc.assets.update.useMutation({
    onSuccess: () => { trpcUtils.assets.list.invalidate(); toast.success("Asset updated"); },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", assetType: "house", category: "personal", description: "", location: "",
    purchasePrice: "", purchaseDate: "", currentValue: "",
    loanBalance: "", monthlyPayment: "", lender: "", loanPayoffDate: "",
    insuranceProvider: "", insurancePolicyNumber: "", insuranceExpiry: "",
    registrationExpiry: "", serialNumber: "", notes: "",
  });

  const resetForm = () => setForm({
    name: "", assetType: "house", category: "personal", description: "", location: "",
    purchasePrice: "", purchaseDate: "", currentValue: "",
    loanBalance: "", monthlyPayment: "", lender: "", loanPayoffDate: "",
    insuranceProvider: "", insurancePolicyNumber: "", insuranceExpiry: "",
    registrationExpiry: "", serialNumber: "", notes: "",
  });

  const handleCreate = () => {
    if (!form.name || !form.assetType) { toast.error("Name and type are required"); return; }
    createAsset.mutate({
      name: form.name,
      assetType: form.assetType as any,
      category: form.category as any,
      description: form.description || undefined,
      address: form.location || undefined,
      purchasePrice: form.purchasePrice || undefined,
      purchaseDate: form.purchaseDate || undefined,
      currentValue: form.currentValue || undefined,
      loanBalance: form.loanBalance || undefined,
      monthlyPayment: form.monthlyPayment || undefined,
      lender: form.lender || undefined,
      loanPayoffDate: form.loanPayoffDate || undefined,
      insuranceProvider: form.insuranceProvider || undefined,
      insurancePolicyNumber: form.insurancePolicyNumber || undefined,
      insuranceExpiry: form.insuranceExpiry || undefined,
      registrationExpiry: form.registrationExpiry || undefined,
      serialNumber: form.serialNumber || undefined,
      notes: form.notes || undefined,
    });
  };

  const getIcon = (type: string) => {
    const found = ASSET_TYPES.find(t => t.value === type);
    return found ? found.icon : Truck;
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const totalValue = (assets as any[] || []).reduce((sum: number, a: any) => sum + (a.currentValue ? parseFloat(a.currentValue) : 0), 0);
  const totalOwed = (assets as any[] || []).reduce((sum: number, a: any) => sum + (a.loanBalance ? parseFloat(a.loanBalance) : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="text-sm text-muted-foreground">{(assets as any[] || []).length} assets tracked</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Asset</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Asset</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Asset Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Lake House, Bass Boat, Cessna 172..." />
              </div>
              <div>
                <Label>Type *</Label>
                <Select value={form.assetType} onValueChange={v => setForm(f => ({...f, assetType: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} placeholder="Address or marina..." />
              </div>
              <div>
                <Label>Serial / HIN / Tail Number</Label>
                <Input value={form.serialNumber} onChange={e => setForm(f => ({...f, serialNumber: e.target.value}))} placeholder="Identification number" />
              </div>
              <div>
                <Label>Purchase Price</Label>
                <Input type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm(f => ({...f, purchasePrice: e.target.value}))} />
              </div>
              <div>
                <Label>Purchase Date</Label>
                <Input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({...f, purchaseDate: e.target.value}))} />
              </div>
              <div>
                <Label>Current Value</Label>
                <Input type="number" step="0.01" value={form.currentValue} onChange={e => setForm(f => ({...f, currentValue: e.target.value}))} />
              </div>
              <div>
                <Label>Loan Balance</Label>
                <Input type="number" step="0.01" value={form.loanBalance} onChange={e => setForm(f => ({...f, loanBalance: e.target.value}))} />
              </div>
              <div>
                <Label>Monthly Payment</Label>
                <Input type="number" step="0.01" value={form.monthlyPayment} onChange={e => setForm(f => ({...f, monthlyPayment: e.target.value}))} />
              </div>
              <div>
                <Label>Lender</Label>
                <Input value={form.lender} onChange={e => setForm(f => ({...f, lender: e.target.value}))} />
              </div>
              <div>
                <Label>Payoff Date</Label>
                <Input type="date" value={form.loanPayoffDate} onChange={e => setForm(f => ({...f, loanPayoffDate: e.target.value}))} />
              </div>
              <div>
                <Label>Insurance Provider</Label>
                <Input value={form.insuranceProvider} onChange={e => setForm(f => ({...f, insuranceProvider: e.target.value}))} />
              </div>
              <div>
                <Label>Policy Number</Label>
                <Input value={form.insurancePolicyNumber} onChange={e => setForm(f => ({...f, insurancePolicyNumber: e.target.value}))} />
              </div>
              <div>
                <Label>Insurance Expiry</Label>
                <Input type="date" value={form.insuranceExpiry} onChange={e => setForm(f => ({...f, insuranceExpiry: e.target.value}))} />
              </div>
              <div>
                <Label>Registration Expiry</Label>
                <Input type="date" value={form.registrationExpiry} onChange={e => setForm(f => ({...f, registrationExpiry: e.target.value}))} />
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Details about this asset..." />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Additional notes..." />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={createAsset.isPending} className="w-full mt-4">
              {createAsset.isPending ? "Adding..." : "Add Asset"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Assets</p>
            <p className="text-2xl font-bold">{(assets as any[] || []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Owed</p>
            <p className="text-2xl font-bold text-red-600">${totalOwed.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Asset List */}
      {(!assets || (assets as any[]).length === 0) ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No assets tracked yet. Add your first asset above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(assets as any[]).map((asset) => {
            const Icon = getIcon(asset.assetType);
            const isExpanded = expandedId === asset.id;
            const equity = (asset.currentValue ? parseFloat(asset.currentValue) : 0) - (asset.loanBalance ? parseFloat(asset.loanBalance) : 0);
            const isUpsideDown = asset.loanBalance && asset.currentValue && parseFloat(asset.loanBalance) > parseFloat(asset.currentValue);

            return (
              <Card key={asset.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-accent/30 transition-colors" onClick={() => setExpandedId(isExpanded ? null : asset.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{ASSET_TYPES.find(t => t.value === asset.assetType)?.label || asset.assetType}</Badge>
                          {asset.category && <Badge variant="secondary" className="text-xs">{asset.category}</Badge>}
                          {asset.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{asset.address}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {asset.currentValue && (
                        <div className="text-right">
                          <p className="text-sm font-medium">${parseFloat(asset.currentValue).toLocaleString()}</p>
                          {asset.loanBalance && <p className={`text-xs ${isUpsideDown ? "text-red-600" : "text-green-600"}`}>Equity: ${equity.toLocaleString()}</p>}
                        </div>
                      )}
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t p-4 space-y-4 bg-muted/20">
                      {asset.description && <p className="text-sm">{asset.description}</p>}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {asset.serialNumber && <InfoItem label="Serial/ID" value={asset.serialNumber} />}
                        {asset.purchasePrice && <InfoItem label="Purchase Price" value={`$${parseFloat(asset.purchasePrice).toLocaleString()}`} />}
                        {asset.purchaseDate && <InfoItem label="Purchase Date" value={new Date(asset.purchaseDate).toLocaleDateString()} />}
                        {asset.currentValue && <InfoItem label="Current Value" value={`$${parseFloat(asset.currentValue).toLocaleString()}`} />}
                        {asset.loanBalance && <InfoItem label="Loan Balance" value={`$${parseFloat(asset.loanBalance).toLocaleString()}`} />}
                        {asset.monthlyPayment && <InfoItem label="Monthly Payment" value={`$${parseFloat(asset.monthlyPayment).toLocaleString()}/mo`} />}
                        {asset.lender && <InfoItem label="Lender" value={asset.lender} />}
                        {asset.loanPayoffDate && <InfoItem label="Payoff Date" value={new Date(asset.loanPayoffDate).toLocaleDateString()} />}
                        {asset.insuranceProvider && <InfoItem label="Insurance" value={asset.insuranceProvider} />}
                        {asset.insurancePolicyNumber && <InfoItem label="Policy #" value={asset.insurancePolicyNumber} />}
                        {asset.insuranceExpiry && <InfoItem label="Insurance Expiry" value={new Date(asset.insuranceExpiry).toLocaleDateString()} isDate overdue={new Date(asset.insuranceExpiry) < new Date()} />}
                        {asset.registrationExpiry && <InfoItem label="Registration Expiry" value={new Date(asset.registrationExpiry).toLocaleDateString()} isDate overdue={new Date(asset.registrationExpiry) < new Date()} />}
                      </div>

                      {asset.notes && (
                        <div className="p-3 rounded bg-background border text-sm">
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          {asset.notes}
                        </div>
                      )}

                      {/* Keep vs Sell recommendation */}
                      {asset.currentValue && asset.loanBalance && (
                        <div className="p-3 rounded-lg border bg-background">
                          <p className="text-sm font-medium">
                            {isUpsideDown
                              ? "⚠️ You owe more than this asset is worth. Keep it until equity is positive, or pay extra toward principal."
                              : equity > parseFloat(asset.currentValue) * 0.5
                              ? "✅ Strong equity position. Good candidate to sell or trade up if desired."
                              : "⚡ Moderate equity. Monitor value — consider selling if maintenance costs rise."}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, isDate, overdue }: { label: string; value: string; isDate?: boolean; overdue?: boolean }) {
  return (
    <div className={`p-2 rounded border ${overdue ? "border-red-200 bg-red-50/50" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm font-medium ${overdue ? "text-red-600" : ""}`}>
        {value} {overdue && <span className="text-xs">(OVERDUE)</span>}
      </p>
    </div>
  );
}
