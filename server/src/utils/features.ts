export const FEATURES = {
  DASHBOARD: 'dashboard',
  SIMULATOR: 'simulator',
  QUEUE: 'queue',
  PRESCRIPTIONS: 'prescriptions',
  ROOMS: 'rooms',
  PATIENTS: 'patients',
  ADMISSIONS: 'admissions',
  DISCHARGES: 'discharges',
  VITALS: 'vitals',
  LABS: 'labs',
  DOCTORS: 'doctors',
  STAFF: 'staff',
  STAFF_TYPES: 'staff_types',
  SHIFTS: 'shifts',
  INVENTORY: 'inventory',
  BILLING: 'billing',
  CLAIMS: 'claims',
  EXPENSES: 'expenses',
  ANALYTICS: 'analytics',
  CALENDAR: 'calendar',
  NOTICES: 'notices',
  LEAVES: 'leaves',
  GROUPS: 'groups',
  FEEDBACK: 'feedback',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
} as const;

export const ALL_FEATURES = Object.values(FEATURES);

export const ADMIN_PERMISSIONS = ALL_FEATURES;

export const STAFF_TYPE_PRESETS = [
  {
    name: 'Hospital Admin',
    code: 'ADMIN',
    role: 'ADMIN',
    description: 'Owner or manager account with full hospital control.',
    permissions: ADMIN_PERMISSIONS,
  },
  {
    name: 'Doctor',
    code: 'DOCTOR',
    role: 'DOCTOR',
    description: 'Clinical workspace, queue, patients, prescriptions, labs, vitals, discharges, and calendar.',
    permissions: [
      FEATURES.DASHBOARD,
      FEATURES.QUEUE,
      FEATURES.PRESCRIPTIONS,
      FEATURES.PATIENTS,
      FEATURES.ADMISSIONS,
      FEATURES.DISCHARGES,
      FEATURES.VITALS,
      FEATURES.LABS,
      FEATURES.DOCTORS,
      FEATURES.CALENDAR,
      FEATURES.NOTICES,
      FEATURES.LEAVES,
      FEATURES.GROUPS,
      FEATURES.FEEDBACK,
    ],
  },
  {
    name: 'Receptionist',
    code: 'RECEPTIONIST',
    role: 'RECEPTIONIST',
    description: 'Front desk queue, appointments, patients, rooms, billing, claims, and calendar.',
    permissions: [
      FEATURES.DASHBOARD,
      FEATURES.QUEUE,
      FEATURES.ROOMS,
      FEATURES.PATIENTS,
      FEATURES.ADMISSIONS,
      FEATURES.DOCTORS,
      FEATURES.BILLING,
      FEATURES.CLAIMS,
      FEATURES.CALENDAR,
      FEATURES.NOTICES,
      FEATURES.LEAVES,
    ],
  },
  {
    name: 'Nurse',
    code: 'NURSE',
    role: 'NURSE',
    description: 'Vitals, queue, admissions, rooms, inventory, shifts, and patient care support.',
    permissions: [
      FEATURES.DASHBOARD,
      FEATURES.QUEUE,
      FEATURES.ROOMS,
      FEATURES.PATIENTS,
      FEATURES.ADMISSIONS,
      FEATURES.VITALS,
      FEATURES.SHIFTS,
      FEATURES.INVENTORY,
      FEATURES.CALENDAR,
      FEATURES.NOTICES,
      FEATURES.LEAVES,
      FEATURES.GROUPS,
    ],
  },
  {
    name: 'Pharmacist',
    code: 'PHARMACIST',
    role: 'PHARMACIST',
    description: 'Prescription and inventory workflow.',
    permissions: [
      FEATURES.PRESCRIPTIONS,
      FEATURES.INVENTORY,
      FEATURES.CALENDAR,
      FEATURES.NOTICES,
      FEATURES.LEAVES,
    ],
  },
  {
    name: 'Lab Technician',
    code: 'LAB_TECH',
    role: 'LAB_TECH',
    description: 'Lab order processing and shared hospital communication.',
    permissions: [
      FEATURES.LABS,
      FEATURES.CALENDAR,
      FEATURES.NOTICES,
      FEATURES.LEAVES,
    ],
  },
];

export function permissionsForRole(role?: string, explicit?: unknown): string[] {
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return ADMIN_PERMISSIONS;
  if (Array.isArray(explicit)) return explicit.filter((item): item is string => typeof item === 'string');
  const preset = STAFF_TYPE_PRESETS.find((item) => item.role === role || item.code === role);
  return preset?.permissions ?? [FEATURES.DASHBOARD, FEATURES.NOTICES, FEATURES.LEAVES];
}
