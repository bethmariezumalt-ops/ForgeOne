import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, Plus, Wrench, AlertTriangle, Calendar, DollarSign, Gauge, Shield, FileText, TrendingDown } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { SERVICE_CATEGORIES, PRIORITY_CONFIG } from "@shared/serviceCategories";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useActivityLog } from "@/hooks/useActivityLog";
import { MediaUpload } from "@/components/MediaUpload";

export default function VehicleDetail() {
  const params = useParams<{ id: string }>();
  const vehicleId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { data: vehicle, isLoading } = trpc.vehicle.getById.useQuery({ id: vehicleId });
  const { data: workOrders } = trpc.workOrder.listByVehicle.useQuery({ vehicleId });
  const { data: maintenance } = trpc.maintenance.listByVehicle.useQuery({ vehicleId });
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: mileageLogs } = trpc.vehicleIntel.getMileageLogs.useQuery({ vehicleId });
  const { data: serviceRecords } = trpc.vehicleIntel.getServiceRecords.useQuery({ vehicleId });
  const { data: recalls } = trpc.vehicleIntel.checkRecalls.useQuery(
    { year: vehicle?.year || 0, make: vehicle?.make || "", model: vehicle?.model || "" },
    { enabled: !!(vehicle?.year && vehicle?.make && vehicle?.model) }
  );
  const trpcUtils = trpc.useUtils();
  const createWO = trpc.workOrder.create.useMutation({ onSuccess: () => { trpcUtils.workOrder.listByVehicle.invalidate({ vehicleId }); setWoOpen(false); toast.success("Work order created"); } });
  const addMileage = trpc.vehicleIntel.addMileageLog.useMutation({ onSuccess: () => { trpcUtils.vehicleIntel.getMileageLogs.invalidate({ vehicleId }); trpcUtils.vehicle.getById.invalidate({ id: vehicleId }); toast.success("Mileage recorded"); setMileageInput(""); } });
  const addService = trpc.vehicleIntel.addServiceRecord.useMutation({ onSuccess: () => { trpcUtils.vehicleIntel.getServiceRecords.invalidate({ vehicleId }); toast.success("Service record added"); setServiceOpen(false); } });
  const updateIntel = trpc.vehicleIntel.updateVehicleIntel.useMutation({ onSuccess: () => { trpcUtils.vehicle.getById.invalidate({ id: vehicleId }); toast.success("Vehicle info updated"); setComplianceOpen(false); setFinancialOpen(false); } });
  const decodeVin = trpc.vehicleIntel.decodeVin.useMutation({ onSuccess: (data) => { toast.success(`Decoded: ${data.year} ${data.make} ${data.model}`); trpcUtils.vehicle.getById.invalidate({ id: vehicleId }); } });

  const [woOpen, setWoOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [priority, setPriority] = useState("medium");
  const [mileageWO, setMileageWO] = useState("");
  const [notes, setNotes] = useState("");
  const [needsSourceOut, setNeedsSourceOut] = useState(false);
  const [mileageInput, setMileageInput] = useState("");
  const [mileageNotes, setMileageNotes] = useState("");
  const [serviceOpen, setServiceOpen] = useState(false);
  const [complianceOpen, setComplianceOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);

  useActivityLog({
    action: "viewed_vehicle",
    entityType: "vehicle",
    entityId: vehicleId,
    entityTitle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : undefined,
    enabled: !!vehicle,
  });

  const handleCreateWO = () => {
    if (!vehicle) return;
    createWO.mutate({
      vehicleId: vehicle.id,
      clientId: vehicle.clientId,
      orderType: "vehicle",
      priority: priority as any,
      businessLine: "acme_automotive",
      mileageAtService: mileageWO ? parseInt(mileageWO) : undefined,
      notes: notes || undefined,
      workDescription: selectedServices.map(s => SERVICE_CATEGORIES.find(c => c.id === s)?.name).filter(Boolean).join(", "),
      items: selectedServices.map(s => ({
        description: SERVICE_CATEGORIES.find(c => c.id === s)?.name || s,
        needsSourceOut,
      })),
    });
  };

  const handleDownloadQR = async () => {
    if (!vehicle) return;
    try {
      const result = await trpcUtils.vehicle.generateQrCode.fetch({ vehicleId: vehicle.id });
      const link = document.createElement("a");
      link.href = result.qrDataUrl;
      link.download = `QR-${vehicle.vin}.png`;
      link.click();
      toast.success("QR code downloaded");
    } catch { toast.error("Failed to generate QR"); }
  };

  const handleDecodeVin = () => {
    if (!vehicle) return;
    decodeVin.mutate({ vin: vehicle.vin });
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;
  if (!vehicle) return <div className="text-center py-8">Vehicle not found</div>;

  const client = clients?.find((c: any) => c.id === vehicle.clientId);
  const v = vehicle as any;

  // Calculate health/retirement score
  const currentYear = new Date().getFullYear();
  const vehicleAge = v.year ? currentYear - v.year : 0;
  const mileageScore = v.currentMileage ? Math.max(0, 100 - (v.currentMileage / 2000)) : 80;
  const ageScore = Math.max(0, 100 - (vehicleAge * 5));
  const healthScore = Math.round((mileageScore + ageScore) / 2);
  const shouldRetire = healthScore < 40;
  const loanBalance = v.loanBalance ? parseFloat(v.loanBalance) : 0;
  const currentValue = v.currentValue ? parseFloat(v.currentValue) : 0;
  const isUpsideDown = loanBalance > currentValue && loanBalance > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/vehicles")}>
          <ArrowLeft className="h-4 w-4 mr-1" />Back
        </Button>
      </div>

      {/* Vehicle Info Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">{vehicle.year} {vehicle.make} {vehicle.model} {v.trim || ""}</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">VIN: {vehicle.vin}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline">{vehicle.vehicleType}</Badge>
                <Badge variant={v.assetCategory === "personal" ? "secondary" : v.assetCategory === "fleet" ? "default" : "outline"}>{v.assetCategory || "fleet"}</Badge>
                {client && <Badge style={{ backgroundColor: (client.color || '#3B82F6') + "20", color: client.color || '#3B82F6' }}>{client.name}</Badge>}
              </div>
              <div className="mt-3 text-sm grid grid-cols-2 gap-x-6 gap-y-1">
                {vehicle.licensePlate && <p>License: <span className="font-medium">{vehicle.licensePlate}</span></p>}
                {vehicle.currentMileage ? <p>Mileage: <span className="font-medium">{vehicle.currentMileage.toLocaleString()} mi</span></p> : null}
                {v.engine && <p>Engine: <span className="font-medium">{v.engine}</span></p>}
                {v.transmission && <p>Trans: <span className="font-medium">{v.transmission}</span></p>}
                {v.drivetrain && <p>Drivetrain: <span className="font-medium">{v.drivetrain}</span></p>}
                {v.fuelType && <p>Fuel: <span className="font-medium">{v.fuelType}</span></p>}
                {v.color && <p>Color: <span className="font-medium">{v.color}</span></p>}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadQR}>
                <Download className="h-4 w-4 mr-1" />QR Code
              </Button>
              <Button variant="outline" size="sm" onClick={handleDecodeVin} disabled={decodeVin.isPending}>
                <FileText className="h-4 w-4 mr-1" />{decodeVin.isPending ? "Decoding..." : "Decode VIN"}
              </Button>
            </div>
          </div>

          {/* Health Score */}
          <div className="mt-4 p-4 rounded-lg border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${healthScore >= 70 ? "bg-green-500" : healthScore >= 40 ? "bg-yellow-500" : "bg-red-500"}`}>
                {healthScore}
              </div>
              <div>
                <p className="font-medium">Vehicle Health Score</p>
                <p className="text-xs text-muted-foreground">Based on age ({vehicleAge} yrs) and mileage ({(v.currentMileage || 0).toLocaleString()} mi)</p>
              </div>
            </div>
            {shouldRetire && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />Consider Replacement
              </Badge>
            )}
            {isUpsideDown && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />Upside Down on Loan
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="mileage" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="mileage"><Gauge className="h-4 w-4 mr-1 hidden sm:inline" />Mileage</TabsTrigger>
          <TabsTrigger value="compliance"><Shield className="h-4 w-4 mr-1 hidden sm:inline" />Compliance</TabsTrigger>
          <TabsTrigger value="service"><Wrench className="h-4 w-4 mr-1 hidden sm:inline" />Service</TabsTrigger>
          <TabsTrigger value="recalls"><AlertTriangle className="h-4 w-4 mr-1 hidden sm:inline" />Recalls</TabsTrigger>
          <TabsTrigger value="financial"><DollarSign className="h-4 w-4 mr-1 hidden sm:inline" />Financial</TabsTrigger>
          <TabsTrigger value="media"><Calendar className="h-4 w-4 mr-1 hidden sm:inline" />Media</TabsTrigger>
        </TabsList>

        {/* MILEAGE TAB */}
        <TabsContent value="mileage">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Mileage Tracking</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input type="number" placeholder="Enter current mileage" value={mileageInput} onChange={e => setMileageInput(e.target.value)} className="flex-1" />
                <Input placeholder="Notes (optional)" value={mileageNotes} onChange={e => setMileageNotes(e.target.value)} className="flex-1" />
                <Button onClick={() => { if (mileageInput) addMileage.mutate({ vehicleId, mileage: parseInt(mileageInput), notes: mileageNotes || undefined }); }} disabled={!mileageInput || addMileage.isPending}>
                  <Plus className="h-4 w-4 mr-1" />Log
                </Button>
              </div>
              {mileageLogs && mileageLogs.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(mileageLogs as any[]).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded border text-sm">
                      <div>
                        <span className="font-medium">{log.mileage.toLocaleString()} mi</span>
                        {log.notes && <span className="text-muted-foreground ml-2">— {log.notes}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{log.source}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(log.recordedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No mileage records yet. Log the first reading above.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COMPLIANCE TAB */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Registration & Compliance</span>
                <Button size="sm" variant="outline" onClick={() => setComplianceOpen(true)}>Edit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ComplianceItem label="Registration Expiry" value={v.registrationExpiry} type="date" />
                <ComplianceItem label="Registration State" value={v.registrationState} />
                <ComplianceItem label="CHP Inspection Due" value={v.chpInspectionDue} type="date" />
                <ComplianceItem label="Last CHP Inspection" value={v.chpInspectionLast} type="date" />
                <ComplianceItem label="Smog Check Due" value={v.smogCheckDue} type="date" />
                <ComplianceItem label="Insurance Expiry" value={v.insuranceExpiry} type="date" />
                <ComplianceItem label="Insurance Provider" value={v.insuranceProvider} />
                <ComplianceItem label="Policy Number" value={v.insurancePolicyNumber} />
              </div>
            </CardContent>
          </Card>
          <ComplianceEditDialog open={complianceOpen} onOpenChange={setComplianceOpen} vehicle={v} onSave={(data: any) => updateIntel.mutate({ id: vehicleId, ...data })} isPending={updateIntel.isPending} />
        </TabsContent>

        {/* SERVICE TAB */}
        <TabsContent value="service">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Service History</span>
                <Button size="sm" onClick={() => setServiceOpen(true)}><Plus className="h-4 w-4 mr-1" />Add Record</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serviceRecords && (serviceRecords as any[]).length > 0 ? (
                <div className="space-y-2">
                  {(serviceRecords as any[]).map((sr) => (
                    <div key={sr.id} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{sr.serviceType}</p>
                          {sr.description && <p className="text-xs text-muted-foreground">{sr.description}</p>}
                        </div>
                        <div className="text-right text-xs">
                          <p>{new Date(sr.servicedAt).toLocaleDateString()}</p>
                          {sr.mileageAtService && <p className="text-muted-foreground">{sr.mileageAtService.toLocaleString()} mi</p>}
                        </div>
                      </div>
                      {(sr.nextDueMileage || sr.nextDueDate) && (
                        <div className="mt-2 text-xs text-orange-600 flex gap-3">
                          {sr.nextDueMileage && <span>Next due: {sr.nextDueMileage.toLocaleString()} mi</span>}
                          {sr.nextDueDate && <span>Next due: {new Date(sr.nextDueDate).toLocaleDateString()}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No service records yet.</p>
              )}
            </CardContent>
          </Card>
          <ServiceRecordDialog open={serviceOpen} onOpenChange={setServiceOpen} vehicleId={vehicleId} currentMileage={v.currentMileage} onSave={(data: any) => addService.mutate(data)} isPending={addService.isPending} />
        </TabsContent>

        {/* RECALLS TAB */}
        <TabsContent value="recalls">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Recalls ({recalls?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recalls && recalls.length > 0 ? (
                <div className="space-y-3">
                  {(recalls as any[]).map((r, i) => (
                    <div key={i} className="p-3 rounded-lg border border-orange-200 bg-orange-50/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{r.component}</p>
                          <p className="text-xs text-muted-foreground mt-1">{r.summary}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{r.nhtsaCampaignNumber}</Badge>
                      </div>
                      {r.consequence && <p className="text-xs text-red-600 mt-2"><strong>Risk:</strong> {r.consequence}</p>}
                      {r.remedy && <p className="text-xs text-green-700 mt-1"><strong>Fix:</strong> {r.remedy}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {vehicle.year && vehicle.make && vehicle.model ? "No recalls found for this vehicle." : "Enter year/make/model to check recalls."}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FINANCIAL TAB */}
        <TabsContent value="financial">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Financial & Resale Analysis</span>
                <Button size="sm" variant="outline" onClick={() => setFinancialOpen(true)}>Edit</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-xs text-muted-foreground">Purchase Price</p>
                  <p className="text-xl font-bold">{v.purchasePrice ? `$${parseFloat(v.purchasePrice).toLocaleString()}` : "—"}</p>
                </div>
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-xs text-muted-foreground">Current Value</p>
                  <p className="text-xl font-bold">{v.currentValue ? `$${parseFloat(v.currentValue).toLocaleString()}` : "—"}</p>
                </div>
                <div className="p-4 rounded-lg border text-center">
                  <p className="text-xs text-muted-foreground">Loan Balance</p>
                  <p className={`text-xl font-bold ${isUpsideDown ? "text-red-600" : ""}`}>{v.loanBalance ? `$${parseFloat(v.loanBalance).toLocaleString()}` : "—"}</p>
                </div>
              </div>

              {/* Keep vs Replace Analysis */}
              <div className="p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-2">Keep vs. Replace Analysis</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Monthly Payment</p>
                    <p className="font-medium">{v.monthlyPayment ? `$${parseFloat(v.monthlyPayment).toLocaleString()}/mo` : "No loan"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payoff Date</p>
                    <p className="font-medium">{v.loanPayoffDate ? new Date(v.loanPayoffDate).toLocaleDateString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lender</p>
                    <p className="font-medium">{v.lender || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Equity</p>
                    <p className={`font-medium ${isUpsideDown ? "text-red-600" : "text-green-600"}`}>
                      {currentValue && loanBalance ? `$${(currentValue - loanBalance).toLocaleString()}` : "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 p-3 rounded bg-background border">
                  <p className="text-sm font-medium">
                    {!v.purchasePrice && !v.currentValue ? "Enter financial data to get a recommendation." :
                     shouldRetire && isUpsideDown ? "⚠️ Vehicle health is low AND you owe more than it's worth. Consider trading in with negative equity rolled over, or pay down the loan before selling." :
                     shouldRetire ? "⚠️ Vehicle health is low. Consider replacing — maintenance costs likely exceed the vehicle's value." :
                     isUpsideDown ? "⚠️ You're upside down on this loan. Keep the vehicle until equity is positive or pay extra toward principal." :
                     healthScore >= 70 ? "✅ This vehicle is in good shape. Keep it — it's cost-effective to maintain." :
                     "⚡ Vehicle is aging. Monitor repair costs vs. monthly payment of a replacement."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <FinancialEditDialog open={financialOpen} onOpenChange={setFinancialOpen} vehicle={v} onSave={(data: any) => updateIntel.mutate({ id: vehicleId, ...data })} isPending={updateIntel.isPending} />
        </TabsContent>

        {/* MEDIA TAB */}
        <TabsContent value="media">
          <Card>
            <CardContent className="p-6">
              <VehicleMediaSection vehicleId={vehicleId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Work Order */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Create Work Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={woOpen} onOpenChange={setWoOpen}>
            <DialogTrigger asChild>
              <Button className="w-full"><Plus className="h-4 w-4 mr-2" />Select Services</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Select Services for {vehicle.year} {vehicle.make} {vehicle.model}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emergency">Emergency</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Current Mileage</Label>
                    <Input type="number" value={mileageWO} onChange={e => setMileageWO(e.target.value)} placeholder={vehicle.currentMileage?.toString() || "Enter mileage"} />
                  </div>
                </div>
                {Object.entries(
                  SERVICE_CATEGORIES.reduce((acc, cat) => {
                    if (!acc[cat.group]) acc[cat.group] = [];
                    acc[cat.group].push(cat);
                    return acc;
                  }, {} as Record<string, typeof SERVICE_CATEGORIES[number][]>)
                ).map(([group, cats]) => (
                  <div key={group}>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">{group}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {cats.map(cat => (
                        <label key={cat.id} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${selectedServices.includes(cat.id) ? "border-primary bg-primary/5" : "hover:bg-accent"}`}>
                          <Checkbox
                            checked={selectedServices.includes(cat.id)}
                            onCheckedChange={(checked) => {
                              setSelectedServices(prev => checked ? [...prev, cat.id] : prev.filter(s => s !== cat.id));
                            }}
                          />
                          <span className="text-sm">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 p-3 rounded-md border border-orange-200 bg-orange-50">
                  <Checkbox checked={needsSourceOut} onCheckedChange={(v) => setNeedsSourceOut(!!v)} />
                  <span className="text-sm font-medium text-orange-800">Needs to Source Out (specialist required)</span>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details..." />
                </div>
                <Button onClick={handleCreateWO} disabled={createWO.isPending || selectedServices.length === 0} className="w-full">
                  {createWO.isPending ? "Creating..." : `Create Work Order (${selectedServices.length} services)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Work Order History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Work Order History</CardTitle>
        </CardHeader>
        <CardContent>
          {(!workOrders || workOrders.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">No work orders yet for this vehicle</p>
          ) : (
            <div className="space-y-2">
              {(workOrders as any[]).map((wo) => (
                <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" style={{
                      color: PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.color,
                      backgroundColor: PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.bgColor,
                    }}>
                      {wo.priority}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">WO-{wo.id}</p>
                      <p className="text-xs text-muted-foreground">{wo.workDescription || wo.notes || "—"}</p>
                    </div>
                  </div>
                  <Badge variant={wo.status === "completed" ? "default" : "secondary"}>{wo.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== Sub-components =====

function ComplianceItem({ label, value, type }: { label: string; value: any; type?: string }) {
  const isDate = type === "date";
  const displayValue = isDate && value ? new Date(value).toLocaleDateString() : value || "—";
  const isOverdue = isDate && value && new Date(value) < new Date();
  return (
    <div className={`p-3 rounded-lg border ${isOverdue ? "border-red-200 bg-red-50/50" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-medium text-sm ${isOverdue ? "text-red-600" : ""}`}>
        {displayValue}
        {isOverdue && <span className="ml-2 text-xs">(OVERDUE)</span>}
      </p>
    </div>
  );
}

function ComplianceEditDialog({ open, onOpenChange, vehicle, onSave, isPending }: any) {
  const [form, setForm] = useState({
    registrationExpiry: vehicle.registrationExpiry ? new Date(vehicle.registrationExpiry).toISOString().split("T")[0] : "",
    registrationState: vehicle.registrationState || "",
    chpInspectionDue: vehicle.chpInspectionDue ? new Date(vehicle.chpInspectionDue).toISOString().split("T")[0] : "",
    chpInspectionLast: vehicle.chpInspectionLast ? new Date(vehicle.chpInspectionLast).toISOString().split("T")[0] : "",
    smogCheckDue: vehicle.smogCheckDue ? new Date(vehicle.smogCheckDue).toISOString().split("T")[0] : "",
    insuranceExpiry: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toISOString().split("T")[0] : "",
    insuranceProvider: vehicle.insuranceProvider || "",
    insurancePolicyNumber: vehicle.insurancePolicyNumber || "",
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Registration & Compliance</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Registration Expiry</Label><Input type="date" value={form.registrationExpiry} onChange={e => setForm(f => ({...f, registrationExpiry: e.target.value}))} /></div>
          <div><Label>State</Label><Input value={form.registrationState} onChange={e => setForm(f => ({...f, registrationState: e.target.value}))} placeholder="CA" /></div>
          <div><Label>CHP Inspection Due</Label><Input type="date" value={form.chpInspectionDue} onChange={e => setForm(f => ({...f, chpInspectionDue: e.target.value}))} /></div>
          <div><Label>Last CHP Inspection</Label><Input type="date" value={form.chpInspectionLast} onChange={e => setForm(f => ({...f, chpInspectionLast: e.target.value}))} /></div>
          <div><Label>Smog Check Due</Label><Input type="date" value={form.smogCheckDue} onChange={e => setForm(f => ({...f, smogCheckDue: e.target.value}))} /></div>
          <div><Label>Insurance Expiry</Label><Input type="date" value={form.insuranceExpiry} onChange={e => setForm(f => ({...f, insuranceExpiry: e.target.value}))} /></div>
          <div><Label>Insurance Provider</Label><Input value={form.insuranceProvider} onChange={e => setForm(f => ({...f, insuranceProvider: e.target.value}))} /></div>
          <div><Label>Policy Number</Label><Input value={form.insurancePolicyNumber} onChange={e => setForm(f => ({...f, insurancePolicyNumber: e.target.value}))} /></div>
        </div>
        <Button onClick={() => onSave(form)} disabled={isPending} className="w-full mt-4">{isPending ? "Saving..." : "Save"}</Button>
      </DialogContent>
    </Dialog>
  );
}

function FinancialEditDialog({ open, onOpenChange, vehicle, onSave, isPending }: any) {
  const [form, setForm] = useState({
    purchasePrice: vehicle.purchasePrice || "",
    purchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toISOString().split("T")[0] : "",
    currentValue: vehicle.currentValue || "",
    loanBalance: vehicle.loanBalance || "",
    monthlyPayment: vehicle.monthlyPayment || "",
    loanPayoffDate: vehicle.loanPayoffDate ? new Date(vehicle.loanPayoffDate).toISOString().split("T")[0] : "",
    lender: vehicle.lender || "",
    assetCategory: vehicle.assetCategory || "fleet",
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Financial Information</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Purchase Price</Label><Input type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm(f => ({...f, purchasePrice: e.target.value}))} /></div>
          <div><Label>Purchase Date</Label><Input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({...f, purchaseDate: e.target.value}))} /></div>
          <div><Label>Current Value</Label><Input type="number" step="0.01" value={form.currentValue} onChange={e => setForm(f => ({...f, currentValue: e.target.value}))} /></div>
          <div><Label>Loan Balance</Label><Input type="number" step="0.01" value={form.loanBalance} onChange={e => setForm(f => ({...f, loanBalance: e.target.value}))} /></div>
          <div><Label>Monthly Payment</Label><Input type="number" step="0.01" value={form.monthlyPayment} onChange={e => setForm(f => ({...f, monthlyPayment: e.target.value}))} /></div>
          <div><Label>Payoff Date</Label><Input type="date" value={form.loanPayoffDate} onChange={e => setForm(f => ({...f, loanPayoffDate: e.target.value}))} /></div>
          <div><Label>Lender</Label><Input value={form.lender} onChange={e => setForm(f => ({...f, lender: e.target.value}))} /></div>
          <div>
            <Label>Asset Category</Label>
            <Select value={form.assetCategory} onValueChange={v => setForm(f => ({...f, assetCategory: v}))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fleet">Fleet</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => onSave(form)} disabled={isPending} className="w-full mt-4">{isPending ? "Saving..." : "Save"}</Button>
      </DialogContent>
    </Dialog>
  );
}

function ServiceRecordDialog({ open, onOpenChange, vehicleId, currentMileage, onSave, isPending }: any) {
  const [form, setForm] = useState({
    serviceType: "",
    description: "",
    mileageAtService: currentMileage?.toString() || "",
    nextDueMileage: "",
    nextDueDate: "",
    cost: "",
    performedBy: "",
    notes: "",
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Service Record</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Service Type</Label><Input value={form.serviceType} onChange={e => setForm(f => ({...f, serviceType: e.target.value}))} placeholder="Oil Change, Brake Pads, Windshield Wiper Fluid..." /></div>
          <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Details..." /></div>
          <div><Label>Mileage at Service</Label><Input type="number" value={form.mileageAtService} onChange={e => setForm(f => ({...f, mileageAtService: e.target.value}))} /></div>
          <div><Label>Cost</Label><Input type="number" step="0.01" value={form.cost} onChange={e => setForm(f => ({...f, cost: e.target.value}))} /></div>
          <div><Label>Next Due Mileage</Label><Input type="number" value={form.nextDueMileage} onChange={e => setForm(f => ({...f, nextDueMileage: e.target.value}))} placeholder="e.g. 105000" /></div>
          <div><Label>Next Due Date</Label><Input type="date" value={form.nextDueDate} onChange={e => setForm(f => ({...f, nextDueDate: e.target.value}))} /></div>
          <div><Label>Performed By</Label><Input value={form.performedBy} onChange={e => setForm(f => ({...f, performedBy: e.target.value}))} /></div>
        </div>
        <Button onClick={() => onSave({ vehicleId, ...form, mileageAtService: form.mileageAtService ? parseInt(form.mileageAtService) : undefined, nextDueMileage: form.nextDueMileage ? parseInt(form.nextDueMileage) : undefined })} disabled={isPending || !form.serviceType} className="w-full mt-4">{isPending ? "Saving..." : "Save Service Record"}</Button>
      </DialogContent>
    </Dialog>
  );
}

function VehicleMediaSection({ vehicleId }: { vehicleId: number }) {
  const { data: media, isLoading } = trpc.photo.listByVehicle.useQuery({ vehicleId });
  const trpcUtils = trpc.useUtils();
  const uploadMutation = trpc.photo.uploadVehicleMedia.useMutation({
    onSuccess: () => trpcUtils.photo.listByVehicle.invalidate({ vehicleId }),
  });
  const deleteMutation = trpc.photo.deleteVehicleMedia.useMutation({
    onSuccess: () => trpcUtils.photo.listByVehicle.invalidate({ vehicleId }),
  });

  return (
    <MediaUpload
      media={(media || []).map((m: any) => ({ id: m.id, mediaUrl: m.mediaUrl, mediaType: m.mediaType, caption: m.caption, createdAt: m.createdAt }))}
      isLoading={isLoading}
      onUpload={async (data) => {
        await uploadMutation.mutateAsync({ vehicleId, mediaData: data.mediaData, mediaType: data.mediaType, caption: data.caption, fileName: data.fileName });
      }}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync({ id });
      }}
      title="Vehicle Photos & Videos"
    />
  );
}
