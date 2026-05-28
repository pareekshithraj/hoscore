export const FEATURE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  simulator: 'Simulator',
  queue: 'OPD Queue',
  prescriptions: 'Prescriptions',
  rooms: 'Rooms & Beds',
  patients: 'Patients',
  admissions: 'Admissions',
  discharges: 'Discharges',
  vitals: 'Vitals',
  labs: 'Lab Orders',
  doctors: 'Doctors',
  staff: 'Staff',
  staff_types: 'Staff Types',
  shifts: 'Shift Roster',
  inventory: 'Inventory',
  billing: 'Billing',
  claims: 'Claims',
  expenses: 'Expenses',
  analytics: 'Analytics',
  calendar: 'Calendar',
  notices: 'Notice Board',
  leaves: 'Leave Requests',
  groups: 'Groups',
  feedback: 'Feedback',
  audit_logs: 'Audit Logs',
  settings: 'Settings',
};

export const ALL_FEATURES = Object.keys(FEATURE_LABELS);

export function hasFeature(permissions: string[] | undefined, feature: string, role?: string) {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;
  return Boolean(permissions?.includes(feature));
}
