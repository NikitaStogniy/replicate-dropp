import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

// Get usage statistics for the team
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!session.user.teamId) {
      return NextResponse.json({ error: "No team assigned" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Get team-wide statistics
    const teamStats = await query<{
      total_generations: number;
      unique_users: number;
      total_today: number;
    }>(
      `SELECT
        COUNT(*)::int as total_generations,
        COUNT(DISTINCT user_id)::int as unique_users,
        COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END)::int as total_today
      FROM generations
      WHERE team_id = $1`,
      [session.user.teamId]
    );

    // Get per-user breakdown
    const userStats = await query<{
      user_id: string;
      user_name: string | null;
      user_email: string;
      total_generations: number;
      generations_today: number;
      usage_limit: number | null;
    }>(
      `SELECT
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        COUNT(g.id)::int as total_generations,
        COUNT(CASE WHEN g.created_at::date = CURRENT_DATE THEN 1 END)::int as generations_today,
        u.usage_limit
      FROM users u
      LEFT JOIN generations g ON u.id = g.user_id
      WHERE u.team_id = $1
      GROUP BY u.id, u.name, u.email, u.usage_limit
      ORDER BY total_generations DESC`,
      [session.user.teamId]
    );

    // If userId is provided, get detailed stats for that user
    let userDetails = null;
    if (userId) {
      // Get generations by model
      const modelStats = await query<{
        model_id: string;
        count: number;
      }>(
        `SELECT
          model_id,
          COUNT(*)::int as count
        FROM generations
        WHERE user_id = $1 AND team_id = $2
        GROUP BY model_id
        ORDER BY count DESC`,
        [userId, session.user.teamId]
      );

      // Get recent generations
      const recentGenerations = await query<{
        id: string;
        model_id: string;
        prompt: string;
        created_at: string;
      }>(
        `SELECT id, model_id, prompt, created_at
        FROM generations
        WHERE user_id = $1 AND team_id = $2
        ORDER BY created_at DESC
        LIMIT 10`,
        [userId, session.user.teamId]
      );

      userDetails = {
        modelStats,
        recentGenerations,
      };
    }

    return NextResponse.json({
      teamStats: teamStats[0],
      userStats,
      userDetails,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
