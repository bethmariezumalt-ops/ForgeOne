import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Hammer, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MediaUpload } from "@/components/MediaUpload";

export default function FlipProjects() {
  const { data: projects, isLoading, refetch } = trpc.flipProject.list.useQuery();
  const createMutation = trpc.flipProject.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Project added"); } });
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ itemDescription: "", projectType: "furniture", notes: "", purchaseCost: "", source: "", materialsCost: "" });

  const handleCreate = () => {
    if (!form.itemDescription || !form.purchaseCost) { toast.error("Description and purchase cost required"); return; }
    createMutation.mutate({
      itemDescription: form.itemDescription,
      projectType: form.projectType as any,
      purchaseCost: form.purchaseCost,
      source: form.source || undefined,
      materialsCost: form.materialsCost || undefined,
      notes: form.notes || undefined,
    });
  };

  const statusColors: Record<string, string> = {
    purchased: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    listed: "bg-purple-100 text-purple-800",
    sold: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Flip Projects</h1>
          <p className="text-muted-foreground mt-1">Customized Enterprise — Buy, Fix, Flip</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Flip Project</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Item Description *</Label><Input value={form.itemDescription} onChange={e => setForm(f => ({...f, itemDescription: e.target.value}))} placeholder="e.g., Oak Dresser from FB Marketplace" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.projectType} onValueChange={v => setForm(f => ({...f, projectType: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="house">House/Real Estate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Purchase Cost ($) *</Label><Input type="number" step="0.01" value={form.purchaseCost} onChange={e => setForm(f => ({...f, purchaseCost: e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Source</Label><Input value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))} placeholder="Facebook Marketplace, Craigslist" /></div>
                <div><Label>Materials Cost ($)</Label><Input type="number" step="0.01" value={form.materialsCost} onChange={e => setForm(f => ({...f, materialsCost: e.target.value}))} /></div>
              </div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Details about the item..." /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Project"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {(!projects || projects.length === 0) ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No flip projects yet. Start by adding something you want to flip!</CardContent></Card>
        ) : (
          projects.map((proj: any) => (
            <Card key={proj.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Hammer className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{proj.itemDescription}</p>
                      <p className="text-xs text-muted-foreground capitalize">{proj.projectType} • {proj.source || "Unknown source"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[proj.status] || ""} variant="outline">{proj.status?.replace(/_/g, " ")}</Badge>
                    <div className="text-right text-sm">
                      {proj.purchaseCost && <p className="text-muted-foreground">Bought: ${proj.purchaseCost}</p>}
                      {proj.salePrice && <p className="font-semibold text-green-600">Sold: ${proj.salePrice}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === proj.id ? null : proj.id)}
                    >
                      {expandedId === proj.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {proj.notes && <p className="text-xs text-muted-foreground mt-2 ml-12">{proj.notes}</p>}

                {/* Expanded Media Section */}
                {expandedId === proj.id && (
                  <div className="mt-4 pt-4 border-t">
                    <FlipProjectMediaSection flipProjectId={proj.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function FlipProjectMediaSection({ flipProjectId }: { flipProjectId: number }) {
  const { data: media, isLoading } = trpc.photo.listByFlipProject.useQuery({ flipProjectId });
  const trpcUtils = trpc.useUtils();
  const uploadMutation = trpc.photo.uploadFlipProjectMedia.useMutation({
    onSuccess: () => trpcUtils.photo.listByFlipProject.invalidate({ flipProjectId }),
  });
  const deleteMutation = trpc.photo.deleteFlipProjectMedia.useMutation({
    onSuccess: () => trpcUtils.photo.listByFlipProject.invalidate({ flipProjectId }),
  });

  return (
    <MediaUpload
      media={(media || []).map((m: any) => ({ id: m.id, mediaUrl: m.mediaUrl, mediaType: m.mediaType, photoType: m.photoType, caption: m.caption, createdAt: m.createdAt }))}
      isLoading={isLoading}
      onUpload={async (data) => {
        await uploadMutation.mutateAsync({
          flipProjectId,
          mediaData: data.mediaData,
          mediaType: data.mediaType,
          photoType: (data.photoType as any) || "other",
          caption: data.caption,
          fileName: data.fileName,
        });
      }}
      onDelete={async (id) => {
        await deleteMutation.mutateAsync({ id });
      }}
      showPhotoType
      photoTypeOptions={[
        { value: "before", label: "Before" },
        { value: "after", label: "After" },
        { value: "progress", label: "Progress" },
        { value: "other", label: "Other" },
      ]}
      title="Project Photos & Videos"
    />
  );
}
