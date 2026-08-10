import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, Repeat, Download, Trash2, Edit2, MapPin, X, UserPlus } from "lucide-react";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useViewAs } from "@/contexts/ViewAsContext";

const EVENT_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  personal: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", label: "Personal" },
  client_work: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Client Work" },
  marketing: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", label: "Marketing" },
  side_gig: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Side Gig" },
  off_day: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", label: "Off Day" },
  emergency: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", label: "Emergency" },
  meeting: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", label: "Meeting" },
  appointment: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", label: "Appointment" },
};

type ViewMode = "month" | "week" | "day";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatTime12(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getLocalDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDateStr(date: Date): string {
  // Use UTC methods to avoid timezone offset issues with MySQL date columns stored as UTC midnight
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() as string;
}

// Generate recurring event occurrences for a date range
function normalizeDateStr(d: any): string {
  if (!d) return "";
  if (d instanceof Date) return getDateStr(d);
  if (typeof d === "string") {
    // Handle ISO strings like "2026-07-28T00:00:00.000Z" - parse and use UTC
    if (d.includes("T")) {
      const parsed = new Date(d);
      return getDateStr(parsed);
    }
    // Plain date string "2026-07-28"
    return d.slice(0, 10);
  }
  return String(d).slice(0, 10);
}

function expandRecurringEvents(events: any[], startDate: Date, endDate: Date): any[] {
  const expanded: any[] = [];
  for (const evt of events) {
    // Normalize the date field to a YYYY-MM-DD string
    const normalizedEvt = { ...evt, date: normalizeDateStr(evt.date) };
    if (!normalizedEvt.isRecurring || !normalizedEvt.recurrenceRule) {
      expanded.push(normalizedEvt);
      continue;
    }
    // Add the original event
    expanded.push(normalizedEvt);
    // Generate occurrences
    const evtDate = new Date(normalizedEvt.date + "T00:00:00");
    const recEndStr = normalizeDateStr(evt.recurrenceEndDate);
    const endRecur = recEndStr ? new Date(recEndStr + "T23:59:59") : new Date(endDate.getTime() + 90 * 86400000);
    const maxEnd = endRecur < endDate ? endRecur : endDate;
    let current = new Date(evtDate);
    const increment = (d: Date) => {
      switch (evt.recurrenceRule) {
        case "daily": d.setDate(d.getDate() + 1); break;
        case "weekly": d.setDate(d.getDate() + 7); break;
        case "monthly": d.setMonth(d.getMonth() + 1); break;
        case "weekdays":
          d.setDate(d.getDate() + 1);
          while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
          break;
      }
    };
    increment(current);
    let safety = 0;
    while (current <= maxEnd && safety < 365) {
      if (current >= startDate) {
        expanded.push({ ...normalizedEvt, id: `${normalizedEvt.id}-${getLocalDateStr(current)}`, date: getLocalDateStr(current), _isRecurringInstance: true, _originalId: normalizedEvt.id });
      }
      increment(current);
      safety++;
    }
  }
  return expanded;
}

export default function Calendar() {
  const { data: events, refetch } = trpc.calendar.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();
  const createMutation = trpc.calendar.create.useMutation({ onSuccess: () => { refetch(); setCreateOpen(false); resetForm(); toast.success("Event added"); }, onError: (err) => { toast.error(err.message || "Failed to create event"); } });
  const updateMutation = trpc.calendar.update.useMutation({ onSuccess: () => { refetch(); setEditOpen(false); toast.success("Event updated"); }, onError: (err) => { toast.error(err.message || "Failed to update event"); } });
  const deleteMutation = trpc.calendar.delete.useMutation({ onSuccess: () => { refetch(); setEditOpen(false); setDetailEvent(null); toast.success("Event deleted"); }, onError: (err) => { toast.error(err.message || "Failed to delete event"); } });
  const exportIcal = trpc.calendar.exportIcal.useQuery(undefined, { enabled: false });

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const defaultForm = { title: "", eventType: "personal", date: "", startTime: "", endTime: "", allDay: false, clientId: "", isRecurring: false, recurrenceRule: "", recurrenceEndDate: "", location: "", notes: "", assignedTo: "" };
  const [form, setForm] = useState(defaultForm);
  const [editForm, setEditForm] = useState(defaultForm);

  const { effectiveRole } = useViewAs();
  const canAssign = effectiveRole === "owner" || effectiveRole === "admin";
  const { data: allUsers } = trpc.user.list.useQuery(undefined, { enabled: canAssign });
  const employees = (allUsers || []).filter((u: any) => ["owner", "admin", "technician"].includes(u.role));

  const resetForm = () => setForm(defaultForm);

  // Compute expanded events for current view range
  const expandedEvents = useMemo(() => {
    if (!events) return [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    let start: Date, end: Date;
    if (viewMode === "month") {
      start = new Date(year, month, 1);
      end = new Date(year, month + 1, 0);
    } else if (viewMode === "week") {
      const dayOfWeek = currentDate.getDay();
      start = new Date(currentDate);
      start.setDate(start.getDate() - dayOfWeek);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
    } else {
      start = new Date(currentDate);
      end = new Date(currentDate);
    }
    return expandRecurringEvents(events, start, end);
  }, [events, currentDate, viewMode]);

  const getEventsForDate = (dateStr: string) => {
    return expandedEvents.filter((e: any) => e.date === dateStr);
  };

  // Navigation
  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewMode === "month") d.setMonth(d.getMonth() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleCreate = () => {
    if (!form.title || !form.date) { toast.error("Title and date required"); return; }
    if (!form.allDay && !form.startTime) { toast.error("Start time required for timed events"); return; }
    createMutation.mutate({
      title: form.title,
      eventType: form.eventType as any,
      date: form.date,
      startTime: form.allDay ? undefined : form.startTime || undefined,
      endTime: form.allDay ? undefined : form.endTime || undefined,
      allDay: form.allDay,
      clientId: form.clientId && form.clientId !== "none" ? parseInt(form.clientId) : undefined,
      isRecurring: form.isRecurring,
      recurrenceRule: form.isRecurring ? (form.recurrenceRule as any) || undefined : undefined,
      recurrenceEndDate: form.isRecurring ? form.recurrenceEndDate || undefined : undefined,
      location: form.location || undefined,
      notes: form.notes || undefined,
      assignedTo: form.assignedTo ? parseInt(form.assignedTo) : undefined,
    });
  };

  const handleUpdate = () => {
    if (!detailEvent) return;
    const id = detailEvent._originalId || detailEvent.id;
    updateMutation.mutate({
      id: typeof id === "number" ? id : parseInt(id),
      title: editForm.title || undefined,
      eventType: editForm.eventType as any,
      date: editForm.date || undefined,
      startTime: editForm.allDay ? undefined : editForm.startTime || undefined,
      endTime: editForm.allDay ? undefined : editForm.endTime || undefined,
      allDay: editForm.allDay,
      isRecurring: editForm.isRecurring,
      recurrenceRule: editForm.isRecurring ? (editForm.recurrenceRule as any) || undefined : undefined,
      recurrenceEndDate: editForm.isRecurring ? editForm.recurrenceEndDate || undefined : undefined,
      location: editForm.location || undefined,
      notes: editForm.notes || undefined,
      assignedTo: editForm.assignedTo ? parseInt(editForm.assignedTo) : null,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Delete this event?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleExportIcal = async () => {
    try {
      const result = await exportIcal.refetch();
      if (result.data?.ical) {
        const blob = new Blob([result.data.ical], { type: "text/calendar" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "acme-fleet-calendar.ics";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Calendar exported! Import this .ics file into Google Calendar.");
      }
    } catch {
      toast.error("Failed to export calendar");
    }
  };

  const openCreateForDate = (dateStr: string) => {
    setForm({ ...defaultForm, date: dateStr });
    setCreateOpen(true);
  };

  const openEventDetail = (evt: any) => {
    setDetailEvent(evt);
    setEditForm({
      title: evt.title || "",
      eventType: evt.eventType || "personal",
      date: normalizeDateStr(evt.date) || "",
      startTime: evt.startTime || "",
      endTime: evt.endTime || "",
      allDay: evt.allDay || false,
      clientId: evt.clientId?.toString() || "",
      isRecurring: evt.isRecurring || false,
      recurrenceRule: evt.recurrenceRule || "",
      recurrenceEndDate: normalizeDateStr(evt.recurrenceEndDate) || "",
      location: evt.location || "",
      notes: evt.notes || "",
      assignedTo: evt.assignedTo?.toString() || "",
    });
  };

  // Calendar grid for month view
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = getLocalDateStr(new Date());

  // Week view dates
  const weekDates = useMemo(() => {
    const dayOfWeek = currentDate.getDay();
    const start = new Date(currentDate);
    start.setDate(start.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const headerTitle = () => {
    if (viewMode === "month") return currentDate.toLocaleString("default", { month: "long", year: "numeric" });
    if (viewMode === "week") {
      const start = weekDates[0];
      const end = weekDates[6];
      return `${start.toLocaleDateString("default", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("default", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("default", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Schedule, plan, and track your time</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportIcal}>
            <Download className="h-4 w-4 mr-1" />Sync
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />Add Event
          </Button>
        </div>
      </div>

      {/* View Controls & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold ml-2">{headerTitle()}</h2>
        </div>
        <div className="flex border rounded-lg overflow-hidden">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${viewMode === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Month View */}
      {viewMode === "month" && (
        <Card>
          <CardContent className="p-2">
            <div className="grid grid-cols-7 gap-px">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground p-2">{d}</div>
              ))}
              {Array.from({ length: 42 }, (_, i) => {
                const day = i - firstDay + 1;
                if (day < 1 || day > daysInMonth) return <div key={i} className="min-h-[80px] bg-muted/20 rounded-sm" />;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = getEventsForDate(dateStr);
                const isToday = dateStr === today;
                return (
                  <div
                    key={i}
                    className={`min-h-[80px] p-1 border rounded-sm cursor-pointer hover:bg-accent/30 transition-colors ${isToday ? "ring-2 ring-primary/30 bg-primary/5" : "bg-background"}`}
                    onClick={() => openCreateForDate(dateStr)}
                  >
                    <span className={`text-xs font-medium ${isToday ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center" : ""}`}>{day}</span>
                    <div className="space-y-0.5 mt-0.5">
                      {dayEvents.slice(0, 3).map((evt: any) => {
                        const color = EVENT_COLORS[evt.eventType] || EVENT_COLORS.personal;
                        return (
                          <div
                            key={evt.id}
                            className={`text-[10px] px-1 py-0.5 rounded truncate border ${color.bg} ${color.text} ${color.border}`}
                            onClick={(e) => { e.stopPropagation(); openEventDetail(evt); }}
                          >
                            {evt.startTime && <span className="font-medium">{formatTime12(evt.startTime).replace(/ (AM|PM)/, "")} </span>}
                            {evt.title}
                            {evt.isRecurring && <Repeat className="inline h-2 w-2 ml-0.5" />}
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && <div className="text-[9px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[800px]">
              {/* Header row */}
              <div className="border-b p-2" />
              {weekDates.map((d, i) => {
                const dateStr = getLocalDateStr(d);
                const isToday = dateStr === today;
                return (
                  <div key={i} className={`border-b border-l p-2 text-center ${isToday ? "bg-primary/5" : ""}`}>
                    <div className="text-xs text-muted-foreground">{d.toLocaleDateString("en-US", { weekday: "short" })}</div>
                    <div className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>{d.getDate()}</div>
                  </div>
                );
              })}
              {/* Time slots */}
              {HOURS.filter(h => h >= 6 && h <= 22).map((hour) => (
                <div key={hour} className="contents">
                  <div className="border-t p-1 text-[10px] text-muted-foreground text-right pr-2 h-12 flex items-start justify-end">
                    {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                  </div>
                  {weekDates.map((d, di) => {
                    const dateStr = getLocalDateStr(d);
                    const dayEvents = getEventsForDate(dateStr);
                    const hourEvents = dayEvents.filter((e: any) => {
                      if (e.allDay) return false;
                      const startHour = parseInt((e.startTime || "00:00").split(":")[0]);
                      return startHour === hour;
                    });
                    return (
                      <div
                        key={di}
                        className="border-t border-l h-12 relative cursor-pointer hover:bg-accent/20"
                        onClick={() => {
                          const timeStr = `${String(hour).padStart(2, "0")}:00`;
                          setForm({ ...defaultForm, date: dateStr, startTime: timeStr, endTime: `${String(hour + 1).padStart(2, "0")}:00` });
                          setCreateOpen(true);
                        }}
                      >
                        {hourEvents.map((evt: any) => {
                          const color = EVENT_COLORS[evt.eventType] || EVENT_COLORS.personal;
                          return (
                            <div
                              key={evt.id}
                              className={`absolute inset-x-0.5 top-0.5 px-1 py-0.5 rounded text-[9px] truncate border ${color.bg} ${color.text} ${color.border} z-10`}
                              onClick={(e) => { e.stopPropagation(); openEventDetail(evt); }}
                            >
                              {evt.title}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
              {/* All-day events row at top */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-[60px_1fr]">
              {/* All-day section */}
              {(() => {
                const dateStr = getLocalDateStr(currentDate);
                const allDayEvents = getEventsForDate(dateStr).filter((e: any) => e.allDay);
                if (allDayEvents.length > 0) {
                  return (
                    <div className="contents">
                      <div className="p-2 text-[10px] text-muted-foreground border-b">All Day</div>
                      <div className="p-2 border-b border-l space-y-1">
                        {allDayEvents.map((evt: any) => {
                          const color = EVENT_COLORS[evt.eventType] || EVENT_COLORS.personal;
                          return (
                            <div
                              key={evt.id}
                              className={`px-2 py-1 rounded text-xs border cursor-pointer ${color.bg} ${color.text} ${color.border}`}
                              onClick={() => openEventDetail(evt)}
                            >
                              {evt.title} {evt.isRecurring && <Repeat className="inline h-3 w-3" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              {/* Hourly slots */}
              {HOURS.map((hour) => {
                const dateStr = getLocalDateStr(currentDate);
                const dayEvents = getEventsForDate(dateStr);
                const hourEvents = dayEvents.filter((e: any) => {
                  if (e.allDay) return false;
                  const startHour = parseInt((e.startTime || "00:00").split(":")[0]);
                  return startHour === hour;
                });
                return (
                  <div key={hour} className="contents">
                    <div className="border-t p-1 text-[10px] text-muted-foreground text-right pr-2 h-14 flex items-start justify-end">
                      {hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`}
                    </div>
                    <div
                      className="border-t border-l h-14 relative cursor-pointer hover:bg-accent/20 p-0.5"
                      onClick={() => {
                        const timeStr = `${String(hour).padStart(2, "0")}:00`;
                        setForm({ ...defaultForm, date: dateStr, startTime: timeStr, endTime: `${String(Math.min(hour + 1, 23)).padStart(2, "0")}:00` });
                        setCreateOpen(true);
                      }}
                    >
                      {hourEvents.map((evt: any) => {
                        const color = EVENT_COLORS[evt.eventType] || EVENT_COLORS.personal;
                        return (
                          <div
                            key={evt.id}
                            className={`px-2 py-1 rounded text-xs border cursor-pointer ${color.bg} ${color.text} ${color.border}`}
                            onClick={(e) => { e.stopPropagation(); openEventDetail(evt); }}
                          >
                            <span className="font-medium">{formatTime12(evt.startTime)}</span>
                            {evt.endTime && <span> – {formatTime12(evt.endTime)}</span>}
                            <span className="ml-2">{evt.title}</span>
                            {evt.isRecurring && <Repeat className="inline h-3 w-3 ml-1" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(EVENT_COLORS).map(([key, val]) => (
          <Badge key={key} variant="outline" className={`${val.bg} ${val.text} ${val.border} text-[10px]`}>{val.label}</Badge>
        ))}
      </div>

      {/* Google Calendar Sync Info */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CalIcon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Google Calendar Sync</p>
              <p className="text-xs text-muted-foreground">Click "Sync" to download an .ics file and import into Google Calendar. Or subscribe to the live feed URL below:</p>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/api/calendar/feed.ics`}
                  className="text-xs h-8 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/calendar/feed.ics`);
                    toast.success("Feed URL copied! Paste it in Google Calendar → Other Calendars → From URL");
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">In Google Calendar: Other calendars (+) → From URL → paste the link above</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Event Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
          <EventForm form={form} setForm={setForm} clients={clients} onSubmit={handleCreate} submitLabel={createMutation.isPending ? "Adding..." : "Add Event"} disabled={createMutation.isPending} employees={employees} canAssign={canAssign} />
        </DialogContent>
      </Dialog>

      {/* Event Detail / Edit Dialog */}
      <Dialog open={!!detailEvent} onOpenChange={(v) => { if (!v) { setDetailEvent(null); setEditOpen(false); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {detailEvent && !editOpen && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${EVENT_COLORS[detailEvent.eventType]?.bg || "bg-gray-200"} border ${EVENT_COLORS[detailEvent.eventType]?.border || ""}`} />
                  {detailEvent.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalIcon className="h-4 w-4" />
                  <span>{new Date(detailEvent.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                {!detailEvent.allDay && detailEvent.startTime && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime12(detailEvent.startTime)}{detailEvent.endTime ? ` – ${formatTime12(detailEvent.endTime)}` : ""}</span>
                  </div>
                )}
                {detailEvent.allDay && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>All day</span>
                  </div>
                )}
                {detailEvent.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{detailEvent.location}</span>
                  </div>
                )}
                {detailEvent.isRecurring && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Repeat className="h-4 w-4" />
                    <span className="capitalize">Repeats {detailEvent.recurrenceRule || "weekly"}</span>
                    {detailEvent.recurrenceEndDate && <span className="text-xs">until {detailEvent.recurrenceEndDate}</span>}
                  </div>
                )}
                {detailEvent.assignedTo && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UserPlus className="h-4 w-4" />
                    <span>Assigned to: {employees.find((u: any) => u.id === detailEvent.assignedTo)?.name || `User #${detailEvent.assignedTo}`}</span>
                  </div>
                )}
                {detailEvent.notes && <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{detailEvent.notes}</p>}
                <Badge variant="outline" className={`${EVENT_COLORS[detailEvent.eventType]?.bg} ${EVENT_COLORS[detailEvent.eventType]?.text}`}>
                  {EVENT_COLORS[detailEvent.eventType]?.label || detailEvent.eventType}
                </Badge>
              </div>
              <div className="flex gap-2 pt-2">
                {!detailEvent._isRecurringInstance && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { setEditForm({ title: detailEvent.title || "", eventType: detailEvent.eventType || "personal", date: detailEvent.date || "", startTime: detailEvent.startTime || "", endTime: detailEvent.endTime || "", allDay: detailEvent.allDay || false, clientId: detailEvent.clientId?.toString() || "", isRecurring: detailEvent.isRecurring || false, recurrenceRule: detailEvent.recurrenceRule || "", recurrenceEndDate: detailEvent.recurrenceEndDate || "", location: detailEvent.location || "", notes: detailEvent.notes || "", assignedTo: detailEvent.assignedTo?.toString() || "" }); setEditOpen(true); }}>
                      <Edit2 className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(detailEvent.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </>
                )}
                {detailEvent._isRecurringInstance && (
                  <p className="text-xs text-muted-foreground">This is a recurring instance. Edit or delete the original event to change all occurrences.</p>
                )}
              </div>
            </div>
          )}
          {detailEvent && editOpen && (
            <>
              <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
              <EventForm form={editForm} setForm={setEditForm} clients={clients} onSubmit={handleUpdate} submitLabel={updateMutation.isPending ? "Saving..." : "Save Changes"} disabled={updateMutation.isPending} employees={employees} canAssign={canAssign} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventForm({ form, setForm, clients, onSubmit, submitLabel, disabled, employees, canAssign }: {
  form: any;
  setForm: (fn: (f: any) => any) => void;
  clients: any;
  onSubmit: () => void;
  submitLabel: string;
  disabled: boolean;
  employees?: any[];
  canAssign?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="Event title" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Type</Label>
          <Select value={form.eventType} onValueChange={v => setForm((f: any) => ({ ...f, eventType: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="appointment">Appointment</SelectItem>
              <SelectItem value="client_work">Client Work</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="side_gig">Side Gig</SelectItem>
              <SelectItem value="off_day">Off Day</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date *</Label>
          <Input type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} />
        </div>
      </div>

      {/* All Day Toggle */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2"><Clock className="h-4 w-4" />All Day</Label>
        <Switch checked={form.allDay} onCheckedChange={v => setForm((f: any) => ({ ...f, allDay: v }))} />
      </div>

      {/* Time fields */}
      {!form.allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Time *</Label>
            <Input type="time" value={form.startTime} onChange={e => setForm((f: any) => ({ ...f, startTime: e.target.value }))} />
          </div>
          <div>
            <Label>End Time</Label>
            <Input type="time" value={form.endTime} onChange={e => setForm((f: any) => ({ ...f, endTime: e.target.value }))} />
          </div>
        </div>
      )}

      {/* Recurring Toggle */}
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2"><Repeat className="h-4 w-4" />Recurring</Label>
        <Switch checked={form.isRecurring} onCheckedChange={v => setForm((f: any) => ({ ...f, isRecurring: v }))} />
      </div>

      {form.isRecurring && (
        <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-primary/20">
          <div>
            <Label>Repeat</Label>
            <Select value={form.recurrenceRule} onValueChange={v => setForm((f: any) => ({ ...f, recurrenceRule: v }))}>
              <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Until (optional)</Label>
            <Input type="date" value={form.recurrenceEndDate} onChange={e => setForm((f: any) => ({ ...f, recurrenceEndDate: e.target.value }))} />
          </div>
        </div>
      )}

      {/* Location */}
      <div>
        <Label>Location</Label>
        <Input value={form.location} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="Where is this event?" />
      </div>

      {/* Client */}
      {(form.eventType === "client_work" || form.eventType === "meeting") && (
        <div>
          <Label>Client (optional)</Label>
          <Select value={form.clientId} onValueChange={v => setForm((f: any) => ({ ...f, clientId: v }))}>
            <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No client</SelectItem>
              {clients?.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Assign To (Owner/Admin only) */}
      {canAssign && employees && employees.length > 0 && (
        <div>
          <Label className="flex items-center gap-2"><UserPlus className="h-4 w-4" />Assign To</Label>
          <Select value={form.assignedTo || ""} onValueChange={v => setForm((f: any) => ({ ...f, assignedTo: v === "none" ? "" : v }))}>
            <SelectTrigger><SelectValue placeholder="Select employee (optional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No assignment</SelectItem>
              {employees.map((u: any) => <SelectItem key={u.id} value={u.id.toString()}>{u.name} ({u.role})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
      <div>
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} placeholder="Additional details..." rows={2} />
      </div>

      <Button onClick={onSubmit} disabled={disabled} className="w-full">
        {submitLabel}
      </Button>
    </div>
  );
}
