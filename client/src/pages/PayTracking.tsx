import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { DollarSign, Plus, Users, Calendar } from "lucide-react";

export default function PayTracking() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const isAdmin = user?.role === "admin" || isOwner;
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);

  // Rate form
  const [rateType, setRateType] = useState("hourly");
  const [rate, setRate] = useState("");
  const [overtimeRate, setOvertimeRate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);

  // Period form
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [regularHours, setRegularHours] = useState("");
  const [overtimeHours, setOvertimeHours] = useState("");
  const [grossPay, setGrossPay] = useState("");
  const [deductions, setDeductions] = useState("");
  const [netPay, setNetPay] = useState("");

  const { data: allUsers = [] } = trpc.user.list.useQuery(undefined, { enabled: isAdmin });
  const { data: payRate } = trpc.pay.getRate.useQuery(
    { userId: selectedUserId ? parseInt(selectedUserId) : user!.id },
    { enabled: !!user }
  );
  const { data: periods = [], refetch: refetchPeriods } = trpc.pay.periods.useQuery(
    selectedUserId ? { userId: parseInt(selectedUserId) } : {},
    { enabled: isAdmin }
  );

  const setRateMut = trpc.pay.setRate.useMutation({
    onSuccess: () => { setRateDialogOpen(false); toast.success("Pay rate updated!"); },
  });
  const createPeriod = trpc.pay.createPeriod.useMutation({
    onSuccess: () => { refetchPeriods(); setPeriodDialogOpen(false); toast.success("Pay period created!"); },
  });

  const techUsers = (allUsers as any[]).filter((u: any) => ["technician", "admin", "owner"].includes(u.role));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pay Tracking</h1>
          <p className="text-muted-foreground mt-1">Manage pay rates and periods for techs, admins, and owners</p>
        </div>
      </div>

      {/* User Selector */}
      {isAdmin && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select team member..." />
                </SelectTrigger>
                <SelectContent>
                  {techUsers.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isOwner && selectedUserId && (
                <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"><DollarSign className="h-4 w-4 mr-1" /> Set Rate</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Set Pay Rate</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Rate Type</Label>
                        <Select value={rateType} onValueChange={setRateType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly</SelectItem>
                            <SelectItem value="salary">Salary</SelectItem>
                            <SelectItem value="commission">Commission</SelectItem>
                            <SelectItem value="flat">Flat Rate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Rate ($)</Label>
                          <Input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="25.00" />
                        </div>
                        <div className="space-y-2">
                          <Label>Overtime Rate ($)</Label>
                          <Input type="number" step="0.01" value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value)} placeholder="37.50" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Effective Date</Label>
                        <Input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => setRateMut.mutate({
                          userId: parseInt(selectedUserId),
                          rateType: rateType as any,
                          rate,
                          overtimeRate: overtimeRate || undefined,
                          effectiveDate,
                        })}
                        disabled={!rate || setRateMut.isPending}
                      >
                        Save Rate
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {isOwner && selectedUserId && (
                <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Pay Period</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Pay Period</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Period Start</Label>
                          <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Period End</Label>
                          <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Regular Hours</Label>
                          <Input type="number" step="0.01" value={regularHours} onChange={(e) => setRegularHours(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Overtime Hours</Label>
                          <Input type="number" step="0.01" value={overtimeHours} onChange={(e) => setOvertimeHours(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Gross Pay</Label>
                          <Input type="number" step="0.01" value={grossPay} onChange={(e) => setGrossPay(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Deductions</Label>
                          <Input type="number" step="0.01" value={deductions} onChange={(e) => setDeductions(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Net Pay</Label>
                          <Input type="number" step="0.01" value={netPay} onChange={(e) => setNetPay(e.target.value)} />
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => createPeriod.mutate({
                          userId: parseInt(selectedUserId),
                          periodStart, periodEnd,
                          regularHours, overtimeHours: overtimeHours || undefined,
                          grossPay, deductions: deductions || undefined, netPay,
                        })}
                        disabled={!periodStart || !periodEnd || !grossPay || !netPay || createPeriod.isPending}
                      >
                        Create Pay Period
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Rate Display */}
      {payRate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Current Pay Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Type</p>
                <p className="text-lg font-semibold capitalize">{payRate.rateType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Rate</p>
                <p className="text-lg font-semibold">${parseFloat(payRate.rate).toFixed(2)}{payRate.rateType === "hourly" ? "/hr" : ""}</p>
              </div>
              {payRate.overtimeRate && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Overtime</p>
                  <p className="text-lg font-semibold">${parseFloat(payRate.overtimeRate).toFixed(2)}/hr</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground uppercase">Effective</p>
                <p className="text-lg font-semibold">{new Date(payRate.effectiveDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pay Periods */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Pay Periods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(periods as any[]).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No pay periods recorded yet.</p>
              )}
              {(periods as any[]).map((period: any) => (
                <div key={period.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(period.periodStart).toLocaleDateString()} — {new Date(period.periodEnd).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {parseFloat(period.regularHours || "0").toFixed(1)}h regular
                      {parseFloat(period.overtimeHours || "0") > 0 && ` + ${parseFloat(period.overtimeHours).toFixed(1)}h OT`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">${parseFloat(period.netPay).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Gross: ${parseFloat(period.grossPay).toFixed(2)}</p>
                  </div>
                  <Badge variant={period.status === "paid" ? "default" : period.status === "approved" ? "secondary" : "outline"}>
                    {period.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
