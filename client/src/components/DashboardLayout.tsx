import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, Users, Car, Building2,
  Wrench, FileText, Calendar, Package, TrendingUp, Truck,
  QrCode, DollarSign, Armchair, ClipboardList, Clock, BarChart3, ScanLine,
  Home, ArrowLeft, Globe, MessageSquare, Banknote, Phone, Mail,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useViewAs } from "@/contexts/ViewAsContext";
import { trpc } from "@/lib/trpc";
import { Eye, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", section: "main" },
  { icon: ClipboardList, label: "Work Orders", path: "/work-orders", section: "main" },
  { icon: Wrench, label: "Job Board", path: "/job-board", section: "main" },
  { icon: QrCode, label: "Scan QR", path: "/scan", section: "main" },
  { icon: Calendar, label: "Calendar", path: "/calendar", section: "main" },
  { icon: Users, label: "Total Clients", path: "/total-clients", section: "main" },
  // Acme Automotive
  { icon: Car, label: "Vehicles", path: "/vehicles", section: "acme" },
  { icon: Building2, label: "Clients", path: "/clients", section: "acme" },
  { icon: FileText, label: "Invoices", path: "/invoices", section: "acme" },
  { icon: BarChart3, label: "Client Overview", path: "/client-overview", section: "acme" },
  { icon: MessageSquare, label: "Inquiries", path: "/inquiries", section: "acme" },
  { icon: ScanLine, label: "Scan Invoice", path: "/invoice-scanner", section: "acme" },
  // On-Site Advantage (building maintenance, plumbing, sign hanging, non-vehicle work)
  { icon: Wrench, label: "General Work", path: "/general-work", section: "onsite" },
  { icon: ClipboardList, label: "Work Orders", path: "/onsite-work-orders", section: "onsite" },
  { icon: FileText, label: "Invoices", path: "/onsite-invoices", section: "onsite" },
  { icon: Building2, label: "Clients", path: "/onsite-clients", section: "onsite" },
  { icon: MessageSquare, label: "Inquiries", path: "/onsite-inquiries", section: "onsite" },
  // Customized Enterprise (flipping for profit)
  { icon: ClipboardList, label: "Work Orders", path: "/custom-work-orders", section: "customized" },
  { icon: FileText, label: "Invoices", path: "/custom-invoices", section: "customized" },
  { icon: Building2, label: "Clients", path: "/custom-clients", section: "customized" },
  { icon: MessageSquare, label: "Inquiries", path: "/custom-inquiries", section: "customized" },
  { icon: Armchair, label: "Flip Projects", path: "/flip-projects", section: "customized" },
  { icon: Package, label: "Assets", path: "/assets", section: "customized" },
  { icon: Building2, label: "Homes by Beth Marie", path: "/real-estate", section: "customized" },
  // Operations
  { icon: Package, label: "Inventory", path: "/inventory", section: "ops" },
  { icon: Truck, label: "Driving Log", path: "/driving", section: "ops" },
  { icon: DollarSign, label: "Expenses", path: "/expenses", section: "ops" },
  { icon: TrendingUp, label: "Profitability", path: "/profitability", section: "ops" },
  { icon: Banknote, label: "Hour Bank", path: "/hour-bank", section: "ops" },
  // Operations - continued
  { icon: Clock, label: "Time Tracking", path: "/time-tracking", section: "ops" },
  { icon: Package, label: "Parts Tracker", path: "/parts-tracker", section: "ops" },
  { icon: TrendingUp, label: "Profit Tracker", path: "/profit-tracker", section: "ops" },
  // Admin
  { icon: Clock, label: "Time & Billing", path: "/time-billing", section: "admin" },
  { icon: Users, label: "Team", path: "/team", section: "admin" },
  { icon: ClipboardList, label: "Employee Tasks", path: "/employee-tasks", section: "admin" },
  { icon: DollarSign, label: "Pay", path: "/pay", section: "admin" },
  { icon: BarChart3, label: "Tech Performance", path: "/tech-performance", section: "admin" },
  { icon: Globe, label: "Customer Portal", path: "/portal", section: "admin", external: true },
  // Personal
  { icon: Home, label: "My Profile", path: "/my-profile", section: "personal" },
  { icon: Phone, label: "Phone Calls", path: "/phone-calls", section: "personal" },
  { icon: Mail, label: "Emails", path: "/my-profile?tab=emails", section: "personal" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <img src="/manus-storage/acme-badge-logo_8e92c66b.png" alt="Acme Automotive" className="h-24 w-24 rounded-xl object-cover" />
            <h1 className="text-2xl font-bold tracking-tight text-center">
              Acme Automotive Services
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Fleet management, work orders, and business tracking. Sign in to continue.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
          <div className="w-full border rounded-lg p-4 bg-muted/30">
            <p className="text-xs font-medium text-center mb-2">Install as App on Your Phone</p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>iPhone:</strong> Tap the Share button (box with arrow) → "Add to Home Screen"</p>
              <p><strong>Android:</strong> Tap the menu (3 dots) → "Add to Home Screen" or "Install App"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  useHeartbeat(); // Track user presence
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const realRole = user?.role || "user";
  const { effectiveRole, isImpersonating, canViewAs, setViewAs, exitViewAs, availableRoles, viewAsName } = useViewAs();
  // Use effectiveRole for all visibility decisions
  const userRole = effectiveRole;
  const isOwner = userRole === "owner";
  const isAdmin = userRole === "admin" || isOwner;
  const isTechnician = userRole === "technician";
  const isCustomer = userRole === "customer";
  // Subcontractors (role=user) see only their assigned work and scan
  const isSubcontractor = userRole === "user";
  // Fetch users for the "View As" user picker (only for admin/owner)
  const { data: allUsers } = trpc.user.list.useQuery(undefined, { enabled: canViewAs });

  const getVisibleItems = (sectionId: string) => {
    const items = menuItems.filter(i => i.section === sectionId);
    // Owner sees everything
    if (isOwner) return items;
    // Admin sees everything except Profitability and Time & Billing (financial totals)
    if (userRole === "admin") {
      if (sectionId === "ops") return items.filter(i => i.path !== "/profitability");
      if (sectionId === "admin") return items.filter(i => i.path !== "/time-billing");
      return items;
    }
    // Technician sees work-related pages
    if (isTechnician) {
      if (sectionId === "main") return items.filter(i => ["/", "/work-orders", "/job-board", "/scan", "/calendar", "/total-clients"].includes(i.path));
      if (sectionId === "acme") return items.filter(i => ["/vehicles", "/clients"].includes(i.path));
      if (sectionId === "onsite") return items;
      if (sectionId === "ops") return items.filter(i => ["/driving", "/hour-bank", "/time-tracking"].includes(i.path));
      if (sectionId === "personal") return items;
      return [];
    }
    // Customer sees minimal
    if (isCustomer) {
      if (sectionId === "main") return items.filter(i => ["/", "/work-orders"].includes(i.path));
      if (sectionId === "personal") return items;
      return [];
    }
    // Subcontractors see only Quick Access + On-Site Advantage + Driving
    if (sectionId === "main") return items.filter(i => ["/", "/work-orders", "/scan"].includes(i.path));
    if (sectionId === "onsite") return items;
    if (sectionId === "ops") return items.filter(i => i.path === "/driving");
    return [];
  };

  const renderSection = (sectionId: string, label: string) => {
    const items = getVisibleItems(sectionId);
    if (items.length === 0) return null;
    return (
      <>
        {!isCollapsed && (
          <p className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            {label}
          </p>
        )}
        {isCollapsed && <Separator className="my-2 mx-2" />}
        {items.map(item => {
          const isActive = location === item.path;
          return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                isActive={isActive}
                onClick={() => {
                  if ((item as any).external) {
                    window.open(item.path, '_blank');
                  } else {
                    setLocation(item.path);
                  }
                }}
                tooltip={item.label}
                className="h-9 transition-all font-normal"
              >
                <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </>
    );
  };

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-10 w-10 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                <img src="/manus-storage/acme-badge-logo_8e92c66b.png" alt="Acme" className="h-9 w-9 rounded-lg object-cover" />
              </button>
              {!isCollapsed && (
                <span className="font-bold tracking-tight truncate text-sm">
                  Acme Automotive
                </span>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
            <SidebarMenu className="px-2 py-1">
              {renderSection("main", "Quick Access")}
              {renderSection("acme", "Acme Automotive")}
              {renderSection("onsite", "On-Site Advantage")}
              {renderSection("customized", "Customized Enterprise")}
              {renderSection("ops", "Operations")}
              {isAdmin && renderSection("admin", "Admin")}
              {renderSection("personal", "Personal")}
            </SidebarMenu>
          </SidebarContent>

          {/* View As Selector - only for admin/owner */}
          {canViewAs && !isCollapsed && (
            <div className="px-3 pb-2">
              <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50/50 p-2.5">
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye className="h-4 w-4 text-indigo-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">View As User</span>
                  {isImpersonating && (
                    <button onClick={exitViewAs} className="ml-auto p-0.5 rounded hover:bg-destructive/10 transition-colors" title="Exit View As">
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  )}
                </div>
                <Select
                  value={isImpersonating ? effectiveRole : ""}
                  onValueChange={(val) => {
                    if (val === "__exit") { exitViewAs(); return; }
                    // Check if it's a user id (number)
                    const selectedUser = allUsers?.find((u: any) => String(u.id) === val);
                    if (selectedUser) {
                      setViewAs(selectedUser.role, selectedUser.name);
                    } else {
                      setViewAs(val);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select role or user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(r => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                    {allUsers && allUsers.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground border-t mt-1 pt-1">By User</div>
                        {allUsers
                          .filter((u: any) => {
                            // Admin cannot view as owner
                            if (realRole === "admin" && u.role === "owner") return false;
                            // Don't show self
                            if (u.id === user?.id) return false;
                            return true;
                          })
                          .map((u: any) => (
                            <SelectItem key={`user-${u.id}`} value={String(u.id)} className="text-xs">
                              {u.name} ({u.role})
                            </SelectItem>
                          ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-8 w-8 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {realRole === "owner" ? "Owner" : realRole === "admin" ? "Admin" : realRole === "technician" ? "Technician" : realRole === "customer" ? "Customer" : "User"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-1">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              {location !== "/" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => window.history.back()}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <span className="tracking-tight text-foreground font-medium text-sm truncate">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setLocation("/")}
            >
              <Home className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!isMobile && location !== "/" && (
          <div className="flex items-center gap-2 px-6 pt-4 pb-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-muted-foreground hover:text-foreground"
              onClick={() => setLocation("/")}
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Button>
          </div>
        )}
        {isImpersonating && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Viewing as: {viewAsName || effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1)}
              </span>
            </div>
            <button
              onClick={exitViewAs}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-1 rounded transition-colors"
            >
              Exit View
            </button>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
