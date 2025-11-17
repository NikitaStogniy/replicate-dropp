import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { nanoid } from "nanoid";

// Get all invite codes for the team
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

    const inviteCodes = await query<{
      code: string;
      type: string;
      user_email: string | null;
      used: boolean;
      created_at: string;
      expires_at: string | null;
    }>(
      `SELECT code, type, user_email, used, created_at, expires_at
       FROM invite_codes
       WHERE team_id = $1
       ORDER BY created_at DESC`,
      [session.user.teamId]
    );

    return NextResponse.json({ inviteCodes });
  } catch (error) {
    console.error("Error fetching invite codes:", error);
    return NextResponse.json(
      { error: "Failed to fetch invite codes" },
      { status: 500 }
    );
  }
}

// Create a new invite code
export async function POST(req: NextRequest) {
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

    const { type, userEmail, expiresInDays } = await req.json();

    // Validate type
    if (!type || !['invite', 'password_reset'].includes(type)) {
      return NextResponse.json(
        { error: "Invalid code type" },
        { status: 400 }
      );
    }

    // For password reset, userEmail is required
    if (type === 'password_reset' && !userEmail) {
      return NextResponse.json(
        { error: "User email is required for password reset codes" },
        { status: 400 }
      );
    }

    // Generate unique code
    const code = nanoid(16);

    // Calculate expiration if provided
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays));
    }

    // Insert invite code
    await query(
      `INSERT INTO invite_codes (code, team_id, type, user_email, created_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        code,
        session.user.teamId,
        type,
        userEmail || null,
        session.user.id,
        expiresAt,
      ]
    );

    return NextResponse.json({
      success: true,
      code,
      expiresAt,
    });
  } catch (error) {
    console.error("Error creating invite code:", error);
    return NextResponse.json(
      { error: "Failed to create invite code" },
      { status: 500 }
    );
  }
}

// Delete an invite code
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    // Delete code (verify it belongs to admin's team)
    await query(
      'DELETE FROM invite_codes WHERE code = $1 AND team_id = $2',
      [code, session.user.teamId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invite code:", error);
    return NextResponse.json(
      { error: "Failed to delete invite code" },
      { status: 500 }
    );
  }
}
