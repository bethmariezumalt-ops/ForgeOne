import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Home, Users, TrendingUp, Phone, Mail, Globe, Star, DollarSign, MapPin, Calendar, Edit, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LEAD_STATUSES = [
  { value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-100 text-yellow-800" },
  { value: "showing", label: "Showing Scheduled", color: "bg-purple-100 text-purple-800" },
  { value: "offer", label: "Offer Made", color: "bg-orange-100 text-orange-800" },
  { value: "under_contract", label: "Under Contract", color: "bg-green-100 text-green-800" },
  { value: "closed", label: "Closed", color: "bg-emerald-100 text-emerald-800" },
  { value: "lost", label: "Lost", color: "bg-red-100 text-red-800" },
];

const LEAD_TYPES = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "investor", label: "Investor" },
  { value: "renter", label: "Renter" },
];

const LEAD_SOURCES = [
  "Zillow", "Realtor.com", "Referral", "Website", "Social Media",
  "Open House", "Cold Call", "Door Knocking", "Sphere of Influence", "Other"
];

export default function RealEstate() {
  const { data: leads, isLoading } = trpc.realEstate.list.useQuery();
  const trpcUtils = trpc.useUtils();
  const createLead = trpc.realEstate.create.useMutation({
    onSuccess: () => { trpcUtils.realEstate.list.invalidate(); setCreateOpen(false); resetForm(); toast.success("Lead added successfully"); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateLead = trpc.realEstate.update.useMutation({
    onSuccess: () => { trpcUtils.realEstate.list.invalidate(); toast.success("Lead updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteLead = trpc.realEstate.delete.useMutation({
    onSuccess: () => { trpcUtils.realEstate.list.invalidate(); toast.success("Lead deleted"); },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", leadType: "buyer",
    status: "new", leadSource: "", propertyInterest: "",
    budget: "", notes: "", followUpDate: "",
  });

  const resetForm = () => setForm({
    name: "", email: "", phone: "", leadType: "buyer",
    status: "new", leadSource: "", propertyInterest: "",
    budget: "", notes: "", followUpDate: "",
  });

  const handleCreate = () => {
    if (!form.name) { toast.error("Name is required"); return; }
    createLead.mutate({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      status: form.status as any,
      leadSource: form.leadSource || undefined,
      propertyInterest: form.propertyInterest || undefined,
      budget: form.budget || undefined,
      notes: form.notes ? `[${form.leadType.toUpperCase()}] ${form.notes}` : `[${form.leadType.toUpperCase()}]`,
      followUpDate: form.followUpDate || undefined,
    });
  };

  const handleStatusChange = (id: number, status: string) => {
    updateLead.mutate({ id, status: status as any });
  };

  const handleEdit = (lead: any) => {
    const leadTypeMatch = lead.notes?.match(/^\[(BUYER|SELLER|INVESTOR|RENTER)\]/);
    const leadType = leadTypeMatch ? leadTypeMatch[1].toLowerCase() : "buyer";
    const cleanNotes = lead.notes?.replace(/^\[(BUYER|SELLER|INVESTOR|RENTER)\]\s*/, "") || "";
    setForm({
      name: lead.name || "",
      email: lead.email || "",
      phone: lead.phone || "",
      leadType,
      status: lead.status || "new",
      leadSource: lead.leadSource || "",
      propertyInterest: lead.propertyInterest || "",
      budget: lead.budget ? String(lead.budget) : "",
      notes: cleanNotes,
      followUpDate: lead.followUpDate ? new Date(lead.followUpDate).toISOString().split("T")[0] : "",
    });
    setEditingId(lead.id);
    setCreateOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingId || !form.name) { toast.error("Name is required"); return; }
    updateLead.mutate({
      id: editingId,
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      status: form.status as any,
      leadSource: form.leadSource || undefined,
      propertyInterest: form.propertyInterest || undefined,
      budget: form.budget || undefined,
      notes: form.notes ? `[${form.leadType.toUpperCase()}] ${form.notes}` : `[${form.leadType.toUpperCase()}]`,
      followUpDate: form.followUpDate || undefined,
    });
    setEditingId(null);
    setCreateOpen(false);
    resetForm();
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      deleteLead.mutate({ id });
    }
  };

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const allLeads = (leads as any[] || []);
  const hotLeads = allLeads.filter((l: any) => ["new", "contacted", "showing"].includes(l.status));
  const activeDeals = allLeads.filter((l: any) => ["offer", "under_contract"].includes(l.status));
  const closedDeals = allLeads.filter((l: any) => l.status === "closed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Homes by Beth Marie</h1>
          <p className="text-sm text-muted-foreground">Next Stage of Happiness — Real Estate</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setEditingId(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Lead</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingId ? "Edit Lead" : "Add New Lead"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Client full name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="(555) 123-4567" />
              </div>
              <div>
                <Label>Lead Type</Label>
                <Select value={form.leadType} onValueChange={v => setForm(f => ({...f, leadType: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lead Source</Label>
                <Select value={form.leadSource} onValueChange={v => setForm(f => ({...f, leadSource: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select source..." /></SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Budget</Label>
                <Input value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value}))} placeholder="$300,000 - $500,000" />
              </div>
              <div className="col-span-2">
                <Label>Property Interest / Address</Label>
                <Input value={form.propertyInterest} onChange={e => setForm(f => ({...f, propertyInterest: e.target.value}))} placeholder="3BR in Sacramento, specific address..." />
              </div>
              <div className="col-span-2">
                <Label>Follow-Up Date</Label>
                <Input type="date" value={form.followUpDate} onChange={e => setForm(f => ({...f, followUpDate: e.target.value}))} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Additional details, preferences, timeline..." rows={3} />
              </div>
            </div>
            <Button onClick={editingId ? handleSaveEdit : handleCreate} disabled={createLead.isPending || updateLead.isPending} className="w-full mt-4">
              {(createLead.isPending || updateLead.isPending) ? "Saving..." : editingId ? "Save Changes" : "Add Lead"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agent Profile Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Beth Marie Zumalt</h2>
              <p className="text-sm text-muted-foreground">Licensed Real Estate Agent — Next Stage of Happiness</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="flex items-center gap-1"><Globe className="h-3 w-3" /><a href="https://nextstageofhappiness.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">nextstageofhappiness.com</a></span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="default" className="text-xs">Active Agent</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{hotLeads.length}</p>
            <p className="text-xs text-muted-foreground">Hot Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-orange-500 mb-1" />
            <p className="text-2xl font-bold">{activeDeals.length}</p>
            <p className="text-xs text-muted-foreground">Active Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{closedDeals.length}</p>
            <p className="text-xs text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto text-purple-500 mb-1" />
            <p className="text-2xl font-bold">{allLeads.length}</p>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
      </div>

      {/* Leads by Status */}
      <Tabs defaultValue="hot" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hot">Hot Leads ({hotLeads.length})</TabsTrigger>
          <TabsTrigger value="active">Active Deals ({activeDeals.length})</TabsTrigger>
          <TabsTrigger value="all">All Leads ({allLeads.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closedDeals.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="hot">
          <LeadList leads={hotLeads} onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} expandedId={expandedId} setExpandedId={setExpandedId} />
        </TabsContent>
        <TabsContent value="active">
          <LeadList leads={activeDeals} onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} expandedId={expandedId} setExpandedId={setExpandedId} />
        </TabsContent>
        <TabsContent value="all">
          <LeadList leads={allLeads} onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} expandedId={expandedId} setExpandedId={setExpandedId} />
        </TabsContent>
        <TabsContent value="closed">
          <LeadList leads={closedDeals} onStatusChange={handleStatusChange} onEdit={handleEdit} onDelete={handleDelete} expandedId={expandedId} setExpandedId={setExpandedId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeadList({ leads, onStatusChange, onEdit, onDelete, expandedId, setExpandedId }: {
  leads: any[];
  onStatusChange: (id: number, status: string) => void;
  onEdit: (lead: any) => void;
  onDelete: (id: number) => void;
  expandedId: number | null;
  setExpandedId: (id: number | null) => void;
}) {
  if (!leads || leads.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">No leads in this category yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Click "Add Lead" above to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => {
        const statusConfig = LEAD_STATUSES.find(s => s.value === lead.status);
        const leadTypeMatch = lead.notes?.match(/^\[(BUYER|SELLER|INVESTOR|RENTER)\]/);
        const leadType = leadTypeMatch ? leadTypeMatch[1].toLowerCase() : null;
        const cleanNotes = lead.notes?.replace(/^\[(BUYER|SELLER|INVESTOR|RENTER)\]\s*/, "") || "";
        const isExpanded = expandedId === lead.id;
        const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date();

        return (
          <Card key={lead.id} className={`transition-all ${isOverdue ? "border-red-200" : ""}`}>
            <CardContent className="p-4">
              {/* Main row - always visible */}
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : lead.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-base">{lead.name}</p>
                    {leadType && (
                      <Badge variant="outline" className="text-xs">{LEAD_TYPES.find(t => t.value === leadType)?.label || leadType}</Badge>
                    )}
                    <Badge className={`text-xs ${statusConfig?.color || ""}`}>{statusConfig?.label || lead.status}</Badge>
                    {isOverdue && <Badge variant="destructive" className="text-[10px]">OVERDUE</Badge>}
                  </div>
                  {/* Contact info - always visible */}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                        <Phone className="h-3 w-3" />{lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                        <Mail className="h-3 w-3" />{lead.email}
                      </a>
                    )}
                    {lead.leadSource && <span className="text-muted-foreground text-xs">via {lead.leadSource}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {lead.propertyInterest && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Property Interest</p>
                        <p className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.propertyInterest}</p>
                      </div>
                    )}
                    {lead.budget && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Budget</p>
                        <p className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{lead.budget}</p>
                      </div>
                    )}
                    {lead.followUpDate && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Follow-Up Date</p>
                        <p className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                          <Calendar className="h-3 w-3" />{new Date(lead.followUpDate).toLocaleDateString()}
                          {isOverdue && " (OVERDUE)"}
                        </p>
                      </div>
                    )}
                    {lead.leadSource && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Source</p>
                        <p>{lead.leadSource}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Added</p>
                      <p>{new Date(lead.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {cleanNotes && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">Notes</p>
                      <p className="text-sm bg-muted/50 p-2 rounded">{cleanNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Select value={lead.status} onValueChange={(v) => onStatusChange(lead.id, v)}>
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" className="h-8" onClick={(e) => { e.stopPropagation(); onEdit(lead); }}>
                      <Edit className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button size="sm" variant="destructive" className="h-8" onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}>
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
