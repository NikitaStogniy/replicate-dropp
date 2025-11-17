// Quick setup script for initial team
const { Pool } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_3OMJG7bYufNR@ep-calm-forest-agk3ex2n-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

// Configuration - change these values
const TEAM_NAME = process.argv[2] || 'Test Team';
const ADMIN_EMAIL = process.argv[3] || 'admin@example.com';
const ADMIN_NAME = process.argv[4] || 'Admin User';
const ADMIN_PASSWORD = process.argv[5] || 'password123';
const REPLICATE_API_KEY = process.argv[6] || null; // Optional

async function setup() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('\n✨ Creating team and admin user...\n');

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existingUser.rows.length > 0) {
      console.log('ℹ️  User with this email already exists. Skipping user creation.');
      await pool.end();
      return;
    }

    // Create team with optional API key
    const teamResult = await pool.query(
      'INSERT INTO teams (name, replicate_api_key) VALUES ($1, $2) RETURNING id',
      [TEAM_NAME, REPLICATE_API_KEY]
    );
    const teamId = teamResult.rows[0].id;
    console.log(`✅ Team created: ${TEAM_NAME} (ID: ${teamId})`);
    if (REPLICATE_API_KEY) {
      console.log(`✅ Replicate API key configured`);
    } else {
      console.log(`⚠️  No Replicate API key provided - set it in admin dashboard`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Create admin user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name, team_id, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [ADMIN_EMAIL, passwordHash, ADMIN_NAME, teamId, 'admin', true]
    );
    const userId = userResult.rows[0].id;
    console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);

    // Create sample invite codes
    const inviteCode1 = nanoid(16);
    const inviteCode2 = nanoid(16);
    await pool.query(
      `INSERT INTO invite_codes (code, team_id, type, created_by)
       VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)`,
      [inviteCode1, teamId, 'invite', userId, inviteCode2, teamId, 'invite', userId]
    );

    console.log('\n=== Setup Complete! ===\n');
    console.log(`Team: ${TEAM_NAME}`);
    console.log(`Admin Email: ${ADMIN_EMAIL}`);
    console.log(`Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`Replicate API Key: ${REPLICATE_API_KEY ? 'Configured ✓' : 'Not set ✗'}`);
    console.log(`\nSample invite codes:`);
    console.log(`  1. ${inviteCode1}`);
    console.log(`  2. ${inviteCode2}`);
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Visit: http://localhost:3000/signin');
    console.log('3. Sign in with the admin credentials above');
    console.log('4. Access admin dashboard at /admin');
    if (!REPLICATE_API_KEY) {
      console.log('5. ⚠️  SET REPLICATE API KEY in admin dashboard (required for generation)');
    }
    console.log('');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

setup();
