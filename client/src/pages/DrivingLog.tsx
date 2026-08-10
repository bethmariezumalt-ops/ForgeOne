import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function DrivingLog() {
  const { data: logs, isLoading, refetch } = trpc.driving.list.useQuery();
  const createMutation = trpc.driving.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Drive logged"); } });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], startMileage: "", endMileage: "", fromLocation: "", toLocation: "", notes: "", hoursWorked: "" });

  const handleCreate = () => {
    if (!form.date) { toast.error("Date required"); return; }
    createMutation.mutate({
      date: form.date,
      startMileage: form.startMileage ? parseInt(form.startMileage) : undefined,
      endMileage: form.endMileage ? parseInt(form.endMileage) : undefined,
      fromLocation: form.fromLocation || undefined,
      toLocation: form.toLocation || undefined,
      notes: form.notes || undefined,
      hoursWorked: form.hoursWorked || undefined,
    });
  };

  const totalMiles = logs?.reduce((sum: number, l: any) => sum + ((l.endMileage || 0) - (l.startMileage || 0)), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driving Log</h1>
          <p className="text-muted-foreground mt-1">{totalMiles.toLocaleString()} total miles logged</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Log Drive</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Driving Hours</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} /></div>
                <div><Label>Hours Worked</Label><Input type="number" step="0.5" value={form.hoursWorked} onChange={e => setForm(f => ({...f, hoursWorked: e.target.value}))} placeholder="8" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Mileage</Label><Input type="number" value={form.startMileage} onChange={e => setForm(f => ({...f, startMileage: e.target.value}))} /></div>
                <div><Label>End Mileage</Label><Input type="number" value={form.endMileage} onChange={e => setForm(f => ({...f, endMileage: e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>From</Label><Input value={form.fromLocation} onChange={e => setForm(f => ({...f, fromLocation: e.target.value}))} placeholder="Home" /></div>
                <div><Label>To</Label><Input value={form.toLocation} onChange={e => setForm(f => ({...f, toLocation: e.target.value}))} placeholder="Client site" /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Driving to Fisher Tile for brake job" /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Logging..." : "Log Drive"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {(!logs || logs.length === 0) ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No driving logs yet</CardContent></Card>
        ) : (
          logs.map((log: any) => (
            <Card key={log.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{log.date}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.fromLocation && log.toLocation ? `${log.fromLocation} → ${log.toLocation}` : log.notes || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {log.startMileage && log.endMileage && (
                      <p className="font-medium text-sm">{(log.endMileage - log.startMileage).toLocaleString()} mi</p>
                    )}
                    {log.hoursWorked && <p className="text-xs text-muted-foreground">{log.hoursWorked}h</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
