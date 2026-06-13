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
    await prisma.auditLog.create({ data });
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
    return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit });
  } catch {
    return [];
  }
}

export async function countAuditLogs() {
  try {
    return prisma.auditLog.count();
  } catch {
    return 0;
  }
}

export async function listAuditLogs({ skip = 0, take = 20 } = {}): Promise<RecentAuditLog[]> {
  try {
    return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, skip, take });
  } catch {
    return [];
  }
}
