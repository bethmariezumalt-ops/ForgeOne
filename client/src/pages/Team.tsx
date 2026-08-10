import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield, Wrench, Copy, Lock, Unlock, Activity, Circle, Eye, Plus, UserPlus, Trash2, Trophy, Star } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ExternalLink, MessageSquare } from "lucide-react";

export default function Team() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const { data: allUsers, isLoading, refetch } = trpc.user.list.useQuery();
  const { data: workOrders } = trpc.workOrder.list.useQuery();
  const { data: onlineUsers } = trpc.activity.onlineUsers.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  const { data: recentActivity } = trpc.activity.recent.useQuery(
    { limit: 30 },
    { enabled: isAdmin, refetchInterval: 60000 }
  );
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { data: userActivity } = trpc.activity.byUser.useQuery(
    { userId: selectedUserId!, limit: 20 },
    { enabled: isAdmin && !!selectedUserId }
  );

  const updateRoleMutation = trpc.user.updateRole.useMutation({
    onSuccess: () => { refetch(); toast.success("Role updated"); },
    onError: () => toast.error("Failed to update role"),
  });
  const updateTierMutation = trpc.techPerformance.updateTier.useMutation({
    onSuccess: () => { refetch(); toast.success("Performance tier updated"); },
    onError: () => toast.error("Failed to update tier"),
  });
  const updateLevelMutation = trpc.techPerformance.updateLevel.useMutation({
    onSuccess: () => { refetch(); toast.success("Experience level updated"); },
    onError: () => toast.error("Failed to update level"),
  });
  const toggleActiveMutation = trpc.user.toggleActive.useMutation({
    onSuccess: () => { refetch(); toast.success("Account status updated"); },
    onError: (err) => toast.error(err.message || "Failed to update account status"),
  });
  const createInviteMutation = trpc.user.createInvite.useMutation({
    onSuccess: (data) => { refetchInvites(); toast.success(`Profile created! Invite code: ${data.inviteCode}`); setCreateOpen(false); setNewProfile({ name: "", role: "user", email: "" }); },
    onError: (err) => toast.error(err.message || "Failed to create profile"),
  });
  const deleteInviteMutation = trpc.user.deleteInvite.useMutation({
    onSuccess: () => { refetchInvites(); toast.success("Invite deleted"); },
  });
  const { data: invites, refetch: refetchInvites } = trpc.user.listInvites.useQuery(undefined, { enabled: isAdmin });
  const [createOpen, setCreateOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: "", role: "user", email: "" });

  const inviteUrl = getLoginUrl();

  // Build a set of online user IDs for quick lookup
  const onlineUserIds = useMemo(() => {
    return new Set((onlineUsers || []).map((u: any) => u.id));
  }, [onlineUsers]);

  const roleIcons: Record<string, React.ReactNode> = {
    owner: <Shield className="h-4 w-4 text-purple-600" />,
    admin: <Shield className="h-4 w-4 text-blue-600" />,
    technician: <Wrench className="h-4 w-4 text-green-600" />,
    customer: <Users className="h-4 w-4 text-amber-600" />,
    user: <Users className="h-4 w-4 text-gray-600" />,
  };

  const roleBadgeColors: Record<string, string> = {
    owner: "bg-purple-100 text-purple-800",
    admin: "bg-blue-100 text-blue-800",
    technician: "bg-green-100 text-green-800",
    customer: "bg-amber-100 text-amber-800",
    user: "bg-gray-100 text-gray-800",
  };

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">Manage employees, roles, access & monitor activity</p>
        </div>
        {isAdmin && onlineUsers && (
          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
            <Circle className="h-2 w-2 mr-1 fill-green-500 text-green-500" />
            {onlineUsers.length} Online
          </Badge>
        )}
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members"><Users className="h-4 w-4 mr-1" /> Members</TabsTrigger>
          {isAdmin && <TabsTrigger value="activity"><Activity className="h-4 w-4 mr-1" /> Activity</TabsTrigger>}
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          {/* Create User Profile */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Create User Profiles</CardTitle>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Create Profile</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create User Profile</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Create a profile that a new user can claim by logging in with the invite link.</p>
                    <div className="space-y-3 mt-2">
                      <div><Label>Name</Label><Input value={newProfile.name} onChange={e => setNewProfile(p => ({...p, name: e.target.value}))} placeholder="Employee name" /></div>
                      <div><Label>Email (optional)</Label><Input value={newProfile.email} onChange={e => setNewProfile(p => ({...p, email: e.target.value}))} placeholder="employee@email.com" /></div>
                      <div>
                        <Label>Role</Label>
                        <Select value={newProfile.role} onValueChange={v => setNewProfile(p => ({...p, role: v}))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="technician">Technician</SelectItem>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full" onClick={() => createInviteMutation.mutate({ name: newProfile.name, role: newProfile.role as any, email: newProfile.email || undefined })} disabled={!newProfile.name || createInviteMutation.isPending}>
                        {createInviteMutation.isPending ? "Creating..." : "Create Profile & Generate Invite"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Create a profile with a name and role. Share the invite link below so they can log in and claim their account.
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">How it works:</p>
                <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                  <li>Create a profile below (name + role)</li>
                  <li>Copy the invite link and send it to the person</li>
                  <li>They click the link, log in, and their account is activated</li>
                </ol>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <code className="flex-1 min-w-0 p-2 bg-muted rounded text-xs truncate">{inviteUrl}</code>
                <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast.success("Login link copied!"); }}>
                  <Copy className="h-4 w-4 mr-1" />Copy Link
                </Button>
              </div>
              {/* Pending Invites */}
              {invites && invites.filter((inv: any) => inv.status === "pending").length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Pending Profiles (waiting to be claimed)</p>
                  {invites.filter((inv: any) => inv.status === "pending").map((inv: any) => {
                    const invLink = `${inviteUrl}?invite=${inv.inviteCode}`;
                    return (
                      <div key={inv.id} className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <UserPlus className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="text-sm font-medium">{inv.name}</span>
                          <Badge className={roleBadgeColors[inv.role] || "bg-gray-100"}>{inv.role}</Badge>
                          {inv.email && <span className="text-xs text-muted-foreground">{inv.email}</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <code className="text-[10px] bg-muted px-2 py-1 rounded flex-1 min-w-0 truncate">{invLink}</code>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(invLink); toast.success(`Invite link for ${inv.name} copied!`); }}>
                            <Copy className="h-3 w-3 mr-1" />Copy
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); window.open(`sms:${inv.email || ""}?body=You've been invited to join Acme Fleet! Click here to set up your account: ${encodeURIComponent(invLink)}`); }}>
                            <MessageSquare className="h-3 w-3 mr-1" />Text
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); window.open(`mailto:${inv.email || ""}?subject=You're invited to Acme Fleet&body=Hi ${inv.name},%0A%0AYou've been invited to join Acme Fleet. Click the link below to set up your account:%0A%0A${encodeURIComponent(invLink)}`); }}>
                            <ExternalLink className="h-3 w-3 mr-1" />Email
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); deleteInviteMutation.mutate({ id: inv.id }); }}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Members List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Team Members ({allUsers?.length ?? 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allUsers?.map((member: any) => {
                  const isOnline = onlineUserIds.has(member.id);
                  return (
                    <div key={member.id} className={`flex items-center justify-between p-4 rounded-lg border hover:bg-accent/30 transition-colors cursor-pointer ${member.isActive === 0 ? "opacity-60 bg-red-50/30" : ""}`} onClick={() => setLocation(member.id === user?.id ? "/my-profile" : `/team/${member.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            {roleIcons[member.role] || <Users className="h-4 w-4" />}
                          </div>
                          {/* Online indicator dot */}
                          {isAdmin && (
                            <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{member.name || "Unnamed User"}</p>
                            {isOnline && isAdmin && (
                              <span className="text-[10px] text-green-600 font-medium uppercase">Online</span>
                            )}
                            {member.performanceTier && member.performanceTier !== "trainee" && (
                              <Badge variant="outline" className="text-[10px] capitalize border-amber-300 text-amber-700">
                                <Trophy className="h-2.5 w-2.5 mr-0.5" />{member.performanceTier}
                              </Badge>
                            )}
                            {member.experienceLevel && (
                              <Badge variant="secondary" className="text-[10px] capitalize">
                                <Star className="h-2.5 w-2.5 mr-0.5" />{member.experienceLevel}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {member.email || "No email"} • Joined {new Date(member.createdAt).toLocaleDateString()}
                            {member.lastSeen && isAdmin && (
                              <> • Last seen {new Date(member.lastSeen).toLocaleString()}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {member.isActive === 0 && (
                          <Badge className="bg-red-100 text-red-700">Locked</Badge>
                        )}
                        {member.id === user?.id ? (
                          <Badge className={roleBadgeColors[member.role]}>You ({member.role})</Badge>
                        ) : (
                          <>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={(e) => { e.stopPropagation(); setSelectedUserId(member.id); }}
                                title="View activity"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                            {/* Performance Tier - Owner only */}
                            {user?.role === "owner" && ["technician", "admin"].includes(member.role) && (
                              <Select
                                value={member.performanceTier || "trainee"}
                                onValueChange={(value) => updateTierMutation.mutate({ userId: member.id, tier: value as any })}
                              >
                                <SelectTrigger className="w-[110px] h-8 text-xs">
                                  <Trophy className="h-3 w-3 mr-1 text-amber-500" /><SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="titanium">Titanium</SelectItem>
                                  <SelectItem value="platinum">Platinum</SelectItem>
                                  <SelectItem value="gold">Gold</SelectItem>
                                  <SelectItem value="silver">Silver</SelectItem>
                                  <SelectItem value="bronze">Bronze</SelectItem>
                                  <SelectItem value="trainee">Trainee</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {/* Experience Level - Admin/Owner */}
                            {isAdmin && ["technician", "admin"].includes(member.role) && (
                              <Select
                                value={member.experienceLevel || "trainee"}
                                onValueChange={(value) => updateLevelMutation.mutate({ userId: member.id, level: value as any })}
                              >
                                <SelectTrigger className="w-[120px] h-8 text-xs">
                                  <Star className="h-3 w-3 mr-1 text-blue-500" /><SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="expert">Expert</SelectItem>
                                  <SelectItem value="master">Master</SelectItem>
                                  <SelectItem value="senior">Senior</SelectItem>
                                  <SelectItem value="journeyman">Journeyman</SelectItem>
                                  <SelectItem value="apprentice">Apprentice</SelectItem>
                                  <SelectItem value="trainee">Trainee</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {/* Role selector */}
                            <Select
                              value={member.role}
                              onValueChange={(value) => updateRoleMutation.mutate({ id: member.id, role: value as any })}
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="technician">Technician</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                              </SelectContent>
                            </Select>
                            </div>
                            {/* Hide lock button if target is owner and current user is admin or owner */}
                            {!(member.role === "owner" && (user?.role === "admin" || user?.role === "owner")) && (
                              <Button
                                variant={member.isActive === 0 ? "default" : "destructive"}
                                size="sm"
                                className="h-8"
                                onClick={(e) => { e.stopPropagation(); toggleActiveMutation.mutate({ id: member.id, isActive: member.isActive === 0 }); }}
                              >
                                {member.isActive === 0 ? <><Unlock className="h-3 w-3 mr-1" />Unlock</> : <><Lock className="h-3 w-3 mr-1" />Lock</>}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Role Descriptions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Access Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-sm">Owner</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Full access: all features including financial totals, profitability reports, and time billing analysis.</p>
                </div>
                <div className="p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">Admin</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Management access: enter/edit invoices, work orders, clients, employees. Cannot see financial totals or profitability.</p>
                </div>
                <div className="p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-sm">Technician</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Field access: scan QR codes, create work orders, log time, view vehicles and clients, driving log.</p>
                </div>
                <div className="p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-amber-600" />
                    <span className="font-medium text-sm">Customer</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Client access: view their own work orders, quotes, and completed work on their vehicles.</p>
                </div>
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm">User (Default)</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Limited access: assigned work and on-site jobs only. Default for new members until promoted.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Work Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{workOrders?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50">
                  <p className="text-2xl font-bold text-amber-700">{workOrders?.filter((wo: any) => wo.status === "pending_approval").length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Pending Approval</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50">
                  <p className="text-2xl font-bold text-blue-700">{workOrders?.filter((wo: any) => wo.status === "in_progress").length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-green-700">{workOrders?.filter((wo: any) => wo.status === "completed").length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab (Admin Only) */}
        {isAdmin && (
          <TabsContent value="activity" className="space-y-6">
            {/* User Activity Detail (when a user is selected) */}
            {selectedUserId && userActivity && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Activity: {allUsers?.find((u: any) => u.id === selectedUserId)?.name || "User"}
                      </CardTitle>
                      <CardDescription>Recent actions and page views</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUserId(null)}>Clear</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {userActivity.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {userActivity.map((entry: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <Activity className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{entry.action}</span>
                            {entry.entityTitle && <span className="text-muted-foreground">- {entry.entityTitle}</span>}
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No activity recorded for this user.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent Activity Feed */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Activity Feed</CardTitle>
                <CardDescription>All team activity across the system</CardDescription>
              </CardHeader>
              <CardContent>
                {recentActivity && recentActivity.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recentActivity.map((entry: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                              <Activity className="h-3 w-3" />
                            </div>
                            {onlineUserIds.has(entry.userId) && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-green-500" />
                            )}
                          </div>
                          <div>
                            <span className="font-medium">{entry.userName || `User #${entry.userId}`}</span>
                            <span className="text-muted-foreground ml-1">{entry.action}</span>
                            {entry.entityTitle && <span className="text-muted-foreground"> - {entry.entityTitle}</span>}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No activity recorded yet. Activity will appear as team members use the system.</p>
                )}
              </CardContent>
            </Card>

            {/* Online Users Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Currently Online</CardTitle>
                <CardDescription>Users active in the last 5 minutes</CardDescription>
              </CardHeader>
              <CardContent>
                {onlineUsers && onlineUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {onlineUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-green-50">
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                        <span className="text-sm font-medium">{u.name || "Unnamed"}</span>
                        <Badge variant="outline" className="text-xs">{u.role}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No users currently online.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
