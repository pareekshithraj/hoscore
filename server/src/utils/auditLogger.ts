export const logAudit = async (
  req: any,
  action: string,
  entity: string,
  entityId?: string,
  details?: string,
) => {
  try {
    const { prisma } = await import("../index.js");
    await prisma.auditLog.create({
      data: {
        hospitalId: req.user?.hospitalId || null,
        userId: req.user?.userId || null,
        userName: req.user?.name || "System",
        userRole: req.user?.role || null,
        action,
        entity,
        entityId: entityId || null,
        details: details || null,
        ipAddress: req.ip || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
