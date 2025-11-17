import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

// Get team's API key (masked)
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

    const team = await queryOne<{
      replicate_api_key: string | null;
    }>(
      'SELECT replicate_api_key FROM teams WHERE id = $1',
      [session.user.teamId]
    );

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Mask the API key if it exists
    let maskedKey = null;
    if (team.replicate_api_key) {
      const key = team.replicate_api_key;
      // Show only first 6 and last 4 characters
      if (key.length > 10) {
        maskedKey = `${key.substring(0, 6)}***...***${key.substring(key.length - 4)}`;
      } else {
        maskedKey = "***configured***";
      }
    }

    return NextResponse.json({
      configured: !!team.replicate_api_key,
      maskedKey,
    });
  } catch (error) {
    console.error("Error fetching API key:", error);
    return NextResponse.json(
      { error: "Failed to fetch API key" },
      { status: 500 }
    );
  }
}

// Update team's API key
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

    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Basic validation for Replicate API key format (starts with r8_)
    if (!apiKey.startsWith('r8_')) {
      return NextResponse.json(
        { error: "Invalid Replicate API key format. Key should start with 'r8_'" },
        { status: 400 }
      );
    }

    // Update the team's API key
    await query(
      'UPDATE teams SET replicate_api_key = $1 WHERE id = $2',
      [apiKey, session.user.teamId]
    );

    return NextResponse.json({
      success: true,
      message: "API key updated successfully",
    });
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    );
  }
}
