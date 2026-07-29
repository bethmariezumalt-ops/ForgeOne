# Project TODO

## Database & Schema
- [x] Create clients table (company name, address, contact info)
- [x] Create vehicles table (VIN, year, make, model, mileage, client_id, vehicle type)
- [x] Create service_categories table (predefined service types)
- [x] Create work_orders table (vehicle_id, technician_id, status, services, notes, mileage_at_service)
- [x] Create work_order_items table (work_order_id, service_category_id, description, cost)
- [x] Create invoices table (work_order_id, invoice_number, total, status)
- [x] Create maintenance_schedules table (vehicle_id, service type, interval_miles, interval_days, last_performed)
- [x] Add role field to users (admin vs technician)

## API Endpoints
- [x] CRUD for clients
- [x] CRUD for vehicles
- [x] CRUD for work orders (create, update status, list by vehicle/technician)
- [x] Invoice generation from work orders
- [x] Maintenance schedule CRUD and due-soon queries
- [x] QR code generation endpoint for vehicles
- [x] Vehicle lookup by VIN (for QR scan)

## Admin Dashboard (Office/You)
- [x] Dashboard overview with stats (pending work orders, overdue maintenance, recent activity)
- [x] Client management page (add/edit/delete companies)
- [x] Vehicle management page (add/edit vehicles, assign to clients)
- [x] Work order review and approval page
- [x] Invoice generation and viewing page
- [x] QR code generation and download page
- [x] Employee/user management page
- [x] Maintenance schedule configuration page

## Technician Mobile Interface (Field)
- [x] QR code scanner using device camera
- [x] Vehicle info display after scan (history, upcoming maintenance)
- [x] Work order creation form with service checkboxes/dropdowns
- [x] Mileage input on scan
- [x] View assigned/pending work orders

## QR Code System
- [x] Generate unique QR codes per vehicle (linked to VIN)
- [x] QR codes resolve to mobile-friendly vehicle page
- [x] Downloadable/printable QR code images

## Service Categories
- [x] Brake jobs
- [x] Oil changes
- [x] Wiper replacement
- [x] Transmission work
- [x] DOT inspections
- [x] Safety inspections
- [x] CHP form maintenance
- [x] Building maintenance
- [x] Plumbing
- [x] Sign hanging
- [x] General maintenance
- [x] Other (custom description)

## Authentication & Roles
- [x] Admin role with full access
- [x] Technician role with field access
- [x] Role-based route protection
- [x] User management (invite/add employees)

## Expanded Service Categories (All Vehicle/Truck Maintenance)
- [x] Add comprehensive service categories covering all vehicle types (new/old, trucks, vans, cars)
- [x] Include "Needs to Source Out" field on work order items for work that must be sent to a specialist
- [x] Engine & Drivetrain: engine repair, transmission, axles, bearings, driveshaft, differential, clutch, motor mounts
- [x] Brakes: brake pads, brake rotors, brake drums, brake lines, brake fluid flush, parking brake
- [x] Cooling & HVAC: AC repair, AC recharge, heater core, radiator, thermostat, coolant flush, fan belt
- [x] Electrical: battery, alternator, starter, wiring, fuses, lighting, turn signals, headlights, tail lights
- [x] Suspension & Steering: shocks, struts, ball joints, tie rods, power steering, wheel alignment, springs, bushings
- [x] Exhaust: exhaust pipe, muffler, catalytic converter, exhaust manifold
- [x] Fluids & Filters: oil change, transmission fluid, power steering fluid, brake fluid, air filter, fuel filter, cabin filter
- [x] Belts & Hoses: serpentine belt, timing belt, radiator hose, heater hose, vacuum lines
- [x] Body & Exterior: windshield wipers, mirrors, door handles, locks, weatherstripping
- [x] DOT/Safety: DOT inspection, safety inspection, CHP forms, fire extinguisher, reflectors, emergency kit
- [x] Building Maintenance: plumbing, electrical, sign hanging, painting, general repairs, HVAC building
- [x] Items NOT done (source out): glass, tires, specialty welding, body/paint work

