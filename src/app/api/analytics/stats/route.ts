// Route API pour les statistiques / analytics
import { NextRequest, NextResponse } from "next/server"
import { requireUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPlanLimits } from "@/config/plans"
import type { PlanType } from "@/config/plans"
import { withErrorHandling } from "@/lib/api-error-handler"

export const GET = withErrorHandling(async (request: NextRequest) => {
  try {
    const user = await requireUser()

    const { searchParams } = request.nextUrl
    const mode = searchParams.get("mode") ?? "basic"

    // Stats avancees reservees au plan AGENCY
    if (mode === "advanced") {
      const limits = getPlanLimits(user.plan as PlanType, user.isAdmin)
      if (!limits.analytics) {
        return NextResponse.json(
          { error: "Fonctionnalite reservee au plan Agence" },
          { status: 403 }
        )
      }
    }

    // --- Stats basiques (tous plans) ---
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Publications ce mois
    const publishedThisMonth = await prisma.publication.count({
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth },
      },
    })

    // Repartition par statut
    const statusBreakdown = await prisma.publication.groupBy({
      by: ["status"],
      where: { userId: user.id },
      _count: { id: true },
    })

    // Taux de succes par plateforme
    const platformStats = await prisma.platformPublication.groupBy({
      by: ["status"],
      where: {
        publication: { userId: user.id },
      },
      _count: { id: true },
    })

    // Succes par plateforme (join via platformConnection)
    const platformSuccessRaw = await prisma.$queryRaw<
      Array<{ platform: string; total: bigint; success: bigint }>
    >`
      SELECT
        pc.platform,
        COUNT(pp.id)::bigint AS total,
        COUNT(CASE WHEN pp.status = 'PUBLISHED' THEN 1 END)::bigint AS success
      FROM platform_publications pp
      JOIN platform_connections pc ON pp.platform_connection_id = pc.id
      JOIN publications p ON pp.publication_id = p.id
      WHERE p.user_id = ${user.id}
      GROUP BY pc.platform
    `

    const platformSuccess = platformSuccessRaw.map((row) => ({
      platform: row.platform,
      total: Number(row.total),
      success: Number(row.success),
      rate: Number(row.total) > 0
        ? Math.round((Number(row.success) / Number(row.total)) * 100)
        : 0,
    }))

    // Activite recente 7 jours
    const recentActivity = await prisma.publication.count({
      where: {
        userId: user.id,
        createdAt: { gte: sevenDaysAgo },
      },
    })

    const basicStats = {
      publishedThisMonth,
      statusBreakdown: statusBreakdown.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      platformSuccess,
      platformPublishStats: platformStats.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      recentActivity,
    }

    if (mode === "basic") {
      return NextResponse.json(basicStats)
    }

    // --- Stats avancees (AGENCY) ---
    // Tendances sur 6 mois
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const monthlyTrends = await prisma.$queryRaw<
      Array<{
        month: string
        total: bigint
        published: bigint
        failed: bigint
        ai_generated: bigint
      }>
    >`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') AS month,
        COUNT(*)::bigint AS total,
        COUNT(CASE WHEN status = 'PUBLISHED' THEN 1 END)::bigint AS published,
        COUNT(CASE WHEN status = 'FAILED' THEN 1 END)::bigint AS failed,
        COUNT(CASE WHEN ai_generated = true THEN 1 END)::bigint AS ai_generated
      FROM publications
      WHERE user_id = ${user.id}
        AND created_at >= ${sixMonthsAgo}
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `

    const trends = monthlyTrends.map((row) => ({
      month: row.month,
      total: Number(row.total),
      published: Number(row.published),
      failed: Number(row.failed),
      aiGenerated: Number(row.ai_generated),
    }))

    // Repartition par type de contenu
    const contentTypeBreakdown = await prisma.publication.groupBy({
      by: ["contentType"],
      where: { userId: user.id },
      _count: { id: true },
    })

    // Pourcentage d'utilisation IA
    const totalPubs = await prisma.publication.count({
      where: { userId: user.id },
    })
    const aiPubs = await prisma.publication.count({
      where: { userId: user.id, aiGenerated: true },
    })
    const aiUsagePercent = totalPubs > 0
      ? Math.round((aiPubs / totalPubs) * 100)
      : 0

    return NextResponse.json({
      ...basicStats,
      advanced: {
        trends,
        contentTypeBreakdown: contentTypeBreakdown.map((c) => ({
          contentType: c.contentType,
          count: c._count.id,
        })),
        aiUsagePercent,
        totalPublications: totalPubs,
        aiPublications: aiPubs,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Non authentifie") {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
    }
    console.error("Erreur recuperation analytics :", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
});
