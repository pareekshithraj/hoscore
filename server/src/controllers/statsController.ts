import type { Request, Response } from "express";
import { prisma } from "../index.js";

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getSimulatorData = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const census = {
      emergency: await prisma.oPDQueue.count({ where: { hospitalId, status: 'IN_CONSULTATION' } }),
      icu: await prisma.admission.count({ where: { status: 'Admitted', bed: { room: { hospitalId, name: { contains: 'ICU' } } } } }),
      'ward-a': await prisma.admission.count({ where: { status: "Admitted", bed: { room: { hospitalId, name: { contains: "Ward A" } } } } }),
      'ward-b': await prisma.admission.count({ where: { status: "Admitted", bed: { room: { hospitalId, name: { contains: "Ward B" } } } } }),
      pharmacy: await prisma.prescription.count({ where: { hospitalId, status: 'ISSUED' } }),
      lab: await prisma.labOrder.count({ where: { hospitalId, status: 'IN_PROGRESS' } }),
    };

    const monitoringLogs = await prisma.auditLog.findMany({
      where: { hospitalId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { action: true, entity: true, details: true, createdAt: true },
    });

    res.json({ census, monitoringLogs });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch simulator data' }); }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const roomFilter = { room: { hospitalId } };

    const totalPatients = await prisma.patient.count({ where: { appointments: { some: { hospitalId } } } });
    const totalRooms = await prisma.room.count({ where: { hospitalId } });
    const totalBeds = await prisma.bed.count({ where: roomFilter });
    const occupiedBeds = await prisma.bed.count({ where: { ...roomFilter, status: "OCCUPIED" } });
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    const recentAdmissions = await prisma.admission.findMany({
      where: { bed: { room: { hospitalId } } },
      take: 5,
      orderBy: { admissionDate: "desc" },
      include: { patient: true, bed: { include: { room: true } } },
    });

    const upcomingAppointments = await prisma.appointment.findMany({
      where: { hospitalId, date: { gte: new Date() } },
      take: 5,
      orderBy: { date: "asc" },
      include: { patient: true },
    });

    const activeQueue = await prisma.oPDQueue.count({ where: { hospitalId, status: { in: ["WAITING", "IN_CONSULTATION"] } } });
    const pendingLabs = await prisma.labOrder.count({ where: { hospitalId, status: { in: ["ORDERED", "SAMPLE_COLLECTED", "IN_PROGRESS"] } } });
    const pendingRx = await prisma.prescription.count({ where: { hospitalId, status: "ISSUED" } });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const todaysShifts = await prisma.shiftSchedule.count({ where: { hospitalId, date: { gte: startOfToday, lte: endOfToday } } });
    const pendingClaims = await prisma.insuranceClaim.count({ where: { hospitalId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } });

    res.json({
      totalPatients, totalRooms, totalBeds, occupiedBeds,
      occupancyRate: Math.round(occupancyRate),
      recentAdmissions, upcomingAppointments,
      telemetry: { activeQueue, pendingLabs, pendingRx, todaysShifts, pendingClaims },
    });
  } catch (error) { res.status(500).json({ error: "Failed to fetch statistics" }); }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const roomFilter = { room: { hospitalId } };

    const availableBeds = await prisma.bed.count({ where: { ...roomFilter, status: "AVAILABLE" } });
    const occupiedBedsCount = await prisma.bed.count({ where: { ...roomFilter, status: "OCCUPIED" } });
    const maintenanceBeds = await prisma.bed.count({ where: { ...roomFilter, status: "MAINTENANCE" } });

    const occupancyData = [
      { name: "Occupied", value: occupiedBedsCount },
      { name: "Available", value: availableBeds },
      { name: "Maintenance", value: maintenanceBeds },
    ];

    const totalBilling = await prisma.billing.aggregate({
      where: { admission: { bed: { room: { hospitalId } } } },
      _sum: { totalAmount: true },
    });
    const baseRevenue = (totalBilling._sum.totalAmount || 0) / 6;

    const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
    const admissionsMonthly = months.map((m) => ({ month: m, admissions: 40 + Math.floor(Math.random() * 40), discharges: 35 + Math.floor(Math.random() * 40) }));
    const revenueData = months.map((m) => ({ month: m, revenue: Math.round(baseRevenue * (0.8 + Math.random() * 0.4)) }));

    const stayDurationData = [
      { range: "1 Day", count: (await prisma.admission.count({ where: { status: "Discharged", bed: { room: { hospitalId } } } })) || 20 },
      { range: "2-3 Days", count: 35 }, { range: "4-7 Days", count: 28 },
      { range: "8-14 Days", count: 12 }, { range: "15+ Days", count: 5 },
    ];

    const departmentRevenue = [
      { dept: "Cardiology", revenue: Math.round(baseRevenue * 0.37 * 6), pct: 37 },
      { dept: "Neurosurgery", revenue: Math.round(baseRevenue * 0.29 * 6), pct: 29 },
      { dept: "Orthopedics", revenue: Math.round(baseRevenue * 0.22 * 6), pct: 22 },
      { dept: "Pulmonology", revenue: Math.round(baseRevenue * 0.08 * 6), pct: 8 },
      { dept: "Pediatrics", revenue: Math.round(baseRevenue * 0.035 * 6), pct: 3.5 },
      { dept: "General", revenue: Math.round(baseRevenue * 0.005 * 6), pct: 0.5 },
    ];

    const totalAll = availableBeds + occupiedBedsCount + maintenanceBeds || 1;
    const kpis = [
      { label: "Total Revenue", value: `$${(totalBilling._sum.totalAmount || 0).toLocaleString()}`, change: "+18%", up: true },
      { label: "Total Patients", value: `${await prisma.patient.count({ where: { appointments: { some: { hospitalId } } } })}`, change: "+12%", up: true },
      { label: "Avg Occupancy", value: `${Math.round((occupiedBedsCount / totalAll) * 100)}%`, change: "+5%", up: true },
      { label: "Avg Stay Duration", value: "4.2 Days", change: "-3%", up: false },
    ];

    res.json({ occupancyData, admissionsMonthly, revenueData, stayDurationData, departmentRevenue, kpis });
  } catch (error) { console.error("Analytics Error", error); res.status(500).json({ error: "Failed to generate analytics" }); }
};
