import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Car, Wrench, Send, Heart, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

function HealthBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge className="bg-green-600 text-white">Good</Badge>;
  if (score >= 50) return <Badge className="bg-yellow-600 text-white">Fair</Badge>;
  if (score >= 25) return <Badge className="bg-orange-600 text-white">Poor</Badge>;
  return <Badge className="bg-red-600 text-white">Critical - Consider Replacing</Badge>;
}

function HealthColor(score: number) {
  if (score >= 70) return "text-green-600";
  if (score >= 50) return "text-yellow-600";
  if (score >= 25) return "text-orange-600";
  return "text-red-600";
}

export default function CustomerPortal() {
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientIdInput, setClientIdInput] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [tab, setTab] = useState("vehicles");

  // Service request form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [requestVehicleId, setRequestVehicleId] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");

  const { data: clientData } = trpc.customerPortal.getClientVehicles.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  );

  const { data: completedWork } = trpc.customerPortal.completedWork.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId && tab === "completed" }
  );

  const { data: vehicleHealth } = trpc.customerPortal.vehicleHealth.useQuery(
    { vehicleId: selectedVehicleId! },
    { enabled: !!selectedVehicleId && tab === "health" }
  );

  const submitRequest = trpc.customerPortal.submitRequest.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setIssueDescription("");
      setRequestVehicleId("");
      setPriority("medium");
    },
    onError: (err) => toast.error(err.message),
  });

  if (!clientId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src="/manus-storage/acme-badge-logo_8e92c66b.png" alt="Acme Automotive" className="h-20 w-20 mx-auto rounded-xl object-cover mb-4" />
            <CardTitle className="text-2xl">Customer Portal</CardTitle>
            <CardDescription>
              Acme Automotive Services - On-Site Advantage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Enter your Client ID</Label>
              <Input
                type="number"
                placeholder="Your client ID number"
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Contact Acme Automotive if you don't have your client ID.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                const id = parseInt(clientIdInput);
                if (id > 0) setClientId(id);
                else toast.error("Please enter a valid client ID");
              }}
            >
              Access Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <img src="/manus-storage/acme-badge-logo_8e92c66b.png" alt="Acme Automotive" className="h-14 w-14 rounded-xl object-cover" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {clientData?.client?.name || "Customer Portal"}
            </h1>
            <p className="text-slate-600">Acme Automotive Services - Fleet Management</p>
          </div>
          <Button variant="outline" className="ml-auto" onClick={() => setClientId(null)}>
            Switch Account
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="vehicles"><Car className="h-4 w-4 mr-1" /> Fleet</TabsTrigger>
            <TabsTrigger value="health"><Heart className="h-4 w-4 mr-1" /> Health</TabsTrigger>
            <TabsTrigger value="completed"><CheckCircle2 className="h-4 w-4 mr-1" /> History</TabsTrigger>
            <TabsTrigger value="request"><Send className="h-4 w-4 mr-1" /> Request</TabsTrigger>
          </TabsList>

          {/* Fleet Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card>
              <CardHeader>
                <CardTitle>Your Fleet Vehicles</CardTitle>
                <CardDescription>All vehicles registered under your account</CardDescription>
              </CardHeader>
              <CardContent>
                {clientData?.vehicles && clientData.vehicles.length > 0 ? (
                  <div className="grid gap-3">
                    {clientData.vehicles.map((v: any) => (
                      <div key={v.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <Car className="h-8 w-8 text-blue-600" />
                          <div>
                            <p className="font-medium">{v.year} {v.make} {v.model}</p>
                            <p className="text-sm text-muted-foreground">VIN: {v.vin}</p>
                            {v.unitNumber && <p className="text-xs text-muted-foreground">Unit: {v.unitNumber}</p>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{(v.currentMileage || 0).toLocaleString()} mi</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-1"
                            onClick={() => { setSelectedVehicleId(v.id); setTab("health"); }}
                          >
                            View Health
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No vehicles found for this account.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicle Health Tab */}
          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Health Assessment</CardTitle>
                <CardDescription>Select a vehicle to view its health score and retirement recommendation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Select
                  value={selectedVehicleId?.toString() || ""}
                  onValueChange={(val) => setSelectedVehicleId(parseInt(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientData?.vehicles?.map((v: any) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.year} {v.make} {v.model} - {v.vin}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {vehicleHealth && (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${HealthColor(vehicleHealth.healthScore)}`}>
                        {vehicleHealth.healthScore}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">out of 100</p>
                      <div className="mt-2">
                        <HealthBadge score={vehicleHealth.healthScore} />
                      </div>
                    </div>

                    <Progress value={vehicleHealth.healthScore} className="h-3" />

                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <Wrench className="h-6 w-6 mx-auto text-blue-600" />
                          <p className="text-2xl font-bold mt-1">{vehicleHealth.totalRepairs}</p>
                          <p className="text-xs text-muted-foreground">Total Repairs</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4 text-center">
                          <AlertTriangle className="h-6 w-6 mx-auto text-orange-600" />
                          <p className="text-2xl font-bold mt-1">{vehicleHealth.overdueItems}</p>
                          <p className="text-xs text-muted-foreground">Overdue Items</p>
                        </CardContent>
                      </Card>
                    </div>

                    {vehicleHealth.factors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Health Factors</h4>
                        <ul className="space-y-1">
                          {vehicleHealth.factors.map((f: string, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">Recommendation</h4>
                      <p className="text-sm text-blue-800">{vehicleHealth.recommendation}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completed Work Tab */}
          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Work History</CardTitle>
                <CardDescription>Recent maintenance and repairs performed on your fleet</CardDescription>
              </CardHeader>
              <CardContent>
                {completedWork && (completedWork as any[]).length > 0 ? (
                  <div className="space-y-3">
                    {(completedWork as any[]).map((item: any, i: number) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.work_orders?.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.vehicles?.year} {item.vehicles?.make} {item.vehicles?.model} - VIN: {item.vehicles?.vin}
                            </p>
                            {item.work_orders?.description && (
                              <p className="text-sm text-slate-600 mt-1">{item.work_orders.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(item.work_orders?.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No completed work found.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Service Request Tab */}
          <TabsContent value="request">
            <Card>
              <CardHeader>
                <CardTitle>Report an Issue / Request Service</CardTitle>
                <CardDescription>Submit a service request and our team will respond promptly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Your Name *</Label>
                    <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="John Smith" />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="john@company.com" />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low - Routine</SelectItem>
                        <SelectItem value="medium">Medium - Standard</SelectItem>
                        <SelectItem value="high">High - Urgent</SelectItem>
                        <SelectItem value="emergency">Emergency - Immediate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Vehicle (optional)</Label>
                  <Select value={requestVehicleId} onValueChange={setRequestVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vehicle (or leave blank for general)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General / Building Issue</SelectItem>
                      {clientData?.vehicles?.map((v: any) => (
                        <SelectItem key={v.id} value={v.id.toString()}>
                          {v.year} {v.make} {v.model} - {v.vin}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Describe the Issue *</Label>
                  <Textarea
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Please describe the issue or service needed in detail..."
                    rows={5}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    if (!contactName || !issueDescription) {
                      toast.error("Please fill in your name and issue description");
                      return;
                    }
                    submitRequest.mutate({
                      clientId: clientId!,
                      vehicleId: requestVehicleId && requestVehicleId !== "none" ? parseInt(requestVehicleId) : undefined,
                      contactName,
                      contactEmail: contactEmail || undefined,
                      contactPhone: contactPhone || undefined,
                      issueDescription,
                      priority: priority as any,
                    });
                  }}
                  disabled={submitRequest.isPending}
                >
                  {submitRequest.isPending ? "Submitting..." : "Submit Service Request"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center">
          <img src="/manus-storage/acme-roadrunner-logo_ae2baad8.png" alt="Acme Automotive" className="h-16 mx-auto opacity-60" />
          <p className="text-sm text-slate-500 mt-2">Acme Automotive Services - Home of the On-Site Advantage</p>
          <p className="text-xs text-slate-400">Est. 1992</p>
        </div>
      </div>
    </div>
  );
}
