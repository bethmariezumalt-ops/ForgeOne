import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMemo } from "react";
import { DollarSign, TrendingUp, Car, Building2, FolderOpen, Wrench } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ProfitTracker() {
  const { user } = useAuth();
  const isOwner = user?.role === "owner";

  // Fetch data for profit calculations
  const { data: workOrders = [] } = trpc.workOrder.list.useQuery();
  const { data: invoices = [] } = trpc.invoice.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  const { data: vehicles = [] } = trpc.vehicle.list.useQuery();

  // Calculate profit per job
  const jobProfits = useMemo(() => {
    return (workOrders as any[]).filter((wo: any) => wo.status === "completed").map((wo: any) => {
      const revenue = parseFloat(wo.chargeAmount || "0");
      const laborCost = parseFloat(wo.actualHours || "0") * 25; // Assume $25/hr labor cost
      const partsCost = parseFloat(wo.partsCost || "0");
      const gross = revenue;
      const net = revenue - laborCost - partsCost;
      return { ...wo, grossProfit: gross, netProfit: net, laborCost, partsCost };
    }).sort((a, b) => b.netProfit - a.netProfit);
  }, [workOrders]);

  // Profit per vehicle
  const vehicleProfits = useMemo(() => {
    const vehicleMap: Record<number, { name: string; gross: number; net: number; jobs: number }> = {};
    jobProfits.forEach((job: any) => {
      if (!job.vehicleId) return;
      if (!vehicleMap[job.vehicleId]) {
        const v = (vehicles as any[]).find((v: any) => v.id === job.vehicleId);
        vehicleMap[job.vehicleId] = { name: v ? `${v.year} ${v.make} ${v.model}` : `Vehicle #${job.vehicleId}`, gross: 0, net: 0, jobs: 0 };
      }
      vehicleMap[job.vehicleId].gross += job.grossProfit;
      vehicleMap[job.vehicleId].net += job.netProfit;
      vehicleMap[job.vehicleId].jobs += 1;
    });
    return Object.entries(vehicleMap).map(([id, data]) => ({ id: parseInt(id), ...data })).sort((a, b) => b.net - a.net);
  }, [jobProfits, vehicles]);

  // Profit per client
  const clientProfits = useMemo(() => {
    const clientMap: Record<number, { name: string; gross: number; net: number; jobs: number }> = {};
    jobProfits.forEach((job: any) => {
      if (!job.clientId) return;
      if (!clientMap[job.clientId]) {
        const c = (clients as any[]).find((c: any) => c.id === job.clientId);
        clientMap[job.clientId] = { name: c?.name || `Client #${job.clientId}`, gross: 0, net: 0, jobs: 0 };
      }
      clientMap[job.clientId].gross += job.grossProfit;
      clientMap[job.clientId].net += job.netProfit;
      clientMap[job.clientId].jobs += 1;
    });
    return Object.entries(clientMap).map(([id, data]) => ({ id: parseInt(id), ...data })).sort((a, b) => b.net - a.net);
  }, [jobProfits, clients]);

  // Profit per business line (project)
  const projectProfits = useMemo(() => {
    const projectMap: Record<string, { name: string; gross: number; net: number; jobs: number }> = {};
    (workOrders as any[]).filter((wo: any) => wo.status === "completed").forEach((wo: any) => {
      const line = wo.businessLine || "acme_automotive";
      const labels: Record<string, string> = {
        acme_automotive: "Acme Automotive",
        on_site_advantage: "On-Site Advantage",
        customized_enterprise: "Customized Enterprise",
      };
      if (!projectMap[line]) {
        projectMap[line] = { name: labels[line] || line, gross: 0, net: 0, jobs: 0 };
      }
      const revenue = parseFloat(wo.chargeAmount || "0");
      const laborCost = parseFloat(wo.actualHours || "0") * 25;
      const partsCost = parseFloat(wo.partsCost || "0");
      projectMap[line].gross += revenue;
      projectMap[line].net += revenue - laborCost - partsCost;
      projectMap[line].jobs += 1;
    });
    return Object.entries(projectMap).map(([key, data]) => ({ key, ...data })).sort((a, b) => b.net - a.net);
  }, [workOrders]);

  // Totals
  const totals = useMemo(() => {
    const gross = jobProfits.reduce((sum, j) => sum + j.grossProfit, 0);
    const net = jobProfits.reduce((sum, j) => sum + j.netProfit, 0);
    return { gross, net, margin: gross > 0 ? ((net / gross) * 100).toFixed(1) : "0" };
  }, [jobProfits]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profit Tracker</h1>
        <p className="text-muted-foreground mt-1">Gross and net profit per job, vehicle, project, and client</p>
      </div>

      {/* Summary Cards - Owner sees totals */}
      {isOwner && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground uppercase">Completed Jobs</p>
              <p className="text-2xl font-bold mt-1">{jobProfits.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground uppercase">Gross Revenue</p>
              <p className="text-2xl font-bold mt-1">${totals.gross.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground uppercase">Net Profit</p>
              <p className="text-2xl font-bold mt-1 text-green-600">${totals.net.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground uppercase">Profit Margin</p>
              <p className="text-2xl font-bold mt-1">{totals.margin}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs">By Job</TabsTrigger>
          <TabsTrigger value="vehicles">By Vehicle</TabsTrigger>
          <TabsTrigger value="clients">By Client</TabsTrigger>
          <TabsTrigger value="projects">By Business Line</TabsTrigger>
        </TabsList>

        {/* BY JOB */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Profit per Job</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {jobProfits.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No completed jobs yet.</p>
                )}
                {jobProfits.slice(0, 30).map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">WO #{job.id} — {job.description || "No description"}</p>
                      <p className="text-xs text-muted-foreground">
                        Revenue: ${job.grossProfit.toFixed(2)} | Labor: ${job.laborCost.toFixed(2)} | Parts: ${job.partsCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${job.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ${job.netProfit.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">net profit</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BY VEHICLE */}
        <TabsContent value="vehicles">
          {vehicleProfits.length > 0 && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vehicleProfits.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, ""]} />
                      <Legend />
                      <Bar dataKey="gross" name="Gross" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net" name="Net" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" /> Profit per Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {vehicleProfits.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No vehicle data yet.</p>
                )}
                {vehicleProfits.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">{v.jobs} jobs completed</p>
                    </div>
                    <div className="text-right">
                      {isOwner && <p className="text-xs text-muted-foreground">Gross: ${v.gross.toFixed(2)}</p>}
                      <p className={`text-sm font-bold ${v.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        Net: ${v.net.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BY CLIENT */}
        <TabsContent value="clients">
          {clientProfits.length > 0 && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clientProfits.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, ""]} />
                      <Legend />
                      <Bar dataKey="gross" name="Gross" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net" name="Net" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Profit per Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientProfits.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No client data yet.</p>
                )}
                {clientProfits.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.jobs} jobs completed</p>
                    </div>
                    <div className="text-right">
                      {isOwner && <p className="text-xs text-muted-foreground">Gross: ${c.gross.toFixed(2)}</p>}
                      <p className={`text-sm font-bold ${c.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        Net: ${c.net.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BY BUSINESS LINE */}
        <TabsContent value="projects">
          {projectProfits.length > 0 && (
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectProfits}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, ""]} />
                      <Legend />
                      <Bar dataKey="gross" name="Gross" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="net" name="Net" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5" /> Profit per Business Line</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projectProfits.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No project data yet.</p>
                )}
                {projectProfits.map((p) => (
                  <div key={p.key} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.jobs} jobs completed</p>
                    </div>
                    <div className="text-right">
                      {isOwner && <p className="text-xs text-muted-foreground">Gross: ${p.gross.toFixed(2)}</p>}
                      <p className={`text-sm font-bold ${p.net >= 0 ? "text-green-600" : "text-red-600"}`}>
                        Net: ${p.net.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
