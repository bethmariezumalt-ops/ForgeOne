import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  CheckCircle2, Plus, Trash2, Mail, Phone, Clock, ListTodo,
  Send, Star, Trophy, Medal, Award, Shield, Sparkles,
  PhoneCall, PhoneOff, PhoneMissed, Calendar, ArrowLeft, Check,
} from "lucide-react";

// Performance tier config with colors
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  titanium: { label: "Titanium", color: "text-slate-100", bg: "bg-gradient-to-r from-slate-700 to-slate-500", border: "border-slate-400", icon: Sparkles },
  platinum: { label: "Platinum", color: "text-purple-100", bg: "bg-gradient-to-r from-purple-700 to-purple-500", border: "border-purple-400", icon: Trophy },
  gold: { label: "Gold", color: "text-yellow-100", bg: "bg-gradient-to-r from-yellow-600 to-amber-500", border: "border-yellow-400", icon: Medal },
  silver: { label: "Silver", color: "text-gray-100", bg: "bg-gradient-to-r from-gray-500 to-gray-400", border: "border-gray-300", icon: Award },
  bronze: { label: "Bronze", color: "text-orange-100", bg: "bg-gradient-to-r from-orange-700 to-orange-500", border: "border-orange-400", icon: Shield },
  trainee: { label: "Trainee", color: "text-green-100", bg: "bg-gradient-to-r from-green-700 to-green-500", border: "border-green-400", icon: Star },
};

