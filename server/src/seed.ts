import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { STAFF_TYPE_PRESETS, permissionsForRole } from './utils/features.js';

const prisma = new PrismaClient();

async function main() {
  // Clean slate
  await prisma.groupMember.deleteMany({});
  await prisma.staffGroup.deleteMany({});
  await prisma.billing.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.admission.deleteMany({});
  await prisma.prescription.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.bed.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.oPDQueue.deleteMany({});
  await prisma.labOrder.deleteMany({});
  await prisma.vitalRecord.deleteMany({});
  await prisma.dischargeSummary.deleteMany({});
  await prisma.shiftSchedule.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.insuranceClaim.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.defaultSchedule.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.doctor.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.membership.deleteMany({});
  await prisma.staffType.deleteMany({});
  await prisma.hospital.deleteMany({});
  await prisma.user.deleteMany({});

  const pw = await bcrypt.hash('admin123', 10);

  // ======== SUPER ADMIN ========
  const superAdmin = await prisma.user.create({
    data: { email: 'admin@hoscore.com', password: pw, name: 'HOSCORE Admin', isSuperAdmin: true },
  });

  // ======== HOSPITALS ========
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const h1 = await prisma.hospital.create({
    data: {
      name: 'St. Vincent Medical Center', slug: 'st-vincent-medical',
      address: '123 Healthcare Ave', city: 'Mumbai', state: 'Maharashtra',
      contact: '+91 22 1234 5678', description: 'Elite tertiary care hospital with advanced robotic surgery and state-of-the-art cardiology.',
      isPartnered: true, rating: 4.9, isActive: true,
    },
  });

  const h2 = await prisma.hospital.create({
    data: {
      name: 'Apollo General Hospital', slug: 'apollo-general',
      address: '456 Medical Blvd', city: 'Delhi', state: 'Delhi',
      contact: '+91 11 9876 5432', description: 'World-renowned medical expertise and research-driven treatments for complex cases.',
      isPartnered: true, rating: 4.8, isActive: true,
    },
  });

  // Subscriptions
  await prisma.subscription.createMany({
    data: [
      { hospitalId: h1.id, plan: 'PROFESSIONAL', pricePerUser: 150, maxUsers: 100, status: 'ACTIVE', endDate },
      { hospitalId: h2.id, plan: 'STARTER', pricePerUser: 150, maxUsers: 50, status: 'ACTIVE', endDate },
    ],
  });

  // ======== USERS & MEMBERSHIPS ========
  // Hospital 1 admin
  const drSarah = await prisma.user.create({
    data: { email: 'sarah@hoscore.com', password: pw, name: 'Dr. Sarah Johnson', phone: '+91 98765 43210' },
  });
  await prisma.membership.create({
    data: { userId: drSarah.id, hospitalId: h1.id, role: 'ADMIN', department: 'Administration', permissions: permissionsForRole('ADMIN') },
  });

  // A doctor at H1 who is ALSO a patient (for testing multi-dashboard)
  const drMark = await prisma.user.create({
    data: { email: 'mark@hoscore.com', password: pw, name: 'Dr. Mark Williams', phone: '+91 98765 43211' },
  });
  await prisma.membership.create({
    data: { userId: drMark.id, hospitalId: h1.id, role: 'DOCTOR', department: 'Neurosurgery', permissions: permissionsForRole('DOCTOR') },
  });
  // Mark is also staff at H2
  await prisma.membership.create({
    data: { userId: drMark.id, hospitalId: h2.id, role: 'DOCTOR', department: 'Neurology', permissions: permissionsForRole('DOCTOR') },
  });
  // Mark also has a patient profile
  await prisma.patient.create({
    data: { userId: drMark.id, name: 'Dr. Mark Williams', email: 'mark@hoscore.com', contact: '+91 98765 43211', gender: 'Male', bloodGroup: 'A+' },
  });

  // Hospital 2 admin
  const adminH2 = await prisma.user.create({
    data: { email: 'admin@apollo.com', password: pw, name: 'Dr. Priya Sharma', phone: '+91 98765 43212' },
  });
  await prisma.membership.create({
    data: { userId: adminH2.id, hospitalId: h2.id, role: 'ADMIN', department: 'Administration', permissions: permissionsForRole('ADMIN') },
  });

  // Nurse at H1
  const nurse1 = await prisma.user.create({
    data: { email: 'nurse@hoscore.com', password: pw, name: 'Anita Kumar', phone: '+91 98765 43213' },
  });
  await prisma.membership.create({
    data: { userId: nurse1.id, hospitalId: h1.id, role: 'NURSE', department: 'General', permissions: permissionsForRole('NURSE') },
  });

  // Patient-only user
  const patientUser = await prisma.user.create({
    data: { email: 'patient@hoscore.com', password: pw, name: 'Rahul Verma', phone: '+91 98765 43214' },
  });
  await prisma.patient.create({
    data: { userId: patientUser.id, hospitalId: h1.id, name: 'Rahul Verma', email: 'patient@hoscore.com', contact: '+91 98765 43214', gender: 'Male', bloodGroup: 'O+', status: 'Out-Patient' },
  });

  // ======== DOCTORS (hospital-scoped records) ========
  const doc1 = await prisma.doctor.create({
    data: { hospitalId: h1.id, name: 'Dr. Sarah Johnson', specialty: 'Cardiology', email: 'sarah@hoscore.com', status: 'On Duty', rating: 4.8, patientsCount: 145 },
  });
  const doc2 = await prisma.doctor.create({
    data: { hospitalId: h1.id, name: 'Dr. Mark Williams', specialty: 'Neurosurgery', email: 'mark@hoscore.com', status: 'On Duty', rating: 4.9, patientsCount: 89 },
  });
  const doc3 = await prisma.doctor.create({
    data: { hospitalId: h2.id, name: 'Dr. Priya Sharma', specialty: 'Pediatrics', email: 'admin@apollo.com', status: 'On Duty', rating: 4.7, patientsCount: 230 },
  });

  // ======== ROOMS & BEDS (H1) ========
  const room1 = await prisma.room.create({
    data: {
      hospitalId: h1.id, name: 'ICU-A', type: 'ICU', capacity: 2,
      beds: { create: [
        { bedNumber: 'ICU-101', status: 'OCCUPIED', pricePerDay: 500 },
        { bedNumber: 'ICU-102', status: 'AVAILABLE', pricePerDay: 500 },
      ] },
    },
    include: { beds: true },
  });
  const room2 = await prisma.room.create({
    data: {
      hospitalId: h1.id, name: 'General Ward B', type: 'Ward', capacity: 4,
      beds: { create: [
        { bedNumber: 'W-201', status: 'AVAILABLE', pricePerDay: 100 },
        { bedNumber: 'W-202', status: 'OCCUPIED', pricePerDay: 100 },
        { bedNumber: 'W-203', status: 'CLEANING', pricePerDay: 100 },
        { bedNumber: 'W-204', status: 'AVAILABLE', pricePerDay: 100 },
      ] },
    },
    include: { beds: true },
  });

  // ======== PATIENTS (hospital-scoped) ========
  const pat1 = await prisma.patient.create({
    data: { hospitalId: h1.id, name: 'John Doe', email: 'john@email.com', contact: '+91 555 0199', gender: 'Male', dateOfBirth: new Date('1985-04-12'), bloodGroup: 'O+', status: 'In-Patient' },
  });
  const pat2 = await prisma.patient.create({
    data: { hospitalId: h1.id, name: 'Jane Smith', email: 'jane@email.com', contact: '+91 555 0299', gender: 'Female', dateOfBirth: new Date('1990-08-22'), bloodGroup: 'A-', status: 'Out-Patient' },
  });
  const walkInPatient = await prisma.patient.create({
    data: {
      hospitalId: h1.id,
      name: 'Ramesh Manual',
      contact: null,
      gender: 'Male',
      bloodGroup: 'B+',
      status: 'Out-Patient',
      isHoscoreUser: false,
      registrationMode: 'WALK_IN_MANUAL',
      manualCareNote: 'No phone/app access. Doctor should consult and document manually if needed.',
    },
  });

  // ======== APPOINTMENTS ========
  await prisma.appointment.createMany({
    data: [
      { hospitalId: h1.id, patientId: pat1.id, doctorId: doc1.id, time: '10:30 AM', date: new Date(), tokenNumber: 1, status: 'CONFIRMED' },
      { hospitalId: h1.id, patientId: pat2.id, doctorId: doc2.id, time: '02:15 PM', date: new Date(), tokenNumber: 5, status: 'PENDING' },
      { hospitalId: h1.id, patientId: walkInPatient.id, doctorId: doc1.id, time: '03:00 PM', date: new Date(), tokenNumber: 8, status: 'PENDING' },
    ],
  });

  // ======== ADMISSIONS ========
  const adm1 = await prisma.admission.create({
    data: { patientId: pat1.id, bedId: room1.beds[0]!.id, admissionDate: new Date(Date.now() - 3 * 86400000), reason: 'Cardiac Observation', status: 'Active' },
  });
  const adm2 = await prisma.admission.create({
    data: { patientId: pat2.id, bedId: room2.beds[1]!.id, admissionDate: new Date(Date.now() - 86400000), reason: 'Post-surgery recovery', status: 'Active' },
  });

  // ======== BILLING ========
  await prisma.billing.createMany({
    data: [
      { hospitalId: h1.id, admissionId: adm1.id, roomCharges: 1500, doctorFees: 2000, labFees: 500, pharmacyFees: 300, totalAmount: 4300, status: 'PENDING' },
      { hospitalId: h1.id, admissionId: adm2.id, roomCharges: 100, doctorFees: 500, labFees: 0, pharmacyFees: 50, totalAmount: 650, status: 'PAID' },
    ],
  });

  // ======== INVENTORY ========
  await prisma.inventory.createMany({
    data: [
      { hospitalId: h1.id, itemName: 'Paracetamol 500mg', type: 'Medicine', stock: 500, reorderLevel: 100, unit: 'Tablets', supplier: 'PharmaCorp', price: 0.1 },
      { hospitalId: h1.id, itemName: 'Surgical Masks', type: 'Consumable', stock: 50, reorderLevel: 200, unit: 'Boxes', supplier: 'MedEquip Inc', price: 15.0 },
      { hospitalId: h1.id, itemName: 'Oxygen Cylinder', type: 'Equipment', stock: 12, reorderLevel: 10, unit: 'Tanks', supplier: 'AirLife', price: 150.0 },
    ],
  });

  console.log('✅ HOSCORE seed complete! Demo accounts:');
  console.log('  Super Admin: admin@hoscore.com / admin123');
  console.log('  Hospital Admin (St. Vincent): sarah@hoscore.com / admin123');
  console.log('  Multi-role (Doctor+Patient): mark@hoscore.com / admin123');
  console.log('  Nurse: nurse@hoscore.com / admin123');
  console.log('  Patient: patient@hoscore.com / admin123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
  for (const preset of STAFF_TYPE_PRESETS) {
    await prisma.staffType.create({
      data: {
        name: preset.name,
        code: preset.code,
        role: preset.role,
        description: preset.description,
        permissions: preset.permissions,
        isPreset: true,
      },
    });
  }
