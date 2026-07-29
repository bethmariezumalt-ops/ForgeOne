# Implementation Notes (Remaining Work)

## Completed in this session:
1. Phone call assignment - added `assignedTo` field to schema, router, and form
2. Button renamed from "Log Call" to "Submit"
3. Employee dropdown added to phone call form

## Still TODO:
### Role-Based Billing Controls on WorkOrders.tsx
- Owner: Can see and edit hourly rates, charge amounts, AND assign employees
- Admin: Can assign employees via dropdown, but CANNOT edit rates/prices
- Technician: Can only see/select hours dropdowns, NO price/billing info visible
- Need to use `useViewAs()` or `useAuth()` to get effectiveRole and conditionally show/hide fields

### Calendar Employee Assignment + Views
- Calendar.tsx needs:
  1. Add `assignedTo` field to calendar_events table (or it may already exist)
  2. Add employee dropdown when creating/editing events
  3. Proper Day view with hourly time slots
  4. Proper Week view with 7 columns and time slots
  5. Proper Month view with event dots/previews
  6. View switcher (Day | Week | Month)

### Sidebar Scrollbar
- Already added overflow-y-auto and scrollbar CSS utility classes to DashboardLayout

### Previous batch items already done:
- Total Clients page with branch filter checkboxes
- Employee Tasks page showing each employee's upcoming jobs
- Clickable call log history with expandable details
- ClipboardList icon imported for Employee Tasks nav item
