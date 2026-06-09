import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type AuditLogInput = {
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  metadata?: unknown;
};

export async function writeAuditLog(input: AuditLogInput) {
  const session = await getAdminSession();
  const data = {
    adminId: session?.adminId || null,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId || null,
    summary: input.summary.slice(0, 512),
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
  };

  try {
    if ((prisma as any).auditLog?.create) {
      await (prisma as any).auditLog.create({ data });
      return;
    }

    await prisma.$executeRaw`
      INSERT INTO AuditLog (id, adminId, action, targetType, targetId, summary, metadata, createdAt)
      VALUES (UUID(), ${data.adminId}, ${data.action}, ${data.targetType}, ${data.targetId}, ${data.summary}, ${data.metadata}, NOW())
    `;
  } catch (error) {
    console.error("[audit-log] failed", error);
  }
}

export type RecentAuditLog = {
  id: string;
  action: string;
  summary: string;
  createdAt: Date;
};

export async function listRecentAuditLogs(limit = 6): Promise<RecentAuditLog[]> {
  try {
    if ((prisma as any).auditLog?.findMany) {
      return (prisma as any).auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
    }

    const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)));
    return await prisma.$queryRaw<RecentAuditLog[]>`
      SELECT id, action, summary, createdAt
      FROM AuditLog
      ORDER BY createdAt DESC
      LIMIT ${safeLimit}
    `;
  } catch {
    return [];
  }
}

export async function countAuditLogs() {
  try {
    if ((prisma as any).auditLog?.count) {
      return (prisma as any).auditLog.count();
    }

    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM AuditLog`;
    return Number(rows[0]?.count || 0);
  } catch {
    return 0;
  }
}

export async function listAuditLogs({ skip = 0, take = 20 } = {}): Promise<RecentAuditLog[]> {
  try {
    if ((prisma as any).auditLog?.findMany) {
      return (prisma as any).auditLog.findMany({ orderBy: { createdAt: "desc" }, skip, take });
    }

    const safeSkip = Math.max(0, Math.floor(skip));
    const safeTake = Math.max(1, Math.min(100, Math.floor(take)));
    return await prisma.$queryRaw<RecentAuditLog[]>`
      SELECT id, action, summary, createdAt
      FROM AuditLog
      ORDER BY createdAt DESC
      LIMIT ${safeTake}
      OFFSET ${safeSkip}
    `;
  } catch {
    return [];
  }
}
