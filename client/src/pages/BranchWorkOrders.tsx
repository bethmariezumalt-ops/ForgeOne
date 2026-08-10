import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ChevronDown, ChevronUp, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
};

interface BranchWorkOrdersProps {
  branchKey: string;
  branchName: string;
  branchColor: string;
}

export default function BranchWorkOrders({ branchKey, branchName, branchColor }: BranchWorkOrdersProps) {
  const { data: allWorkOrders, isLoading, refetch } = trpc.workOrder.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: vehicles } = trpc.vehicle.list.useQuery();
  const createMutation = trpc.workOrder.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Work order created"); } });
  const updateMutation = trpc.workOrder.update.useMutation({ onSuccess: () => { refetch(); toast.success("Work order updated"); setEditingId(null); } });

  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({ clientId: "", vehicleId: "", description: "", priority: "medium", orderType: "repair" });
  const [editForm, setEditForm] = useState({ workDescription: "", priority: "", status: "", notes: "" });

  const workOrders = allWorkOrders?.filter((wo: any) => (wo as any).businessLine === branchKey) ?? [];
  const filtered = statusFilter === "all" ? workOrders : workOrders.filter((wo: any) => wo.status === statusFilter);

  const handleCreate = () => {
    createMutation.mutate({
      clientId: form.clientId ? parseInt(form.clientId) : undefined,
      vehicleId: form.vehicleId ? parseInt(form.vehicleId) : undefined,
      workDescription: form.description,
      priority: form.priority as any,
      orderType: form.orderType as any,
      businessLine: branchKey as any,
    });
  };

  const startEdit = (wo: any) => {
    setEditingId(wo.id);
    setEditForm({
      workDescription: wo.workDescription || "",
      priority: wo.priority || "medium",
      status: wo.status || "pending",
      notes: wo.notes || "",
    });
  };

  const saveEdit = (id: number) => {
    updateMutation.mutate({
      id,
      workDescription: editForm.workDescription,
      priority: editForm.priority as any,
      status: editForm.status as any,
      notes: editForm.notes,
    });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{branchName} — Work Orders</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} work orders</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className={branchColor}><Plus className="h-4 w-4 mr-2" />New Work Order</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New {branchName} Work Order</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Client</Label>
                <Select value={form.clientId} onValueChange={v => setForm(f => ({...f, clientId: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vehicle (optional)</Label>
                <Select value={form.vehicleId} onValueChange={v => setForm(f => ({...f, vehicleId: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No vehicle</SelectItem>
                    {vehicles?.map((v: any) => <SelectItem key={v.id} value={String(v.id)}>{v.year} {v.make} {v.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description *</Label><Textarea value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Work to be done" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({...f, priority: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={form.orderType} onValueChange={v => setForm(f => ({...f, orderType: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !form.description} className="w-full">
                {createMutation.isPending ? "Creating..." : "Create Work Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto">{filtered.length} orders</Badge>
      </div>

      {/* Work Order List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No work orders for {branchName} yet.</CardContent></Card>
        ) : (
          filtered.map((wo: any) => {
            const isExpanded = expandedId === wo.id;
            const isEditing = editingId === wo.id;
            const client = clients?.find((c: any) => c.id === wo.clientId);
            return (
              <Card key={wo.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4" onClick={() => setExpandedId(isExpanded ? null : wo.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                        {wo.id}
                      </div>
                      <div>
                        <p className="font-medium">WO-{wo.id}</p>
                        <p className="text-sm text-muted-foreground">{client?.name || "No client"} — {wo.workDescription || wo.orderType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[wo.status] || "bg-gray-100"}>{wo.status?.replace("_", " ")}</Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t" onClick={e => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div><Label>Description</Label><Textarea value={editForm.workDescription} onChange={e => setEditForm(f => ({...f, workDescription: e.target.value}))} /></div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Priority</Label>
                              <Select value={editForm.priority} onValueChange={v => setEditForm(f => ({...f, priority: v}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="emergency">Emergency</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Status</Label>
                              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({...f, status: v}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="denied">Denied</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div><Label>Notes</Label><Textarea value={editForm.notes} onChange={e => setEditForm(f => ({...f, notes: e.target.value}))} /></div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(wo.id)} disabled={updateMutation.isPending}><Save className="h-3 w-3 mr-1" />Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-3 w-3 mr-1" />Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{wo.orderType}</span></div>
                            <div><span className="text-muted-foreground">Priority:</span> <span className="capitalize">{wo.priority}</span></div>
                            <div><span className="text-muted-foreground">Created:</span> {wo.createdAt ? new Date(wo.createdAt).toLocaleDateString() : "N/A"}</div>
                            <div><span className="text-muted-foreground">Billed:</span> {wo.billedHours || 0}h @ ${wo.chargePerHour || 0}/hr</div>
                          </div>
                          {wo.notes && <p className="text-sm text-muted-foreground mt-2">Notes: {wo.notes}</p>}
                          <Button size="sm" variant="outline" onClick={() => startEdit(wo)} className="mt-2"><Edit2 className="h-3 w-3 mr-1" />Edit</Button>
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
