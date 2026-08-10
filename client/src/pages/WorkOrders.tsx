import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Filter, Image, ChevronDown, ChevronUp, FileText, Clock, CheckCircle2, XCircle, PlayCircle, AlertTriangle, Pencil, Trash2, PlusCircle, Save, X, History, UserPlus } from "lucide-react";
import { MediaUpload } from "@/components/MediaUpload";
import { useState } from "react";
import { PRIORITY_CONFIG, BUSINESS_LINES } from "@shared/serviceCategories";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useViewAs } from "@/contexts/ViewAsContext";

export default function WorkOrders() {
  // MUST call useViewAs before any early returns (React hook rules)
  const { effectiveRole } = useViewAs();
  const isTechnician = effectiveRole === "technician";
  const isOwner = effectiveRole === "owner";
  const isAdmin = effectiveRole === "admin";
  const canEditRates = isOwner; // Only owner can edit billing rates
  const canAssign = isOwner || isAdmin; // Owner and admin can assign employees
  const canSeeBilling = !isTechnician; // Technicians cannot see any billing/price info

  const { data: workOrders, isLoading, refetch } = trpc.workOrder.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: allUsers } = trpc.user.list.useQuery(undefined, { enabled: canAssign });
  const createMutation = trpc.workOrder.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Work order created"); }, onError: (err) => toast.error(err.message) });
  const updateStatusMutation = trpc.workOrder.updateStatus.useMutation({ onSuccess: () => { refetch(); toast.success("Status updated"); }, onError: (err) => toast.error(err.message) });
  const updateMutation = trpc.workOrder.update.useMutation({ onSuccess: () => { refetch(); toast.success("Work order updated"); setEditingId(null); }, onError: (err) => toast.error(err.message) });
  const createInvoiceMutation = trpc.invoice.createFromWorkOrder.useMutation({ onSuccess: () => { toast.success("Invoice generated! Go to Invoices to view it."); refetch(); }, onError: (err) => toast.error(err.message) });
  const logHoursMutation = trpc.workOrder.logHours.useMutation({ onSuccess: () => { refetch(); toast.success("Hours logged"); }, onError: (err) => toast.error(err.message) });
  const addItemMutation = trpc.workOrder.addItem.useMutation({ onSuccess: () => { refetch(); toast.success("Line item added"); setNewItem(null); }, onError: (err) => toast.error(err.message) });
  const deleteItemMutation = trpc.workOrder.deleteItem.useMutation({ onSuccess: () => { refetch(); toast.success("Item removed"); }, onError: (err) => toast.error(err.message) });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mediaWoId, setMediaWoId] = useState<number | null>(null);
  const [hoursForm, setHoursForm] = useState<{ id: number; actualHours: string; billedHours: string; hourlyRate: string } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [newItem, setNewItem] = useState<{ workOrderId: number; description: string; laborHours: string; laborRate: string; partsCost: string; totalCost: string } | null>(null);
  const [showHistoryId, setShowHistoryId] = useState<number | null>(null);
  const [form, setForm] = useState({ clientId: "", orderType: "vehicle" as string, priority: "medium" as string, businessLine: "acme_automotive" as string, workDescription: "", notes: "", chargeAmount: "", technicianId: "" });

  useActivityLog({ action: "viewed_work_orders", entityType: "page", entityTitle: "Work Orders" });

  const employees = (allUsers || []).filter((u: any) => ["owner", "admin", "technician"].includes(u.role));

  const filtered = workOrders?.filter(wo => {
    if (statusFilter !== "all" && wo.status !== statusFilter) return false;
    if (priorityFilter !== "all" && wo.priority !== priorityFilter) return false;
    if (branchFilter !== "all" && (wo as any).businessLine !== branchFilter) return false;
    return true;
  }) ?? [];

  const handleCreate = () => {
    if (!form.clientId) { toast.error("Please select a client"); return; }
    createMutation.mutate({
      clientId: parseInt(form.clientId),
      orderType: form.orderType as any,
      priority: form.priority as any,
      businessLine: form.businessLine as any,
      workDescription: form.workDescription || undefined,
      notes: form.notes || undefined,
      chargeAmount: canSeeBilling ? (form.chargeAmount || undefined) : undefined,
      technicianId: form.technicianId ? parseInt(form.technicianId) : undefined,
    });
  };

  const startEditing = (wo: any) => {
    setEditingId(wo.id);
    setEditForm({
      workDescription: wo.workDescription || "",
      notes: wo.notes || "",
      priority: wo.priority,
      orderType: wo.orderType,
      businessLine: wo.businessLine,
      chargeAmount: wo.chargeAmount || "",
      mileageAtService: wo.mileageAtService?.toString() || "",
      technicianId: wo.technicianId?.toString() || "",
    });
  };

  const saveEdit = () => {
    if (!editingId || !editForm) return;
    const mutateData: any = {
      id: editingId,
      workDescription: editForm.workDescription || undefined,
      notes: editForm.notes || undefined,
      priority: editForm.priority as any,
      orderType: editForm.orderType as any,
      businessLine: editForm.businessLine as any,
      mileageAtService: editForm.mileageAtService ? parseInt(editForm.mileageAtService) : undefined,
    };
    // Only include billing fields if user has permission
    if (canEditRates) {
      mutateData.chargeAmount = editForm.chargeAmount || undefined;
    }
    // Only include assignment if user can assign
    if (canAssign && editForm.technicianId) {
      mutateData.technicianId = parseInt(editForm.technicianId);
    }
    updateMutation.mutate(mutateData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_approval": return <Clock className="h-4 w-4 text-amber-500" />;
      case "approved": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "denied": return <XCircle className="h-4 w-4 text-red-500" />;
      case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case "completed": return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Work Orders</h1>
          <p className="text-muted-foreground">Manage and track all work orders</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Work Order</Button>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Work Order</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Client *</Label>
                <Select value={form.clientId} onValueChange={v => setForm(f => ({...f, clientId: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.orderType} onValueChange={v => setForm(f => ({...f, orderType: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="building">Building</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={v => setForm(f => ({...f, priority: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Business Line</Label>
                <Select value={form.businessLine} onValueChange={v => setForm(f => ({...f, businessLine: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
                    <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
                    <SelectItem value="onsite_advantage">On-Site Advantage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Work Description</Label>
                <Textarea value={form.workDescription} onChange={e => setForm(f => ({...f, workDescription: e.target.value}))} placeholder="Describe the work needed..." />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Additional notes..." />
              </div>
              {/* Charge Amount - only visible to owner/admin */}
              {canSeeBilling && (
                <div>
                  <Label>Charge Amount ($)</Label>
                  <Input type="number" step="0.01" value={form.chargeAmount} onChange={e => setForm(f => ({...f, chargeAmount: e.target.value}))} placeholder="0.00" />
                </div>
              )}
              {/* Assign Employee - only visible to owner/admin */}
              {canAssign && (
                <div>
                  <Label>Assign To</Label>
                  <Select value={form.technicianId} onValueChange={v => setForm(f => ({...f, technicianId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select employee (optional)" /></SelectTrigger>
                    <SelectContent>
                      {employees.map((u: any) => <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.role})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full" onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Work Order"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_approval">Pending Approval</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
            <SelectItem value="on_site_advantage">On-Site Advantage</SelectItem>
            <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="ml-auto">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</Badge>
      </div>

      {/* Work Order Cards */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No work orders found. Create one to get started.</CardContent></Card>
        ) : (
          filtered.map(wo => {
            const isExpanded = expandedId === wo.id;
            const isEditing = editingId === wo.id;
            const client = clients?.find(c => c.id === wo.clientId);
            const priorityConf = PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG];
            const assignedUser = employees.find((u: any) => u.id === wo.technicianId);

            return (
              <Card key={wo.id} className={`transition-all ${isExpanded ? "ring-1 ring-primary/30" : "hover:shadow-md"}`}>
                <CardContent className="p-4">
                  {/* Card Header - Always Visible */}
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => { setExpandedId(isExpanded ? null : wo.id); if (isEditing && !isExpanded) setEditingId(null); }}
                  >
                    {getStatusIcon(wo.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">WO-{wo.id}</span>
                        <Badge variant="outline" className="text-xs">{getStatusLabel(wo.status)}</Badge>
                        <Badge style={{ backgroundColor: priorityConf?.color || "#888", color: "white" }} className="text-xs">{wo.priority}</Badge>
                        {assignedUser && <Badge variant="secondary" className="text-xs"><UserPlus className="h-3 w-3 mr-1" />{assignedUser.name}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {client?.name || "Unknown Client"} {wo.workDescription ? `— ${wo.workDescription.slice(0, 60)}${wo.workDescription.length > 60 ? "..." : ""}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(wo.createdAt).toLocaleDateString()}</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      {/* Line Items */}
                      <WorkOrderLineItems workOrderId={wo.id} onDeleteItem={(id) => deleteItemMutation.mutate({ id, workOrderId: wo.id })} canSeeBilling={canSeeBilling} canEditRates={canEditRates} />

                      {/* Edit Mode */}
                      {isEditing && editForm ? (
                        <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">Edit Work Order</p>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                              <Label className="text-xs">Work Description</Label>
                              <Textarea value={editForm.workDescription} onChange={e => setEditForm((f: any) => ({...f, workDescription: e.target.value}))} placeholder="Describe the work..." rows={3} />
                            </div>
                            <div className="md:col-span-2">
                              <Label className="text-xs">Notes / Addendum</Label>
                              <Textarea value={editForm.notes} onChange={e => setEditForm((f: any) => ({...f, notes: e.target.value}))} placeholder="Add notes, updates, or addendum information..." rows={3} />
                            </div>
                            <div>
                              <Label className="text-xs">Priority</Label>
                              <Select value={editForm.priority} onValueChange={v => setEditForm((f: any) => ({...f, priority: v}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="emergency">Emergency</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs">Business Line</Label>
                              <Select value={editForm.businessLine} onValueChange={v => setEditForm((f: any) => ({...f, businessLine: v}))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
                                  <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
                                  <SelectItem value="onsite_advantage">On-Site Advantage</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {/* Charge Amount - only owner can edit */}
                            {canEditRates && (
                              <div>
                                <Label className="text-xs">Charge Amount ($)</Label>
                                <Input type="number" step="0.01" value={editForm.chargeAmount} onChange={e => setEditForm((f: any) => ({...f, chargeAmount: e.target.value}))} placeholder="0.00" />
                              </div>
                            )}
                            {/* Assignment dropdown - owner and admin */}
                            {canAssign && (
                              <div>
                                <Label className="text-xs">Assigned To</Label>
                                <Select value={editForm.technicianId} onValueChange={v => setEditForm((f: any) => ({...f, technicianId: v}))}>
                                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                                  <SelectContent>
                                    {employees.map((u: any) => <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.role})</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                            <div>
                              <Label className="text-xs">Mileage at Service</Label>
                              <Input type="number" value={editForm.mileageAtService} onChange={e => setEditForm((f: any) => ({...f, mileageAtService: e.target.value}))} placeholder="Current mileage" />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending}>
                              <Save className="h-3.5 w-3.5 mr-1" /> {updateMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Read-Only Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Client</p>
                              <p className="font-medium">{client?.name || "Unknown"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Business Line</p>
                              <p className="font-medium">{BUSINESS_LINES[wo.businessLine as keyof typeof BUSINESS_LINES]?.label || wo.businessLine}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Created</p>
                              <p className="font-medium">{new Date(wo.createdAt).toLocaleDateString()}</p>
                            </div>
                            {/* Charge Amount - hidden from technicians */}
                            {canSeeBilling && wo.chargeAmount && (
                              <div>
                                <p className="text-muted-foreground text-xs">Charge Amount</p>
                                <p className="font-medium text-green-700">${parseFloat(wo.chargeAmount).toFixed(2)}</p>
                              </div>
                            )}
                            {wo.actualHours && (
                              <div>
                                <p className="text-muted-foreground text-xs">Actual Hours</p>
                                <p className="font-medium">{wo.actualHours}h</p>
                              </div>
                            )}
                            {/* Billed Hours - hidden from technicians */}
                            {canSeeBilling && wo.billedHours && (
                              <div>
                                <p className="text-muted-foreground text-xs">Billed Hours</p>
                                <p className="font-medium">{wo.billedHours}h</p>
                              </div>
                            )}
                            {wo.mileageAtService && (
                              <div>
                                <p className="text-muted-foreground text-xs">Mileage at Service</p>
                                <p className="font-medium">{wo.mileageAtService.toLocaleString()} mi</p>
                              </div>
                            )}
                            {assignedUser && (
                              <div>
                                <p className="text-muted-foreground text-xs">Assigned To</p>
                                <p className="font-medium">{assignedUser.name}</p>
                              </div>
                            )}
                          </div>

                          {/* Work Description */}
                          {wo.workDescription && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Work Description</p>
                              <p className="text-sm bg-background rounded p-2 border whitespace-pre-wrap">{wo.workDescription}</p>
                            </div>
                          )}

                          {/* Notes */}
                          {wo.notes && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Notes / Addendum</p>
                              <p className="text-sm bg-background rounded p-2 border whitespace-pre-wrap">{wo.notes}</p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Add Line Item Form */}
                      {newItem && newItem.workOrderId === wo.id && (
                        <div className="border rounded-lg p-3 bg-background space-y-3">
                          <p className="text-sm font-medium">Add Line Item / Service</p>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Description *</Label>
                              <Input value={newItem.description} onChange={e => setNewItem(ni => ni ? {...ni, description: e.target.value} : null)} placeholder="e.g., Oil change, Brake pad replacement..." />
                            </div>
                            <div className={`grid gap-2 ${canSeeBilling ? "grid-cols-4" : "grid-cols-1"}`}>
                              <div>
                                <Label className="text-xs">Labor (hrs)</Label>
                                <Input type="number" step="0.25" value={newItem.laborHours} onChange={e => setNewItem(ni => ni ? {...ni, laborHours: e.target.value} : null)} placeholder="0" />
                              </div>
                              {canSeeBilling && (
                                <>
                                  <div>
                                    <Label className="text-xs">Rate ($/hr)</Label>
                                    <Input type="number" step="0.01" value={newItem.laborRate} onChange={e => setNewItem(ni => ni ? {...ni, laborRate: e.target.value} : null)} placeholder="75" />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Parts ($)</Label>
                                    <Input type="number" step="0.01" value={newItem.partsCost} onChange={e => setNewItem(ni => ni ? {...ni, partsCost: e.target.value} : null)} placeholder="0" />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Total ($)</Label>
                                    <Input type="number" step="0.01" value={newItem.totalCost} onChange={e => setNewItem(ni => ni ? {...ni, totalCost: e.target.value} : null)} placeholder="0" />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => {
                              if (!newItem.description) { toast.error("Description is required"); return; }
                              addItemMutation.mutate({
                                workOrderId: newItem.workOrderId,
                                description: newItem.description,
                                laborHours: newItem.laborHours || undefined,
                                laborRate: canSeeBilling ? (newItem.laborRate || undefined) : undefined,
                                partsCost: canSeeBilling ? (newItem.partsCost || undefined) : undefined,
                                totalCost: canSeeBilling ? (newItem.totalCost || undefined) : undefined,
                              });
                            }} disabled={addItemMutation.isPending}>
                              <Save className="h-3.5 w-3.5 mr-1" /> {addItemMutation.isPending ? "Adding..." : "Add Item"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setNewItem(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {/* Edit Button */}
                        {!isEditing && (
                          <Button size="sm" variant="outline" onClick={() => startEditing(wo)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                        )}

                        {/* Add Line Item Button */}
                        <Button size="sm" variant="outline" onClick={() => setNewItem({ workOrderId: wo.id, description: "", laborHours: "", laborRate: "", partsCost: "", totalCost: "" })}>
                          <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add Item
                        </Button>

                        {/* Status Change Buttons */}
                        {wo.status === "pending_approval" && canAssign && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => updateStatusMutation.mutate({ id: wo.id, status: "approved" })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateStatusMutation.mutate({ id: wo.id, status: "denied" })}
                              disabled={updateStatusMutation.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Deny
                            </Button>
                          </>
                        )}
                        {wo.status === "approved" && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => updateStatusMutation.mutate({ id: wo.id, status: "in_progress" })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <PlayCircle className="h-3.5 w-3.5 mr-1" /> Start Work
                          </Button>
                        )}
                        {wo.status === "in_progress" && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => updateStatusMutation.mutate({ id: wo.id, status: "completed" })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Complete
                          </Button>
                        )}
                        {wo.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ id: wo.id, status: "pending_approval" })}
                            disabled={updateStatusMutation.isPending}
                          >
                            Submit for Approval
                          </Button>
                        )}

                        {/* Log Hours Button */}
                        {(wo.status === "in_progress" || wo.status === "completed") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setHoursForm({ id: wo.id, actualHours: wo.actualHours || "", billedHours: wo.billedHours || "", hourlyRate: wo.hourlyRate || "75" })}
                          >
                            <Clock className="h-3.5 w-3.5 mr-1" /> Log Hours
                          </Button>
                        )}

                        {/* Generate Invoice Button - hidden from technicians */}
                        {canSeeBilling && wo.status === "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => createInvoiceMutation.mutate({ workOrderId: wo.id })}
                            disabled={createInvoiceMutation.isPending}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" /> Generate Invoice
                          </Button>
                        )}

                        {/* Media Button */}
                        <Button size="sm" variant="ghost" onClick={() => setMediaWoId(wo.id)}>
                          <Image className="h-3.5 w-3.5 mr-1" /> Media
                        </Button>

                        {/* History Button */}
                        <Button size="sm" variant="ghost" onClick={() => setShowHistoryId(showHistoryId === wo.id ? null : wo.id)}>
                          <History className="h-3.5 w-3.5 mr-1" /> History
                        </Button>
                      </div>

                      {/* Edit History */}
                      {showHistoryId === wo.id && <WorkOrderEditHistory workOrderId={wo.id} />}

                      {/* Log Hours Inline Form */}
                      {hoursForm && hoursForm.id === wo.id && (
                        <div className="border rounded-lg p-3 bg-background space-y-3">
                          <p className="text-sm font-medium">Log Hours for WO-{wo.id}</p>
                          <div className={`grid gap-2 ${canSeeBilling ? "grid-cols-3" : "grid-cols-1"}`}>
                            <div>
                              <Label className="text-xs">Actual Hours</Label>
                              <Input
                                type="number"
                                step="0.25"
                                value={hoursForm.actualHours}
                                onChange={e => setHoursForm(f => f ? {...f, actualHours: e.target.value} : null)}
                                placeholder="0"
                              />
                            </div>
                            {/* Billed Hours - hidden from technicians */}
                            {canSeeBilling && (
                              <div>
                                <Label className="text-xs">Billed Hours</Label>
                                <Input
                                  type="number"
                                  step="0.25"
                                  value={hoursForm.billedHours}
                                  onChange={e => setHoursForm(f => f ? {...f, billedHours: e.target.value} : null)}
                                  placeholder="0"
                                />
                              </div>
                            )}
                            {/* Hourly Rate - only owner can edit */}
                            {canEditRates && (
                              <div>
                                <Label className="text-xs">Hourly Rate ($)</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={hoursForm.hourlyRate}
                                  onChange={e => setHoursForm(f => f ? {...f, hourlyRate: e.target.value} : null)}
                                  placeholder="75"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                if (!hoursForm.actualHours) { toast.error("Please enter actual hours"); return; }
                                logHoursMutation.mutate({
                                  id: hoursForm.id,
                                  actualHours: hoursForm.actualHours,
                                  billedHours: canSeeBilling ? (hoursForm.billedHours || undefined) : undefined,
                                  hourlyRate: canEditRates ? (hoursForm.hourlyRate || undefined) : undefined,
                                });
                                setHoursForm(null);
                              }}
                              disabled={logHoursMutation.isPending}
                            >
                              Save Hours
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setHoursForm(null)}>Cancel</Button>
                          </div>
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

      {/* Media Dialog */}
      <WOMediaDialog workOrderId={mediaWoId} open={!!mediaWoId} onOpenChange={(v) => { if (!v) setMediaWoId(null); }} />
    </div>
  );
}

function WorkOrderLineItems({ workOrderId, onDeleteItem, canSeeBilling, canEditRates }: { workOrderId: number; onDeleteItem: (id: number) => void; canSeeBilling: boolean; canEditRates: boolean }) {
  const { data: detail, refetch } = trpc.workOrder.getById.useQuery({ id: workOrderId });
  const updateItemMutation = trpc.workOrder.updateItem.useMutation({ onSuccess: () => { refetch(); toast.success("Item updated"); setEditingItemId(null); }, onError: (err: any) => toast.error(err.message) });
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemEdit, setItemEdit] = useState<any>(null);

  if (!detail?.items || detail.items.length === 0) return null;

  const startEditItem = (item: any) => {
    setEditingItemId(item.id);
    setItemEdit({
      description: item.description || "",
      laborHours: item.laborHours || "",
      laborRate: item.laborRate || "",
      partsCost: item.partsCost || "",
      totalCost: item.totalCost || "",
    });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Line Items / Services</p>
      <div className="bg-background border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Description</th>
              <th className="text-right px-3 py-2 font-medium">Labor (hrs)</th>
              {canSeeBilling && <th className="text-right px-3 py-2 font-medium">Rate</th>}
              {canSeeBilling && <th className="text-right px-3 py-2 font-medium">Parts</th>}
              {canSeeBilling && <th className="text-right px-3 py-2 font-medium">Total</th>}
              <th className="text-right px-3 py-2 font-medium w-20"></th>
            </tr>
          </thead>
          <tbody>
            {detail.items.map((item: any) => (
              editingItemId === item.id ? (
                <tr key={item.id} className="border-t bg-blue-50/50">
                  <td className="px-2 py-1">
                    <Input className="h-7 text-xs" value={itemEdit.description} onChange={e => setItemEdit((f: any) => ({...f, description: e.target.value}))} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-7 text-xs w-16 ml-auto" type="number" step="0.25" value={itemEdit.laborHours} onChange={e => setItemEdit((f: any) => ({...f, laborHours: e.target.value}))} />
                  </td>
                  {canSeeBilling && (
                    <td className="px-2 py-1">
                      <Input className="h-7 text-xs w-16 ml-auto" type="number" step="0.01" value={itemEdit.laborRate} onChange={e => setItemEdit((f: any) => ({...f, laborRate: e.target.value}))} disabled={!canEditRates} />
                    </td>
                  )}
                  {canSeeBilling && (
                    <td className="px-2 py-1">
                      <Input className="h-7 text-xs w-16 ml-auto" type="number" step="0.01" value={itemEdit.partsCost} onChange={e => setItemEdit((f: any) => ({...f, partsCost: e.target.value}))} disabled={!canEditRates} />
                    </td>
                  )}
                  {canSeeBilling && (
                    <td className="px-2 py-1">
                      <Input className="h-7 text-xs w-16 ml-auto" type="number" step="0.01" value={itemEdit.totalCost} onChange={e => setItemEdit((f: any) => ({...f, totalCost: e.target.value}))} disabled={!canEditRates} />
                    </td>
                  )}
                  <td className="px-2 py-1 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-600" onClick={() => {
                        const mutateData: any = { id: item.id, workOrderId, description: itemEdit.description, laborHours: itemEdit.laborHours };
                        if (canEditRates) {
                          mutateData.laborRate = itemEdit.laborRate;
                          mutateData.partsCost = itemEdit.partsCost;
                          mutateData.totalCost = itemEdit.totalCost;
                        }
                        updateItemMutation.mutate(mutateData);
                      }}><Save className="h-3 w-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingItemId(null)}><X className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className="border-t hover:bg-muted/30 cursor-pointer" onDoubleClick={() => startEditItem(item)}>
                  <td className="px-3 py-2">{item.description}{item.needsSourceOut && <Badge variant="outline" className="ml-2 text-xs">Source Out</Badge>}</td>
                  <td className="px-3 py-2 text-right">{item.laborHours || "-"}</td>
                  {canSeeBilling && <td className="px-3 py-2 text-right">{item.laborRate ? `$${item.laborRate}` : "-"}</td>}
                  {canSeeBilling && <td className="px-3 py-2 text-right">{item.partsCost ? `$${item.partsCost}` : "-"}</td>}
                  {canSeeBilling && <td className="px-3 py-2 text-right font-medium">{item.totalCost ? `$${item.totalCost}` : "-"}</td>}
                  <td className="px-3 py-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-500 hover:text-blue-700" onClick={() => startEditItem(item)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={() => onDeleteItem(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground px-3 py-1 border-t bg-muted/20">Double-click a row or click the pencil icon to edit</p>
      </div>
    </div>
  );
}

function WorkOrderEditHistory({ workOrderId }: { workOrderId: number }) {
  const { data: history, isLoading } = trpc.workOrder.editHistory.useQuery({ workOrderId });
  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!history || history.length === 0) return (
    <div className="border rounded-lg p-3 bg-muted/20">
      <p className="text-xs text-muted-foreground">No edit history yet.</p>
    </div>
  );
  return (
    <div className="border rounded-lg p-3 bg-muted/20 space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Edit History</p>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {history.map((edit: any) => (
          <div key={edit.id} className="flex items-start gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <div className="flex-1">
              <span className="font-medium">{edit.userName || "System"}</span>{" "}
              <span className="text-muted-foreground">{edit.description}</span>
            </div>
            <span className="text-muted-foreground shrink-0">{new Date(edit.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WOMediaDialog({ workOrderId, open, onOpenChange }: { workOrderId: number | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: photos, isLoading } = trpc.photo.listByWorkOrder.useQuery({ workOrderId: workOrderId || 0 }, { enabled: !!workOrderId });
  const trpcUtils = trpc.useUtils();
  const uploadMutation = trpc.photo.upload.useMutation({
    onSuccess: () => trpcUtils.photo.listByWorkOrder.invalidate({ workOrderId: workOrderId || 0 }),
  });
  const deleteMutation = trpc.photo.delete.useMutation({
    onSuccess: () => trpcUtils.photo.listByWorkOrder.invalidate({ workOrderId: workOrderId || 0 }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Work Order Media (WO-{workOrderId})</DialogTitle></DialogHeader>
        <MediaUpload
          media={(photos || []).map((p: any) => ({ id: p.id, mediaUrl: p.photoUrl, mediaType: p.mediaType || "photo", photoType: p.photoType, caption: p.caption, createdAt: p.createdAt }))}
          isLoading={isLoading}
          onUpload={async (data) => {
            if (!workOrderId) return;
            await uploadMutation.mutateAsync({ workOrderId, photoData: data.mediaData, mediaType: data.mediaType, photoType: (data.photoType as any) || "evidence", caption: data.caption, fileName: data.fileName });
          }}
          onDelete={async (id) => {
            await deleteMutation.mutateAsync({ id });
          }}
          showPhotoType
          photoTypeOptions={[
            { value: "before", label: "Before" },
            { value: "after", label: "After" },
            { value: "evidence", label: "Evidence" },
            { value: "other", label: "Other" },
          ]}
          title="Photos & Videos"
        />
      </DialogContent>
    </Dialog>
  );
}
