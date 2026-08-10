import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { GripVertical, Car, Wrench, Clock, User, DollarSign, Pencil, X, Save } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

const STATUS_COLUMNS = [
  { id: "draft", label: "Draft", color: "bg-gray-100 border-gray-300" },
  { id: "pending_approval", label: "Pending", color: "bg-yellow-50 border-yellow-300" },
  { id: "approved", label: "Approved", color: "bg-blue-50 border-blue-300" },
  { id: "in_progress", label: "In Progress", color: "bg-indigo-50 border-indigo-300" },
  { id: "completed", label: "Completed", color: "bg-green-50 border-green-300" },
  { id: "denied", label: "Denied", color: "bg-red-50 border-red-300" },
];

const BUSINESS_COLUMNS = [
  { id: "acme_automotive", label: "Acme Automotive", color: "bg-blue-50 border-blue-300" },
  { id: "customized_enterprise", label: "Customized Enterprise", color: "bg-purple-50 border-purple-300" },
  { id: "onsite_advantage", label: "On-Site Advantage", color: "bg-emerald-50 border-emerald-300" },
];

const BUSINESS_LINE_LABELS: Record<string, string> = {
  acme_automotive: "Acme Auto",
  customized_enterprise: "Customized",
  onsite_advantage: "On-Site",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending",
  approved: "Approved",
  in_progress: "In Progress",
  completed: "Completed",
  denied: "Denied",
};

