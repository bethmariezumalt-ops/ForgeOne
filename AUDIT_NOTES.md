# Business Line Mirroring Audit

## Current State

### Acme Automotive (section: "acme")
- Vehicles (/vehicles)
- Clients (/clients) 
- Invoices (/invoices)
- Client Overview (/client-overview)
- Inquiries (/inquiries)
- Scan Invoice (/invoice-scanner)
- **MISSING: Phone Calls, Emails**

### On-Site Advantage (section: "onsite")
- General Work (/general-work)
- Work Orders (/onsite-work-orders)
- Invoices (/onsite-invoices)
- Clients (/onsite-clients)
- Inquiries (/onsite-inquiries)
- **MISSING: Client Overview, Scan Invoice, Phone Calls, Emails**

### Customized Enterprise (section: "customized")
- Work Orders (/custom-work-orders)
- Invoices (/custom-invoices)
- Clients (/custom-clients)
- Inquiries (/custom-inquiries)
- Flip Projects (/flip-projects)
- Assets (/assets)
- Homes by Beth Marie (/real-estate)
- **MISSING: Client Overview, Scan Invoice, Phone Calls, Emails**

## Target: Each business line should have:
1. Work Orders (already done via BranchWorkOrders)
2. Invoices (already done via BranchInvoices)
3. Clients (already done via BranchClients)
4. Client Overview (needs branch-filtered version)
5. Inquiries (already done via BranchInquiries)
6. Scan Invoice (can reuse InvoiceScanner with businessLine prop)
7. Phone Calls (link to /phone-calls?branch=X or filtered version)
8. Emails (link to emails filtered by branch)

## Top-level pages needing business line filter dropdown:
- Work Orders (/work-orders) - ALREADY HAS branchFilter
- Invoices (/invoices) - ALREADY HAS branchFilter
- Inquiries (/inquiries) - NEEDS branchFilter added
- Client Overview (/client-overview) - NEEDS branchFilter added
- Phone Calls (/phone-calls) - ALREADY HAS businessLine filter
- Dashboard (/) - NEEDS overall business line filter

## Pattern for branch pages:
- BranchWorkOrders, BranchInvoices, BranchClients, BranchInquiries accept props:
  { branchKey: string, branchName: string, branchColor: string }
- In App.tsx, wrapper components pass the props:
  function OnsiteWorkOrders() { return <BranchWorkOrders branchKey="on_site_advantage" branchName="On-Site Advantage" branchColor="bg-emerald-600 hover:bg-emerald-700" />; }

## Branch keys:
- acme_automotive
- on_site_advantage
- customized_enterprise
