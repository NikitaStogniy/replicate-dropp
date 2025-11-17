import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, inviteCode } = await req.json();

    // Validate input
    if (!email || !password || !inviteCode) {
      return NextResponse.json(
        { error: "Email, password, and invite code are required" },
        { status: 400 }
      );
    }

    // Validate invite code
    const invite = await queryOne<{
      code: string;
      team_id: string;
      type: string;
      used: boolean;
      expires_at: string | null;
    }>(
      `SELECT code, team_id, type, used, expires_at
       FROM invite_codes
       WHERE code = $1 AND type = 'invite'`,
      [inviteCode]
    );

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 400 }
      );
    }

    if (invite.used) {
      return NextResponse.json(
        { error: "Invite code has already been used" },
        { status: 400 }
      );
    }

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Invite code has expired" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user (let PostgreSQL generate the UUID)
    await query(
      `INSERT INTO users (email, password_hash, name, team_id, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, passwordHash, name || null, invite.team_id, 'user', true]
    );

    // Mark invite code as used
    await query(
      'UPDATE invite_codes SET used = true WHERE code = $1',
      [inviteCode]
    );

    return NextResponse.json(
      { success: true, message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
