// Script to create initial team and admin user
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const { nanoid } = require('nanoid');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createInitialTeam() {
  console.log('\n=== Initial Team & Admin Setup ===\n');

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    // Get team name
    const teamName = await question('Team name: ');
    if (!teamName.trim()) {
      console.error('❌ Team name cannot be empty');
      process.exit(1);
    }

    // Get admin details
    const adminEmail = await question('Admin email: ');
    if (!adminEmail.trim() || !adminEmail.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    const adminName = await question('Admin name (optional): ');

    // Get password (hidden input)
    const adminPassword = await question('Admin password (min 8 chars): ');
    if (adminPassword.length < 8) {
      console.error('❌ Password must be at least 8 characters');
      process.exit(1);
    }

    console.log('\n✨ Creating team and admin user...\n');

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingUser.rows.length > 0) {
      console.error('❌ User with this email already exists');
      process.exit(1);
    }

    // Create team
    const teamResult = await pool.query(
      'INSERT INTO teams (name) VALUES ($1) RETURNING id',
      [teamName]
    );
    const teamId = teamResult.rows[0].id;

    console.log(`✅ Team created: ${teamName} (ID: ${teamId})`);

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const userId = nanoid();
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, team_id, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, adminEmail, passwordHash, adminName || null, teamId, 'admin', true]
    );

    console.log(`✅ Admin user created: ${adminEmail}`);

    // Create a sample invite code
    const inviteCode = nanoid(16);
    await pool.query(
      `INSERT INTO invite_codes (code, team_id, type, created_by)
       VALUES ($1, $2, $3, $4)`,
      [inviteCode, teamId, 'invite', userId]
    );

    console.log('\n=== Setup Complete! ===\n');
    console.log(`Team: ${teamName}`);
    console.log(`Admin: ${adminEmail}`);
    console.log(`\nSample invite code for team members: ${inviteCode}`);
    console.log('\nYou can now:');
    console.log('1. Sign in at /signin with your admin credentials');
    console.log('2. Access admin dashboard at /admin');
    console.log('3. Generate more invite codes for team members\n');

    await pool.end();
    rl.close();
  } catch (error) {
    console.error('❌ Error creating team:', error);
    await pool.end();
    rl.close();
    process.exit(1);
  }
}

createInitialTeam();
