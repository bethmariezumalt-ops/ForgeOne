import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Building2, Download, Phone, Mail, MapPin, ChevronDown, ChevronUp, PhoneCall, PhoneOff, PhoneMissed, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
  name: "",
  clientType: "regular",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  color: "#3B82F6",
  businesses: ["acme_automotive"] as string[],
});
  const resetForm = () => setForm({
  name: "",
  clientType: "regular",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  color: "#3B82F6",
  businesses: ["acme_automotive"],
});

  const loadClients = async () => {
  setIsLoading(true);

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("branch", "acme_automotive")
    .order("name");

  if (error) {
    toast.error(error.message);
    setClients([]);
  } else {
    setClients(
      (data ?? []).map((client) => ({
        id: client.id,
        name: client.name,
        clientType: client.client_type,
        contactName: client.contact_name,
        contactEmail: client.contact_email,
        contactPhone: client.contact_phone,
        address: client.address,
        color: client.color,
        createdAt: client.created_at,
      }))
    );
  }

  setIsLoading(false);
};

useEffect(() => {
  loadClients();
}, []);
  const handleCreate = async () => {
  if (!form.name.trim()) {
    toast.error("Client name is required");
    return;
  }

  setSaving(true);

  const { data: newClient, error } = await supabase
  .from("clients")
  .insert({
    name: form.name.trim(),
    client_type: form.clientType,
    contact_name: form.contactName || null,
    contact_email: form.contactEmail || null,
    contact_phone: form.contactPhone || null,
    address: form.address || null,
    color: form.color,
    branch: "acme_automotive",
  })
  .select("id")
  .single();
if (!error && newClient) {
  const { error: businessError } = await supabase
    .from("client_businesses")
    .insert(
      form.businesses.map((business) => ({
        client_id: newClient.id,
        business,
      }))
    );

  if (businessError) {
    toast.error(businessError.message);
    setSaving(false);
    return;
  }
}
  if (error) {
    toast.error(error.message);
  } else {
    toast.success("Client added");
    resetForm();
    setOpen(false);
    await loadClients();
  }

  setSaving(false);
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
                <div className="col-span-2">
  <Label>Businesses</Label>
  <div className="mt-2 space-y-2">
    {[
      ["acme_automotive", "ACME Automotive Services"],
      ["on_site_advantage", "On-Site Advantage"],
      ["customized_enterprise", "Customize Enterprises"],
    ].map(([value, label]) => (
      <label key={value} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.businesses.includes(value)}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              businesses: e.target.checked
                ? [...f.businesses, value]
                : f.businesses.filter((business) => business !== value),
            }))
          }
        />
        <span>{label}</span>
      </label>
    ))}
  </div>
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
                <Button onClick={handleCreate} disabled={saving} className="w-full">
  {saving ? "Adding..." : "Add Client"}
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

          </div>
        )}
      </CardContent>
    </Card>
  );
}