## Non-Vehicle Work (No QR Code Required)
- [x] Add a "General Work" button on technician's phone (no QR scan needed)
- [x] Non-vehicle work order form with categories: building maintenance, plumbing, electrical, sign hanging, painting, landscaping, general labor, other
- [x] Include client/location selector, description field, and time/materials tracking
- [x] Track non-vehicle work separately but in same invoicing system
- [x] Allow photos/notes for non-vehicle jobs

## Non-Vehicle Work - Invoice & Charge Features
- [x] Description text box for what Tony was hired to do
- [x] Charge amount field (what he wants to charge for the job)
- [x] Generate printable/emailable invoice from non-vehicle work orders
- [x] Email invoice directly to client from the app (via mailto: link)
- [x] Print-friendly invoice format (PDF or print view)

## Parts Tracking & Cost Management
- [x] Parts inventory/order tracking (part name, part number, vendor, quantity)
- [x] Track cost of parts (what you paid) vs. charge to client (markup)
- [x] Link parts to specific work orders
- [x] Parts cost summary per job

## Profitability Tracking
- [x] Revenue tracking (what is billed to clients)
- [x] Cost tracking (parts cost, labor cost, overhead)
- [x] Profit margin per job, per client, and overall
- [x] Profitability dashboard/reports

## Employee Pay Tracking
- [x] Employee hourly rate / pay rate configuration
- [x] Track hours worked per job / per day
- [x] Payment records (date paid, amount, period)
- [x] Labor cost calculation per work order

