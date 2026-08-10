import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, TrendingUp, TrendingDown, AlertTriangle, DollarSign, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ReferenceLine } from "recharts";

export default function TimeBilling() {
  const { data: billingData, isLoading, refetch } = trpc.workOrder.timeBilling.useQuery();
  const { data: workOrders } = trpc.workOrder.list.useQuery();
  const logHoursMutation = trpc.workOrder.logHours.useMutation({ onSuccess: () => { refetch(); setLogOpen(false); toast.success("Hours logged successfully"); } });
  const [logOpen, setLogOpen] = useState(false);
  const [selectedWO, setSelectedWO] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState("month");
  const [form, setForm] = useState({ actualHours: "", billedHours: "", hourlyRate: "75", isRedo: false, redoReason: "" });

  // Calculate timeframe data for the graph
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
      return { actual, billed, difference: billed - actual };
    };

    // Today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    // This week (Mon-Sun)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // This quarter
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    const quarterStart = new Date(now.getFullYear(), qMonth, 1);
    const quarterEnd = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59);

    // Bi-annual (first or second half)
    const biStart = now.getMonth() < 6
      ? new Date(now.getFullYear(), 0, 1)
      : new Date(now.getFullYear(), 6, 1);
    const biEnd = now.getMonth() < 6
      ? new Date(now.getFullYear(), 5, 30, 23, 59, 59)
      : new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    // Annual
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    return [
      { name: "Today", ...calcRange(getJobsInRange(todayStart, todayEnd)) },
      { name: "This Week", ...calcRange(getJobsInRange(weekStart, weekEnd)) },
      { name: "This Month", ...calcRange(getJobsInRange(monthStart, monthEnd)) },
      { name: "Quarter", ...calcRange(getJobsInRange(quarterStart, quarterEnd)) },
      { name: "Bi-Annual", ...calcRange(getJobsInRange(biStart, biEnd)) },
      { name: "Annual", ...calcRange(getJobsInRange(yearStart, yearEnd)) },
    ];
  }, [billingData]);

  // Year-over-year comparison
  const yearOverYearData = useMemo(() => {
    if (!billingData?.jobs) return [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];

    return years.map(year => {
      const yearJobs = billingData.jobs.filter(j => {
        if (!j.completedAt) return false;
        return new Date(j.completedAt).getFullYear() === year;
      });
      const actual = yearJobs.reduce((sum, j) => sum + j.actualHours, 0);
      const billed = yearJobs.reduce((sum, j) => sum + j.billedHours, 0);
      const avgRate = yearJobs.length > 0 ? yearJobs.reduce((sum, j) => sum + j.hourlyRate, 0) / yearJobs.length : 75;
      return {
        year: year.toString(),
        actualHours: actual,
        billedHours: billed,
        difference: billed - actual,
        revenue: billed * avgRate,
        jobs: yearJobs.length,
      };
    });
  }, [billingData]);

  // Job-level profitability for the table
  const jobProfitability = useMemo(() => {
    if (!billingData?.jobs) return [];
    return [...billingData.jobs].sort((a, b) => a.profitLoss - b.profitLoss);
  }, [billingData]);

  // Unlogged work orders (completed but no hours logged)
  const unloggedOrders = useMemo(() => {
    if (!workOrders) return [];
    return workOrders.filter((wo: any) => wo.status === "completed" && !wo.actualHours);
  }, [workOrders]);

  const handleLogHours = () => {
    if (!selectedWO) return;
    if (!form.actualHours || !form.billedHours) { toast.error("Please enter both actual and billed hours"); return; }
    logHoursMutation.mutate({
      id: selectedWO,
      actualHours: form.actualHours,
      billedHours: form.billedHours,
      hourlyRate: form.hourlyRate || undefined,
      isRedo: form.isRedo || undefined,
      redoReason: form.isRedo ? form.redoReason : undefined,
    });
  };

  const summary = billingData?.summary || { totalActual: 0, totalBilled: 0, netDifference: 0, redoCount: 0, redoLoss: 0 };
  const avgRate = 75; // default rate
  const netProfitFromHours = summary.netDifference * avgRate;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time & Billing</h1>
          <p className="text-muted-foreground mt-1">Track actual hours vs. billed hours — see where you're ahead and where you're losing money</p>
        </div>
        <Dialog open={logOpen} onOpenChange={setLogOpen}>
          <DialogTrigger asChild>
            <Button><Clock className="h-4 w-4 mr-2" />Log Hours</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log Hours for a Job</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Work Order</Label>
                <Select value={selectedWO?.toString() || ""} onValueChange={v => setSelectedWO(parseInt(v))}>
                  <SelectTrigger><SelectValue placeholder="Select a completed job" /></SelectTrigger>
                  <SelectContent>
                    {unloggedOrders.map((wo: any) => (
                      <SelectItem key={wo.id} value={wo.id.toString()}>
                        #{wo.id} - {wo.workDescription || wo.notes || "No description"}
                      </SelectItem>
                    ))}
                    {workOrders?.filter((wo: any) => wo.status === "completed").map((wo: any) => (
                      <SelectItem key={`all-${wo.id}`} value={wo.id.toString()}>
                        #{wo.id} - {wo.workDescription || wo.notes || "No description"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Actual Hours</Label>
                  <Input type="number" step="0.25" value={form.actualHours} onChange={e => setForm(f => ({...f, actualHours: e.target.value}))} placeholder="e.g. 3.5" />
                </div>
                <div>
                  <Label>Billed Hours</Label>
                  <Input type="number" step="0.25" value={form.billedHours} onChange={e => setForm(f => ({...f, billedHours: e.target.value}))} placeholder="e.g. 4.0" />
                </div>
                <div>
                  <Label>Hourly Rate ($)</Label>
                  <Input type="number" step="1" value={form.hourlyRate} onChange={e => setForm(f => ({...f, hourlyRate: e.target.value}))} placeholder="75" />
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Switch checked={form.isRedo} onCheckedChange={v => setForm(f => ({...f, isRedo: v}))} />
                <div>
                  <Label>This is a redo/warranty job</Label>
                  <p className="text-xs text-muted-foreground">Mark if this job had to be redone (lost money)</p>
                </div>
              </div>
              {form.isRedo && (
                <div>
                  <Label>Redo Reason</Label>
                  <Textarea value={form.redoReason} onChange={e => setForm(f => ({...f, redoReason: e.target.value}))} placeholder="Why did this job need to be redone?" />
                </div>
              )}
              <Button onClick={handleLogHours} disabled={logHoursMutation.isPending} className="w-full">
                {logHoursMutation.isPending ? "Saving..." : "Log Hours"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Total Actual</p>
            <p className="text-2xl font-bold">{summary.totalActual.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Total Billed</p>
            <p className="text-2xl font-bold">{summary.totalBilled.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Net Difference</p>
            <p className={`text-2xl font-bold ${summary.netDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.netDifference >= 0 ? '+' : ''}{summary.netDifference.toFixed(1)}h
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Hour Profit</p>
            <p className={`text-2xl font-bold ${netProfitFromHours >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${netProfitFromHours.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase">Redo Jobs</p>
            <p className="text-2xl font-bold text-orange-600">{summary.redoCount}</p>
            {summary.redoLoss > 0 && <p className="text-xs text-red-500">-${summary.redoLoss.toFixed(0)} lost</p>}
          </CardContent>
        </Card>
      </div>

      {/* Hour Profitability by Timeframe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Hour Profitability by Timeframe
          </CardTitle>
          <p className="text-sm text-muted-foreground">Green = ahead (billed more than worked), Red = behind (underbilled)</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeframeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}h`, name === 'actual' ? 'Actual Hours' : name === 'billed' ? 'Billed Hours' : 'Difference']}
                />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Bar dataKey="actual" name="Actual Hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="billed" name="Billed Hours" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="difference" name="Net (+/-)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Year-over-Year Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearOverYearData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line type="monotone" dataKey="billedHours" name="Billed Hours" stroke="#22c55e" strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="actualHours" name="Actual Hours" stroke="#6366f1" strokeWidth={3} dot={{ r: 6 }} />
                <Line type="monotone" dataKey="difference" name="Net Difference" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {yearOverYearData.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {yearOverYearData.map(y => (
                <div key={y.year} className="text-center p-3 border rounded-lg">
                  <p className="font-bold text-lg">{y.year}</p>
                  <p className="text-sm text-muted-foreground">{y.jobs} jobs</p>
                  <p className={`text-sm font-medium ${y.difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {y.difference >= 0 ? '+' : ''}{y.difference.toFixed(1)}h net
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job-Level Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Job-Level Billing Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">Each job sorted by profit/loss — red = lost money, green = came out ahead</p>
        </CardHeader>
        <CardContent>
          {jobProfitability.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hours logged yet. Complete jobs and log actual vs. billed hours to see analysis.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {jobProfitability.map(job => (
                <div key={job.id} className={`flex items-center justify-between p-3 rounded-lg border ${job.profitLoss < 0 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                  <div className="flex items-center gap-3">
                    {job.profitLoss >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                    <div>
                      <p className="font-medium text-sm">{job.clientName} — {job.workDescription?.slice(0, 50)}</p>
                      <p className="text-xs text-muted-foreground">
                        Actual: {job.actualHours}h | Billed: {job.billedHours}h | Rate: ${job.hourlyRate}/h
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${job.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {job.profitLoss >= 0 ? '+' : ''}${job.profitLoss.toFixed(0)}
                    </p>
                    {job.isRedo && <Badge variant="destructive" className="text-xs">REDO</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
