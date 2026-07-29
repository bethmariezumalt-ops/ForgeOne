// Comprehensive list of vehicle/truck maintenance service categories
export const SERVICE_CATEGORIES = [
  // Engine & Drivetrain
  { id: "oil_change", name: "Oil Change", group: "Engine", color: "#D97706" },
  { id: "transmission", name: "Transmission", group: "Engine", color: "#7C3AED" },
  { id: "engine_repair", name: "Engine Repair", group: "Engine", color: "#DC2626" },
  { id: "belts_hoses", name: "Belts & Hoses", group: "Engine", color: "#059669" },
  { id: "coolant_flush", name: "Coolant Flush", group: "Engine", color: "#0891B2" },
  { id: "fuel_system", name: "Fuel System", group: "Engine", color: "#CA8A04" },
  // Brakes & Suspension
  { id: "brake_pads", name: "Brake Pads", group: "Brakes", color: "#DC2626" },
  { id: "brake_rotors", name: "Brake Rotors", group: "Brakes", color: "#B91C1C" },
  { id: "brake_lines", name: "Brake Lines", group: "Brakes", color: "#991B1B" },
  { id: "brake_drums", name: "Brake Drums", group: "Brakes", color: "#7F1D1D" },
  { id: "bearings", name: "Bearings", group: "Suspension", color: "#6B7280" },
  { id: "axles", name: "Axles", group: "Suspension", color: "#4B5563" },
  { id: "shocks_struts", name: "Shocks & Struts", group: "Suspension", color: "#374151" },
  { id: "suspension", name: "Suspension General", group: "Suspension", color: "#1F2937" },
  { id: "steering", name: "Steering", group: "Suspension", color: "#111827" },
  // Electrical
  { id: "battery", name: "Battery", group: "Electrical", color: "#EAB308" },
  { id: "alternator", name: "Alternator", group: "Electrical", color: "#CA8A04" },
  { id: "starter", name: "Starter", group: "Electrical", color: "#A16207" },
  { id: "wiring", name: "Wiring/Electrical", group: "Electrical", color: "#854D0E" },
  { id: "lights", name: "Lights/Bulbs", group: "Electrical", color: "#FBBF24" },
  // HVAC
  { id: "ac_repair", name: "AC Repair", group: "HVAC", color: "#06B6D4" },
  { id: "heater", name: "Heater", group: "HVAC", color: "#F97316" },
  { id: "ac_recharge", name: "AC Recharge", group: "HVAC", color: "#0891B2" },
  // Filters & Fluids
  { id: "oil_filter", name: "Oil Filter", group: "Filters", color: "#D97706" },
  { id: "air_filter", name: "Air Filter", group: "Filters", color: "#65A30D" },
  { id: "cabin_filter", name: "Cabin Air Filter", group: "Filters", color: "#4D7C0F" },
  { id: "fuel_filter", name: "Fuel Filter", group: "Filters", color: "#CA8A04" },
  { id: "trans_fluid", name: "Transmission Fluid", group: "Filters", color: "#7C3AED" },
  { id: "power_steering_fluid", name: "Power Steering Fluid", group: "Filters", color: "#6D28D9" },
  { id: "brake_fluid", name: "Brake Fluid", group: "Filters", color: "#DC2626" },
  // Body & Exterior
  { id: "wipers", name: "Windshield Wipers", group: "Body", color: "#2563EB" },
  { id: "mirrors", name: "Mirrors", group: "Body", color: "#3B82F6" },
  { id: "body_work", name: "Body Work", group: "Body", color: "#1D4ED8" },
  { id: "paint_touch_up", name: "Paint Touch-Up", group: "Body", color: "#1E40AF" },
  // Exhaust
  { id: "exhaust", name: "Exhaust System", group: "Exhaust", color: "#78716C" },
  { id: "muffler", name: "Muffler", group: "Exhaust", color: "#57534E" },
  { id: "catalytic_converter", name: "Catalytic Converter", group: "Exhaust", color: "#44403C" },
  // DOT & Inspections
  { id: "dot_inspection", name: "DOT Inspection", group: "Inspections", color: "#2563EB" },
  { id: "safety_inspection", name: "Safety Inspection", group: "Inspections", color: "#1D4ED8" },
  { id: "chp_forms", name: "CHP Forms", group: "Inspections", color: "#1E40AF" },
  { id: "emissions", name: "Emissions Check", group: "Inspections", color: "#15803D" },
  // General Maintenance
  { id: "tune_up", name: "Tune-Up", group: "General", color: "#059669" },
  { id: "alignment", name: "Alignment", group: "General", color: "#0D9488" },
  { id: "diagnostic", name: "Diagnostic/Scan", group: "General", color: "#0EA5E9" },
  { id: "preventive", name: "Preventive Maintenance", group: "General", color: "#10B981" },
  { id: "other_vehicle", name: "Other (Vehicle)", group: "General", color: "#6B7280" },
] as const;

// Non-vehicle service categories (On-Site Advantage / Building)
export const BUILDING_SERVICE_CATEGORIES = [
  { id: "plumbing", name: "Plumbing", color: "#2563EB" },
  { id: "sign_hanging", name: "Sign Hanging", color: "#7C3AED" },
  { id: "painting", name: "Painting", color: "#F59E0B" },
  { id: "carpentry", name: "Carpentry", color: "#92400E" },
  { id: "electrical_building", name: "Electrical (Building)", color: "#EAB308" },
  { id: "hvac_building", name: "HVAC (Building)", color: "#06B6D4" },
  { id: "flooring", name: "Flooring", color: "#78716C" },
  { id: "drywall", name: "Drywall", color: "#9CA3AF" },
  { id: "general_repair", name: "General Repair", color: "#059669" },
  { id: "cleaning", name: "Cleaning/Pressure Wash", color: "#0EA5E9" },
  { id: "landscaping", name: "Landscaping", color: "#16A34A" },
  { id: "locksmith", name: "Locksmith", color: "#4B5563" },
  { id: "moving", name: "Moving/Hauling", color: "#D97706" },
  { id: "other_building", name: "Other", color: "#6B7280" },
] as const;

// Items that MUST be sourced out (Acme doesn't do these)
export const SOURCE_OUT_CATEGORIES = [
  "glass", "tires", "tire_mount", "windshield_replacement",
  "frame_work", "major_body_work", "upholstery",
] as const;

export const PRIORITY_CONFIG = {
  emergency: { label: "Emergency", color: "#DC2626", bgColor: "#FEF2F2", borderColor: "#FECACA" },
  high: { label: "High", color: "#EA580C", bgColor: "#FFF7ED", borderColor: "#FED7AA" },
  medium: { label: "Medium", color: "#2563EB", bgColor: "#EFF6FF", borderColor: "#BFDBFE" },
  low: { label: "Low", color: "#16A34A", bgColor: "#F0FDF4", borderColor: "#BBF7D0" },
} as const;

export const BUSINESS_LINES = {
  acme_automotive: { label: "Acme Automotive", color: "#2563EB", icon: "truck" },
  customized_enterprise: { label: "Customized Enterprise", color: "#7C3AED", icon: "armchair" },
  onsite_advantage: { label: "On-Site Advantage", color: "#059669", icon: "building" },
} as const;
