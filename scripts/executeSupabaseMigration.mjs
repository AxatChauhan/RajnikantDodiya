import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

const connectionString = 'postgresql://postgres:superSecretRajnikantDodiyaPassword@db.ztqmrikjwmlawifjekdy.supabase.co:5432/postgres';

async function runMigration() {
  console.log('Connecting to Supabase PostgreSQL...');
  
  // Try direct connection first, with fallback to pooled connection if IPv4/IPv6 issues
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to Supabase PostgreSQL database!');

    const schemaPath = path.join(process.cwd(), 'supabase', 'consolidated_production_schema.sql');
    console.log(`Reading SQL schema from ${schemaPath}...`);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing consolidated production schema migration...');
    await client.query(sql);
    console.log('✅ Successfully executed consolidated production schema!');

    // Verify all 11 tables exist in the public schema
    console.log('\nVerifying created tables in public schema:');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = res.rows.map(r => r.table_name);
    console.log('Tables found:', tableNames);

    const requiredTables = [
      'netvidya_users',
      'netvidya_buyers',
      'netvidya_reading_files',
      'netvidya_tests',
      'netvidya_store_settings',
      'site_content',
      'author_security',
      'students',
      'orders',
      'student_licenses',
      'device_sessions'
    ];

    let allPresent = true;
    for (const t of requiredTables) {
      if (tableNames.includes(t)) {
        console.log(`  ✅ Table '${t}' is present.`);
      } else {
        console.error(`  ❌ Table '${t}' is MISSING.`);
        allPresent = false;
      }
    }

    if (allPresent) {
      console.log('\n🎉 ALL 11 PRODUCTION TABLES SUCCESSFULLY CREATED AND VERIFIED!');
    } else {
      console.error('\n⚠️ Some tables were not found.');
    }

    // Check store settings seed
    const settingsRes = await client.query('SELECT * FROM public.netvidya_store_settings LIMIT 1;');
    console.log('Store settings seed row:', settingsRes.rows[0]);

  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
