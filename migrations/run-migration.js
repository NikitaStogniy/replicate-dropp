// Migration runner script
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://neondb_owner:npg_3OMJG7bYufNR@ep-calm-forest-agk3ex2n-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  // Read the migration file
  const migrationSQL = fs.readFileSync(
    path.join(__dirname, '001_initial_schema.sql'),
    'utf8'
  );

  try {
    console.log('Running migration...');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
