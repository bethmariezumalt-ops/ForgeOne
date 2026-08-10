import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-indigo-100 text-indigo-800",
  quoted: "bg-amber-100 text-amber-800",
  scheduled: "bg-purple-100 text-purple-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
};

interface BranchInquiriesProps {
  branchKey: string;
  branchName: string;
  branchColor: string;
}

export default function BranchInquiries({ branchKey, branchName, branchColor }: BranchInquiriesProps) {
  const { data: inquiries, isLoading, refetch } = trpc.inquiry.list.useQuery();
  const createMutation = trpc.inquiry.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Inquiry created"); } });
  const updateMutation = trpc.inquiry.update.useMutation({ onSuccess: () => { refetch(); toast.success("Status updated"); } });

  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", source: "advertising", serviceNeeded: "", notes: "" });

  // Filter inquiries to this branch
  const branchInquiries = inquiries?.filter((inq: any) => inq.businessLine === branchKey) ?? [];

  const handleCreate = () => {
    createMutation.mutate({
      name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      source: form.source,
      serviceNeeded: form.serviceNeeded,
      businessLine: branchKey,
      notes: form.notes || undefined,
    });
  };

  const updateStatus = (id: number, status: string) => {
    updateMutation.mutate({ id, status: status as any });
  };

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{branchName} — Inquiries</h1>
          <p className="text-muted-foreground mt-1">{branchInquiries.length} inquiries from advertising & referrals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className={branchColor}><Plus className="h-4 w-4 mr-2" />New Inquiry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New {branchName} Inquiry</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Contact Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Prospect name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} /></div>
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({...f, source: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="advertising">Advertising</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="walk_in">Walk-In</SelectItem>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Service Needed *</Label><Textarea value={form.serviceNeeded} onChange={e => setForm(f => ({...f, serviceNeeded: e.target.value}))} placeholder="What they need done" /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Additional notes" /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending || !form.name || !form.serviceNeeded} className="w-full">
                {createMutation.isPending ? "Creating..." : "Add Inquiry"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inquiry Pipeline */}
      <div className="flex gap-2 flex-wrap">
        {["new", "contacted", "quoted", "scheduled", "converted", "lost"].map(s => {
          const count = branchInquiries.filter((i: any) => i.status === s).length;
          return (
            <Badge key={s} variant="outline" className="capitalize">
              {s}: {count}
            </Badge>
          );
        })}
      </div>

      {/* Inquiry List */}
      <div className="space-y-3">
        {branchInquiries.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            No inquiries for {branchName} yet. Add one when a prospect reaches out.
          </CardContent></Card>
        ) : (
          branchInquiries.map((inq: any) => {
            const isExpanded = expandedId === inq.id;
            return (
              <Card key={inq.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4" onClick={() => setExpandedId(isExpanded ? null : inq.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">{inq.name}</p>
                        <p className="text-sm text-muted-foreground">{inq.serviceNeeded?.slice(0, 60) || "No description"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[inq.status] || "bg-gray-100"}>{inq.status}</Badge>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t" onClick={e => e.stopPropagation()}>
                      <div className="space-y-2 text-sm">
                        {inq.email && <p><span className="text-muted-foreground">Email:</span> {inq.email}</p>}
                        {inq.phone && <p><span className="text-muted-foreground">Phone:</span> {inq.phone}</p>}
                        <p><span className="text-muted-foreground">Source:</span> <span className="capitalize">{inq.source?.replace("_", " ")}</span></p>
                        <p><span className="text-muted-foreground">Service Needed:</span> {inq.serviceNeeded}</p>
                        {inq.notes && <p><span className="text-muted-foreground">Notes:</span> {inq.notes}</p>}
                        <p><span className="text-muted-foreground">Created:</span> {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : "N/A"}</p>
                      </div>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {inq.status === "new" && <Button size="sm" variant="outline" onClick={() => updateStatus(inq.id, "contacted")}>Mark Contacted</Button>}
                        {inq.status === "contacted" && <Button size="sm" variant="outline" onClick={() => updateStatus(inq.id, "quoted")}>Mark Quoted</Button>}
                        {inq.status === "quoted" && <Button size="sm" variant="outline" onClick={() => updateStatus(inq.id, "scheduled")}>Mark Scheduled</Button>}
                        {inq.status === "scheduled" && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(inq.id, "converted")}>Convert to Client</Button>}
                        {!["converted", "lost"].includes(inq.status) && <Button size="sm" variant="destructive" onClick={() => updateStatus(inq.id, "lost")}>Mark Lost</Button>}
                      </div>
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
