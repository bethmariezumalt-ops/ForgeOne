import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Inventory() {
  const { data: items, isLoading, refetch } = trpc.inventory.list.useQuery();
  const createMutation = trpc.inventory.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Item added"); } });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ itemName: "", partNumber: "", category: "other" as string, quantityOnHand: "0", reorderLevel: "2", costPerUnit: "", vendor: "" });

  const handleCreate = () => {
    if (!form.itemName) { toast.error("Item name required"); return; }
    createMutation.mutate({
      itemName: form.itemName,
      partNumber: form.partNumber || undefined,
      category: form.category as any,
      quantityOnHand: parseInt(form.quantityOnHand) || 0,
      reorderLevel: parseInt(form.reorderLevel) || 2,
      costPerUnit: form.costPerUnit || undefined,
      vendor: form.vendor || undefined,
    });
  };

  const lowStock = items?.filter((i: any) => (i.quantityOnHand ?? 0) <= (i.reorderLevel ?? 2)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground mt-1">{items?.length ?? 0} items tracked</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Inventory Item</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Item Name *</Label><Input value={form.itemName} onChange={e => setForm(f => ({...f, itemName: e.target.value}))} placeholder="e.g., 5W-30 Motor Oil" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Part Number</Label><Input value={form.partNumber} onChange={e => setForm(f => ({...f, partNumber: e.target.value}))} /></div>
                <div><Label>Vendor</Label><Input value={form.vendor} onChange={e => setForm(f => ({...f, vendor: e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Quantity</Label><Input type="number" value={form.quantityOnHand} onChange={e => setForm(f => ({...f, quantityOnHand: e.target.value}))} /></div>
                <div><Label>Reorder Level</Label><Input type="number" value={form.reorderLevel} onChange={e => setForm(f => ({...f, reorderLevel: e.target.value}))} /></div>
                <div><Label>Unit Cost ($)</Label><Input type="number" step="0.01" value={form.costPerUnit} onChange={e => setForm(f => ({...f, costPerUnit: e.target.value}))} /></div>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <p className="font-medium text-orange-800">{lowStock.length} item{lowStock.length > 1 ? "s" : ""} low on stock</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {lowStock.map((i: any) => <Badge key={i.id} variant="outline" className="text-orange-700">{i.itemName} ({i.quantityOnHand})</Badge>)}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items?.length === 0 ? (
          <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">No inventory items yet</CardContent></Card>
        ) : (
          items?.map((item: any) => (
            <Card key={item.id} className={`${item.quantity <= item.minQuantity ? "border-orange-200" : ""}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.itemName}</p>
                      {item.partNumber && <p className="text-xs text-muted-foreground">{item.partNumber}</p>}
                    </div>
                  </div>
                  <Badge variant={(item.quantityOnHand ?? 0) <= (item.reorderLevel ?? 2) ? "destructive" : "secondary"}>
                    {item.quantityOnHand ?? 0} in stock
                  </Badge>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  {item.costPerUnit && <span>${item.costPerUnit}/unit</span>}
                  {item.vendor && <span>{item.vendor}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