export function TierBadge({ tier }: { tier: string | null | undefined }) {
  const config = TIER_CONFIG[tier || "trainee"] || TIER_CONFIG.trainee;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color} border ${config.border} shadow-sm`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

export default function UserProfile() {
  const { user } = useAuth();
  const params = useParams<{ userId?: string }>();
  const [, setLocation] = useLocation();
  const viewingOther = !!params.userId;
  const isAdminViewer = user?.role === "admin" || user?.role === "owner";

  // State
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState<string>("medium");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [expandedCallId, setExpandedCallId] = useState<number | null>(null);
  const [callForm, setCallForm] = useState({
    contactName: "", phoneNumber: "", direction: "outbound", outcome: "not_called", notes: "", followUpDate: "", businessLine: "", assignedTo: "",
  });

  // Queries - own data
  const { data: todos = [], refetch: refetchTodos } = trpc.todo.list.useQuery(undefined, { enabled: !viewingOther });
  const { data: emails = [], refetch: refetchEmails } = trpc.email.list.useQuery(undefined, { enabled: !viewingOther });
  const { data: phoneCalls = [] } = trpc.phoneCall.list.useQuery(undefined);
  const { data: activeClock } = trpc.timeClock.activeClockIn.useQuery(undefined, { enabled: !viewingOther });
  const { data: allUsers } = trpc.user.list.useQuery(undefined, { enabled: viewingOther && isAdminViewer });

  // Get the viewed user's info
  const viewedUser = viewingOther
    ? allUsers?.find((u: any) => String(u.id) === params.userId)
    : user;

  // Mutations
  const createTodo = trpc.todo.create.useMutation({ onSuccess: () => { refetchTodos(); setNewTodoTitle(""); } });
  const updateTodo = trpc.todo.update.useMutation({ onSuccess: () => refetchTodos() });
  const deleteTodo = trpc.todo.delete.useMutation({ onSuccess: () => refetchTodos() });
  const createEmail = trpc.email.create.useMutation({
    onSuccess: () => { refetchEmails(); setEmailDialogOpen(false); setEmailSubject(""); setEmailTo(""); setEmailBody(""); toast.success("Email logged"); },
  });
  const clockInMut = trpc.timeClock.clockIn.useMutation({ onSuccess: () => toast.success("Clocked in!") });
  const clockOutMut = trpc.timeClock.clockOut.useMutation({ onSuccess: () => toast.success("Clocked out!") });
  const createCall = trpc.phoneCall.create.useMutation({
    onSuccess: () => { setCallDialogOpen(false); resetCallForm(); toast.success("Call logged!"); },
  });
  const updateCall = trpc.phoneCall.update.useMutation({
    onSuccess: () => toast.success("Call updated"),
  });

  const { data: teamMembers = [] } = trpc.user.list.useQuery();
  const resetCallForm = () => setCallForm({ contactName: "", phoneNumber: "", direction: "outbound", outcome: "not_called", notes: "", followUpDate: "", businessLine: "", assignedTo: "" });

  const handleCreateCall = () => {
    if (!callForm.contactName) { toast.error("Contact name is required"); return; }
    createCall.mutate({
      contactName: callForm.contactName,
      phoneNumber: callForm.phoneNumber || undefined,
      direction: callForm.direction as any,
      outcome: callForm.outcome as any,
      businessLine: callForm.businessLine && callForm.businessLine !== "none" ? callForm.businessLine : undefined,
      notes: callForm.notes || undefined,
      followUpDate: callForm.followUpDate || undefined,
      assignedTo: callForm.assignedTo ? parseInt(callForm.assignedTo) : undefined,
    });
  };

  const tier = (viewedUser as any)?.performanceTier || "trainee";
  const displayName = viewedUser?.name || "User";
  const displayEmail = (viewedUser as any)?.email || "No email set";
  const displayRole = (viewedUser as any)?.role || "user";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Back button when viewing another user */}
      {viewingOther && (
        <Button variant="ghost" size="sm" onClick={() => setLocation("/team")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Team
        </Button>
      )}

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {viewingOther ? `${displayName}'s Profile` : "My Profile"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {displayName} &middot; {displayEmail} &middot; <Badge variant="secondary" className="text-[10px]">{displayRole}</Badge>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <TierBadge tier={tier} />
          {!viewingOther && (
            activeClock ? (
              <Button variant="destructive" size="sm" onClick={() => clockOutMut.mutate({ id: activeClock.id })}>
                <Clock className="h-4 w-4 mr-1" /> Clock Out
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={() => clockInMut.mutate({})}>
                <Clock className="h-4 w-4 mr-1" /> Clock In
              </Button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* TODO LIST - only show for own profile */}
        {!viewingOther && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ListTodo className="h-5 w-5 text-primary" />
                My Todo List
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add Todo */}
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Add a task..."
                  value={newTodoTitle}
                  onChange={(e) => setNewTodoTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTodoTitle.trim()) {
                      createTodo.mutate({ title: newTodoTitle.trim(), priority: newTodoPriority as any });
                    }
                  }}
                  className="flex-1"
                />
                <Select value={newTodoPriority} onValueChange={setNewTodoPriority}>
                  <SelectTrigger className="w-20 sm:w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Med</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="icon"
                  onClick={() => { if (newTodoTitle.trim()) createTodo.mutate({ title: newTodoTitle.trim(), priority: newTodoPriority as any }); }}
                  disabled={!newTodoTitle.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Todo List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {todos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No tasks yet. Add one above!</p>
                )}
                {todos.map((todo: any) => (
                  <div key={todo.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${todo.completed ? "bg-muted/50 opacity-60" : "hover:bg-accent/30"}`}>
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={(checked) => updateTodo.mutate({ id: todo.id, completed: !!checked })}
                    />
                    <span className={`flex-1 text-sm ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                      {todo.title}
                    </span>
                    <Badge variant={todo.priority === "urgent" ? "destructive" : todo.priority === "high" ? "default" : "secondary"} className="text-[10px]">
                      {todo.priority}
                    </Badge>
                    <button onClick={() => deleteTodo.mutate({ id: todo.id })} className="p-1 hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* EMAIL AREA - only for own profile */}
        {!viewingOther && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                <span className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Log
                </span>
                <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Log Email
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Log Email</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input placeholder="To" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} />
                      <Input placeholder="Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                      <Textarea placeholder="Body..." value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={4} />
                      <Button
                        className="w-full"
                        onClick={() => createEmail.mutate({ subject: emailSubject, toAddress: emailTo, body: emailBody, direction: "outbound", status: "sent" })}
                        disabled={!emailSubject.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" /> Save Email
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {emails.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No emails logged yet.</p>
                )}
                {emails.map((email: any) => (
                  <div key={email.id} className="flex items-start gap-3 p-2 rounded-lg border hover:bg-accent/30 transition-colors">
                    <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{email.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {email.direction === "outbound" ? "To" : "From"}: {email.toAddress || email.fromAddress || "—"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{email.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PHONE CALLS - with Log & Schedule Call dialog */}
        <Card className={viewingOther ? "lg:col-span-2" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
              <span className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Phone Calls
              </span>
              {!viewingOther && (
                <Dialog open={callDialogOpen} onOpenChange={(open) => { setCallDialogOpen(open); if (!open) resetCallForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-3.5 w-3.5 mr-1" /> Log / Schedule Call
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Log or Schedule a Phone Call</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <Label>Contact Name *</Label>
                        <Input value={callForm.contactName} onChange={e => setCallForm(f => ({...f, contactName: e.target.value}))} placeholder="Who to call..." />
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <Input value={callForm.phoneNumber} onChange={e => setCallForm(f => ({...f, phoneNumber: e.target.value}))} placeholder="(555) 123-4567" />
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
                            <SelectItem value="not_called">Not Called Yet (Scheduled)</SelectItem>
                            <SelectItem value="reached">Reached</SelectItem>
                            <SelectItem value="voicemail">Voicemail</SelectItem>
                            <SelectItem value="no_answer">No Answer</SelectItem>
                            <SelectItem value="callback_requested">Callback Requested</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Business Line</Label>
                        <Select value={callForm.businessLine} onValueChange={v => setCallForm(f => ({...f, businessLine: v}))}>
                          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">General</SelectItem>
                            <SelectItem value="acme_automotive">Acme Automotive</SelectItem>
                            <SelectItem value="customized_enterprise">Customized Enterprise</SelectItem>
                            <SelectItem value="onsite_advantage">On-Site Advantage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Follow-Up / Schedule Date</Label>
                        <Input type="datetime-local" value={callForm.followUpDate} onChange={e => setCallForm(f => ({...f, followUpDate: e.target.value}))} />
                      </div>
                      <div>
                        <Label>Assign To Employee</Label>
                        <Select value={callForm.assignedTo} onValueChange={v => setCallForm(f => ({...f, assignedTo: v}))}>
                          <SelectTrigger><SelectValue placeholder="Select employee..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {(teamMembers as any[]).map((m: any) => (
                              <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Notes</Label>
                        <Textarea value={callForm.notes} onChange={e => setCallForm(f => ({...f, notes: e.target.value}))} placeholder="Call notes..." rows={2} />
                      </div>
                    </div>
                    <Button onClick={handleCreateCall} disabled={createCall.isPending} className="w-full mt-2">
                      {createCall.isPending ? "Saving..." : "Submit"}
                    </Button>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {(phoneCalls as any[]).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No phone calls recorded yet. Click "Log / Schedule Call" to add one.</p>
              )}
              {(phoneCalls as any[]).map((call: any) => {
                const isOverdue = call.followUpDate && !call.isCompleted && new Date(call.followUpDate) < new Date();
                const isFuture = call.followUpDate && new Date(call.followUpDate) > new Date();
                const outcomeIcon = call.outcome === "reached" ? <PhoneCall className="h-4 w-4 text-green-600 shrink-0" /> :
                  call.outcome === "voicemail" ? <PhoneOff className="h-4 w-4 text-amber-600 shrink-0" /> :
                  call.outcome === "no_answer" ? <PhoneMissed className="h-4 w-4 text-red-600 shrink-0" /> :
                  call.outcome === "scheduled" ? <Calendar className="h-4 w-4 text-blue-600 shrink-0" /> :
                  <Phone className="h-4 w-4 text-blue-600 shrink-0" />;
                const isExpanded = expandedCallId === call.id;
                return (
                  <div key={call.id}
                    className={`rounded-lg border transition-all cursor-pointer ${isOverdue ? "bg-red-50 dark:bg-red-950/20 border-red-200" : call.isCompleted ? "bg-muted/50 opacity-70" : isFuture ? "bg-blue-50/50 dark:bg-blue-950/10 border-blue-200" : "hover:bg-accent/30"}`}
                    onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                  >
                    <div className="flex items-start gap-3 p-3">
                      {outcomeIcon}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-medium">{call.contactName}</p>
                          {call.businessLine && (
                            <Badge variant="secondary" className="text-[9px]">
                              {call.businessLine === "acme_automotive" ? "Acme" : call.businessLine === "customized_enterprise" ? "Custom" : "On-Site"}
                            </Badge>
                          )}
                          {isFuture && !call.isCompleted && <Badge className="text-[9px] bg-blue-100 text-blue-700">Scheduled</Badge>}
                          {isOverdue && <Badge variant="destructive" className="text-[9px]">Overdue</Badge>}
                        </div>
                        {call.phoneNumber && <p className="text-xs text-muted-foreground">{call.phoneNumber}</p>}
                        {!isExpanded && call.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{call.notes}</p>}
                        {!isExpanded && call.followUpDate && (
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                            <Calendar className="h-3 w-3" />
                            {isOverdue ? "OVERDUE: " : isFuture ? "Scheduled: " : "Follow-up: "}
                            {new Date(call.followUpDate).toLocaleDateString()} {new Date(call.followUpDate).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                          </p>
                        )}
                      </div>
                      {!viewingOther && !call.isCompleted && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 shrink-0" onClick={(e) => { e.stopPropagation(); updateCall.mutate({ id: call.id, isCompleted: true }); }} title="Mark complete">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      {call.isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-1" />
                      )}
                    </div>
                    {/* Expanded detail view */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-0 ml-7 border-t mt-1 pt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-muted-foreground">Direction:</span> <span className="font-medium capitalize">{call.direction || "outbound"}</span></div>
                          <div><span className="text-muted-foreground">Outcome:</span> <span className="font-medium capitalize">{(call.outcome || "pending").replace("_", " ")}</span></div>
                          {call.followUpDate && (
                            <div className="col-span-2"><span className="text-muted-foreground">Follow-up Date:</span> <span className="font-medium">{new Date(call.followUpDate).toLocaleString()}</span></div>
                          )}
                          <div className="col-span-2"><span className="text-muted-foreground">Logged:</span> <span className="font-medium">{new Date(call.createdAt).toLocaleString()}</span></div>
                        </div>
                        {call.notes && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Notes:</span>
                            <p className="mt-1 p-2 bg-muted/50 rounded text-foreground whitespace-pre-wrap">{call.notes}</p>
                          </div>
                        )}
                        {call.isCompleted && (
                          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* TIME CLOCK STATUS - only for own profile */}
        {!viewingOther && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Time Clock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeClock ? (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Currently Clocked In</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Since: {new Date(activeClock.clockIn).toLocaleString()}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3"
                    onClick={() => clockOutMut.mutate({ id: activeClock.id })}
                  >
                    Clock Out
                  </Button>
                </div>
              ) : (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Not currently clocked in</p>
                  <Button size="sm" onClick={() => clockInMut.mutate({})}>
                    <Clock className="h-4 w-4 mr-1" /> Start Work
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Viewed user info card (when admin views another user) */}
        {viewingOther && viewedUser && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">User Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Name</p>
                  <p className="font-medium">{viewedUser.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Role</p>
                  <p className="font-medium capitalize">{displayRole}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">{displayEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge variant={(viewedUser as any).isActive === 0 ? "destructive" : "default"}>
                    {(viewedUser as any).isActive === 0 ? "Locked" : "Active"}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Joined</p>
                  <p className="font-medium">{new Date((viewedUser as any).createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Performance Tier</p>
                  <TierBadge tier={tier} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
