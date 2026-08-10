import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Phone, Mail, Calendar, DollarSign, ArrowRight, Trash2, Edit2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  quoted: "bg-purple-100 text-purple-800",
  scheduled: "bg-indigo-100 text-indigo-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

const SOURCES = ["Advertisement", "Referral", "Website", "Social Media", "Google", "Yelp", "Walk-in", "Phone Call", "Other"];
const BUSINESS_LINES = ["Acme Automotive", "Customized Enterprise", "On-Site Advantage"];

export default function Inquiries() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", source: "", serviceNeeded: "",
    vehicleInfo: "", notes: "", businessLine: "", quotedAmount: "", followUpDate: "",
  });

  const { data: inquiries, refetch } = trpc.inquiry.list.useQuery();
  const createMutation = trpc.inquiry.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); resetForm(); toast.success("Inquiry added"); } });
  const updateMutation = trpc.inquiry.update.useMutation({ onSuccess: () => { refetch(); setEditingId(null); resetForm(); toast.success("Inquiry updated"); } });
  const deleteMutation = trpc.inquiry.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Inquiry deleted"); } });

  function resetForm() {
    setForm({ name: "", phone: "", email: "", source: "", serviceNeeded: "", vehicleInfo: "", notes: "", businessLine: "", quotedAmount: "", followUpDate: "" });
  }

  function handleSubmit() {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  }

  function startEdit(inquiry: any) {
    setEditingId(inquiry.id);
    setForm({
      name: inquiry.name || "",
      phone: inquiry.phone || "",
      email: inquiry.email || "",
      source: inquiry.source || "",
      serviceNeeded: inquiry.serviceNeeded || "",
      vehicleInfo: inquiry.vehicleInfo || "",
      notes: inquiry.notes || "",
      businessLine: inquiry.businessLine || "",
      quotedAmount: inquiry.quotedAmount || "",
      followUpDate: inquiry.followUpDate ? new Date(inquiry.followUpDate).toISOString().split("T")[0] : "",
    });
    setShowForm(true);
  }

  function handleStatusChange(id: number, status: string) {
    updateMutation.mutate({ id, status: status as any });
  }

  const filtered = inquiries?.filter((i: any) => filter === "all" || i.status === filter) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customer Inquiries</h1>
          <p className="text-muted-foreground">Track prospects from advertising and referrals</p>
        </div>
        <Button onClick={() => { resetForm(); setEditingId(null); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Inquiry
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "new", "contacted", "quoted", "scheduled", "converted", "lost"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && <span className="ml-1 text-xs">({inquiries?.filter((i: any) => i.status === s).length || 0})</span>}
          </Button>
        ))}
      </div>

      {/* New/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Inquiry" : "New Customer Inquiry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>How They Found Us</Label>
                <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Business Line</Label>
                <Select value={form.businessLine} onValueChange={v => setForm({ ...form, businessLine: v })}>
                  <SelectTrigger><SelectValue placeholder="Select business" /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_LINES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>What They Need Done</Label>
              <Textarea value={form.serviceNeeded} onChange={e => setForm({ ...form, serviceNeeded: e.target.value })} placeholder="Describe the service they're looking for..." rows={3} />
            </div>
            <div>
              <Label>Vehicle Info (if applicable)</Label>
              <Input value={form.vehicleInfo} onChange={e => setForm({ ...form, vehicleInfo: e.target.value })} placeholder="Year, Make, Model, VIN" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quoted Amount</Label>
                <Input type="number" step="0.01" value={form.quotedAmount} onChange={e => setForm({ ...form, quotedAmount: e.target.value })} placeholder="0.00" />
              </div>
              <div>
                <Label>Follow-Up Date</Label>
                <Input type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." rows={2} />
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingId ? "Update Inquiry" : "Add Inquiry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inquiry Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {filter === "all" ? "No inquiries yet. Click '+ New Inquiry' to add one." : `No ${filter} inquiries.`}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((inquiry: any) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{inquiry.name}</h3>
                      <Badge className={STATUS_COLORS[inquiry.status] || ""}>{inquiry.status}</Badge>
                      {inquiry.businessLine && <Badge variant="outline">{inquiry.businessLine}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
                      {inquiry.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{inquiry.phone}</span>}
                      {inquiry.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{inquiry.email}</span>}
                      {inquiry.source && <span>via {inquiry.source}</span>}
                      {inquiry.quotedAmount && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${inquiry.quotedAmount}</span>}
                      {inquiry.followUpDate && (
                        <span className={`flex items-center gap-1 ${new Date(inquiry.followUpDate) < new Date() ? "text-red-600 font-medium" : ""}`}>
                          <Calendar className="w-3 h-3" />Follow-up: {new Date(inquiry.followUpDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {inquiry.serviceNeeded && <p className="text-sm mb-1"><strong>Needs:</strong> {inquiry.serviceNeeded}</p>}
                    {inquiry.vehicleInfo && <p className="text-sm mb-1"><strong>Vehicle:</strong> {inquiry.vehicleInfo}</p>}
                    {inquiry.notes && <p className="text-sm text-muted-foreground">{inquiry.notes}</p>}
                    <p className="text-xs text-muted-foreground mt-2">Added {new Date(inquiry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {/* Status progression buttons */}
                    {inquiry.status === "new" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(inquiry.id, "contacted")}>
                        <ArrowRight className="w-3 h-3 mr-1" />Contacted
                      </Button>
                    )}
                    {inquiry.status === "contacted" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(inquiry.id, "quoted")}>
                        <ArrowRight className="w-3 h-3 mr-1" />Quoted
                      </Button>
                    )}
                    {inquiry.status === "quoted" && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(inquiry.id, "scheduled")}>
                        <ArrowRight className="w-3 h-3 mr-1" />Scheduled
                      </Button>
                    )}
                    {inquiry.status === "scheduled" && (
                      <Button size="sm" variant="default" onClick={() => handleStatusChange(inquiry.id, "converted")}>
                        <ArrowRight className="w-3 h-3 mr-1" />Convert
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => startEdit(inquiry)}><Edit2 className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { if (confirm("Delete this inquiry?")) deleteMutation.mutate({ id: inquiry.id }); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
