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
      where: { hospitalId, date: { gte: new Date() }, status: 'PENDING' },
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

    // Compute actual total revenue from Billing table
    const totalBilling = await prisma.billing.aggregate({
      where: { hospitalId },
      _sum: { totalAmount: true },
    });
    const totalRevenueSum = totalBilling._sum.totalAmount || 0;

    // Fetch admissions in the last 6 months to construct actual monthly trends
    const now = new Date();
    const monthsData = [];
    
    // Generate the last 6 calendar months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const monthLabel = d.toLocaleString("en-US", { month: "short" });

      const admissionsCount = await prisma.admission.count({
        where: {
          bed: { room: { hospitalId } },
          admissionDate: { gte: startOfMonth, lte: endOfMonth }
        }
      });

      const dischargesCount = await prisma.admission.count({
        where: {
          bed: { room: { hospitalId } },
          dischargeDate: { gte: startOfMonth, lte: endOfMonth }
        }
      });

      const monthlyBilling = await prisma.billing.aggregate({
        where: {
          hospitalId,
          createdAt: { gte: startOfMonth, lte: endOfMonth }
        },
        _sum: { totalAmount: true }
      });

      monthsData.push({
        label: monthLabel,
        admissions: admissionsCount,
        discharges: dischargesCount,
        revenue: monthlyBilling._sum.totalAmount || 0
      });
    }

    const admissionsMonthly = monthsData.map(m => ({
      month: m.label,
      admissions: m.admissions,
      discharges: m.discharges
    }));

    const revenueData = monthsData.map(m => ({
      month: m.label,
      revenue: m.revenue
    }));

    // Calculate real stay durations for discharged patients
    const dischargedAdmissions = await prisma.admission.findMany({
      where: {
        bed: { room: { hospitalId } },
        status: "Discharged",
        dischargeDate: { not: null },
        admissionDate: { not: null }
      },
      select: {
        admissionDate: true,
        dischargeDate: true
      }
    });

    let oneDay = 0;
    let twoToThree = 0;
    let fourToSeven = 0;
    let eightToFourteen = 0;
    let fifteenPlus = 0;
    let totalStayDays = 0;

    dischargedAdmissions.forEach(adm => {
      if (adm.admissionDate && adm.dischargeDate) {
        const diffTime = Math.abs(adm.dischargeDate.getTime() - adm.admissionDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        
        totalStayDays += diffDays;
        
        if (diffDays <= 1) {
          oneDay++;
        } else if (diffDays <= 3) {
          twoToThree++;
        } else if (diffDays <= 7) {
          fourToSeven++;
        } else if (diffDays <= 14) {
          eightToFourteen++;
        } else {
          fifteenPlus++;
        }
      }
    });

    const stayDurationData = [
      { range: "1 Day", count: oneDay },
      { range: "2-3 Days", count: twoToThree },
      { range: "4-7 Days", count: fourToSeven },
      { range: "8-14 Days", count: eightToFourteen },
      { range: "15+ Days", count: fifteenPlus },
    ];

    // Compute department wise revenues
    // Since department is associated with rooms/memberships, let's group billing by Room types dynamically
    const billingsWithRooms = await prisma.billing.findMany({
      where: { hospitalId },
      include: {
        admission: {
          include: {
            bed: {
              include: {
                room: true
              }
            }
          }
        }
      }
    });

    const deptMap: Record<string, number> = {};
    billingsWithRooms.forEach(b => {
      const roomType = b.admission?.bed?.room?.type || "General";
      deptMap[roomType] = (deptMap[roomType] || 0) + b.totalAmount;
    });

    const departmentRevenue = Object.entries(deptMap).map(([dept, revenue]) => {
      const pct = totalRevenueSum > 0 ? Math.round((revenue / totalRevenueSum) * 100) : 0;
      return { dept, revenue, pct };
    });

    // Handle fallback if empty
    if (departmentRevenue.length === 0) {
      departmentRevenue.push({ dept: "General", revenue: 0, pct: 0 });
    }

    const totalAll = availableBeds + occupiedBedsCount + maintenanceBeds || 1;
    const avgStayStr = dischargedAdmissions.length > 0 
      ? `${(totalStayDays / dischargedAdmissions.length).toFixed(1)} Days`
      : "0 Days";

    const totalPatients = await prisma.patient.count({ where: { appointments: { some: { hospitalId } } } });

    const kpis = [
      { label: "Total Revenue", value: `₹${totalRevenueSum.toLocaleString()}`, change: "+0%", up: true },
      { label: "Total Patients", value: `${totalPatients}`, change: "+0%", up: true },
      { label: "Avg Occupancy", value: `${Math.round((occupiedBedsCount / totalAll) * 100)}%`, change: "+0%", up: true },
      { label: "Avg Stay Duration", value: avgStayStr, change: "+0%", up: true },
    ];

    res.json({ occupancyData, admissionsMonthly, revenueData, stayDurationData, departmentRevenue, kpis });
  } catch (error) {
    console.error("Analytics Error", error);
    res.status(500).json({ error: "Failed to generate analytics" });
  }
};

