import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query, queryOne } from "@/lib/db";
import { logger } from "@/lib/logger";

// Validation schema for signup
const signupSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  name: z.string().optional(),
  inviteCode: z.string().min(1, "Invite code is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input with Zod
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const { email, password, name, inviteCode } = validation.data;

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
    logger.error("Signup error:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
