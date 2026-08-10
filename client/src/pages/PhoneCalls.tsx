import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Phone, PhoneCall, PhoneOff, PhoneMissed, Plus, Search, X, Filter, Check, Clock, Calendar } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const OUTCOMES = [
  { value: "not_called", label: "Not Called Yet", icon: Phone, color: "text-blue-600" },
  { value: "reached", label: "Reached", icon: PhoneCall, color: "text-green-600" },
  { value: "voicemail", label: "Voicemail", icon: PhoneOff, color: "text-amber-600" },
  { value: "no_answer", label: "No Answer", icon: PhoneMissed, color: "text-red-600" },
  { value: "callback_requested", label: "Callback Requested", icon: Phone, color: "text-purple-600" },
];

const BUSINESS_LINES = [
  { value: "acme_automotive", label: "Acme Automotive" },
  { value: "customized_enterprise", label: "Customized Enterprise" },
  { value: "onsite_advantage", label: "On-Site Advantage" },
  { value: "real_estate", label: "Homes by Beth Marie" },
];

export default function PhoneCalls() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOutcome, setFilterOutcome] = useState<string>("all");
  const [filterBusiness, setFilterBusiness] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all"); // all, pending, completed
  const [showFilters, setShowFilters] = useState(false);

  // Create/Edit dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<any>(null);

  const [callForm, setCallForm] = useState({
    contactName: "", phoneNumber: "", clientId: "", direction: "outbound",
    outcome: "not_called", businessLine: "", followUpDate: "", notes: "",
  });
  const [editForm, setEditForm] = useState({
    outcome: "not_called", businessLine: "", followUpDate: "", notes: "", isCompleted: false,
  });

  // Build query filters
  const queryFilters = useMemo(() => {
    const filters: any = {};
    if (filterStatus === "pending") filters.isCompleted = false;
    if (filterStatus === "completed") filters.isCompleted = true;
    if (filterOutcome !== "all") filters.outcome = filterOutcome;
    if (filterBusiness !== "all") filters.businessLine = filterBusiness;
    if (searchQuery.trim()) filters.search = searchQuery.trim();
    return filters;
  }, [searchQuery, filterOutcome, filterBusiness, filterStatus]);

  const { data: phoneCalls = [], isLoading } = trpc.phoneCall.list.useQuery(queryFilters);
  const { data: clientsList } = trpc.clients.list.useQuery();
  const trpcUtils = trpc.useUtils();

  const createCall = trpc.phoneCall.create.useMutation({
    onSuccess: () => {
      trpcUtils.phoneCall.list.invalidate();
      trpcUtils.phoneCall.pendingFollowUps.invalidate();
      toast.success("Call logged");
      setCreateDialogOpen(false);
      resetCallForm();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateCall = trpc.phoneCall.update.useMutation({
    onSuccess: () => {
      trpcUtils.phoneCall.list.invalidate();
      trpcUtils.phoneCall.pendingFollowUps.invalidate();
      toast.success("Updated");
      setEditDialogOpen(false);
      setEditingCall(null);
    },
    onError: (e) => toast.error(e.message),
  });

  function resetCallForm() {
    setCallForm({ contactName: "", phoneNumber: "", clientId: "", direction: "outbound", outcome: "not_called", businessLine: "", followUpDate: "", notes: "" });
  }

  function handleCreateCall() {
    if (!callForm.contactName.trim()) { toast.error("Contact name required"); return; }
    createCall.mutate({
      contactName: callForm.contactName.trim(),
      phoneNumber: callForm.phoneNumber || undefined,
      clientId: callForm.clientId && callForm.clientId !== "none" ? Number(callForm.clientId) : undefined,
      direction: callForm.direction as any,
      outcome: callForm.outcome as any,
      businessLine: callForm.businessLine && callForm.businessLine !== "none" ? callForm.businessLine : undefined,
      followUpDate: callForm.followUpDate || undefined,
      notes: callForm.notes || undefined,
    });
  }

  function safeDateToLocal(d: any): string {
    if (!d) return "";
    try {
      const dt = d instanceof Date ? d : new Date(typeof d === "string" ? d.replace(" ", "T") : d);
      if (isNaN(dt.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    } catch { return ""; }
  }
  function safeDateDisplay(d: any): Date | null {
    if (!d) return null;
    try {
      const dt = d instanceof Date ? d : new Date(typeof d === "string" ? d.replace(" ", "T") : d);
      return isNaN(dt.getTime()) ? null : dt;
    } catch { return null; }
  }
  function openEditCall(call: any) {
    setEditingCall(call);
    setEditForm({
      outcome: call.outcome || "not_called",
      businessLine: call.businessLine || "",
      followUpDate: safeDateToLocal(call.followUpDate),
      notes: call.notes || "",
      isCompleted: call.isCompleted || false,
    });
    setEditDialogOpen(true);
  }

  function handleUpdateCall() {
    if (!editingCall) return;
    updateCall.mutate({
      id: editingCall.id,
      outcome: editForm.outcome as any,
      businessLine: editForm.businessLine || undefined,
      followUpDate: editForm.followUpDate || undefined,
      notes: editForm.notes || undefined,
      isCompleted: editForm.isCompleted,
    });
  }

  function clearFilters() {
    setSearchQuery("");
    setFilterOutcome("all");
    setFilterBusiness("all");
    setFilterStatus("all");
  }

  const hasActiveFilters = searchQuery || filterOutcome !== "all" || filterBusiness !== "all" || filterStatus !== "all";

  function getOutcomeConfig(outcome: string) {
    return OUTCOMES.find(o => o.value === outcome) || OUTCOMES[0];
  }

  return (
    <div className="container max-w-5xl py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="h-6 w-6 text-blue-600" />
            Phone Call Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and search all phone conversations
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetCallForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log Call
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Phone Call</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Contact Name *</Label>
                <Input value={callForm.contactName} onChange={e => setCallForm(f => ({...f, contactName: e.target.value}))} placeholder="Who to call..." />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input value={callForm.phoneNumber} onChange={e => setCallForm(f => ({...f, phoneNumber: e.target.value}))} placeholder="(555) 123-4567" />
              </div>
              <div>
                <Label>Client</Label>
                <Select value={callForm.clientId || "none"} onValueChange={v => setCallForm(f => ({...f, clientId: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select client..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client</SelectItem>
                    {clientsList?.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Direction</Label>
                <Select value={callForm.direction} onValueChange={v => setCallForm(f => ({...f, direction: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Outcome</Label>
                <Select value={callForm.outcome} onValueChange={v => setCallForm(f => ({...f, outcome: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OUTCOMES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Business Line</Label>
                <Select value={callForm.businessLine || "none"} onValueChange={v => setCallForm(f => ({...f, businessLine: v === "none" ? "" : v}))}>
                  <SelectTrigger><SelectValue placeholder="Select business..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    {BUSINESS_LINES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Follow-Up Date</Label>
                <Input type="datetime-local" value={callForm.followUpDate} onChange={e => setCallForm(f => ({...f, followUpDate: e.target.value}))} />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea value={callForm.notes} onChange={e => setCallForm(f => ({...f, notes: e.target.value}))} placeholder="Call notes..." rows={2} />
              </div>
            </div>
            <Button onClick={handleCreateCall} disabled={createCall.isPending} className="w-full mt-2">
              {createCall.isPending ? "Saving..." : "Log Call"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone number, or notes..."
                className="pl-9"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && <Badge variant="destructive" className="h-5 text-[10px] px-1.5">{[filterOutcome !== "all", filterBusiness !== "all", filterStatus !== "all"].filter(Boolean).length}</Badge>}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground">
                Clear all
              </Button>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Calls</SelectItem>
                    <SelectItem value="pending">Pending / Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Outcome</Label>
                <Select value={filterOutcome} onValueChange={setFilterOutcome}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Outcomes</SelectItem>
                    {OUTCOMES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Business Line</Label>
                <Select value={filterBusiness} onValueChange={setFilterBusiness}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Businesses</SelectItem>
                    {BUSINESS_LINES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{phoneCalls.length} call{phoneCalls.length !== 1 ? "s" : ""} found</span>
        {hasActiveFilters && <span className="text-xs">Filtered results</span>}
      </div>

      {/* Phone Calls List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="py-4"><div className="h-12 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : phoneCalls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {hasActiveFilters ? "No calls match your search criteria." : "No phone calls logged yet."}
            </p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">Clear filters</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {phoneCalls.map((call: any) => {
            const outcomeConfig = getOutcomeConfig(call.outcome);
            const OutcomeIcon = outcomeConfig.icon;
            const followUpDt = safeDateDisplay(call.followUpDate);
            const isOverdue = !call.isCompleted && followUpDt && followUpDt < new Date();
            const linkedClient = call.clientId ? clientsList?.find((c: any) => c.id === call.clientId) : null;
            const bizLabel = BUSINESS_LINES.find(b => b.value === call.businessLine)?.label;

            return (
              <Card
                key={call.id}
                className={`cursor-pointer hover:shadow-md transition-all hover:ring-1 hover:ring-primary/20 ${
                  call.isCompleted ? "opacity-70" : ""
                } ${isOverdue ? "border-red-200 bg-red-50/50" : ""}`}
                onClick={() => openEditCall(call)}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    {/* Outcome Icon */}
                    <div className={`mt-0.5 p-1.5 rounded-full bg-muted ${outcomeConfig.color}`}>
                      <OutcomeIcon className="h-4 w-4" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{call.contactName}</span>
                        {call.isCompleted && <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200">Completed</Badge>}
                        {isOverdue && <Badge variant="destructive" className="text-[10px] h-5">Overdue</Badge>}
                        {bizLabel && <Badge variant="secondary" className="text-[10px] h-5">{bizLabel}</Badge>}
                        <Badge variant="outline" className="text-[10px] h-5">{outcomeConfig.label}</Badge>
                        {call.direction && <Badge variant="outline" className="text-[10px] h-5 capitalize">{call.direction}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {call.phoneNumber && <span>{call.phoneNumber}</span>}
                        {linkedClient && <span className="text-blue-600">{linkedClient.name}</span>}
                        {followUpDt && (
                          <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                            <Clock className="h-3 w-3" />
                            {followUpDt.toLocaleDateString()} {followUpDt.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                          </span>
                        )}
                      </div>
                      {call.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{call.notes}</p>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!call.isCompleted && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => { e.stopPropagation(); updateCall.mutate({ id: call.id, isCompleted: true }); }}
                          title="Mark complete"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {safeDateDisplay(call.createdAt)?.toLocaleDateString() || ""}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditingCall(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Phone Call: {editingCall?.contactName}</DialogTitle>
          </DialogHeader>
          {editingCall && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 bg-muted/50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{editingCall.contactName}</span></div>
                    {editingCall.phoneNumber && <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{editingCall.phoneNumber}</span></div>}
                    {editingCall.direction && <div><span className="text-muted-foreground">Direction:</span> <span className="font-medium capitalize">{editingCall.direction}</span></div>}
                    {editingCall.createdAt && <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{safeDateDisplay(editingCall.createdAt)?.toLocaleDateString() || ""}</span></div>}
                  </div>
                </div>
                <div>
                  <Label>Outcome</Label>
                  <Select value={editForm.outcome} onValueChange={v => setEditForm(f => ({...f, outcome: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OUTCOMES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Business Line</Label>
                  <Select value={editForm.businessLine || "none"} onValueChange={v => setEditForm(f => ({...f, businessLine: v === "none" ? "" : v}))}>
                    <SelectTrigger><SelectValue placeholder="Select business..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General</SelectItem>
                      {BUSINESS_LINES.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Follow-Up Date</Label>
                  <Input type="datetime-local" value={editForm.followUpDate} onChange={e => setEditForm(f => ({...f, followUpDate: e.target.value}))} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editForm.isCompleted} onChange={e => setEditForm(f => ({...f, isCompleted: e.target.checked}))} className="rounded" />
                    <span className="text-sm">Mark Completed</span>
                  </label>
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={editForm.notes} onChange={e => setEditForm(f => ({...f, notes: e.target.value}))} placeholder="Call notes..." rows={3} />
                </div>
              </div>
              <Button onClick={handleUpdateCall} disabled={updateCall.isPending} className="w-full">
                {updateCall.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
