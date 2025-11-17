import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

// Get limits for team
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

    const teamLimits = await queryOne<{
      usage_limit: number | null;
    }>(
      'SELECT usage_limit FROM teams WHERE id = $1',
      [session.user.teamId]
    );

    return NextResponse.json({ teamLimit: teamLimits?.usage_limit || null });
  } catch (error) {
    console.error("Error fetching limits:", error);
    return NextResponse.json(
      { error: "Failed to fetch limits" },
      { status: 500 }
    );
  }
}

// Update team limit
export async function PATCH(req: NextRequest) {
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

    const { teamLimit } = await req.json();

    await query(
      'UPDATE teams SET usage_limit = $1 WHERE id = $2',
      [teamLimit === null ? null : parseInt(teamLimit), session.user.teamId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating limits:", error);
    return NextResponse.json(
      { error: "Failed to update limits" },
      { status: 500 }
    );
  }
}
