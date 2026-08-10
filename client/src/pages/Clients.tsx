import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Building2, Download, Phone, Mail, MapPin, ChevronDown, ChevronUp, PhoneCall, PhoneOff, PhoneMissed, Check } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Clients() {
  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery();
  const createMutation = trpc.clients.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Client added"); resetForm(); } });
  const seedMutation = trpc.seed.loadDefaultClients.useMutation({ onSuccess: (data) => { refetch(); if (data && data.length > 0) { toast.success(`Loaded ${data.length} starter client(s)`); } else { toast.info("Default clients already exist"); } } });
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", clientType: "regular", contactName: "", contactEmail: "", contactPhone: "", address: "", color: "#3B82F6" });
  const resetForm = () => setForm({ name: "", clientType: "regular", contactName: "", contactEmail: "", contactPhone: "", address: "", color: "#3B82F6" });

  const handleCreate = () => {
    if (!form.name) { toast.error("Client name is required"); return; }
    createMutation.mutate({
      name: form.name,
      clientType: form.clientType as any,
      contactName: form.contactName || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      address: form.address || undefined,
      color: form.color,
    });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">{clients?.length ?? 0} clients</p>
        </div>
        <div className="flex gap-2">
          {(!clients || clients.length === 0) && (
            <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
              <Download className="h-4 w-4 mr-2" />{seedMutation.isPending ? "Loading..." : "Load Starter Clients"}
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Client</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Company name" /></div>
                  <div>
                    <Label>Client Type</Label>
                    <Select value={form.clientType} onValueChange={v => setForm(f => ({...f, clientType: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="one_time">One-Time</SelectItem>
                        <SelectItem value="emergency">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Contact Name</Label><Input value={form.contactName} onChange={e => setForm(f => ({...f, contactName: e.target.value}))} /></div>
                  <div><Label>Contact Phone</Label><Input value={form.contactPhone} onChange={e => setForm(f => ({...f, contactPhone: e.target.value}))} /></div>
                </div>
                <div><Label>Contact Email</Label><Input type="email" value={form.contactEmail} onChange={e => setForm(f => ({...f, contactEmail: e.target.value}))} /></div>
                <div><Label>Address</Label><Textarea value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} /></div>
                <div>
                  <Label>Color Code</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.color} onChange={e => setForm(f => ({...f, color: e.target.value}))} className="h-9 w-12 rounded border cursor-pointer" />
                    <span className="text-sm text-muted-foreground">Used for calendar & dashboard</span>
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Adding..." : "Add Client"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients?.length === 0 ? (
          <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No clients yet. Click "Add Client" to get started.</CardContent></Card>
        ) : (
          clients?.map((c: any) => (
            <ClientCard
              key={c.id}
              client={c}
              isExpanded={expandedId === c.id}
              onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ClientCard({ client: c, isExpanded, onToggle }: { client: any; isExpanded: boolean; onToggle: () => void }) {
  const { data: callHistory } = trpc.phoneCall.list.useQuery(
    { clientId: c.id },
    { enabled: isExpanded }
  );
  const updateCall = trpc.phoneCall.update.useMutation({
    onSuccess: () => { toast.success("Call updated"); },
  });

  return (
    <Card className={`transition-all ${isExpanded ? "col-span-full md:col-span-2 lg:col-span-3" : "hover:shadow-md"}`}>
      <CardContent className="p-4">
        {/* Main row */}
        <div className="flex items-start gap-3 cursor-pointer" onClick={onToggle}>
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: c.color + "20" }}>
            <Building2 className="h-5 w-5" style={{ color: c.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{c.name}</p>
              <Badge variant="outline" className="text-xs shrink-0">{c.clientType?.replace("_", " ")}</Badge>
            </div>
            {c.contactName && <p className="text-sm text-muted-foreground mt-1">{c.contactName}</p>}
            <div className="flex items-center gap-3 mt-1 text-xs">
              {c.contactPhone && (
                <a href={`tel:${c.contactPhone}`} className="flex items-center gap-1 text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                  <Phone className="h-3 w-3" />{c.contactPhone}
                </a>
              )}
              {c.contactEmail && (
                <a href={`mailto:${c.contactEmail}`} className="flex items-center gap-1 text-blue-600 hover:underline" onClick={e => e.stopPropagation()}>
                  <Mail className="h-3 w-3" />{c.contactEmail}
                </a>
              )}
            </div>
          </div>
          <div className="shrink-0">
            {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Expanded section */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Contact details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Contact Info</p>
                {c.contactName && <p className="font-medium">{c.contactName}</p>}
                {c.contactPhone && (
                  <a href={`tel:${c.contactPhone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                    <Phone className="h-3 w-3" />{c.contactPhone}
                  </a>
                )}
                {c.contactEmail && (
                  <a href={`mailto:${c.contactEmail}`} className="flex items-center gap-1 text-blue-600 hover:underline mt-1">
                    <Mail className="h-3 w-3" />{c.contactEmail}
                  </a>
                )}
              </div>
              {c.address && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">Address</p>
                  <p className="flex items-start gap-1"><MapPin className="h-3 w-3 mt-0.5 shrink-0" />{c.address}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Client Since</p>
                <p>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "N/A"}</p>
              </div>
            </div>

            {/* Phone Call History */}
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1">
                <PhoneCall className="h-4 w-4" /> Phone Call History
              </p>
              {!callHistory || callHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">No phone calls logged for this client yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(callHistory as any[]).map((call: any) => {
                    const outcomeIcon = call.outcome === "reached" ? <PhoneCall className="h-3 w-3 text-green-600" /> :
                      call.outcome === "voicemail" ? <PhoneOff className="h-3 w-3 text-amber-600" /> :
                      call.outcome === "no_answer" ? <PhoneMissed className="h-3 w-3 text-red-600" /> :
                      <Phone className="h-3 w-3 text-blue-600" />;
                    const bizLabels: Record<string, string> = { acme_automotive: "Acme Auto", customized_enterprise: "Custom Ent.", onsite_advantage: "On-Site", real_estate: "Real Estate" };
                    return (
                      <div key={call.id} className={`flex items-center gap-2 p-2 rounded text-xs ${call.isCompleted ? "bg-green-50 border border-green-100" : "bg-muted/50"}`}>
                        {outcomeIcon}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{call.contactName}</span>
                            {call.businessLine && <span className="text-[9px] bg-primary/10 text-primary px-1 rounded">{bizLabels[call.businessLine] || call.businessLine}</span>}
                            <span className="text-muted-foreground">• {call.outcome?.replace("_", " ")}</span>
                          </div>
                          {call.notes && <p className="text-muted-foreground truncate">{call.notes}</p>}
                          <p className="text-muted-foreground">{call.createdAt ? new Date(call.createdAt).toLocaleDateString() : ""}</p>
                        </div>
                        {!call.isCompleted && (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => updateCall.mutate({ id: call.id, isCompleted: true })} title="Mark complete">
                            <Check className="h-3 w-3 text-green-600" />
                          </Button>
                        )}
                        {call.isCompleted && <Badge variant="outline" className="text-[9px] text-green-600 border-green-200">Done</Badge>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
