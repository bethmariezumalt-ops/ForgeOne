import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Car, Download, Search } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Vehicles() {
  const { data: vehicles, isLoading, refetch } = trpc.vehicle.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const createMutation = trpc.vehicle.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Vehicle added"); } });
  const trpcUtils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"all" | "vin" | "plate">("all");
  const [form, setForm] = useState({ vin: "", make: "", model: "", year: "", clientId: "", licensePlate: "", color: "", currentMileage: "", vehicleType: "car" });

  // Filter vehicles based on search
  const filteredVehicles = vehicles?.filter((v: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (searchType === "vin") return v.vin?.toLowerCase().includes(q);
    if (searchType === "plate") return v.licensePlate?.toLowerCase().includes(q);
    // "all" - search VIN, plate, make, model, year
    return (
      v.vin?.toLowerCase().includes(q) ||
      v.licensePlate?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      String(v.year).includes(q)
    );
  });

  const handleCreate = () => {
    if (!form.vin || !form.clientId) { toast.error("VIN and Client are required"); return; }
    createMutation.mutate({
      vin: form.vin,
      make: form.make || undefined,
      model: form.model || undefined,
      year: form.year ? parseInt(form.year) : undefined,
      clientId: parseInt(form.clientId),
      licensePlate: form.licensePlate || undefined,
      color: form.color || undefined,
      currentMileage: form.currentMileage ? parseInt(form.currentMileage) : undefined,
      vehicleType: form.vehicleType as any,
    });
  };

  const handleDownloadQR = async (vehicleId: number, vin: string) => {
    try {
      const result = await trpcUtils.vehicle.generateQrCode.fetch({ vehicleId });
      const link = document.createElement("a");
      link.href = result.qrDataUrl;
      link.download = `QR-${vin}.png`;
      link.click();
      toast.success("QR code downloaded");
    } catch { toast.error("Failed to generate QR"); }
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground mt-1">{vehicles?.length ?? 0} vehicles tracked</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Vehicle</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>VIN *</Label>
                  <Input value={form.vin} onChange={e => setForm(f => ({...f, vin: e.target.value}))} placeholder="Enter VIN" />
                </div>
                <div>
                  <Label>Client *</Label>
                  <Select value={form.clientId} onValueChange={v => setForm(f => ({...f, clientId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {clients?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Year</Label><Input value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))} placeholder="2024" /></div>
                <div><Label>Make</Label><Input value={form.make} onChange={e => setForm(f => ({...f, make: e.target.value}))} placeholder="Ford" /></div>
                <div><Label>Model</Label><Input value={form.model} onChange={e => setForm(f => ({...f, model: e.target.value}))} placeholder="Transit" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>License Plate</Label><Input value={form.licensePlate} onChange={e => setForm(f => ({...f, licensePlate: e.target.value}))} /></div>
                <div><Label>Color</Label><Input value={form.color} onChange={e => setForm(f => ({...f, color: e.target.value}))} /></div>
                <div><Label>Mileage</Label><Input type="number" value={form.currentMileage} onChange={e => setForm(f => ({...f, currentMileage: e.target.value}))} /></div>
              </div>
              <div>
                <Label>Vehicle Type</Label>
                <Select value={form.vehicleType} onValueChange={v => setForm(f => ({...f, vehicleType: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="suv">SUV</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Vehicle"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={searchType === "vin" ? "Search by VIN number..." : searchType === "plate" ? "Search by license plate..." : "Search by VIN, plate, make, model, year..."}
            className="pl-9"
          />
        </div>
        <Select value={searchType} onValueChange={v => setSearchType(v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            <SelectItem value="vin">VIN Only</SelectItem>
            <SelectItem value="plate">Plate Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          {filteredVehicles?.length ?? 0} result{filteredVehicles?.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
          {searchType !== "all" && ` (${searchType === "vin" ? "VIN" : "License Plate"} search)`}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVehicles?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchQuery ? `No vehicles match "${searchQuery}". Try a different search.` : "No vehicles yet. Add your first vehicle above."}
            </CardContent>
          </Card>
        ) : (
          filteredVehicles?.map((v: any) => (
            <Card key={v.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/vehicles/${v.id}`)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Car className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{v.year} {v.make} {v.model}</p>
                      <p className="text-xs text-muted-foreground font-mono">{v.vin}</p>
                      {v.licensePlate && <p className="text-xs text-muted-foreground">Plate: <span className="font-semibold uppercase">{v.licensePlate}</span></p>}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{v.vehicleType}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{v.currentMileage ? `${v.currentMileage.toLocaleString()} mi` : "No mileage"}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleDownloadQR(v.id, v.vin); }}>
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
