import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

export default function Profitability() {
  const { data: invoices, isLoading: loadingInv } = trpc.invoice.list.useQuery();
  const { data: expenses, isLoading: loadingExp } = trpc.expense.list.useQuery();
  const { data: flips } = trpc.flipProject.list.useQuery();

  if (loadingInv || loadingExp) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  const totalRevenue = invoices?.reduce((sum: number, inv: any) => sum + parseFloat(inv.total || inv.totalAmount || "0"), 0) ?? 0;
  const totalExpenses = expenses?.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || "0"), 0) ?? 0;
  const flipProfit = flips?.filter((f: any) => f.status === "sold").reduce((sum: number, f: any) => sum + (parseFloat(f.salePrice || "0") - parseFloat(f.purchasePrice || "0") - parseFloat(f.materialsCost || "0") - parseFloat(f.laborCost || "0")), 0) ?? 0;
  const netProfit = totalRevenue + flipProfit - totalExpenses;

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  expenses?.forEach((exp: any) => {
    const cat = exp.category || "other";
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + parseFloat(exp.amount || "0");
  });

  // Group revenue by business line (from notes field)
  const revenueByBusiness: Record<string, number> = {
    "Acme Automotive": 0,
    "On-Site Advantage": 0,
    "Customized Enterprise": 0,
  };
  invoices?.forEach((inv: any) => {
    revenueByBusiness["Acme Automotive"] += parseFloat(inv.total || inv.totalAmount || "0");
  });
  if (flipProfit > 0) revenueByBusiness["Customized Enterprise"] = flipProfit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profitability</h1>
        <p className="text-muted-foreground mt-1">Financial overview across all business lines</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-xl font-bold text-green-700">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-xl font-bold text-red-700">${totalExpenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flip Profit</p>
                <p className="text-xl font-bold text-purple-700">${flipProfit.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={netProfit >= 0 ? "border-green-200" : "border-red-200"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${netProfit >= 0 ? "bg-green-100" : "bg-red-100"}`}>
                <DollarSign className={`h-5 w-5 ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Profit</p>
                <p className={`text-xl font-bold ${netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>${netProfit.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Business Line */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Revenue by Business Line</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(revenueByBusiness).map(([biz, amount]) => (
              <div key={biz} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${biz === "Acme Automotive" ? "bg-blue-500" : biz === "On-Site Advantage" ? "bg-green-500" : "bg-purple-500"}`} />
                  <span className="text-sm font-medium">{biz}</span>
                </div>
                <span className="font-semibold">${amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses by Category */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Expenses by Category</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
              <div key={cat} className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize">{cat.replace(/_/g, " ")}</Badge>
                <span className="font-medium text-red-600">-${amount.toFixed(2)}</span>
              </div>
            ))}
            {Object.keys(expensesByCategory).length === 0 && (
              <p className="text-muted-foreground text-center py-4">No expenses recorded yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flip Projects Summary */}
      {flips && flips.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Flip Projects</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flips.map((flip: any) => (
                <div key={flip.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{flip.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{flip.flipType} • {flip.status}</p>
                  </div>
                  {flip.status === "sold" ? (
                    <span className="font-semibold text-green-600">
                      +${(parseFloat(flip.salePrice || "0") - parseFloat(flip.purchasePrice || "0") - parseFloat(flip.materialsCost || "0") - parseFloat(flip.laborCost || "0")).toFixed(2)}
                    </span>
                  ) : (
                    <Badge variant="secondary">{flip.status}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
