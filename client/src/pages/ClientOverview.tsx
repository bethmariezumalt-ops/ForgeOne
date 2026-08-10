import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, TrendingUp, Car, Briefcase, Plus, Phone, DollarSign, Target, Trophy, Camera, FileText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function ClientOverview() {
  const { data: clientData, isLoading: clientsLoading } = trpc.clientProfitability.overview.useQuery();
  const { data: bidsData, isLoading: bidsLoading, refetch: refetchBids } = trpc.bid.list.useQuery();
  const createBid = trpc.bid.create.useMutation({ onSuccess: () => { refetchBids(); setBidOpen(false); toast.success("Bid added"); } });
  const updateBid = trpc.bid.update.useMutation({ onSuccess: () => { refetchBids(); toast.success("Bid updated"); } });
  const deleteBid = trpc.bid.delete.useMutation({ onSuccess: () => { refetchBids(); toast.success("Bid removed"); } });

  const uploadPhoto = trpc.bid.uploadPhoto.useMutation({ onSuccess: () => { refetchBids(); toast.success("Photo uploaded"); } });
  const createInvoiceFromBid = trpc.bid.createInvoice.useMutation({ onSuccess: () => { toast.success("Invoice created from bid!"); } });

  const [bidOpen, setBidOpen] = useState(false);
  const [photoUploadBidId, setPhotoUploadBidId] = useState<number | null>(null);
  const [bidForm, setBidForm] = useState({
    companyName: "", contactName: "", contactPhone: "", contactEmail: "",
    bidAmount: "", estimatedVehicles: "", serviceType: "fleet_maintenance" as string,
    status: "prospect" as string, notes: "", followUpDate: "",
  });

  const handleCreateBid = () => {
    if (!bidForm.companyName) { toast.error("Company name required"); return; }
    createBid.mutate({
      ...bidForm,
      estimatedVehicles: bidForm.estimatedVehicles ? parseInt(bidForm.estimatedVehicles) : undefined,
      serviceType: bidForm.serviceType as any,
      status: bidForm.status as any,
    });
  };

  const statusColors: Record<string, string> = {
    prospect: "bg-gray-100 text-gray-700",
    bid_sent: "bg-blue-100 text-blue-700",
    negotiating: "bg-amber-100 text-amber-700",
    won: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-700",
  };

  // Chart data for top clients by revenue
  const chartData = (clientData || []).slice(0, 8).map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "..." : c.name,
    revenue: c.totalRevenue,
    jobs: c.totalJobs,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Overview</h1>
          <p className="text-muted-foreground mt-1">Companies, vehicles, profitability, and new business opportunities</p>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-2xl font-bold">{clientData?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Active Clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Car className="h-5 w-5 mx-auto text-indigo-600 mb-1" />
            <p className="text-2xl font-bold">{clientData?.reduce((s, c) => s + c.vehicleCount, 0) ?? 0}</p>
            <p className="text-xs text-muted-foreground">Total Vehicles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-2xl font-bold">${(clientData?.reduce((s, c) => s + c.totalRevenue, 0) ?? 0).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto text-amber-600 mb-1" />
            <p className="text-2xl font-bold">{bidsData?.filter(b => b.status !== "won" && b.status !== "lost").length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Active Bids</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Client Revenue Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="revenue" name="Revenue ($)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Profitability Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Client Profitability (Ranked)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : !clientData || clientData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No clients yet. Go to Clients to add some.</p>
          ) : (
            <div className="space-y-2">
              {clientData.map((client, idx) => (
                <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: client.color || "#3B82F6" }}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.vehicleCount} vehicles | {client.totalJobs} total jobs | {client.pendingJobs} upcoming
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700">${client.totalRevenue.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.totalActualHours > 0 ? `$${client.profitPerHour.toFixed(0)}/hr` : "No hours logged"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Jobs by Client */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-600" />
            Upcoming Jobs by Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientData?.filter(c => c.pendingJobs > 0).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pending jobs</p>
          ) : (
            <div className="space-y-4">
              {clientData?.filter(c => c.pendingJobs > 0).map(client => (
                <div key={client.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: client.color || "#3B82F6" }} />
                      <span className="font-medium">{client.name}</span>
                    </div>
                    <Badge variant="outline">{client.pendingJobs} pending</Badge>
                  </div>
                  {client.upcomingJobDetails && client.upcomingJobDetails.length > 0 && (
                    <div className="space-y-1 ml-5">
                      {client.upcomingJobDetails.map((job: any) => (
                        <div key={job.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground truncate max-w-[60%]">{job.description || "Work order #" + job.id}</span>
                          <div className="flex items-center gap-2">
                            {job.priority && job.priority !== "medium" && (
                              <Badge className={job.priority === "emergency" ? "bg-red-100 text-red-700" : job.priority === "high" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"}>
                                {job.priority}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">{job.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Potential Bids / New Business */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-600" />
              Potential Bids & New Business
            </span>
            <Dialog open={bidOpen} onOpenChange={setBidOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Bid</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Potential Bid</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  <div>
                    <Label>Company Name *</Label>
                    <Input value={bidForm.companyName} onChange={e => setBidForm(f => ({...f, companyName: e.target.value}))} placeholder="Company name" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Contact Name</Label>
                      <Input value={bidForm.contactName} onChange={e => setBidForm(f => ({...f, contactName: e.target.value}))} placeholder="Contact person" />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input value={bidForm.contactPhone} onChange={e => setBidForm(f => ({...f, contactPhone: e.target.value}))} placeholder="Phone" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Bid Amount ($)</Label>
                      <Input type="number" value={bidForm.bidAmount} onChange={e => setBidForm(f => ({...f, bidAmount: e.target.value}))} placeholder="Monthly/annual bid" />
                    </div>
                    <div>
                      <Label>Est. Vehicles</Label>
                      <Input type="number" value={bidForm.estimatedVehicles} onChange={e => setBidForm(f => ({...f, estimatedVehicles: e.target.value}))} placeholder="# vehicles" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Service Type</Label>
                      <Select value={bidForm.serviceType} onValueChange={v => setBidForm(f => ({...f, serviceType: v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fleet_maintenance">Fleet Maintenance</SelectItem>
                          <SelectItem value="building_maintenance">Building Maintenance</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={bidForm.status} onValueChange={v => setBidForm(f => ({...f, status: v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="bid_sent">Bid Sent</SelectItem>
                          <SelectItem value="negotiating">Negotiating</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Follow-up Date</Label>
                    <Input type="date" value={bidForm.followUpDate} onChange={e => setBidForm(f => ({...f, followUpDate: e.target.value}))} />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={bidForm.notes} onChange={e => setBidForm(f => ({...f, notes: e.target.value}))} placeholder="Details about this opportunity..." />
                  </div>
                  <Button onClick={handleCreateBid} disabled={createBid.isPending} className="w-full">
                    {createBid.isPending ? "Adding..." : "Add Bid"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bidsLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
          ) : !bidsData || bidsData.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No bids yet. Click "New Bid" to start tracking potential clients.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bidsData.map(bid => (
                <div key={bid.id} className="p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{bid.companyName}</p>
                        <p className="text-xs text-muted-foreground">
                          {bid.contactName && `${bid.contactName} • `}
                          {bid.estimatedVehicles ? `~${bid.estimatedVehicles} vehicles • ` : ""}
                          {bid.serviceType?.replace("_", " ")}
                        </p>
                        {bid.followUpDate && (
                          <p className="text-xs text-blue-600">Follow up: {new Date(bid.followUpDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {bid.bidAmount && <span className="text-sm font-medium text-green-700">${parseFloat(bid.bidAmount).toFixed(0)}</span>}
                      <Badge className={statusColors[bid.status] || "bg-gray-100 text-gray-700"}>
                        {bid.status?.replace("_", " ")}
                      </Badge>
                      <Select value={bid.status} onValueChange={v => updateBid.mutate({ id: bid.id, status: v as any })}>
                        <SelectTrigger className="w-8 h-8 p-0 border-0"><span className="sr-only">Change status</span></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prospect">Prospect</SelectItem>
                          <SelectItem value="bid_sent">Bid Sent</SelectItem>
                          <SelectItem value="negotiating">Negotiating</SelectItem>
                          <SelectItem value="won">Won</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Action buttons for photos and invoice */}
                  <div className="flex items-center gap-2 mt-2 ml-0">
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const base64 = (reader.result as string).split(",")[1];
                          uploadPhoto.mutate({ bidId: bid.id, photoData: base64, fileName: file.name });
                        };
                        reader.readAsDataURL(file);
                      }} />
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                        <Camera className="h-3 w-3" /> Add Photo
                      </span>
                    </label>
                    {bid.status === "won" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => createInvoiceFromBid.mutate({ bidId: bid.id, subtotal: bid.bidAmount || "0", total: bid.bidAmount || "0" })}>
                        <FileText className="h-3 w-3 mr-1" /> Create Invoice
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:text-red-700" onClick={() => deleteBid.mutate({ id: bid.id })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
