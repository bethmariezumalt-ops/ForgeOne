import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wrench, Camera, Trash2, Image, Video } from "lucide-react";
import { MediaUpload } from "@/components/MediaUpload";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BUILDING_SERVICE_CATEGORIES, PRIORITY_CONFIG } from "@shared/serviceCategories";

export default function GeneralWork() {
  const { data: workOrders, isLoading, refetch } = trpc.workOrder.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const createMutation = trpc.workOrder.create.useMutation({ onSuccess: (data) => { refetch(); setCreatedWorkOrderId(data?.id || null); if (photos.length > 0) { uploadPhotos(data?.id); } else { setOpen(false); toast.success("Work order created"); } } });
  const photoUploadMutation = trpc.photo.upload.useMutation();
  const [open, setOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<number | null>(null);
  const [createdWorkOrderId, setCreatedWorkOrderId] = useState<number | null>(null);
  const [photos, setPhotos] = useState<{ data: string; name: string; caption: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    clientId: "", priority: "medium", workDescription: "", chargeAmount: "", notes: "", buildingLocation: "", serviceType: "",
  });

  // Filter to only non-vehicle work orders
  const generalOrders = workOrders?.filter(wo => wo.orderType === "building" || wo.orderType === "general") ?? [];

  const handleCreate = () => {
    if (!form.clientId) { toast.error("Please select a client"); return; }
    if (!form.workDescription) { toast.error("Please describe the work"); return; }
    createMutation.mutate({
      clientId: parseInt(form.clientId),
      orderType: "building",
      priority: form.priority as any,
      businessLine: "onsite_advantage",
      workDescription: form.workDescription,
      chargeAmount: form.chargeAmount || undefined,
      notes: form.notes || undefined,
      buildingLocation: form.buildingLocation || undefined,
    });
  };

  const uploadPhotos = async (workOrderId: number | null | undefined) => {
    if (!workOrderId) { setOpen(false); return; }
    try {
      for (const photo of photos) {
        await photoUploadMutation.mutateAsync({
          workOrderId,
          photoData: photo.data,
          caption: photo.caption || undefined,
          photoType: "evidence",
          fileName: photo.name,
        });
      }
      toast.success(`Work order created with ${photos.length} photo(s)`);
      setPhotos([]);
      setOpen(false);
    } catch (e) {
      toast.error("Work order created but some photos failed to upload");
      setOpen(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setPhotos(prev => [...prev, { data: base64, name: file.name, caption: "" }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">On-Site Advantage</h1>
          <p className="text-muted-foreground mt-1">Building maintenance, plumbing, sign hanging, and all non-vehicle work</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Job</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Building/General Work Order</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Client *</Label>
                  <Select value={form.clientId} onValueChange={v => setForm(f => ({...f, clientId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
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
                <Label>Service Type</Label>
                <Select value={form.serviceType} onValueChange={v => setForm(f => ({...f, serviceType: v}))}>
                  <SelectTrigger><SelectValue placeholder="Select type of work" /></SelectTrigger>
                  <SelectContent>
                    {BUILDING_SERVICE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.buildingLocation} onChange={e => setForm(f => ({...f, buildingLocation: e.target.value}))} placeholder="Building/site address" />
              </div>
              <div>
                <Label>Work Description *</Label>
                <Textarea value={form.workDescription} onChange={e => setForm(f => ({...f, workDescription: e.target.value}))} placeholder="Describe what you were hired to do..." rows={3} />
              </div>
              <div>
                <Label>Charge Amount ($)</Label>
                <Input type="number" step="0.01" value={form.chargeAmount} onChange={e => setForm(f => ({...f, chargeAmount: e.target.value}))} placeholder="How much to charge" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Additional notes..." />
              </div>

              {/* Photo Upload Section */}
              <div className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2"><Camera className="h-4 w-4" />Photos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Plus className="h-3 w-3 mr-1" />Add Photo
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handlePhotoSelect} />
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative group">
                        <img src={`data:image/jpeg;base64,${photo.data}`} alt={photo.name} className="w-full h-20 object-cover rounded" />
                        <button onClick={() => removePhoto(idx)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {photos.length === 0 && <p className="text-xs text-muted-foreground">Take photos of the job site or work completed</p>}
              </div>

              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Creating..." : `Create Work Order${photos.length > 0 ? ` (${photos.length} photo${photos.length > 1 ? 's' : ''})` : ''}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {generalOrders.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <Wrench className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            No general work orders yet. Tap "New Job" to create one.
          </CardContent></Card>
        ) : (
          generalOrders.map((wo: any) => (
            <Card key={wo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" style={{
                      color: PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.color,
                      backgroundColor: PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.bgColor,
                    }}>
                      {wo.priority}
                    </Badge>
                    <div>
                      <p className="font-medium">{wo.workDescription || `Job #${wo.id}`}</p>
                      <p className="text-xs text-muted-foreground">{wo.buildingLocation || "No location"}</p>
                      {wo.chargeAmount && <p className="text-sm text-green-600 font-medium">${wo.chargeAmount}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedWorkOrder(wo.id); setPhotoDialogOpen(true); }}>
                      <Image className="h-4 w-4" />
                    </Button>
                    <Badge variant={wo.status === "completed" ? "default" : "secondary"}>
                      {wo.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Photo Viewer Dialog */}
      <PhotoViewerDialog workOrderId={selectedWorkOrder} open={photoDialogOpen} onOpenChange={setPhotoDialogOpen} />
    </div>
  );
}

function PhotoViewerDialog({ workOrderId, open, onOpenChange }: { workOrderId: number | null; open: boolean; onOpenChange: (v: boolean) => void }) {
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
        <DialogHeader><DialogTitle>Job Media</DialogTitle></DialogHeader>
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
          title="Job Photos & Videos"
        />
      </DialogContent>
    </Dialog>
  );
}
