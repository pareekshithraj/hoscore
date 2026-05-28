import { prisma } from '../index.js';
import { getR2UsageSummary, type R2UsageSummary } from './r2.js';

const BYTES_PER_GB = 1024 ** 3;

const pricing = {
  neon: {
    storageUsdPerGbMonth: Number(process.env.NEON_STORAGE_USD_PER_GB_MONTH ?? 0.35),
    launchCuHourUsd: Number(process.env.NEON_LAUNCH_CU_HOUR_USD ?? 0.106),
    freeCuHoursPerProject: Number(process.env.NEON_FREE_CU_HOURS_PER_PROJECT ?? 100),
    freeStorageGbMonthPerProject: Number(process.env.NEON_FREE_STORAGE_GB_MONTH_PER_PROJECT ?? 0.5),
  },
  r2: {
    storageUsdPerGbMonth: Number(process.env.R2_STORAGE_USD_PER_GB_MONTH ?? 0.015),
    classAUsdPerMillion: Number(process.env.R2_CLASS_A_USD_PER_MILLION ?? 4.5),
    classBUsdPerMillion: Number(process.env.R2_CLASS_B_USD_PER_MILLION ?? 0.36),
    freeStorageGbMonth: Number(process.env.R2_FREE_STORAGE_GB_MONTH ?? 10),
    freeClassAOperations: Number(process.env.R2_FREE_CLASS_A_OPERATIONS ?? 1_000_000),
    freeClassBOperations: Number(process.env.R2_FREE_CLASS_B_OPERATIONS ?? 10_000_000),
  },
};

function bytesToGb(bytes: number) {
  return bytes / BYTES_PER_GB;
}

function estimateStorageCost(usedGb: number, freeGb: number, usdPerGbMonth: number) {
  return Math.max(usedGb - freeGb, 0) * usdPerGbMonth;
}

export async function getPlatformUsage() {
  const safeR2Usage = getR2UsageSummary().catch((error): R2UsageSummary & { error: string } => ({
    bucket: process.env.R2_BUCKET_NAME || 'hoscore',
    objectCount: 0,
    totalBytes: 0,
    isConfigured: false,
    error: error instanceof Error ? error.message : 'R2 usage unavailable',
  }));

  const [databaseRows, r2Usage, hospitals, users, patients, activeSubscriptions] = await Promise.all([
    prisma.$queryRaw<Array<{ database_name: string; size_bytes: bigint }>>`
      SELECT current_database() AS database_name, pg_database_size(current_database()) AS size_bytes
    `,
    safeR2Usage,
    prisma.hospital.count(),
    prisma.user.count(),
    prisma.patient.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
  ]);

  const database = databaseRows[0];
  const neonBytes = Number(database?.size_bytes ?? 0);
  const neonGb = bytesToGb(neonBytes);
  const r2Gb = bytesToGb(r2Usage.totalBytes);

  return {
    generatedAt: new Date().toISOString(),
    tenants: {
      hospitals,
      users,
      patients,
      activeSubscriptions,
    },
    neon: {
      databaseName: database?.database_name ?? 'unknown',
      storageBytes: neonBytes,
      storageGb: neonGb,
      estimatedStorageCostUsd: estimateStorageCost(
        neonGb,
        pricing.neon.freeStorageGbMonthPerProject,
        pricing.neon.storageUsdPerGbMonth
      ),
      pricing: pricing.neon,
    },
    r2: {
      bucket: r2Usage.bucket,
      isConfigured: r2Usage.isConfigured,
      objectCount: r2Usage.objectCount,
      storageBytes: r2Usage.totalBytes,
      storageGb: r2Gb,
      estimatedStorageCostUsd: estimateStorageCost(
        r2Gb,
        pricing.r2.freeStorageGbMonth,
        pricing.r2.storageUsdPerGbMonth
      ),
      pricing: pricing.r2,
      error: 'error' in r2Usage ? r2Usage.error : null,
    },
    notes: [
      'Neon storage is measured from pg_database_size(current_database()). Compute, branch-hours, and history storage require Neon account billing telemetry.',
      'R2 object count and bytes are measured by listing the configured bucket. Class A/B operation usage requires Cloudflare billing/analytics telemetry or external request accounting.',
      'Cost estimates use configurable pricing defaults and storage-only live usage; provider invoices remain authoritative.',
    ],
  };
}

function extractPhotoBytes(photos: unknown) {
  if (!Array.isArray(photos)) return 0;
  return photos.reduce((sum, photo: any) => sum + (typeof photo?.size === 'number' ? photo.size : 0), 0);
}

export async function getHospitalUsage(hospitalId: string) {
  const [platform, hospital, users, patients, appointments, documents] = await Promise.all([
    getPlatformUsage(),
    prisma.hospital.findUnique({ where: { id: hospitalId }, select: { id: true, name: true, photos: true, logo: true } }),
    prisma.membership.count({ where: { hospitalId, status: 'ACTIVE' } }),
    prisma.patient.count({ where: { OR: [{ hospitalId }, { appointments: { some: { hospitalId } } }] } }),
    prisma.appointment.count({ where: { hospitalId } }),
    prisma.report.count({ where: { admission: { bed: { room: { hospitalId } } } } }),
  ]);

  const profilePhotoBytes = extractPhotoBytes(hospital?.photos);
  return {
    generatedAt: platform.generatedAt,
    hospital: {
      id: hospital?.id,
      name: hospital?.name,
      users,
      patients,
      appointments,
      clinicalDocuments: documents,
    },
    neon: platform.neon,
    r2: {
      ...platform.r2,
      hospitalProfilePhotoBytes: profilePhotoBytes,
      hospitalProfilePhotoCostUsd: estimateStorageCost(
        bytesToGb(profilePhotoBytes),
        pricing.r2.freeStorageGbMonth,
        pricing.r2.storageUsdPerGbMonth
      ),
    },
    pricing,
    notes: [
      'Hospital-level Neon is reported from the shared database size because this app uses one multi-tenant database.',
      'Hospital R2 photo bytes are exact for new uploaded photos that include object size metadata; legacy URLs may not include size.',
      ...platform.notes,
    ],
  };
}
