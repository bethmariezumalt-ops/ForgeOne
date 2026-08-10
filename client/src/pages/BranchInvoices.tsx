import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign, ChevronDown, ChevronUp, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

interface BranchInvoicesProps {
  branchKey: string;
  branchName: string;
  branchColor: string;
}

export default function BranchInvoices({ branchKey, branchName, branchColor }: BranchInvoicesProps) {
  const { data: invoices, isLoading, refetch } = trpc.invoice.list.useQuery();
  const { data: workOrders } = trpc.workOrder.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const createMutation = trpc.invoice.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Invoice created"); } });
  const updateMutation = trpc.invoice.update.useMutation({ onSuccess: () => { refetch(); toast.success("Invoice updated"); setEditingId(null); } });

  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ workOrderId: "", subtotal: "", tax: "", total: "", notes: "" });
  const [editForm, setEditForm] = useState({ subtotal: "", tax: "", total: "", notes: "", status: "" });

  // Filter invoices to this branch by matching work order businessLine
  const branchWorkOrderIds = new Set(workOrders?.filter((wo: any) => (wo as any).businessLine === branchKey).map(wo => wo.id) ?? []);
  const branchInvoices = invoices?.filter((inv: any) => branchWorkOrderIds.has(inv.workOrderId)) ?? [];
  const branchWOs = workOrders?.filter((wo: any) => (wo as any).businessLine === branchKey && wo.status !== "denied") ?? [];

  const handleCreate = () => {
    createMutation.mutate({
      workOrderId: parseInt(form.workOrderId),
      subtotal: form.subtotal,
      tax: form.tax,
      total: form.total,
      notes: form.notes || undefined,
    });
  };

  const startEdit = (inv: any) => {
    setEditingId(inv.id);
    setEditForm({
      subtotal: inv.subtotal?.toString() || "",
      tax: inv.tax?.toString() || "",
      total: inv.total?.toString() || "",
      notes: inv.notes || "",
      status: inv.status || "draft",
    });
  };

  const saveEdit = (id: number) => {
    updateMutation.mutate({
      id,
      subtotal: editForm.subtotal,
      tax: editForm.tax,
      total: editForm.total,
      notes: editForm.notes,
      status: editForm.status as any,
    });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{branchName} — Invoices</h1>
          <p className="text-muted-foreground mt-1">{branchInvoices.length} invoices</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className={branchColor}><Plus className="h-4 w-4 mr-2" />Create Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New {branchName} Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Work Order</Label>
                <Select value={form.workOrderId} onValueChange={v => setForm(f => ({...f, workOrderId: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select work order" /></SelectTrigger>
                  <SelectContent>
                    {branchWOs.map((wo: any) => (
                      <SelectItem key={wo.id} value={wo.id.toString()}>WO-{wo.id} — {wo.workDescription || wo.orderType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Subtotal ($)</Label><Input type="number" step="0.01" value={form.subtotal} onChange={e => setForm(f => ({...f, subtotal: e.target.value}))} /></div>
                <div><Label>Tax ($)</Label><Input type="number" step="0.01" value={form.tax} onChange={e => setForm(f => ({...f, tax: e.target.value}))} /></div>
                <div><Label>Total ($)</Label><Input type="number" step="0.01" value={form.total} onChange={e => setForm(f => ({...f, total: e.target.value}))} /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Invoice notes" /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !form.workOrderId} className="w-full">
                {createMutation.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {branchInvoices.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            No invoices for {branchName} yet.
          </CardContent></Card>
        ) : (
          branchInvoices.map((inv: any) => {
            const isExpanded = expandedId === inv.id;
            const isEditing = editingId === inv.id;
            const client = clients?.find((c: any) => c.id === inv.clientId);
            return (
              <Card key={inv.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4" onClick={() => setExpandedId(isExpanded ? null : inv.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">#{inv.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">{client?.name || "No client"} • WO-{inv.workOrderId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-green-700">${parseFloat(inv.total || "0").toFixed(2)}</p>
                      <Badge className={STATUS_COLORS[inv.status] || "bg-gray-100"}>{inv.status}</Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t" onClick={e => e.stopPropagation()}>
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div><Label>Subtotal</Label><Input type="number" step="0.01" value={editForm.subtotal} onChange={e => setEditForm(f => ({...f, subtotal: e.target.value}))} /></div>
                            <div><Label>Tax</Label><Input type="number" step="0.01" value={editForm.tax} onChange={e => setEditForm(f => ({...f, tax: e.target.value}))} /></div>
                            <div><Label>Total</Label><Input type="number" step="0.01" value={editForm.total} onChange={e => setEditForm(f => ({...f, total: e.target.value}))} /></div>
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Select value={editForm.status} onValueChange={v => setEditForm(f => ({...f, status: v}))}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label>Notes</Label><Input value={editForm.notes} onChange={e => setEditForm(f => ({...f, notes: e.target.value}))} /></div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(inv.id)}><Save className="h-3 w-3 mr-1" />Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-3 w-3 mr-1" />Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div><span className="text-muted-foreground">Subtotal:</span> ${inv.subtotal || "0.00"}</div>
                            <div><span className="text-muted-foreground">Tax:</span> ${inv.tax || "0.00"}</div>
                            <div><span className="text-muted-foreground">Total:</span> ${inv.total || "0.00"}</div>
                          </div>
                          {inv.notes && <p className="text-sm text-muted-foreground">Notes: {inv.notes}</p>}
                          <Button size="sm" variant="outline" onClick={() => startEdit(inv)} className="mt-2"><Edit2 className="h-3 w-3 mr-1" />Edit</Button>
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
