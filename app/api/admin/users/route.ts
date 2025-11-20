import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

// Get all users in the admin's team
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

    // Get all users in the team with their generation counts
    const users = await query<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      is_active: boolean;
      usage_limit: number | null;
      created_at: string;
      generation_count: number;
    }>(
      `SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.usage_limit,
        u.created_at,
        COUNT(g.id)::int as generation_count
      FROM users u
      LEFT JOIN generations g ON u.id = g.user_id
      WHERE u.team_id = $1
      GROUP BY u.id, u.name, u.email, u.role, u.is_active, u.usage_limit, u.created_at
      ORDER BY u.created_at DESC`,
      [session.user.teamId]
    );

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// Update user (disable/enable or change limits)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId, isActive, usageLimit, role } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user is in the same team
    const userInTeam = await query(
      'SELECT id FROM users WHERE id = $1 AND team_id = $2',
      [userId, session.user.teamId]
    );

    if (!userInTeam.length) {
      return NextResponse.json(
        { error: "User not found in your team" },
        { status: 404 }
      );
    }

    // Update user
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (typeof isActive === 'boolean') {
      updates.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }

    if (usageLimit !== undefined) {
      updates.push(`usage_limit = $${paramCount}`);
      values.push(usageLimit === null ? null : parseInt(usageLimit));
      paramCount++;
    }

    if (role !== undefined) {
      // Validate role
      if (!['admin', 'user'].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be 'admin' or 'user'" },
          { status: 400 }
        );
      }
      updates.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    values.push(userId);
    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}`,
      values
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Delete user
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify user is in the same team
    const userInTeam = await query(
      'SELECT id FROM users WHERE id = $1 AND team_id = $2',
      [userId, session.user.teamId]
    );

    if (!userInTeam.length) {
      return NextResponse.json(
        { error: "User not found in your team" },
        { status: 404 }
      );
    }

    // Don't allow deleting yourself
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user (CASCADE will handle related records)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
