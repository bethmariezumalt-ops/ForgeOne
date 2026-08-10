import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Clock, MapPin, Plus, Play, Square, Car, Calendar } from "lucide-react";

export default function TimeTracking() {
  const { user } = useAuth();
  const [mileageStart, setMileageStart] = useState("");
  const [mileageEnd, setMileageEnd] = useState("");
  const [mileageFrom, setMileageFrom] = useState("");
  const [mileageTo, setMileageTo] = useState("");

  const { data: activeClock, refetch: refetchClock } = trpc.timeClock.activeClockIn.useQuery();
  const { data: entries = [], refetch: refetchEntries } = trpc.timeClock.myEntries.useQuery();
  const { data: mileageEntries = [], refetch: refetchMileage } = trpc.techMileage.list.useQuery();

  const clockIn = trpc.timeClock.clockIn.useMutation({ onSuccess: () => { refetchClock(); refetchEntries(); toast.success("Clocked in!"); } });
  const clockOut = trpc.timeClock.clockOut.useMutation({ onSuccess: () => { refetchClock(); refetchEntries(); toast.success("Clocked out!"); } });
  const createMileage = trpc.techMileage.create.useMutation({
    onSuccess: () => { refetchMileage(); setMileageStart(""); setMileageEnd(""); setMileageFrom(""); setMileageTo(""); toast.success("Mileage logged!"); },
  });

  // Calculate hours by period
  const hoursSummary = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const biweekStart = new Date(now);
    biweekStart.setDate(now.getDate() - 14);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let dayHours = 0, weekHours = 0, biweekHours = 0, monthHours = 0;

    (entries as any[]).forEach((entry: any) => {
      const hours = parseFloat(entry.totalHours || "0");
      const entryDate = new Date(entry.date);
      if (entry.date === today) dayHours += hours;
      if (entryDate >= weekStart) weekHours += hours;
      if (entryDate >= biweekStart) biweekHours += hours;
      if (entryDate >= monthStart) monthHours += hours;
    });

    return { dayHours, weekHours, biweekHours, monthHours };
  }, [entries]);

  // Calculate total mileage this week
  const weeklyMileage = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    return (mileageEntries as any[]).reduce((sum: number, entry: any) => {
      if (new Date(entry.date) >= weekStart) return sum + parseFloat(entry.totalMiles || "0");
      return sum;
    }, 0);
  }, [mileageEntries]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Time & Mileage Tracking</h1>
        <p className="text-muted-foreground mt-1">Track your work hours and mileage between jobs</p>
      </div>

      {/* Clock In/Out Card */}
      <Card className="border-2 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Time Clock</h3>
              {activeClock ? (
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-600 font-medium">
                    Clocked in since {new Date(activeClock.clockIn).toLocaleTimeString()}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Not currently clocked in</p>
              )}
            </div>
            {activeClock ? (
              <Button variant="destructive" size="lg" onClick={() => clockOut.mutate({ id: activeClock.id })} disabled={clockOut.isPending}>
                <Square className="h-4 w-4 mr-2" /> Clock Out
              </Button>
            ) : (
              <Button size="lg" onClick={() => clockIn.mutate({})} disabled={clockIn.isPending}>
                <Play className="h-4 w-4 mr-2" /> Clock In
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Hours Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Today</p>
            <p className="text-2xl font-bold mt-1">{hoursSummary.dayHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">This Week</p>
            <p className="text-2xl font-bold mt-1">{hoursSummary.weekHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Bi-Weekly</p>
            <p className="text-2xl font-bold mt-1">{hoursSummary.biweekHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">This Month</p>
            <p className="text-2xl font-bold mt-1">{hoursSummary.monthHours.toFixed(1)}h</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="time" className="space-y-4">
        <TabsList>
          <TabsTrigger value="time">Time Entries</TabsTrigger>
          <TabsTrigger value="mileage">Mileage Log</TabsTrigger>
        </TabsList>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Recent Time Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(entries as any[]).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No time entries yet. Clock in to start tracking!</p>
                )}
                {(entries as any[]).slice(0, 20).map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{new Date(entry.date).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.clockIn).toLocaleTimeString()} — {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : "In progress..."}
                      </p>
                    </div>
                    <Badge variant={entry.clockOut ? "default" : "secondary"}>
                      {entry.totalHours ? `${parseFloat(entry.totalHours).toFixed(1)}h` : "Active"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mileage">
          <div className="space-y-4">
            {/* Log Mileage Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" /> Log Mileage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Mileage</Label>
                    <Input type="number" placeholder="e.g. 45230" value={mileageStart} onChange={(e) => setMileageStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Mileage</Label>
                    <Input type="number" placeholder="e.g. 45245" value={mileageEnd} onChange={(e) => setMileageEnd(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input placeholder="Starting location" value={mileageFrom} onChange={(e) => setMileageFrom(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input placeholder="Destination" value={mileageTo} onChange={(e) => setMileageTo(e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  {mileageStart && mileageEnd && (
                    <p className="text-sm text-muted-foreground">
                      Distance: <span className="font-semibold text-foreground">{(parseFloat(mileageEnd) - parseFloat(mileageStart)).toFixed(1)} miles</span>
                    </p>
                  )}
                  <Button
                    onClick={() => createMileage.mutate({
                      startMileage: mileageStart,
                      endMileage: mileageEnd,
                      fromLocation: mileageFrom || undefined,
                      toLocation: mileageTo || undefined,
                      date: new Date().toISOString().split("T")[0],
                    })}
                    disabled={!mileageStart || !mileageEnd || createMileage.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Log Mileage
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Mileage Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><MapPin className="h-5 w-5" /> Mileage Log</span>
                  <Badge variant="secondary">{weeklyMileage.toFixed(1)} mi this week</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(mileageEntries as any[]).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">No mileage entries yet.</p>
                  )}
                  {(mileageEntries as any[]).slice(0, 20).map((entry: any) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">
                          {entry.fromLocation || "Start"} → {entry.toLocation || "End"}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
                      </div>
                      <Badge>{parseFloat(entry.totalMiles).toFixed(1)} mi</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
