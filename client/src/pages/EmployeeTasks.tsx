import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Wrench, Calendar, Clock } from "lucide-react";
import { useState, useMemo } from "react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  denied: "bg-red-100 text-red-700",
};

const BRANCH_LABELS: Record<string, string> = {
  acme_automotive: "Acme Auto",
  on_site_advantage: "On-Site",
  customized_enterprise: "Custom Enterprise",
};

export default function EmployeeTasks() {
  const { data: workOrders = [] } = trpc.workOrder.list.useQuery();
  const { data: users = [] } = trpc.user.list.useQuery();
  const [timeFilter, setTimeFilter] = useState("upcoming");

  const employees = useMemo(() => {
    return (users as any[]).filter((u: any) =>
      u.role === "technician" || u.role === "admin" || u.role === "owner" || u.role === "user"
    );
  }, [users]);

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const getEmployeeJobs = (userId: number) => {
    return (workOrders as any[]).filter((wo: any) => {
      if (wo.technicianId !== userId) return false;
      if (wo.status === "completed" || wo.status === "denied") return false;

      if (timeFilter === "today") {
        const scheduled = wo.scheduledDate ? new Date(wo.scheduledDate) : null;
        return !scheduled || scheduled.toDateString() === now.toDateString();
      }
      if (timeFilter === "this_week") {
        const scheduled = wo.scheduledDate ? new Date(wo.scheduledDate) : null;
        return !scheduled || scheduled <= oneWeekFromNow;
      }
      if (timeFilter === "two_weeks") {
        const scheduled = wo.scheduledDate ? new Date(wo.scheduledDate) : null;
        return !scheduled || scheduled <= twoWeeksFromNow;
      }
      // "upcoming" = all active
      return true;
    }).sort((a: any, b: any) => {
      const aDate = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
      const bDate = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
      return aDate - bDate;
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Employee Tasks & Jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            View assigned and upcoming work for each team member
          </p>
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="two_weeks">Next 2 Weeks</SelectItem>
            <SelectItem value="upcoming">All Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {employees.map((emp: any) => {
          const jobs = getEmployeeJobs(emp.id);
          return (
            <Card key={emp.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                      {emp.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{emp.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{emp.role}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">No active jobs assigned</p>
                ) : (
                  <div className="space-y-2">
                    {jobs.map((job: any) => (
                      <div key={job.id} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-accent/30 transition-colors">
                        <Wrench className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{job.title || `WO-${job.id}`}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            {job.scheduledDate && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Calendar className="h-3 w-3" />
                                {new Date(job.scheduledDate).toLocaleDateString()}
                              </span>
                            )}
                            {job.billedHours && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {job.billedHours}h
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {job.businessLine && (
                            <Badge variant="outline" className="text-[9px]">
                              {BRANCH_LABELS[job.businessLine] || job.businessLine}
                            </Badge>
                          )}
                          <Badge className={`text-[10px] ${STATUS_COLORS[job.status] || "bg-gray-100 text-gray-700"}`}>
                            {(job.status || "pending").replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
