import pool from '../config/database';
import fs from 'fs';
import path from 'path';

async function createAllTables() {
  const client = await pool.connect();
  try {
    console.log('Creating all database tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-all-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    await client.query('BEGIN');
    
    for (let i = 0; i < statements.length; i++) {
      const trimmed = statements[i].trim();
      if (trimmed && !trimmed.startsWith('--')) {
        try {
          await client.query(trimmed);
          console.log(`✓ Executed statement ${i + 1}/${statements.length}`);
        } catch (err: any) {
          // If table already exists, log warning but continue
          if (err.code === '42P07') {
            console.log(`ℹ Table already exists, skipping statement ${i + 1}/${statements.length}`);
          } else {
            throw err; // Re-throw other errors
          }
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to create tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if executed directly
if (require.main === module) {
  createAllTables()
    .then(() => {
      console.log('Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export default createAllTables;
