import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Users, Building2, Filter, Save } from "lucide-react";

const BRANCHES = [
  { key: "acme_automotive", label: "Acme Automotive", color: "bg-blue-500" },
  { key: "on_site_advantage", label: "On-Site Advantage", color: "bg-emerald-500" },
  { key: "customized_enterprise", label: "Customized Enterprise", color: "bg-purple-500" },
] as const;

export default function TotalClients() {
  const { data: clients, isLoading } = trpc.client.list.useQuery();
  const [search, setSearch] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>(() => {
    const saved = localStorage.getItem("acme-total-clients-branches");
    return saved ? JSON.parse(saved) : BRANCHES.map(b => b.key);
  });

  useEffect(() => {
    localStorage.setItem("acme-total-clients-branches", JSON.stringify(selectedBranches));
  }, [selectedBranches]);

  const toggleBranch = (key: string) => {
    setSelectedBranches(prev =>
      prev.includes(key) ? prev.filter(b => b !== key) : [...prev, key]
    );
  };

  const selectAll = () => setSelectedBranches(BRANCHES.map(b => b.key));
  const selectNone = () => setSelectedBranches([]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((client: any) => {
      const matchesSearch = !search ||
        client.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        client.contactName?.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase());
      const matchesBranch = selectedBranches.length === 0 ||
        selectedBranches.includes(client.businessLine || "acme_automotive");
      return matchesSearch && matchesBranch;
    });
  }, [clients, search, selectedBranches]);

  const branchCounts = useMemo(() => {
    if (!clients) return {};
    const counts: Record<string, number> = {};
    clients.forEach((c: any) => {
      const bl = c.businessLine || "acme_automotive";
      counts[bl] = (counts[bl] || 0) + 1;
    });
    return counts;
  }, [clients]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-40 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Total Clients
        </h1>
        <p className="text-muted-foreground mt-1">
          All clients across all branches — {clients?.length || 0} total
        </p>
      </div>

      {/* Branch Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Branch Filter
            <span className="text-xs text-muted-foreground ml-2">(saved automatically)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            {BRANCHES.map(branch => (
              <label key={branch.key} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedBranches.includes(branch.key)}
                  onCheckedChange={() => toggleBranch(branch.key)}
                />
                <span className={`w-3 h-3 rounded-full ${branch.color}`} />
                <span className="text-sm">{branch.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {branchCounts[branch.key] || 0}
                </Badge>
              </label>
            ))}
            <div className="flex gap-2 ml-auto">
              <Button variant="ghost" size="sm" onClick={selectAll}>All</Button>
              <Button variant="ghost" size="sm" onClick={selectNone}>None</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name, contact, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredClients.length} of {clients?.length || 0} clients
      </p>

      {/* Client List */}
      <div className="grid gap-3">
        {filteredClients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No clients match your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client: any) => {
            const branch = BRANCHES.find(b => b.key === (client.businessLine || "acme_automotive"));
            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ backgroundColor: client.color || "#6366f1" }}
                      >
                        {client.companyName?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{client.companyName}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {client.contactName} {client.email && `• ${client.email}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {branch && (
                        <Badge variant="outline" className="text-xs">
                          <span className={`w-2 h-2 rounded-full ${branch.color} mr-1.5`} />
                          {branch.label}
                        </Badge>
                      )}
                      <Badge variant={client.clientType === "emergency" ? "destructive" : "secondary"} className="text-xs">
                        {client.clientType || "regular"}
                      </Badge>
                    </div>
                  </div>
                  {(client.phone || client.address) && (
                    <div className="mt-2 ml-13 text-sm text-muted-foreground flex flex-wrap gap-4">
                      {client.phone && <span>📞 {client.phone}</span>}
                      {client.address && <span>📍 {client.address}</span>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
