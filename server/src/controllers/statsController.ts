import type { Request, Response } from "express";
import { prisma } from "../index.js";

const hid = (req: Request) => (req as any).user?.hospitalId;

export const getSimulatorData = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const [emergency, icu, wardA, wardB, pharmacy, lab, monitoringLogs] = await Promise.all([
      prisma.oPDQueue.count({ where: { hospitalId, status: 'IN_CONSULTATION' } }),
      prisma.admission.count({ where: { status: 'Admitted', bed: { room: { hospitalId, name: { contains: 'ICU' } } } } }),
      prisma.admission.count({ where: { status: "Admitted", bed: { room: { hospitalId, name: { contains: "Ward A" } } } } }),
      prisma.admission.count({ where: { status: "Admitted", bed: { room: { hospitalId, name: { contains: "Ward B" } } } } }),
      prisma.prescription.count({ where: { hospitalId, status: 'ISSUED' } }),
      prisma.labOrder.count({ where: { hospitalId, status: 'IN_PROGRESS' } }),
      prisma.auditLog.findMany({
        where: { hospitalId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { action: true, entity: true, details: true, createdAt: true },
      }),
    ]);

    const census = {
      emergency,
      icu,
      'ward-a': wardA,
      'ward-b': wardB,
      pharmacy,
      lab,
    };

    res.json({ census, monitoringLogs });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch simulator data' }); }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const hospitalId = hid(req);
    const roomFilter = { room: { hospitalId } };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    // 7-day window (weekly chart is bucketed in memory from grouped rows below)
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    // ---- Fire every independent query concurrently instead of awaiting serially ----
    const [
      totalPatients,
      totalRooms,
      totalBeds,
      occupiedBeds,
      recentAdmissions,
      upcomingAppointments,
      activeQueue,
      pendingLabs,
      pendingRx,
      todaysShifts,
      pendingClaims,
      totalICUBeds,
      occupiedICUBeds,
      totalERBeds,
      occupiedERBeds,
      weekAdmissions,
      weekDischarges,
      weekBilling,
      apptsByDoctor,
      doctorsList,
      completedQueues,
    ] = await Promise.all([
      prisma.patient.count({ where: { appointments: { some: { hospitalId } } } }),
      prisma.room.count({ where: { hospitalId } }),
      prisma.bed.count({ where: roomFilter }),
      prisma.bed.count({ where: { ...roomFilter, status: "OCCUPIED" } }),
      prisma.admission.findMany({
        where: { bed: { room: { hospitalId } } },
        take: 5,
        orderBy: { admissionDate: "desc" },
        include: { patient: true, bed: { include: { room: true } } },
      }),
      prisma.appointment.findMany({
        where: { hospitalId, date: { gte: new Date() }, status: 'PENDING' },
        take: 5,
        orderBy: { date: "asc" },
        include: { patient: true },
      }),
      prisma.oPDQueue.count({ where: { hospitalId, status: { in: ["WAITING", "IN_CONSULTATION"] } } }),
      prisma.labOrder.count({ where: { hospitalId, status: { in: ["ORDERED", "SAMPLE_COLLECTED", "IN_PROGRESS"] } } }),
      prisma.prescription.count({ where: { hospitalId, status: "ISSUED" } }),
      prisma.shiftSchedule.count({ where: { hospitalId, date: { gte: startOfToday, lte: endOfToday } } }),
      prisma.insuranceClaim.count({ where: { hospitalId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
      prisma.bed.count({ where: { room: { hospitalId, type: "ICU" } } }),
      prisma.bed.count({ where: { room: { hospitalId, type: "ICU" }, status: "OCCUPIED" } }),
      prisma.bed.count({ where: { room: { hospitalId, type: { in: ["Emergency", "Triage", "ER"] } } } }),
      prisma.bed.count({ where: { room: { hospitalId, type: { in: ["Emergency", "Triage", "ER"] } }, status: "OCCUPIED" } }),
      // Pull the week's rows once and bucket in memory (was 7 × 3 = 21 serial queries)
      prisma.admission.findMany({
        where: { bed: { room: { hospitalId } }, admissionDate: { gte: weekStart, lte: endOfToday } },
        select: { admissionDate: true },
      }),
      prisma.admission.findMany({
        where: { bed: { room: { hospitalId } }, dischargeDate: { gte: weekStart, lte: endOfToday } },
        select: { dischargeDate: true },
      }),
      prisma.billing.findMany({
        where: { hospitalId, createdAt: { gte: weekStart, lte: endOfToday } },
        select: { createdAt: true, totalAmount: true },
      }),
      // Department distribution in ONE grouped query (was one count per doctor — N+1)
      prisma.appointment.groupBy({
        by: ['doctorId'],
        where: { hospitalId, doctorId: { not: null } },
        _count: { _all: true },
      }),
      prisma.doctor.findMany({ where: { hospitalId }, select: { id: true, specialty: true } }),
      prisma.oPDQueue.findMany({
        where: { hospitalId, status: "COMPLETED", calledAt: { not: null } },
        select: { createdAt: true, calledAt: true },
        take: 50,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    const icuOccupancyRate = totalICUBeds > 0 ? Math.round((occupiedICUBeds / totalICUBeds) * 100) : undefined;
    const erOccupancyRate = totalERBeds > 0 ? Math.round((occupiedERBeds / totalERBeds) * 100) : undefined;

    // ---- Bucket the week's rows into 7 days in memory ----
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const admByDay: Record<string, number> = {};
    const disByDay: Record<string, number> = {};
    const revByDay: Record<string, number> = {};
    for (const a of weekAdmissions) if (a.admissionDate) admByDay[dayKey(a.admissionDate)] = (admByDay[dayKey(a.admissionDate)] || 0) + 1;
    for (const dc of weekDischarges) if (dc.dischargeDate) disByDay[dayKey(dc.dischargeDate)] = (disByDay[dayKey(dc.dischargeDate)] || 0) + 1;
    for (const b of weekBilling) revByDay[dayKey(b.createdAt)] = (revByDay[dayKey(b.createdAt)] || 0) + (b.totalAmount || 0);

    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const k = dayKey(d);
      weeklyData.push({
        name: weekdays[d.getDay()],
        admissions: admByDay[k] || 0,
        discharges: disByDay[k] || 0,
        revenue: revByDay[k] || 0,
      });
    }

    // ---- Map grouped appointment counts onto doctor specialties ----
    const specialtyById: Record<string, string | null> = {};
    for (const doc of doctorsList) specialtyById[doc.id] = doc.specialty;
    const deptCounts: Record<string, number> = {};
    for (const row of apptsByDoctor) {
      const specialty = row.doctorId ? specialtyById[row.doctorId] : null;
      const count = row._count._all;
      if (specialty && count > 0) {
        deptCounts[specialty] = (deptCounts[specialty] || 0) + count;
      }
    }
    const colors = ["#38bdf8", "#6366f1", "#a78bfa", "#34d399", "#f43f5e", "#fbbf24"];
    const departmentData = Object.entries(deptCounts).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));

    // Real average wait/triage time from completed OPD queues (undefined when none — client shows "—")
    let avgTriageTime: number | undefined = undefined;
    if (completedQueues.length > 0) {
      const sum = completedQueues.reduce((acc, q) => {
        if (q.calledAt && q.createdAt) {
          return acc + (q.calledAt.getTime() - q.createdAt.getTime()) / (1000 * 60);
        }
        return acc;
      }, 0);
      avgTriageTime = Math.round((sum / completedQueues.length) * 10) / 10;
    }

    res.json({
      totalPatients, totalRooms, totalBeds, occupiedBeds,
      occupancyRate: Math.round(occupancyRate),
      icuOccupancyRate,
      erOccupancyRate,
      weeklyData,
      departmentData,
      recentAdmissions, upcomingAppointments,
      avgTriageTime,
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

