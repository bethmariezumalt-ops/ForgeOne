import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Building2, Phone, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface BranchClientsProps {
  branchKey: string;
  branchName: string;
  branchColor: string;
}

export default function BranchClients({ branchKey, branchName, branchColor }: BranchClientsProps) {
  const { data: clients, isLoading, refetch } = trpc.clients.list.useQuery();
  const { data: workOrders } = trpc.workOrder.list.useQuery();
  const createMutation = trpc.clients.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Client added"); } });

  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  // Filter clients who have work orders in this branch
  const branchClientIds = new Set(workOrders?.filter((wo: any) => (wo as any).businessLine === branchKey).map(wo => wo.clientId).filter(Boolean) ?? []);
  const branchClients = clients?.filter((c: any) => branchClientIds.has(c.id)) ?? [];

  const handleCreate = () => {
    createMutation.mutate({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
    });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{branchName} — Clients</h1>
          <p className="text-muted-foreground mt-1">{branchClients.length} clients with {branchName} work</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className={branchColor}><Plus className="h-4 w-4 mr-2" />Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Client to {branchName}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Client name" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="email@example.com" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="(555) 123-4567" /></div>
              <div><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} placeholder="Street address" /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !form.name} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Client"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Client List */}
      <div className="space-y-3">
        {branchClients.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            No clients with {branchName} work orders yet. Create a work order for a client to see them here.
          </CardContent></Card>
        ) : (
          branchClients.map((client: any) => {
            const isExpanded = expandedId === client.id;
            const clientWOs = workOrders?.filter((wo: any) => wo.clientId === client.id && (wo as any).businessLine === branchKey) ?? [];
            return (
              <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4" onClick={() => setExpandedId(isExpanded ? null : client.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{clientWOs.length} work orders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{clientWOs.filter((wo: any) => wo.status === "completed").length} completed</Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t" onClick={e => e.stopPropagation()}>
                      <div className="space-y-2 text-sm">
                        {client.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{client.email}</div>}
                        {client.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{client.phone}</div>}
                        {client.address && <p className="text-muted-foreground">{client.address}</p>}
                      </div>
                      {clientWOs.length > 0 && (
                        <div className="mt-3 space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Recent Work Orders</p>
                          {clientWOs.slice(0, 5).map((wo: any) => (
                            <div key={wo.id} className="flex items-center justify-between p-2 rounded border text-sm">
                              <span>WO-{wo.id} — {wo.workDescription || wo.orderType}</span>
                              <Badge variant="outline" className="text-xs capitalize">{wo.status?.replace("_", " ")}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
