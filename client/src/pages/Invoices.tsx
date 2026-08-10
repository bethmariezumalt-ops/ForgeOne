import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Printer, Mail, DollarSign, Pencil, Check, X, Send, CreditCard, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Invoices() {
  const { data: invoices, isLoading, refetch } = trpc.invoice.list.useQuery();
  const { data: workOrders } = trpc.workOrder.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const createMutation = trpc.invoice.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Invoice created"); } });
  const updateMutation = trpc.invoice.update.useMutation({ onSuccess: () => { refetch(); toast.success("Invoice updated"); setEditingId(null); } });
  const moveBranchMutation = trpc.workOrder.updateBusinessLine.useMutation({ onSuccess: () => { refetch(); toast.success("Invoice moved to new branch"); }, onError: (err) => toast.error(err.message) });
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [form, setForm] = useState({ workOrderId: "", subtotal: "", tax: "", total: "", notes: "", clientId: "" });
  const [editForm, setEditForm] = useState({ subtotal: "", tax: "", total: "", notes: "", dueDate: "", status: "", clientId: "" });

  const handleCreate = () => {
    if (!form.workOrderId || !form.total) { toast.error("Work order and total required"); return; }
    const wo = workOrders?.find(w => w.id === parseInt(form.workOrderId));
    createMutation.mutate({
      workOrderId: parseInt(form.workOrderId),
      clientId: wo?.clientId || parseInt(form.clientId) || 1,
      subtotal: form.subtotal || form.total,
      tax: form.tax || undefined,
      total: form.total,
      notes: form.notes || undefined,
    });
  };

  const startEdit = (inv: any) => {
    setEditingId(inv.id);
    setEditForm({
      subtotal: inv.subtotal || "",
      tax: inv.tax || "",
      total: inv.total || "",
      notes: inv.notes || "",
      dueDate: inv.dueDate || "",
      status: inv.status || "draft",
      clientId: inv.clientId ? String(inv.clientId) : "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      subtotal: editForm.subtotal || undefined,
      tax: editForm.tax || undefined,
      total: editForm.total || undefined,
      notes: editForm.notes || undefined,
      dueDate: editForm.dueDate || undefined,
      status: editForm.status as any || undefined,
      clientId: editForm.clientId ? parseInt(editForm.clientId) : undefined,
    });
  };

  const handleMarkSent = (inv: any) => {
    updateMutation.mutate({ id: inv.id, status: "sent" });
  };

  const handleMarkPaid = (inv: any) => {
    const today = new Date().toISOString().split("T")[0];
    updateMutation.mutate({ id: inv.id, status: "paid", paidDate: today });
  };

  const generateInvoiceHtml = (invoice: any) => {
    const wo = workOrders?.find(w => w.id === invoice.workOrderId);
    const client = clients?.find((c: any) => c.id === invoice.clientId);
    return `
      <html><head><title>Invoice #${invoice.invoiceNumber}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto}
      .invoice-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #1e3a5f}
      .logo-section{display:flex;align-items:center;gap:15px}
      .logo-section img{height:80px;width:80px;object-fit:cover;border-radius:8px}
      .company-info h2{margin:0;color:#1e3a5f;font-size:1.4em}
      .company-info p{margin:2px 0;color:#555;font-size:0.85em}
      .invoice-title{text-align:right}
      .invoice-title h1{margin:0;color:#1e3a5f;font-size:2em}
      .invoice-meta{margin-top:5px;font-size:0.9em;color:#555}
      .header{display:flex;justify-content:space-between;margin-bottom:30px}
      .details{margin:20px 0}table{width:100%;border-collapse:collapse;margin:20px 0}
      th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#1e3a5f;color:white}
      .total{font-size:1.2em;font-weight:bold;text-align:right;margin-top:20px;padding:15px;background:#f0f4f8;border-radius:4px;border-left:4px solid #1e3a5f}
      .footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #ddd}
      .footer img{height:60px;margin-bottom:10px}</style></head>
      <body>
      <div class="invoice-header">
        <div class="logo-section">
          <img src="${window.location.origin}/manus-storage/acme-badge-logo_8e92c66b.png" alt="Acme Logo" />
          <div class="company-info">
            <h2>Acme Automotive Services</h2>
            <p>Fleet Vehicle Maintenance</p>
            <p>Home of the On-Site Advantage</p>
            <p>Est. 1992</p>
          </div>
        </div>
        <div class="invoice-title">
          <h1>INVOICE</h1>
          <div class="invoice-meta">
            <strong>#${invoice.invoiceNumber}</strong><br>
            ${new Date(invoice.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <div class="header">
        <div><strong>Invoice Details</strong><br>
        <strong>Due:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon Receipt"}<br>
        <strong>Status:</strong> ${invoice.status}</div>
      </div>
      ${client ? `<div class="details"><p><strong>Bill To:</strong> ${client.name}</p>${client.contactEmail ? `<p>${client.contactEmail}</p>` : ""}</div>` : ""}
      <div class="details">
        <p><strong>Work Order:</strong> WO-${invoice.workOrderId}</p>
        ${wo ? `<p><strong>Description:</strong> ${wo.workDescription || "Vehicle maintenance"}</p>` : ""}
      </div>
      <table><tr><th>Description</th><th>Amount</th></tr>
      <tr><td>Services Rendered</td><td>$${invoice.subtotal || "0.00"}</td></tr>
      ${invoice.tax ? `<tr><td>Tax</td><td>$${invoice.tax}</td></tr>` : ""}
      </table>
      <div class="total">Total Due: $${invoice.total}</div>
      ${invoice.notes ? `<p><em>Notes: ${invoice.notes}</em></p>` : ""}
      <div class="footer">
        <img src="${window.location.origin}/manus-storage/acme-roadrunner-logo_44d0beab.png" alt="Acme Automotive - Home of the On-Site Advantage" />
        <p style="color:#666;font-size:0.9em">Thank you for your business!</p>
        <p style="color:#999;font-size:0.8em">Acme Automotive Services &bull; Est. 1992 &bull; Home of the On-Site Advantage</p>
      </div>
      </body></html>
    `;
  };

  const handlePrint = (invoice: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(generateInvoiceHtml(invoice));
    printWindow.document.close();
    printWindow.print();
  };

  const handleEmail = (invoice: any) => {
    const client = clients?.find((c: any) => c.id === invoice.clientId);
    const wo = workOrders?.find(w => w.id === invoice.workOrderId);
    const email = client?.contactEmail || "";
    const subject = encodeURIComponent(`Invoice #${invoice.invoiceNumber} - Acme Automotive`);
    const body = encodeURIComponent(
      `Dear ${client?.name || "Client"},\n\n` +
      `Please find below the details for Invoice #${invoice.invoiceNumber}:\n\n` +
      `Work Order: WO-${invoice.workOrderId}\n` +
      `Description: ${wo?.workDescription || "Vehicle maintenance services"}\n` +
      `Subtotal: $${invoice.subtotal || "0.00"}\n` +
      `${invoice.tax ? `Tax: $${invoice.tax}\n` : ""}` +
      `Total Due: $${invoice.total}\n\n` +
      `Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "Upon Receipt"}\n\n` +
      `${invoice.notes ? `Notes: ${invoice.notes}\n\n` : ""}` +
      `Thank you for your business!\n\n` +
      `Best regards,\nAcme Automotive`
    );
    
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_self");
    toast.success(email ? `Opening email to ${email}` : "Opening email client (no client email on file)");
  };

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
  };

  const filteredInvoices = invoices?.filter((inv: any) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (branchFilter !== "all") {
      const wo = workOrders?.find(w => w.id === inv.workOrderId);
      if ((wo as any)?.businessLine !== branchFilter) return false;
    }
    return true;
  });

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground mt-1">{invoices?.length ?? 0} invoices</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Create Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Work Order</Label>
                <Select value={form.workOrderId} onValueChange={v => setForm(f => ({...f, workOrderId: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select work order" /></SelectTrigger>
                  <SelectContent>
                    {workOrders?.filter(wo => wo.status !== "denied").map((wo: any) => (
                      <SelectItem key={wo.id} value={wo.id.toString()}>WO-{wo.id} — {wo.workDescription || wo.orderType}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Subtotal ($)</Label><Input type="number" step="0.01" value={form.subtotal} onChange={e => setForm(f => ({...f, subtotal: e.target.value}))} /></div>
                <div><Label>Tax ($)</Label><Input type="number" step="0.01" value={form.tax} onChange={e => setForm(f => ({...f, tax: e.target.value}))} /></div>
                <div><Label>Total ($) *</Label><Input type="number" step="0.01" value={form.total} onChange={e => setForm(f => ({...f, total: e.target.value}))} /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Invoice notes" /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
            <SelectItem value="on_site_advantage">On-Site Advantage</SelectItem>
            <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto">{filteredInvoices?.length ?? 0} invoices</Badge>
      </div>

      <div className="space-y-3">
        {filteredInvoices?.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            No invoices yet. Create one from a work order.
          </CardContent></Card>
        ) : (
          filteredInvoices?.map((inv: any) => {
            const isExpanded = expandedId === inv.id;
            const isEditing = editingId === inv.id;
            const client = clients?.find((c: any) => c.id === inv.clientId);
            const wo = workOrders?.find(w => w.id === inv.workOrderId);

            return (
              <Card key={inv.id} className={`transition-all ${isExpanded ? "ring-1 ring-primary/30 shadow-md" : "hover:shadow-md"}`}>
                <CardContent className="p-0">
                  {/* Summary Row - Clickable */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer"
                    onClick={() => { setExpandedId(isExpanded ? null : inv.id); if (isEditing && !isExpanded) setEditingId(null); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">#{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {client?.name || "Unknown Client"} • WO-{inv.workOrderId} • {new Date(inv.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-green-700">${inv.total}</span>
                      <Badge className={`text-xs ${statusColors[inv.status] || ""}`}>
                        {inv.status}
                      </Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-4">
                      {/* Detail Info or Edit Form */}
                      {isEditing ? (
                        <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Client</Label>
                              <Select value={editForm.clientId} onValueChange={v => setEditForm(f => ({...f, clientId: v}))}>
                                <SelectTrigger className="h-9"><SelectValue placeholder="Select client" /></SelectTrigger>
                                <SelectContent>
                                  {clients?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Status</Label>
                              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({...f, status: v}))}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Draft</SelectItem>
                                  <SelectItem value="sent">Sent</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Subtotal ($)</Label>
                              <Input className="h-9" type="number" step="0.01" value={editForm.subtotal} onChange={e => setEditForm(f => ({...f, subtotal: e.target.value}))} />
                            </div>
                            <div>
                              <Label className="text-xs">Tax ($)</Label>
                              <Input className="h-9" type="number" step="0.01" value={editForm.tax} onChange={e => setEditForm(f => ({...f, tax: e.target.value}))} />
                            </div>
                            <div>
                              <Label className="text-xs">Total ($)</Label>
                              <Input className="h-9" type="number" step="0.01" value={editForm.total} onChange={e => setEditForm(f => ({...f, total: e.target.value}))} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Due Date</Label>
                              <Input className="h-9" type="date" value={editForm.dueDate} onChange={e => setEditForm(f => ({...f, dueDate: e.target.value}))} />
                            </div>
                            <div>
                              <Label className="text-xs">Notes</Label>
                              <Textarea className="min-h-[36px] text-sm" value={editForm.notes} onChange={e => setEditForm(f => ({...f, notes: e.target.value}))} placeholder="Invoice notes..." rows={1} />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                              <Check className="h-3 w-3 mr-1" />{updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-3 w-3 mr-1" />Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Client</p>
                            <p className="font-medium">{client?.name || "Unknown"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Work Order</p>
                            <p className="font-medium">WO-{inv.workOrderId}</p>
                            {wo && <p className="text-xs text-muted-foreground">{wo.workDescription || wo.orderType}</p>}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Due Date</p>
                            <p className="font-medium">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "Upon Receipt"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Created</p>
                            <p className="font-medium">{new Date(inv.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Subtotal</p>
                            <p className="font-medium">${inv.subtotal || "0.00"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Tax</p>
                            <p className="font-medium">${inv.tax || "0.00"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-semibold text-green-700">${inv.total}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Paid Date</p>
                            <p className="font-medium">{inv.paidDate ? new Date(inv.paidDate).toLocaleDateString() : "—"}</p>
                          </div>
                          {inv.notes && (
                            <div className="col-span-2 md:col-span-4">
                              <p className="text-xs text-muted-foreground">Notes</p>
                              <p className="text-sm">{inv.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {!isEditing && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          <Button size="sm" variant="outline" onClick={() => startEdit(inv)}>
                            <Pencil className="h-3 w-3 mr-1" />Edit
                          </Button>
                          <Select onValueChange={(v) => moveBranchMutation.mutate({ id: inv.workOrderId, businessLine: v as any })}>
                            <SelectTrigger className="h-8 w-[160px] text-xs">
                              <SelectValue placeholder="Move to Branch..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
                              <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
                              <SelectItem value="onsite_advantage">On-Site Advantage</SelectItem>
                            </SelectContent>
                          </Select>
                          {inv.status === "draft" && (
                            <Button size="sm" variant="outline" className="text-blue-700 border-blue-200 hover:bg-blue-50" onClick={() => handleMarkSent(inv)}>
                              <Send className="h-3 w-3 mr-1" />Mark Sent
                            </Button>
                          )}
                          {(inv.status === "sent" || inv.status === "overdue") && (
                            <Button size="sm" variant="outline" className="text-green-700 border-green-200 hover:bg-green-50" onClick={() => handleMarkPaid(inv)}>
                              <CreditCard className="h-3 w-3 mr-1" />Mark Paid
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleEmail(inv)}>
                            <Mail className="h-3 w-3 mr-1" />Email
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handlePrint(inv)}>
                            <Printer className="h-3 w-3 mr-1" />Print
                          </Button>
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
