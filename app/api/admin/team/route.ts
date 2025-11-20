import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

// Get team information
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

    // Get team information
    const teams = await query<{
      id: number;
      name: string;
      created_at: string;
    }>(
      `SELECT id, name, created_at FROM teams WHERE id = $1`,
      [session.user.teamId]
    );

    if (!teams.length) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({ team: teams[0] });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team information" },
      { status: 500 }
    );
  }
}
