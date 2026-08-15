import { prisma } from '../index.js';

/**
 * Keep the clinical Doctor roster in sync with portal staff whose role is DOCTOR.
 * OPD matches the logged-in user to a Doctor row by email.
 */
export async function ensureDoctorRoster(
  hospitalId: string,
  opts: { name: string; email?: string | null; contact?: string | null; specialty?: string | null },
) {
  const email = opts.email ? String(opts.email).trim().toLowerCase() : '';
  if (!email) return null;

  const existing = await prisma.doctor.findFirst({
    where: { hospitalId, email: { equals: email, mode: 'insensitive' } },
  });
  if (existing) {
    const nextName = opts.name?.trim();
    if (nextName && nextName !== existing.name) {
      return prisma.doctor.update({
        where: { id: existing.id },
        data: { name: nextName, contact: opts.contact ?? existing.contact },
      });
    }
    return existing;
  }

  return prisma.doctor.create({
    data: {
      hospitalId,
      name: opts.name || email,
      email,
      contact: opts.contact || null,
      specialty: opts.specialty || 'General Medicine',
      status: 'ON_DUTY',
    },
  });
}
