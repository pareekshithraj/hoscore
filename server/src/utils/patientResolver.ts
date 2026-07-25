import { prisma } from '../index.js';
import { normalizePhone } from './phone.js';

// ============================================================================
//  SHARED PATIENT IDENTITY / DEDUP LOGIC
//  Both the "Register Patient" path (patientController.createPatient) and the
//  "Book Appointment" path (appointmentController.createAppointment) create
//  Patient rows. Historically they diverged: register never deduped and always
//  minted a HOSCORE 6-digit id; appointment deduped loosely on name and never
//  minted an id. This module makes the two paths behave identically.
// ============================================================================

export interface PatientIdentityInput {
  name?: string;
  contact?: string | null;
  email?: string | null;
  /** Caller's explicit intent. If omitted we infer from whether a verifiable contact exists. */
  isHoscoreUser?: boolean;
}

export interface ResolvedIdentity {
  isHoscore: boolean;
  normalizedContact: string | null;
  normalizedEmail: string | null;
}

/**
 * Decide whether a patient should get a HOSCORE (app-capable) identity.
 *
 * A HOSCORE identity is only meaningful for someone who can actually be reached
 * / log in — i.e. has a phone or email. A rural / elderly walk-in with no phone
 * should stay WALK_IN_MANUAL even if the caller forgot to untick the box, and
 * an explicit `isHoscoreUser: false` is always honoured.
 */
export function resolveIdentity(input: PatientIdentityInput): ResolvedIdentity {
  const normalizedContact = normalizePhone(input.contact);
  const normalizedEmail = input.email ? input.email.trim().toLowerCase() || null : null;
  const hasVerifiableContact = !!(normalizedContact || normalizedEmail);

  // Explicit opt-out wins; otherwise require a reachable contact to be HOSCORE.
  const isHoscore = input.isHoscoreUser === false ? false : hasVerifiableContact;

  return { isHoscore, normalizedContact, normalizedEmail };
}

/**
 * Generate a unique 6-digit patient id. Uses insert-time uniqueness (the column
 * is @unique) via a bounded retry loop rather than a check-then-insert that can
 * race. Returns a candidate; the caller must create inside a try/retry so a
 * duplicate-key error can regenerate.
 */
export async function generateSixDigitId(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await prisma.patient.findUnique({ where: { sixDigitId: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  throw new Error('Could not allocate a unique patient id');
}

/**
 * Find a patient already known to this hospital by a STRONG identifier only —
 * never by name alone (two "Ramesh Kumar"s are different people). Matches on
 * normalized phone, email, or HOSCORE 6-digit id, scoped to patients connected
 * to the hospital (registered there, or with an appointment/admission there).
 */
export async function findExistingPatient(
  hospitalId: string,
  input: { contact?: string | null; email?: string | null; sixDigitId?: string | null },
): Promise<{ id: string; name: string; sixDigitId: string | null; isHoscoreUser: boolean } | null> {
  const normalizedContact = normalizePhone(input.contact);
  const normalizedEmail = input.email ? input.email.trim().toLowerCase() || null : null;
  const sixDigitId = input.sixDigitId || null;

  const identifierClauses: any[] = [];
  if (sixDigitId) identifierClauses.push({ sixDigitId });
  if (normalizedContact) identifierClauses.push({ contact: normalizedContact });
  if (normalizedEmail) identifierClauses.push({ email: normalizedEmail });

  // No strong identifier → cannot safely dedup. Treat as a new person.
  if (identifierClauses.length === 0) return null;

  const patient = await prisma.patient.findFirst({
    where: {
      AND: [
        { OR: identifierClauses },
        {
          OR: [
            { hospitalId },
            { appointments: { some: { hospitalId } } },
            { admissions: { some: { bed: { room: { hospitalId } } } } },
          ],
        },
      ],
    },
    select: { id: true, name: true, sixDigitId: true, isHoscoreUser: true },
  });

  return patient;
}

export interface FindOrCreateResult {
  patient: { id: string; name: string; sixDigitId: string | null; isHoscoreUser: boolean };
  created: boolean;
}

/**
 * Reuse an existing hospital-connected patient (matched by strong identifier) or
 * create a new one with consistent HOSCORE / manual handling. Used by the
 * appointment path; the register path uses the pieces above so it can surface a
 * "possible duplicate" prompt to staff instead of silently reusing.
 */
export async function findOrCreatePatient(
  hospitalId: string,
  input: PatientIdentityInput & { manualCareNote?: string | null },
): Promise<FindOrCreateResult> {
  const existing = await findExistingPatient(hospitalId, { contact: input.contact, email: input.email });
  if (existing) return { patient: existing, created: false };

  const { isHoscore, normalizedContact, normalizedEmail } = resolveIdentity(input);

  for (let attempt = 0; attempt < 5; attempt++) {
    const sixDigitId = isHoscore ? await generateSixDigitId() : null;
    try {
      const patient = await prisma.patient.create({
        data: {
          name: input.name || 'Unknown Patient',
          contact: normalizedContact,
          email: normalizedEmail,
          hospitalId,
          sixDigitId,
          isHoscoreUser: isHoscore,
          registrationMode: isHoscore ? 'HOSCORE' : 'WALK_IN_MANUAL',
          manualCareNote: isHoscore
            ? null
            : input.manualCareNote || 'Patient does not use phone/app. Continue manual care workflow.',
        },
        select: { id: true, name: true, sixDigitId: true, isHoscoreUser: true },
      });
      return { patient, created: true };
    } catch (err: any) {
      // Retry only on a sixDigitId unique-collision; otherwise rethrow.
      if (err?.code === 'P2002' && isHoscore) continue;
      throw err;
    }
  }
  throw new Error('Could not create patient after multiple attempts');
}