function DroppableColumn({ id, label, color, children, count }: { id: string; label: string; color: string; children: React.ReactNode; count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 ${color} ${isOver ? "ring-2 ring-primary ring-offset-2" : ""} transition-all`}
    >
      <div className="p-3 border-b font-semibold text-sm flex items-center justify-between">
        <span className="text-base">{label}</span>
        <Badge variant="secondary">{count}</Badge>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {children}
      </div>
      {count === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">Drop jobs here</div>
      )}
    </div>
  );
}

function DraggableJobCard({ job, onClick }: { job: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `job-${job.id}`,
    data: { job },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? "shadow-lg" : ""}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div {...listeners} className="mt-1 text-muted-foreground hover:text-foreground">
              <GripVertical className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
              <div className="flex items-center gap-1 mb-1 flex-wrap">
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {BUSINESS_LINE_LABELS[job.businessLine] || job.businessLine}
                </Badge>
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {STATUS_LABELS[job.status] || job.status}
                </Badge>
                {job.priority === "emergency" && <Badge className="bg-red-500 text-[10px]">Emergency</Badge>}
                {job.priority === "high" && <Badge className="bg-orange-500 text-[10px]">High</Badge>}
              </div>
              <p className="text-sm font-medium truncate">{job.workDescription || "Untitled Job"}</p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                {job.vehicleId && <span className="flex items-center gap-0.5"><Car className="w-3 h-3" /></span>}
                {job.technicianId && <span className="flex items-center gap-0.5"><User className="w-3 h-3" /></span>}
                {job.chargeAmount && <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" />${job.chargeAmount}</span>}
                {(job.billedHours || job.actualHours) && <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{job.actualHours || job.billedHours}h</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function JobCardOverlay({ job }: { job: any }) {
  return (
    <Card className="shadow-xl border-primary cursor-grabbing w-[280px]">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 mt-1 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <Badge variant="outline" className="text-xs">
                {BUSINESS_LINE_LABELS[job.businessLine] || job.businessLine}
              </Badge>
            </div>
            <p className="text-sm font-medium truncate">{job.workDescription || "Untitled Job"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Job Detail Dialog
function JobDetailDialog({ job, open, onClose, onSave }: { job: any; open: boolean; onClose: () => void; onSave: () => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    workDescription: job?.workDescription || "",
    notes: job?.notes || "",
    priority: job?.priority || "medium",
    chargeAmount: job?.chargeAmount || "",
    businessLine: job?.businessLine || "acme_automotive",
    status: job?.status || "draft",
  });

  const updateMutation = trpc.workOrder.update.useMutation({
    onSuccess: () => { toast.success("Job updated"); setEditing(false); onSave(); },
    onError: (err) => toast.error(err.message),
  });

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Work Order #{job.id}</span>
            {!editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />Edit
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="space-y-3">
            <div>
              <Label>Description</Label>
              <Textarea value={form.workDescription} onChange={e => setForm(f => ({...f, workDescription: e.target.value}))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <Label>Charge Amount</Label>
                <Input value={form.chargeAmount} onChange={e => setForm(f => ({...f, chargeAmount: e.target.value}))} placeholder="0.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({...f, status: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_COLUMNS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => updateMutation.mutate({ id: job.id, ...form })} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-1" />{updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800">{BUSINESS_LINE_LABELS[job.businessLine]}</Badge>
              <Badge className="bg-gray-100 text-gray-800">{STATUS_LABELS[job.status]}</Badge>
              <Badge className={job.priority === "emergency" ? "bg-red-100 text-red-800" : job.priority === "high" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"}>
                {job.priority}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm">{job.workDescription || "No description"}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {job.chargeAmount && (
                <div><p className="text-muted-foreground">Charge</p><p className="font-medium">${job.chargeAmount}</p></div>
              )}
              {job.billedHours && (
                <div><p className="text-muted-foreground">Billed Hours</p><p className="font-medium">{job.billedHours}h</p></div>
              )}
              {job.actualHours && (
                <div><p className="text-muted-foreground">Actual Hours</p><p className="font-medium">{job.actualHours}h</p></div>
              )}
              {job.hourlyRate && (
                <div><p className="text-muted-foreground">Rate</p><p className="font-medium">${job.hourlyRate}/hr</p></div>
              )}
            </div>
            {job.notes && (
              <div><p className="text-sm font-medium text-muted-foreground">Notes</p><p className="text-sm">{job.notes}</p></div>
            )}
            <div className="text-xs text-muted-foreground">
              Created: {new Date(job.createdAt).toLocaleString()}
              {job.completedAt && <> • Completed: {new Date(job.completedAt).toLocaleString()}</>}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function JobBoard() {
  const [boardMode, setBoardMode] = useState<"status" | "business">("status");
  const [filterBusiness, setFilterBusiness] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeJob, setActiveJob] = useState<any>(null);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const { data: workOrders, refetch } = trpc.workOrder.list.useQuery();
  const updateStatusMutation = trpc.workOrder.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast.success("Job moved"); },
    onError: (err) => toast.error(err.message),
  });
  const updateBusinessLineMutation = trpc.workOrder.updateBusinessLine.useMutation({
    onSuccess: () => { refetch(); toast.success("Job moved to new business line"); },
    onError: (err) => toast.error(err.message),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const filteredOrders = useMemo(() => {
    if (!workOrders) return [];
    let result = workOrders as any[];
    if (filterBusiness !== "all") result = result.filter((wo: any) => wo.businessLine === filterBusiness);
    if (filterStatus !== "all") result = result.filter((wo: any) => wo.status === filterStatus);
    return result;
  }, [workOrders, filterBusiness, filterStatus]);

  const ordersByStatus = useMemo(() => {
    const map: Record<string, any[]> = {};
    STATUS_COLUMNS.forEach(col => { map[col.id] = []; });
    filteredOrders.forEach((wo: any) => {
      if (map[wo.status]) map[wo.status].push(wo);
    });
    return map;
  }, [filteredOrders]);

  const ordersByBusiness = useMemo(() => {
    const map: Record<string, any[]> = {};
    BUSINESS_COLUMNS.forEach(col => { map[col.id] = []; });
    filteredOrders.forEach((wo: any) => {
      if (map[wo.businessLine]) map[wo.businessLine].push(wo);
    });
    return map;
  }, [filteredOrders]);

  function handleDragStart(event: DragStartEvent) {
    const job = (event.active.data.current as any)?.job;
    setActiveJob(job);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveJob(null);
    const { active, over } = event;
    if (!over) return;

    const job = (active.data.current as any)?.job;
    if (!job) return;

    const targetId = over.id as string;

    if (boardMode === "status") {
      if (targetId === job.status) return;
      if (!STATUS_COLUMNS.find(col => col.id === targetId)) return;
      updateStatusMutation.mutate({ id: job.id, status: targetId as any });
    } else {
      if (targetId === job.businessLine) return;
      if (!BUSINESS_COLUMNS.find(col => col.id === targetId)) return;
      updateBusinessLineMutation.mutate({ id: job.id, businessLine: targetId as any });
    }
  }

  const columns = boardMode === "status" ? STATUS_COLUMNS : BUSINESS_COLUMNS;
  const ordersMap = boardMode === "status" ? ordersByStatus : ordersByBusiness;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Job Board</h1>
          <p className="text-muted-foreground text-sm">Drag jobs between columns. Click a job to view/edit details.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={boardMode} onValueChange={(v) => setBoardMode(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="status" className="text-xs h-7">By Status</TabsTrigger>
              <TabsTrigger value="business" className="text-xs h-7">By Business Line</TabsTrigger>
            </TabsList>
          </Tabs>
          {boardMode === "status" && (
            <Select value={filterBusiness} onValueChange={setFilterBusiness}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Filter Business" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Business Lines</SelectItem>
                <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
                <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
                <SelectItem value="onsite_advantage">On-Site Advantage</SelectItem>
              </SelectContent>
            </Select>
          )}
          {boardMode === "business" && (
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUS_COLUMNS.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {columns.map(col => (
            <DroppableColumn key={col.id} id={col.id} label={col.label} color={col.color} count={ordersMap[col.id]?.length || 0}>
              {ordersMap[col.id]?.map((job: any) => (
                <DraggableJobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
              ))}
            </DroppableColumn>
          ))}
        </div>

        <DragOverlay>
          {activeJob ? <JobCardOverlay job={activeJob} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Job Detail Dialog */}
      <JobDetailDialog
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onSave={() => { refetch(); setSelectedJob(null); }}
      />
    </div>
  );
}
