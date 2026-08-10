import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Car, ClipboardList, AlertTriangle, DollarSign, Wrench, TrendingUp, Phone, Package, Megaphone, Clock, Calendar, BarChart3, Plus, Check, PhoneCall, PhoneOff, PhoneMissed, Trophy, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PRIORITY_CONFIG } from "@shared/serviceCategories";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { useViewAs } from "@/contexts/ViewAsContext";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { HourBankWidget } from "./HourBank";
import { TierBadge } from "./UserProfile";

function HourProfitabilityChart() {
  const { data: billingData } = trpc.workOrder.timeBilling.useQuery();
  const [, setLocation] = useLocation();

  const timeframeData = useMemo(() => {
    if (!billingData?.jobs) return [];
    const now = new Date();
    const jobs = billingData.jobs;

    const getJobsInRange = (startDate: Date, endDate: Date) => {
      return jobs.filter(j => {
        if (!j.completedAt) return false;
        const d = new Date(j.completedAt);
        return d >= startDate && d <= endDate;
      });
    };

    const calcRange = (rangeJobs: typeof jobs) => {
      const actual = rangeJobs.reduce((sum, j) => sum + j.actualHours, 0);
      const billed = rangeJobs.reduce((sum, j) => sum + j.billedHours, 0);
      const rate = rangeJobs.length > 0 ? rangeJobs.reduce((sum, j) => sum + j.hourlyRate, 0) / rangeJobs.length : 75;
      return { actual, billed, net: billed - actual, profit: (billed - actual) * rate };
    };

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    const quarterStart = new Date(now.getFullYear(), qMonth, 1);
    const quarterEnd = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59);
    const biStart = now.getMonth() < 6 ? new Date(now.getFullYear(), 0, 1) : new Date(now.getFullYear(), 6, 1);
    const biEnd = now.getMonth() < 6 ? new Date(now.getFullYear(), 5, 30, 23, 59, 59) : new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    return [
      { name: "Today", ...calcRange(getJobsInRange(todayStart, todayEnd)) },
      { name: "Week", ...calcRange(getJobsInRange(weekStart, weekEnd)) },
      { name: "Month", ...calcRange(getJobsInRange(monthStart, monthEnd)) },
      { name: "Quarter", ...calcRange(getJobsInRange(quarterStart, quarterEnd)) },
      { name: "Bi-Annual", ...calcRange(getJobsInRange(biStart, biEnd)) },
      { name: "Annual", ...calcRange(getJobsInRange(yearStart, yearEnd)) },
    ];
  }, [billingData]);

  const summary = billingData?.summary;
  const netHours = summary?.netDifference ?? 0;
  const redoCount = summary?.redoCount ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            Hour Profitability
          </span>
          <button onClick={() => setLocation("/time-billing")} className="text-sm font-normal text-primary hover:underline">
            Full Report
          </button>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Billed hours vs actual hours — are we ahead or behind?</p>
      </CardHeader>
      <CardContent>
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className={`text-xl font-bold ${netHours >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netHours >= 0 ? '+' : ''}{netHours.toFixed(1)}h
            </p>
            <p className="text-[10px] text-muted-foreground">Net Hours</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className="text-xl font-bold">{summary?.totalBilled?.toFixed(0) ?? 0}h</p>
            <p className="text-[10px] text-muted-foreground">Total Billed</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/50">
            <p className={`text-xl font-bold ${redoCount > 0 ? 'text-orange-600' : ''}`}>{redoCount}</p>
            <p className="text-[10px] text-muted-foreground">Redo Jobs</p>
          </div>
        </div>
        {/* Chart */}
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeframeData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
              <Bar dataKey="actual" name="Actual" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="billed" name="Billed" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="net" name="Net (+/-)" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function MaintenanceOverviewChart() {
  const { data: maintenanceData } = trpc.dashboard.maintenanceOverview.useQuery();
  const [, setLocation] = useLocation();

  if (!maintenanceData) return null;
  const { byCategory, byVehicle, overdue, upcoming } = maintenanceData;

  // Build chart data for categories
  const chartData = byCategory.map((cat: any) => ({
    name: cat.name.length > 12 ? cat.name.slice(0, 12) + '...' : cat.name,
    fullName: cat.name,
    routine: cat.routine,
    major: cat.major,
    overdue: cat.overdue,
  }));

  // Build vehicle breakdown data
  const vehicleData = byVehicle.filter((v: any) => v.routine + v.major + v.overdue + v.activeJobs > 0).map((v: any) => ({
    name: v.vehicleName.length > 15 ? v.vehicleName.slice(0, 15) + '...' : v.vehicleName,
    fullName: v.vehicleName,
    vehicleId: v.vehicleId,
    routine: v.routine,
    major: v.major,
    overdue: v.overdue,
    activeJobs: v.activeJobs,
  }));

  const totalOverdue = overdue.length;
  const totalUpcoming = upcoming.length;

  if (chartData.length === 0 && vehicleData.length === 0 && totalOverdue === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No maintenance schedules set up yet. Add maintenance schedules to vehicles to see the overview here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overdue Alert */}
      {totalOverdue > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-800">{totalOverdue} Overdue Maintenance Item{totalOverdue > 1 ? 's' : ''}</p>
                <p className="text-sm text-orange-600">{totalUpcoming} more due within 30 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance by Category Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance Jobs by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                          <p className="font-medium mb-1">{d.fullName}</p>
                          <p className="text-green-600">Routine: {d.routine}</p>
                          <p className="text-blue-600">Major: {d.major}</p>
                          <p className="text-red-600">Overdue: {d.overdue}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="routine" name="Routine (Oil, Filters, Fluids)" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="major" name="Major (Engine, Trans, Brakes)" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Breakdown Chart */}
      {vehicleData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5" />
              Maintenance by Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vehicleData} layout="vertical" margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg text-sm">
                          <p className="font-medium mb-1">{d.fullName}</p>
                          <p className="text-green-600">Routine: {d.routine}</p>
                          <p className="text-blue-600">Major: {d.major}</p>
                          <p className="text-red-600">Overdue: {d.overdue}</p>
                          <p className="text-purple-600">Active Jobs: {d.activeJobs}</p>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="routine" name="Routine" fill="#22c55e" radius={[0, 3, 3, 0]} stackId="a" />
                  <Bar dataKey="major" name="Major" fill="#3b82f6" radius={[0, 3, 3, 0]} stackId="a" />
                  <Bar dataKey="overdue" name="Overdue" fill="#ef4444" radius={[0, 3, 3, 0]} stackId="a" />
                  <Bar dataKey="activeJobs" name="Active Work Orders" fill="#a855f7" radius={[0, 3, 3, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Vehicle detail list */}
            <div className="mt-4 space-y-2">
              {vehicleData.map((v: any) => (
                <div
                  key={v.vehicleId}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => setLocation(`/vehicles/${v.vehicleId}`)}
                >
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{v.fullName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.overdue > 0 && <Badge variant="destructive" className="text-xs">{v.overdue} overdue</Badge>}
                    {v.activeJobs > 0 && <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">{v.activeJobs} active</Badge>}
                    {v.routine + v.major > 0 && <Badge variant="outline" className="text-xs">{v.routine + v.major} scheduled</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { effectiveRole } = useViewAs();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: workOrders } = trpc.workOrder.list.useQuery();
  const { data: invoices } = trpc.invoice.list.useQuery();
  const { data: expenses } = trpc.expense.list.useQuery();
  const { data: inventory } = trpc.inventory.list.useQuery();
  const { data: calendarEvents } = trpc.calendar.list.useQuery();
  const { data: phoneCallsData } = trpc.phoneCall.pendingFollowUps.useQuery();
  const { data: clientsList } = trpc.clients.list.useQuery();
  const { data: techRankings = [] } = trpc.techPerformance.stats.useQuery();
  const trpcUtils = trpc.useUtils();

  const createCall = trpc.phoneCall.create.useMutation({
    onSuccess: () => { trpcUtils.phoneCall.pendingFollowUps.invalidate(); toast.success("Call logged"); setCallDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateCall = trpc.phoneCall.update.useMutation({
    onSuccess: () => { trpcUtils.phoneCall.pendingFollowUps.invalidate(); toast.success("Updated"); },
  });

  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [editCallDialogOpen, setEditCallDialogOpen] = useState(false);
  const [editingCall, setEditingCall] = useState<any>(null);
  const [callForm, setCallForm] = useState({
    contactName: "", phoneNumber: "", clientId: "", direction: "outbound",
    outcome: "not_called", notes: "", followUpDate: "", businessLine: "",
  });
  const [editCallForm, setEditCallForm] = useState({
    outcome: "not_called", notes: "", followUpDate: "", businessLine: "", isCompleted: false,
  });
  const resetCallForm = () => setCallForm({ contactName: "", phoneNumber: "", clientId: "", direction: "outbound", outcome: "not_called", notes: "", followUpDate: "", businessLine: "" });
  const safeDateToLocal = (d: any): string => {
    if (!d) return "";
    try {
      const dt = d instanceof Date ? d : new Date(typeof d === "string" ? d.replace(" ", "T") : d);
      if (isNaN(dt.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    } catch { return ""; }
  };
  const safeDateDisplay = (d: any): Date | null => {
    if (!d) return null;
    try {
      const dt = d instanceof Date ? d : new Date(typeof d === "string" ? d.replace(" ", "T") : d);
      return isNaN(dt.getTime()) ? null : dt;
    } catch { return null; }
  };
  const openEditCall = (call: any) => {
    setEditingCall(call);
    setEditCallForm({
      outcome: call.outcome || "not_called",
      notes: call.notes || "",
      followUpDate: safeDateToLocal(call.followUpDate),
      businessLine: call.businessLine || "",
      isCompleted: call.isCompleted || false,
    });
    setEditCallDialogOpen(true);
  };
  const handleUpdateCall = () => {
    if (!editingCall) return;
    updateCall.mutate({
      id: editingCall.id,
      outcome: editCallForm.outcome as any,
      notes: editCallForm.notes || undefined,
      followUpDate: editCallForm.followUpDate || null,
      businessLine: editCallForm.businessLine || undefined,
      isCompleted: editCallForm.isCompleted,
    });
    setEditCallDialogOpen(false);
  };
  const handleCreateCall = () => {
    if (!callForm.contactName) { toast.error("Contact name is required"); return; }
    createCall.mutate({
      contactName: callForm.contactName,
      phoneNumber: callForm.phoneNumber || undefined,
      clientId: callForm.clientId && callForm.clientId !== "none" ? parseInt(callForm.clientId) : undefined,
      direction: callForm.direction as any,
      outcome: callForm.outcome as any,
      businessLine: callForm.businessLine && callForm.businessLine !== "none" ? callForm.businessLine : undefined,
      notes: callForm.notes || undefined,
      followUpDate: callForm.followUpDate || undefined,
    });
  };

  // Role checks - use effectiveRole from ViewAs context (must be before any early return)
  const userRole = effectiveRole;
  const isOwner = userRole === "owner";
  const isAdminOrOwner = userRole === "admin" || isOwner;
  const isTechnician = userRole === "technician";
  const isCustomer = userRole === "customer";
  const showFinancials = isOwner; // Only owner sees revenue/profit totals

  // Timeframe calculations
  const timeframeData = useMemo(() => {
    if (!workOrders) return { today: 0, thisWeek: 0, nextWeek: 0, thisMonth: 0 };
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startOfNextWeek = new Date(endOfWeek);
    startOfNextWeek.setDate(endOfWeek.getDate() + 1);
    const endOfNextWeek = new Date(startOfNextWeek);
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const pending = workOrders.filter((wo: any) => wo.status !== "completed" && wo.status !== "denied");
    return {
      today: pending.filter((wo: any) => wo.createdAt && new Date(wo.createdAt).toISOString().split("T")[0] === today).length || pending.length,
      thisWeek: pending.length,
      nextWeek: Math.ceil(pending.length * 0.6),
      thisMonth: pending.length + (workOrders.filter((wo: any) => wo.status === "completed").length || 0),
    };
  }, [workOrders]);

  // Financial stats
  const financials = useMemo(() => {
    const revenue = invoices?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total || "0"), 0) ?? 0;
    const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || "0"), 0) ?? 0;
    return { revenue, expenses: totalExpenses, profit: revenue - totalExpenses };
  }, [invoices, expenses]);

  // Revenue by branch
  const branchRevenue = useMemo(() => {
    if (!invoices || !workOrders) return { acme: 0, onsite: 0, custom: 0 };
    const getWoBranch = (inv: any) => {
      const wo = workOrders.find(w => w.id === inv.workOrderId);
      return (wo as any)?.businessLine || "acme_automotive";
    };
    return {
      acme: invoices.filter(inv => getWoBranch(inv) === "acme_automotive").reduce((s, inv: any) => s + parseFloat(inv.total || "0"), 0),
      onsite: invoices.filter(inv => getWoBranch(inv) === "on_site_advantage").reduce((s, inv: any) => s + parseFloat(inv.total || "0"), 0),
      custom: invoices.filter(inv => getWoBranch(inv) === "customized_enterprise").reduce((s, inv: any) => s + parseFloat(inv.total || "0"), 0),
    };
  }, [invoices, workOrders]);

  // Parts to order (low stock items)
  const partsToOrder = useMemo(() => {
    return inventory?.filter((i: any) => (i.quantityOnHand ?? 0) <= (i.reorderLevel ?? 2)) ?? [];
  }, [inventory]);

  // Emergency and priority work orders
  const emergencyOrders = workOrders?.filter((wo: any) => wo.priority === "emergency" && wo.status !== "completed") ?? [];
  const highPriorityOrders = workOrders?.filter((wo: any) => wo.priority === "high" && wo.status !== "completed") ?? [];
  const pendingOrders = workOrders?.filter((wo: any) => wo.status === "pending" || wo.status === "in_progress") ?? [];

  // Marketing events from calendar
  const marketingEvents = calendarEvents?.filter((e: any) => e.eventType === "marketing") ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Role checks already defined above (before early return)

  if (isCustomer) {
    // ===== CUSTOMER DASHBOARD - Distinct portal-style view =====
    const myWorkOrders = workOrders?.filter((wo: any) => wo.status !== "denied") ?? [];
    const activeWork = myWorkOrders.filter((wo: any) => wo.status === "in_progress" || wo.status === "pending");
    const completedWork = myWorkOrders.filter((wo: any) => wo.status === "completed");
    const myInvoices = invoices ?? [];
    const unpaidInvoices = myInvoices.filter((inv: any) => inv.status === "sent" || inv.status === "overdue");

    return (
      <div className="space-y-6">
        {/* Customer Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
          <h1 className="text-2xl font-bold">Welcome, {user?.name || "Customer"}</h1>
          <p className="text-blue-100 mt-1">Your service dashboard — track your vehicles and work status</p>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-5 text-center">
              <Wrench className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-800">{activeWork.length}</p>
              <p className="text-sm text-blue-600">In Progress</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-5 text-center">
              <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-800">{completedWork.length}</p>
              <p className="text-sm text-green-600">Completed</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-5 text-center">
              <DollarSign className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-800">{unpaidInvoices.length}</p>
              <p className="text-sm text-amber-600">Invoices Due</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Work Queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Work In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeWork.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No active work orders right now. We'll notify you when work begins.</p>
            ) : (
              <div className="space-y-3">
                {activeWork.map((wo: any) => (
                  <div key={wo.id} className="flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm">
                    <div>
                      <p className="font-medium">WO-{wo.id}</p>
                      <p className="text-sm text-muted-foreground">{wo.workDescription || wo.orderType}</p>
                    </div>
                    <Badge className={wo.status === "in_progress" ? "bg-blue-600" : "bg-amber-500"}>
                      {wo.status === "in_progress" ? "Working on it" : "Queued"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Work History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              Completed Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedWork.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No completed work yet.</p>
            ) : (
              <div className="space-y-2">
                {completedWork.slice(0, 10).map((wo: any) => (
                  <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">WO-{wo.id} — {wo.workDescription || wo.orderType}</p>
                      <p className="text-xs text-muted-foreground">{wo.completedDate ? new Date(wo.completedDate).toLocaleDateString() : ""}</p>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">Done</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        {unpaidInvoices.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-600" />
                Outstanding Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unpaidInvoices.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">#{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "TBD"}</p>
                    </div>
                    <p className="font-bold text-amber-700">${parseFloat(inv.total || "0").toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Service */}
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardContent className="p-5 text-center">
            <p className="text-sm text-muted-foreground mb-3">Need something done?</p>
            <Button onClick={() => setLocation("/inquiries")} className="bg-indigo-600 hover:bg-indigo-700">
              Request Service
            </Button>
          </CardContent>
        </Card>

        {/* Team Rankings */}
        <RankingsWidget rankings={techRankings as any[]} />
      </div>
    );
  }

  if (userRole === "user") {
    // ===== SUBCONTRACTOR DASHBOARD - Distinct from tech and customer =====
    const assignedWork = workOrders?.filter((wo: any) => wo.status === "in_progress" || wo.status === "pending") ?? [];
    const openWork = workOrders?.filter((wo: any) => wo.status === "pending" && !(wo as any).assignedTo) ?? [];
    const myCompletedWork = workOrders?.filter((wo: any) => wo.status === "completed") ?? [];

    return (
      <div className="space-y-6">
        {/* Subcontractor Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Subcontractor Portal</h1>
              <p className="text-emerald-100">Welcome, {user?.name || "Contractor"}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-emerald-200">
            <CardContent className="p-5 text-center">
              <ClipboardList className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{assignedWork.length}</p>
              <p className="text-sm text-muted-foreground">Assigned Jobs</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="p-5 text-center">
              <Package className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{openWork.length}</p>
              <p className="text-sm text-muted-foreground">Available to Pick Up</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-5 text-center">
              <Check className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{myCompletedWork.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Assigned Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              Your Assigned Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedWork.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No jobs currently assigned. Check available work below.</p>
            ) : (
              <div className="space-y-3">
                {assignedWork.map((wo: any) => (
                  <div key={wo.id} className="flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/work-orders")}>
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.color }} />
                      <div>
                        <p className="font-medium">WO-{wo.id}</p>
                        <p className="text-sm text-muted-foreground">{wo.workDescription || wo.orderType}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{wo.status?.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Open Work */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              Available Work (Unassigned)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openWork.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No unassigned work available right now.</p>
            ) : (
              <div className="space-y-2">
                {openWork.slice(0, 8).map((wo: any) => (
                  <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => setLocation("/work-orders")}>
                    <div>
                      <p className="text-sm font-medium">WO-{wo.id} — {wo.workDescription || wo.orderType}</p>
                      <p className="text-xs text-muted-foreground">{(wo as any)?.businessLine?.replace("_", " ") || "Acme Automotive"}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{wo.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => setLocation("/driving")}>
            <Car className="h-5 w-5" />
            <span className="text-xs">Mileage Log</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col gap-1" onClick={() => setLocation("/scan")}>
            <Package className="h-5 w-5" />
            <span className="text-xs">Scan QR</span>
          </Button>
        </div>

        {/* Team Rankings */}
        <RankingsWidget rankings={techRankings as any[]} />
      </div>
    );
  }

  if (isTechnician) {
    // ===== TECHNICIAN DASHBOARD =====
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tech Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name || "Technician"}</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setLocation("/scan")}>
            <Car className="h-6 w-6" />
            <span className="text-xs">Scan QR</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setLocation("/time-tracking")}>
            <Clock className="h-6 w-6" />
            <span className="text-xs">Clock In/Out</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setLocation("/general-work")}>
            <Wrench className="h-6 w-6" />
            <span className="text-xs">General Work</span>
          </Button>
        </div>

        {/* Emergency Alert */}
        {emergencyOrders.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-semibold text-red-800">{emergencyOrders.length} Emergency Job{emergencyOrders.length > 1 ? "s" : ""}</p>
                  <p className="text-sm text-red-600">Do these first!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hour Bank Widget */}
        <HourBankWidget />

        {/* Today's Priority List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Priority Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending jobs — great work!</p>
            ) : (
              <div className="space-y-2">
                {pendingOrders.sort((a: any, b: any) => {
                  const order = { emergency: 0, high: 1, medium: 2, low: 3 };
                  return (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3);
                }).slice(0, 8).map((wo: any) => (
                  <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setLocation("/work-orders")}>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.color }} />
                      <div>
                        <p className="text-sm font-medium">WO-{wo.id}</p>
                        <p className="text-xs text-muted-foreground">{wo.workDescription || wo.orderType}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{wo.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Rankings */}
        <RankingsWidget rankings={techRankings as any[]} />
      </div>
    );
  }

  // Fallback for any other non-admin role
  if (!isAdminOrOwner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome, {user?.name}</p>
        </div>
        <Card><CardContent className="p-8 text-center text-muted-foreground">Contact your administrator for access.</CardContent></Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Business overview across all operations</p>
      </div>

      {/* Emergency Alert */}
      {emergencyOrders.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-800">{emergencyOrders.length} Emergency Work Order{emergencyOrders.length > 1 ? "s" : ""}</p>
                <p className="text-sm text-red-600">Requires immediate attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${showFinancials ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/vehicles")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Vehicles</p>
                <p className="text-2xl font-bold mt-1">{stats?.totalVehicles ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/work-orders")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Work Orders</p>
                <p className="text-2xl font-bold mt-1">{stats?.pendingWorkOrders ?? 0}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {showFinancials && (
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/profitability")}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold mt-1 text-green-700">${financials.revenue.toFixed(0)}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showFinancials && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className={`text-2xl font-bold mt-1 ${financials.profit >= 0 ? "text-green-700" : "text-red-700"}`}>
                    ${financials.profit.toFixed(0)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Revenue by Branch - Owner only */}
      {showFinancials && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Revenue by Branch
              <Badge variant="outline" className="ml-auto text-[10px]">Total: ${financials.revenue.toFixed(0)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-center">
                <p className="text-lg font-bold text-blue-700">${branchRevenue.acme.toFixed(0)}</p>
                <p className="text-[10px] text-blue-600 mt-1 font-medium">Acme Automotive</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-lg font-bold text-emerald-700">${branchRevenue.onsite.toFixed(0)}</p>
                <p className="text-[10px] text-emerald-600 mt-1 font-medium">On-Site Advantage</p>
              </div>
              <div className="p-3 rounded-lg bg-violet-50 border border-violet-100 text-center">
                <p className="text-lg font-bold text-violet-700">${branchRevenue.custom.toFixed(0)}</p>
                <p className="text-[10px] text-violet-600 mt-1 font-medium">Customized Enterprise</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Timeframe Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Work Schedule Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-4 rounded-lg bg-red-50 border border-red-100">
              <p className="text-3xl font-bold text-red-700">{timeframeData.today}</p>
              <p className="text-xs text-red-600 mt-1 font-medium">Today</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-3xl font-bold text-amber-700">{timeframeData.thisWeek}</p>
              <p className="text-xs text-amber-600 mt-1 font-medium">This Week</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-3xl font-bold text-blue-700">{timeframeData.nextWeek}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">Next Week</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-100">
              <p className="text-3xl font-bold text-purple-700">{timeframeData.thisMonth}</p>
              <p className="text-xs text-purple-600 mt-1 font-medium">This Month</p>
            </div>
          </div>
          {/* Visual bar chart */}
          <div className="mt-4 space-y-2">
            {[
              { label: "Today", value: timeframeData.today, max: timeframeData.thisMonth, color: "bg-red-500" },
              { label: "This Week", value: timeframeData.thisWeek, max: timeframeData.thisMonth, color: "bg-amber-500" },
              { label: "Next Week", value: timeframeData.nextWeek, max: timeframeData.thisMonth, color: "bg-blue-500" },
              { label: "This Month", value: timeframeData.thisMonth, max: timeframeData.thisMonth, color: "bg-purple-500" },
            ].map(bar => (
              <div key={bar.label} className="flex items-center gap-3">
                <span className="text-xs w-20 text-muted-foreground">{bar.label}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${bar.color} rounded-full transition-all`} style={{ width: `${bar.max > 0 ? (bar.value / bar.max) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-medium w-6 text-right">{bar.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Three Column Layout: Phone Calls, Parts Queue, Marketing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Phone Calls To-Do */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                Phone Calls
                {phoneCallsData && phoneCallsData.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-5">{phoneCallsData.length}</Badge>
                )}
              </CardTitle>
              <Dialog open={callDialogOpen} onOpenChange={(open) => { setCallDialogOpen(open); if (!open) resetCallForm(); }}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    <Plus className="h-4 w-4" />
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
                          <SelectItem value="not_called">Not Called Yet</SelectItem>
                          <SelectItem value="reached">Reached</SelectItem>
                          <SelectItem value="voicemail">Voicemail</SelectItem>
                          <SelectItem value="no_answer">No Answer</SelectItem>
                          <SelectItem value="callback_requested">Callback Requested</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Business Line</Label>
                      <Select value={callForm.businessLine || "none"} onValueChange={v => setCallForm(f => ({...f, businessLine: v === "none" ? "" : v}))}>
                        <SelectTrigger><SelectValue placeholder="Select business..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">General</SelectItem>
                          <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
                          <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
                          <SelectItem value="onsite_advantage">On-Site Advantage</SelectItem>
                          <SelectItem value="real_estate">Homes by Beth Marie</SelectItem>
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
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {phoneCallsData && phoneCallsData.length > 0 ? phoneCallsData.slice(0, 8).map((call: any) => {
                const followUpDt = safeDateDisplay(call.followUpDate);
                const isOverdue = followUpDt && followUpDt < new Date();
                const outcomeIcon = call.outcome === "reached" ? <PhoneCall className="h-3 w-3 text-green-600" /> :
                  call.outcome === "voicemail" ? <PhoneOff className="h-3 w-3 text-amber-600" /> :
                  call.outcome === "no_answer" ? <PhoneMissed className="h-3 w-3 text-red-600" /> :
                  <Phone className="h-3 w-3 text-blue-600" />;
                const linkedClient = call.clientId ? clientsList?.find((c: any) => c.id === call.clientId) : null;
                const bizLabels: Record<string, string> = { acme_automotive: "Acme Auto", customized_enterprise: "Custom Ent.", onsite_advantage: "On-Site", real_estate: "Real Estate" };
                const bizLabel = call.businessLine ? bizLabels[call.businessLine] || call.businessLine : null;
                return (
                  <div key={call.id} className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all ${isOverdue ? "bg-red-50 border border-red-200" : "bg-muted/50"}`} onClick={() => openEditCall(call)}>
                    {outcomeIcon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="truncate font-medium text-xs">{call.contactName}</p>
                        {bizLabel && <span className="text-[9px] bg-primary/10 text-primary px-1 rounded shrink-0">{bizLabel}</span>}
                      </div>
                      {call.phoneNumber && <p className="text-[10px] text-muted-foreground">{call.phoneNumber}</p>}
                      {linkedClient && (
                        <p className="text-[10px] text-blue-600 truncate">{linkedClient.name}{linkedClient.contactPhone ? ` • ${linkedClient.contactPhone}` : ""}</p>
                      )}
                      {followUpDt && (
                        <p className={`text-[10px] ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                          {isOverdue ? "OVERDUE: " : ""}{followUpDt.toLocaleDateString()} {followUpDt.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                        </p>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={(e) => { e.stopPropagation(); updateCall.mutate({ id: call.id, isCompleted: true }); }}>
                      <Check className="h-3 w-3 text-green-600" />
                    </Button>
                  </div>
                );
              }) : (
                <p className="text-xs text-muted-foreground text-center py-3">No pending calls. Click + to add one.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Phone Call Dialog */}
        <Dialog open={editCallDialogOpen} onOpenChange={(open) => { setEditCallDialogOpen(open); if (!open) setEditingCall(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Phone Call: {editingCall?.contactName}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Outcome</Label>
                <Select value={editCallForm.outcome} onValueChange={v => setEditCallForm(f => ({...f, outcome: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_called">Not Called Yet</SelectItem>
                    <SelectItem value="reached">Reached</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                    <SelectItem value="no_answer">No Answer</SelectItem>
                    <SelectItem value="callback_requested">Callback Requested</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Business Line</Label>
                <Select value={editCallForm.businessLine || "none"} onValueChange={v => setEditCallForm(f => ({...f, businessLine: v === "none" ? "" : v}))}>
                  <SelectTrigger><SelectValue placeholder="Select business..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General</SelectItem>
                    <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
                    <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
                    <SelectItem value="onsite_advantage">On-Site Advantage</SelectItem>
                    <SelectItem value="real_estate">Homes by Beth Marie</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Follow-Up Date</Label>
                <Input type="datetime-local" value={editCallForm.followUpDate} onChange={e => setEditCallForm(f => ({...f, followUpDate: e.target.value}))} />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editCallForm.isCompleted} onChange={e => setEditCallForm(f => ({...f, isCompleted: e.target.checked}))} className="rounded" />
                  <span className="text-sm">Mark Completed</span>
                </label>
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea value={editCallForm.notes} onChange={e => setEditCallForm(f => ({...f, notes: e.target.value}))} placeholder="Call notes..." rows={3} />
              </div>
            </div>
            <Button onClick={handleUpdateCall} disabled={updateCall.isPending} className="w-full mt-2">
              {updateCall.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogContent>
        </Dialog>

        {/* Parts to Order */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/parts-tracker")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              Parts to Order
              <Button variant="outline" size="sm" className="ml-auto h-6 text-[10px]" onClick={(e) => { e.stopPropagation(); setLocation("/parts-tracker"); }}>+ Add Part</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {partsToOrder.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded bg-orange-50 text-sm">
                  <span className="truncate">{item.itemName}</span>
                  <Badge variant="destructive" className="text-[10px] h-5">{item.quantityOnHand ?? 0} left</Badge>
                </div>
              ))}
              {partsToOrder.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">Stock levels OK</p>
              )}
              {partsToOrder.length > 0 && (
                <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={(e) => { e.stopPropagation(); setLocation("/parts-tracker"); }}>View All Parts</Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Marketing Queue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-purple-600" />
              Marketing Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {marketingEvents.slice(0, 5).map((evt: any) => (
                <div key={evt.id} className="flex items-center gap-2 p-2 rounded bg-purple-50 text-sm">
                  <div className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                  <div className="truncate">
                    <span>{evt.title}</span>
                    <span className="text-xs text-muted-foreground ml-1">{evt.date}</span>
                  </div>
                </div>
              ))}
              {marketingEvents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">No marketing days scheduled</p>
              )}
              <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={() => setLocation("/calendar")}>
                View Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hours Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Field Hours</span>
              </div>
              <p className="text-2xl font-bold">{pendingOrders.length * 3}h</p>
              <p className="text-xs text-muted-foreground">Estimated based on active jobs</p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: "70%" }} />
              </div>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Office Hours</span>
              </div>
              <p className="text-2xl font-bold">{Math.ceil(pendingOrders.length * 0.5)}h</p>
              <p className="text-xs text-muted-foreground">Invoicing, calls, scheduling</p>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "30%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hour Profitability Graph - Owner Only */}
      {showFinancials && <HourProfitabilityChart />}

      {/* Maintenance Overview Graph */}
      <MaintenanceOverviewChart />

      {/* Priority Work Orders */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Priority Work Orders
            <button onClick={() => setLocation("/work-orders")} className="text-sm font-normal text-primary hover:underline">
              View all
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No pending work orders</p>
          ) : (
            <div className="space-y-2">
              {pendingOrders.sort((a: any, b: any) => {
                const order = { emergency: 0, high: 1, medium: 2, low: 3 };
                return (order[a.priority as keyof typeof order] ?? 3) - (order[b.priority as keyof typeof order] ?? 3);
              }).slice(0, 8).map((wo: any) => (
                <div key={wo.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        color: PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.color,
                        backgroundColor: PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.bgColor,
                        borderColor: PRIORITY_CONFIG[wo.priority as keyof typeof PRIORITY_CONFIG]?.borderColor,
                      }}
                    >
                      {wo.priority}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">WO-{wo.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {wo.workDescription || (wo.orderType === "vehicle" ? "Vehicle" : wo.orderType === "building" ? "Building" : "General")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={wo.status === "completed" ? "default" : "secondary"} className="text-xs">
                    {wo.status?.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Health Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Business Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.totalClients ?? 0}</p>
              <p className="text-xs text-muted-foreground">Active Clients</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.completedWorkOrders ?? 0}</p>
              <p className="text-xs text-muted-foreground">Jobs Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{invoices?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Invoices Sent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{inventory?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground">Inventory Items</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tech Rankings */}
      <RankingsWidget rankings={techRankings as any[]} showRevenue={showFinancials} />
    </div>
  );
}

// ===== SHARED RANKINGS WIDGET - Visible on ALL dashboard levels =====
function RankingsWidget({ rankings, showRevenue = false }: { rankings: any[]; showRevenue?: boolean }) {
  if (!rankings || rankings.length === 0) return null;
  const sorted = [...rankings].sort((a, b) => b.totalRevenue - a.totalRevenue);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" /> Team Rankings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sorted.slice(0, 10).map((tech, idx) => (
            <div key={tech.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/30 transition-colors">
              <div className="text-lg font-bold text-muted-foreground w-7 text-center">
                {idx === 0 ? "\uD83E\uDD47" : idx === 1 ? "\uD83E\uDD48" : idx === 2 ? "\uD83E\uDD49" : `${idx + 1}`}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{tech.name || "Unknown"}</p>
                  <TierBadge tier={tech.performanceTier || "trainee"} />
                  <Badge variant="secondary" className="text-[10px] capitalize">{tech.experienceLevel || "trainee"}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{tech.completedJobs} jobs</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{tech.efficiency}% efficiency</span>
                  {showRevenue && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${tech.totalRevenue.toLocaleString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
