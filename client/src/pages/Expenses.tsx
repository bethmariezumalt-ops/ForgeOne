import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Receipt } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BUSINESS_LINES } from "@shared/serviceCategories";

export default function Expenses() {
  const { data: expenses, isLoading, refetch } = trpc.expense.list.useQuery();
  const createMutation = trpc.expense.create.useMutation({ onSuccess: () => { refetch(); setOpen(false); toast.success("Expense added"); } });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "fuel", businessLine: "acme_automotive", vendor: "", date: new Date().toISOString().split("T")[0] });

  const handleCreate = () => {
    if (!form.description || !form.amount) { toast.error("Description and amount required"); return; }
    createMutation.mutate({
      description: form.description,
      amount: form.amount,
      category: form.category as any,
      vendor: form.vendor || undefined,
      date: form.date,
      notes: form.businessLine ? `Business: ${form.businessLine}` : undefined,
    });
  };

  const totalExpenses = expenses?.reduce((sum: number, e: any) => sum + parseFloat(e.amount || "0"), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Business Expenses</h1>
          <p className="text-muted-foreground mt-1">Total: ${totalExpenses.toFixed(2)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Business Expense</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Description *</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="e.g., Oil for truck" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount ($) *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} /></div>
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="parts">Parts</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
                      <SelectItem value="vehicle_maintenance">Vehicle Maintenance</SelectItem>
                      <SelectItem value="insurance">Insurance</SelectItem>
                      <SelectItem value="supplies">Supplies</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Business Line</Label>
                  <Select value={form.businessLine} onValueChange={v => setForm(f => ({...f, businessLine: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
                      <SelectItem value="onsite_advantage">On-Site Advantage</SelectItem>
                      <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Vendor</Label><Input value={form.vendor} onChange={e => setForm(f => ({...f, vendor: e.target.value}))} placeholder="AutoZone, Home Depot, etc." /></div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? "Adding..." : "Add Expense"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {(!expenses || expenses.length === 0) ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No expenses recorded yet</CardContent></Card>
        ) : (
          expenses.map((exp: any) => (
            <Card key={exp.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-red-50 flex items-center justify-center">
                      <Receipt className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{exp.description}</p>
                      <p className="text-xs text-muted-foreground">{exp.date} • {exp.vendor || exp.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {BUSINESS_LINES[exp.businessLine as keyof typeof BUSINESS_LINES]?.label || exp.businessLine}
                    </Badge>
                    <span className="font-semibold text-red-600">-${exp.amount}</span>
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