## Inventory Tracking
- [x] Inventory items table (wipers, oil filters, oil, supplies)
- [x] Track quantity on hand, reorder level, cost per unit
- [x] Log when inventory is used on a job (deduct from stock)
- [x] Track business vehicle/tool maintenance as expenses (Tony's truck tires, oil pump, tools)
- [x] Separate category for "business equipment maintenance" vs client job parts

## Driving Hours & Location Tracking
- [x] Log driving hours per day / per job
- [x] Track which jobs are at which location/address
- [x] Mileage tracking for Tony's truck (business miles)

## Client Types & Emergency Jobs
- [x] Client type field: regular vs one-time/emergency
- [x] Quick-add for emergency roadside service calls (no QR needed)
- [x] One-off jobs for non-regular clients (Frey, etc.)
- [x] Pre-loaded clients: Buhler, Fisher Tile, coffee company (via 'Load Starter Clients' button)

## Calendar & Scheduling
- [x] Calendar view showing scheduled workdays at regular clients
- [x] Recurring schedule support (e.g., Monday = Buhler, Tuesday = Fisher Tile)
- [x] Marketing days — blocked time for finding new clients / picking up side work
- [x] Side gig / expansion job tracking (one-off opportunities outside regular fleet work)
- [x] Day types: regular client work, marketing/prospecting, side gig, off day
- [x] Ability to add/move/reschedule calendar events

## Color Coding & Priority System
- [x] Color code clients (each client gets a unique color for quick identification)
- [x] Color code service types (brakes=red, oil=amber, maintenance=blue, electrical=yellow, etc.)
- [x] Priority ratings on work orders: emergency, high, medium, low
- [x] Dashboard priority view — sorted by urgency, color-coded at a glance
- [x] Emergency jobs highlighted prominently vs routine maintenance

## Multiple Business Lines
- [x] Support multiple businesses: Acme Automotive, Customized Enterprise, On-Site Advantage
- [x] Business line selector on work orders and expenses
- [x] Profitability tracking per business line
- [x] Flip project tracker: purchase cost, materials, labor, resale price, profit per piece

## Business Lines (Corrected)
- [x] Acme Automotive — fleet vehicle maintenance (Holman, DOT, CHP)
- [x] Customized Enterprise — flipping (furniture, vehicles, houses, other)
- [x] On-Site Advantage — building maintenance, plumbing, sign hanging, on-site work
- [x] Business line selector on all work orders, expenses, and calendar events
- [x] Profitability dashboard shows all three businesses with combined and individual views

## Customized Enterprise (Corrected Scope)
- [x] Customized Enterprise = flipping anything for profit (not just furniture)
- [x] Flip project types: furniture, vehicles, houses/real estate, other
- [x] Rename "furniture_projects" to "flip_projects" with a type selector
- [x] Track: purchase cost, materials, labor, resale price, profit per flip
- [x] Status: purchased, in-progress, listed, sold

## Enhanced Dashboard
- [x] Pie/bar chart showing work orders by timeframe (today, this week, this month, next week)
- [x] Field hours vs office hours graph
- [x] Phone calls to-do list
- [x] Parts to order queue
- [x] Marketing task queue

## Role-Specific Dashboards
- [x] Admin dashboard: full overview, charts, financials, phone calls list, parts queue, marketing queue
- [x] Technician dashboard: assigned jobs today/week, priority list, QR scanner quick access, driving log
- [x] Subcontractor view: limited nav visibility (role=user sees only assigned work pages)
- [x] Note: Backend currently allows any authenticated user to access data; full data-level isolation would require additional work order assignment filtering
- [x] Each person sees their own dashboard based on role

## Stats & Business Health (for selling/remote management)
- [x] Business health metrics on dashboard (active clients, jobs completed, invoices sent, inventory items)
- [x] Revenue and profit tracking
- [x] Work order completion rates

## On-Site Advantage Visibility Fix
- [x] Rename "General Work" to "On-Site Advantage" in sidebar navigation
- [x] Add On-Site Advantage as its own section in the sidebar (separate from Quick Access)
- [x] Make it clear this is for building maintenance, plumbing, sign hanging, and all non-vehicle work

## Time & Billing Analysis (Backdoor Dashboard)
- [x] Add actual hours vs. billed hours fields to work orders
- [x] Create a Time & Billing page with logging interface
- [x] Graph showing jobs ahead in billing vs. underbilled jobs
- [x] Flag redo jobs where money was lost
- [x] Show profit/loss per job based on hours (actual vs. billed)
- [x] Summary stats: total hours ahead, total hours behind, net billing efficiency

## Hour Profitability Graph on Dashboard
- [x] Add profitability graph to admin dashboard showing billing vs actual hours
- [x] Show timeframes: day, week, month, quarterly, bi-annually, annually
- [x] Year-over-year comparison
- [x] Only visible to admin/owner (not technicians or subcontractors)
- [x] Add Time & Billing page to sidebar navigation

## Client Profitability & Bids
- [x] Client overview page showing each company with their vehicles and job counts
- [x] Rank clients by profitability (revenue generated)
- [x] Show upcoming jobs per client
- [x] Add "Potential Bids" section for tracking new companies to acquire work from
- [x] Bid tracking: company name, contact, bid amount, status (pending/won/lost), notes

## Bid Photos & Invoice Features
- [x] Allow photo uploads on bids (job site photos, vehicle photos for proposals)
- [x] Create invoices directly from won bids
- [x] Handwritten invoice scanner: take photo of handwritten invoice, use AI to extract text/numbers
- [x] Convert extracted data into a professional Acme Automotive printable/emailable invoice

## Logo Integration
- [x] Add badge logo to sidebar/header as main app logo
- [x] Add roadrunner mascot logo to invoices
- [x] Use logos throughout the app branding

## Mobile Friendly & PWA
- [x] Optimize all pages for mobile screens (touch targets, responsive layouts)
- [x] Add persistent back/home button on every page
- [x] Make app installable as PWA (Progressive Web App) for employee phones
- [x] Add manifest.json and service worker for PWA
- [x] Add "Add to Home Screen" prompt/instructions (via PWA manifest)

## Employee Account Lock-out
- [x] Add isActive/disabled field to user accounts
- [x] Admin can disable/lock any user account instantly
- [x] Disabled users are blocked from logging in and accessing the app
- [x] Show lock/unlock toggle on Team page

## Mobile Polish (Gaps)
- [x] Add visible 'Install App' help card with iPhone/Android instructions

## User Activity Tracking
- [x] Show which users are currently online/logged in
- [x] Track when a user views a work order/job
- [x] Activity log showing which jobs each person has viewed
- [x] Show "last seen" timestamp for each user

## Customer Portal (Client-Facing)
- [x] Public/client landing page for customers to report issues or request work
- [x] Clients can see completed work on their vehicles
- [x] Vehicle "health" score based on maintenance history, age, mileage
- [x] Retirement alerts - when a vehicle should be replaced
- [x] Client can submit a service request without needing admin login

## Media Uploads (Photos & Videos)
- [x] Reusable MediaUpload component with camera capture and file picker (mobile-friendly)
- [x] Upload photos/videos for vehicles (vehicle condition, damage, before/after)
- [x] Upload photos/videos for work orders (work being done, progress shots)
- [x] Upload photos/videos for flip projects (furniture, vehicles, houses - before/after)
- [x] Upload photos/videos for general work / On-Site Advantage jobs
- [x] Media gallery view on each entity (grid of thumbnails with lightbox)
- [x] Support both photo and video file types
- [x] Store media in S3 with metadata in database
- [x] Delete media capability for admins

## Calendar Improvements
- [x] Fix existing calendar errors when adding events
- [x] Add personal calendar events (not just work orders)
- [x] Add time/duration fields to calendar events (start time, end time)
- [x] Add recurring event support (daily, weekly, monthly, custom)
- [x] Google Calendar sync (export/import events via iCal format)
- [x] Proper time frame display (day view, week view with time slots)
- [x] Edit and delete calendar events

## Vehicle Intelligence & Mileage Tracking
- [x] Track mileage on every vehicle (personal and fleet)
- [x] VIN decode - auto-lookup DMV info (year, make, model, engine, specs)
- [x] Registration due date tracking with alerts
- [x] CHP safety inspection due dates for fleet vehicles
- [x] Service history log (oil change, wipers, fluids, tires, etc.) specific to vehicle year/make
- [x] Recall information lookup and alerts
- [x] Resale value estimation
- [x] Keep-vs-replace analysis (loan balance, maintenance costs, depreciation)
- [x] Support all vehicle types: cars, trucks, boats, jet skis, trailers, airplanes

## General Asset Tracking (Customized Enterprise)
- [x] Assets page for tracking all owned assets
- [x] Support asset types: houses, boats, jet skis, trailers, trucks, airplanes, cars
- [x] Track purchase price, current value, loan balance, monthly payment
- [x] Track insurance, registration, and inspection dates
- [x] Personal vs. business asset classification
- [x] Asset health/condition scoring

## Homes by Beth Marie (Real Estate)
- [x] Real estate section under Customized Enterprise
- [x] Agent profile with license info, contact, website link (Next Stage of Happiness)
- [x] Property listings management (active, pending, sold)
- [x] Hot leads tracking with status pipeline
- [x] Link to external real estate website
- [x] Lead source tracking and follow-up reminders

## Bug Fixes
- [x] Fix: Cannot open, view, or expand any work orders
- [x] Add: Work order detail view with status change (approve/deny/complete)
- [x] Add: Generate invoice directly from a completed work order

## Phone Call Tracking & Follow-Ups
- [x] Phone calls table (client, contact name, phone number, notes, follow-up date, status)
- [x] Add phone call from dashboard or client page
- [x] Log call notes and outcome (reached, voicemail, no answer, callback requested)
- [x] Set follow-up date/time for callbacks
- [x] Dashboard phone calls section shows pending follow-ups sorted by date
- [x] Mark calls as completed
- [x] Link calls to clients for history tracking

## Bug Fixes (Round 2)
- [x] Fix: Homes by Beth Marie - no way to enter or see lead information (form not working / leads not displaying)
- [x] Add: Business line field to phone call form so you know which business the call is for

## Vehicle Lookup
- [x] Search vehicles by VIN number
- [x] Search vehicles by license plate number
- [x] Search bar on Vehicles page with VIN/plate toggle

## Dashboard Maintenance Graph
- [x] Graph showing routine maintenance jobs due (oil change, tire rotation, fluid checks)
- [x] Graph showing larger mechanical jobs due (engine, transmission, brakes)
- [x] Breakdown by vehicle showing which vehicles need what service

## Work Order Editing & Addendums
- [x] Edit work order details after creation (description, priority, vehicle, technician)
- [x] Add line items/services to existing work orders (addendum)
- [x] Add notes/comments to work orders after creation
- [x] Edit existing line items (change description, cost, hours)
- [x] Remove line items from work orders
- [x] Track edit history (who changed what and when)
- [x] Allow updating mileage, charge amount, hours after initial creation

## Role System Overhaul (4-Tier)
- [x] Add Owner role (highest level - full access including financials)
- [x] Admin role (can enter/edit invoices and work orders, but CANNOT see financial totals/profitability)
- [x] Technician role (sees assigned work and open/unassigned work they can pick up)
- [x] Customer role (sees queue of work being done on their vehicles and completed work)
- [x] Update schema role enum to include owner, admin, technician, customer

## Drag & Drop Job Management
- [x] Drag-and-drop board for Owner/Admin to move jobs between categories/statuses
- [x] Visual Kanban-style board with columns for each status
- [x] Drag work orders between status columns (Draft → Pending → In Progress → Completed)

## Customer Inquiries
- [x] New inquiry tracking for prospects who saw advertising
- [x] Capture what they might need done
- [x] Inquiry status pipeline (new → contacted → quoted → converted)

## Clickable Invoices & Work Orders
- [x] Click on any invoice to view full details and edit
- [x] Click on any work order to view full details and edit
- [x] Inline editing on invoice details (amounts, line items, notes)

## User Profile Creation & Invite System
- [x] Admin/Owner can create a user profile (name, role) that generates an invite link
- [x] New user can attach their email and create their own login via the invite link
- [x] Show pending/unclaimed profiles on Team page

## Account Locking Rules
- [x] Admin cannot lock Owner profiles
- [x] Owner cannot lock other Owner profiles
- [x] Only the system/database can change owner lock status
- [x] Enforce locking rules in backend and frontend

## Drag & Drop Between Business Lines
- [x] Allow jobs/projects to be dragged between business line groups (Acme Automotive, On-Site Advantage, Customized Enterprise)
- [x] Add business line columns or grouping to the Job Board
- [x] Update work order business line on drop

## Clickable/Editable Work Orders
- [x] Click on any work order to open full detail view
- [x] Edit work order fields inline (description, priority, technician, status, hours, charge)
- [x] Save changes with confirmation

## Hour Banking System
- [x] Add hour_bank table (user_id, banked_hours, borrowed_hours, running_balance)
- [x] When a job takes less time than billed, bank the difference
- [x] When a job takes longer or is a redo, borrow from the bank
- [x] Track banking transactions per work order
- [x] Full color profitability/banking graphs on Owner dashboard
- [x] Color graphs (no totals) visible to Admin
- [x] Smaller relatable graph on Technician home page showing their personal bank balance

## View As (Impersonate User View)
- [x] Add "View As" dropdown in sidebar/header for Admin and Owner
- [x] Allow selecting a specific user by name or by role level
- [x] Override the displayed role/view to match the selected user's perspective
- [x] Admin cannot select Owner level in the View As dropdown
- [x] Owner can view as any level (Admin, Technician, Customer, User)
- [x] Show a banner indicating "Viewing as [name/role]" with exit button
- [x] Revert to normal view when exiting impersonation

## Personal Todo List Per User
- [x] Add user_todos table (userId, title, completed, priority, dueDate)
- [x] Todo list section on each user's profile page
- [x] Create, edit, complete, delete todos

## Email & Phone Call Areas Per User
- [x] Add user_emails table (userId, subject, body, from, to, date, status)
- [x] Email section on user profile page
- [x] Phone call tracking area on user profile page (existing phone_calls table)

## Tech Time Tracking
- [x] Add time_clock table (userId, clockIn, clockOut, date, totalHours)
- [x] Track time started work for each tech
- [x] Mileage logged between jobs (mileage_log table)
- [x] Track actual hours worked per day, week, biweekly, and month
- [x] Time clock UI for techs to clock in/out

## Parts Markup Tracking
- [x] Track parts ordered with configurable markup (25%, 50%, 75%, 100%, up to 300%)
- [x] Parts cost vs billed amount tracking
- [x] Markup percentage selector per part

## Pay Tracking
- [x] Track pay for each tech, admin, and owner
- [x] Pay period summaries (day, week, biweekly, month)
- [x] Pay rate configuration per user

## Profit Tracking (Gross & Net)
- [x] Track gross and net profit per job/work order
- [x] Track gross and net profit per vehicle/truck
- [x] Track gross and net profit per project
- [x] Track gross and net profit per client
- [x] Profit dashboard with breakdowns at each level

## Tech Performance Rating System
- [x] Track each tech's revenue generated for the company
- [x] Rate techs at different levels: Titanium, Platinum, Gold, Silver, Bronze, Trainee
- [x] Performance dashboard showing each tech's efficiency and earnings
- [x] Auto-calculate tier based on revenue generated
- [x] Display tier badges on team page and tech profiles
- [x] Color-coded tier badges (Titanium=slate, Platinum=purple, Gold=amber, Silver=gray, Bronze=orange, Trainee=green)

## Bug Fix - Production Runtime Error (useViewAs hook order)
- [x] Fixed useViewAs hook called after early return in Home.tsx

## Parts to Order Enhancement
- [x] Made Parts to Order widget clickable with link to Parts Tracker
- [x] Added '+ Add Part' button on dashboard widget

## LEGACY - Bug Fix - Production Runtime Error
- [x] Fix runtime crash on published site (error in index-jrPuSVa1.js) — Fixed: useViewAs hook was called after early return
- [x] Investigate and fix the component causing the crash — Root cause: Home.tsx hook order violation

## Parts to Order from Dashboard
- [x] Add ability to order/add parts from the dashboard "Parts to Order" widget — Added + Add Part button
- [x] Link dashboard widget to Parts Tracker page or add inline ordering — Widget is now clickable, links to /parts-tracker

## Business Branch Filtering & Revenue
- [x] Add business line filter tabs to Work Orders page (All, Acme Automotive, On-Site Advantage, Customized Enterprise)
- [x] Add business line filter tabs to Invoices page
- [x] Add billable hours tracking per branch
- [x] Revenue breakdown by branch on dashboard (Owner view)
- [x] Total revenue across all branches on dashboard

## Phone & Email Tracking Accessibility
- [x] Make phone calls and emails accessible from sidebar nav (not just profile)
- [x] Add quick-access phone/email buttons to dashboard

## View As Improvements
- [x] Make View As selector more prominent/visible in sidebar
- [x] Add clear instructions on how to switch between tech/admin/customer views

## Distinct Customer Dashboard
- [x] Create a unique Customer portal view (not a stripped-down tech view)
- [x] Show customer's vehicles and their current work status
- [x] Show customer's invoices with payment status
- [x] Show work queue (what's being worked on, what's completed)
- [x] Clean portal-style layout distinct from internal dashboards

## Distinct Subcontractor Dashboard
- [x] Create a unique Subcontractor view different from tech and customer
- [x] Show assigned jobs/projects
- [x] Show payment/billing info for their work
- [x] Show available open work they can bid on or pick up

## Branch Mirroring (On-Site Advantage & Customized Enterprise)
- [x] On-Site Advantage gets its own Work Orders page in sidebar
- [x] On-Site Advantage gets its own Invoices page in sidebar
- [x] On-Site Advantage gets its own Clients page in sidebar
- [x] On-Site Advantage gets its own Inquiries page in sidebar
- [x] Customized Enterprise gets its own Work Orders page in sidebar
- [x] Customized Enterprise gets its own Invoices page in sidebar
- [x] Customized Enterprise gets its own Clients page in sidebar
- [x] Customized Enterprise gets its own Inquiries page in sidebar
- [x] Each branch section in sidebar shows its own pages (mirroring Acme Automotive structure)

## Job Board Layout Fix
- [x] Change Job Board from narrow side-by-side columns to stacked vertical layout
- [x] Make cards full-width for better readability on mobile and desktop

## Move Items Between Branches
- [x] Allow work orders to be moved/reassigned to a different branch
- [x] Allow invoices to be moved/reassigned to a different branch
- [x] Allow new assignments to be moved to a different branch
- [x] Add branch selector/dropdown on work order detail and invoice detail views

## Phone Call Logging & Scheduling
- [x] Add ability to log phone calls (who, when, notes, outcome)
- [x] Add ability to schedule future phone calls with reminders
- [x] Mark calls as completed
- [x] Phone call list on dashboard with add button that works

## Clickable Team Profiles
- [x] Make team member names/cards clickable to view their full profile
- [x] Navigate to user profile page when clicking a team member

## Invite Sending & Activation
- [x] Show copy-to-clipboard button for invite links
- [x] Show clear instructions on how to send/share the invite
- [x] Make it obvious how to activate a created profile

## Mobile Responsiveness (iPad/iPhone)
- [x] Ensure sidebar collapses properly on mobile
- [x] Make all pages responsive for tablet and phone viewports
- [x] Ensure touch-friendly tap targets (min 44px)
- [x] Test Job Board, Dashboard, Invoices, Work Orders on mobile

## Sidebar Scrollbar
- [ ] Add visible scrollbar to left sidebar so all nav items are accessible

## Total Clients Tab
- [ ] Create a Total Clients page showing all clients from all branches
- [ ] Add branch filter checkboxes (save selection for future searches)
- [ ] Click to filter by one or multiple branches

## Call Log History
- [ ] Make past phone calls clickable to see full details and outcome
- [ ] Make future/scheduled calls clickable to see details
- [ ] Show call history list with expandable details

## Employee Task/Job List
- [ ] Show list of employees with their upcoming tasks/jobs
- [ ] Display future assigned work per employee

## Drag & Drop + Edit Reassignment
- [ ] Allow drag-and-drop of jobs, invoices, and work orders to other branches
- [ ] Allow editing to reassign items to different employees
- [ ] Allow editing to reassign items to different branches

## Phone Call Assignment & UI Fix
- [ ] Add ability to assign phone calls to different employees
- [ ] Change "Log Call" button text to "Submit"
- [ ] Add employee dropdown in phone call form

## Calendar Employee Assignment & Views
- [x] Add employee assignment dropdown when creating/editing calendar events
- [ ] Add proper Day view showing hourly time slots
- [ ] Add proper Week view showing 7 days with time slots
- [ ] Add proper Month view showing all days with event dots/previews
- [ ] Allow switching between Day, Week, Month views

## Role-Based Billing Controls
- [x] Owner can adjust billable hour rates on work orders
- [x] Owner and Admin can assign work orders to employees via dropdown
- [x] Technician sees only hour dropdowns (no price/billing info)
- [x] Hide all billing/rate fields from technician view
- [x] Admin sees assignment dropdowns but cannot edit rates

## Hierarchy & Experience Levels
- [x] Owner/Admin can manually adjust employee hierarchy/experience levels
- [x] Techs earn levels through experience (auto-awarded based on performance metrics)
- [x] Owner/Admin have override to manually change tech levels
- [x] Display experience level on team page and profiles
- [x] Level progression: Trainee → Apprentice → Journeyman → Senior → Master → Expert
- [x] Show rankings on dashboard for ALL levels (Owner, Admin, Tech, Customer)

## Bug Fixes & UX Improvements (July 28)
- [x] Fix calendar page not showing any events after navigating to it
- [x] Make hierarchy/level assignment controls clearly visible and accessible (not buried in Tech Performance page)
- [x] Add level/hierarchy controls directly on Team page for each employee

## Bug Fixes (July 28 - Phone Calls)
- [x] Fix phone call creation crash (unexpected error on production - was hooks ordering issue, now fixed)
- [x] Make phone call log entries clickable and editable for owner level
- [x] All items should be editable at owner level

## Bug Fixes (July 28 - Round 2)
- [x] Phone call creation crash - was stale browser cache serving old JS bundle; updated service worker to force-clear old caches
- [x] Previously recorded phone calls editable - edit dialog was already implemented, stale cache prevented user from seeing it
- [x] Calendar events adding to the day prior - fixed timezone issue (used UTC methods for DB date objects, local methods for UI grid)

## Phone Call Log Search & Filter
- [x] Add search bar to filter phone calls by contact name, phone number, or notes
- [x] Add filter dropdown for outcome (reached, voicemail, no answer, callback requested)
- [x] Add filter for business line
- [x] Add filter for completed/pending status
- [x] Show all phone calls (not just pending) with ability to toggle view
- [x] Created dedicated /phone-calls page with full search & filter UI
- [x] Added Phone Calls link in sidebar navigation

## Business Line Mirroring & Filtering
- [ ] Add Client Overview page to On-Site Advantage section
- [ ] Add Client Overview page to Customized Enterprise section
- [ ] Add Scan Invoice page to On-Site Advantage section
- [ ] Add Scan Invoice page to Customized Enterprise section
- [ ] Add Phone Calls link to each business line section (filtered by business line)
- [ ] Add Emails link to each business line section (filtered by business line)
- [ ] Add business line filter dropdown to top-level Inquiries page
- [ ] Add business line filter dropdown to top-level Client Overview page
- [ ] Ensure all items are editable/viewable in all business line pages
- [ ] Top-level Dashboard filter: dropdown to filter all dashboard data by business line
