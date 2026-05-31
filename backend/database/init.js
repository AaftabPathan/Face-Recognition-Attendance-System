const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  console.log('🔄 Starting Automated Database Initialization...');
  
  // Connection configuration without specifying database name first
  const connectionConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true // Allows executing entire SQL files at once!
  };

  let connection;

  try {
    // 1. Establish core MySQL connection
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to MySQL Server.');

    // 2. Create database if not exists
    const dbName = process.env.DB_NAME || 'face_attendance_db';
    console.log(`🔄 Creating database "${dbName}" if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log(`✅ Database "${dbName}" checked/created.`);

    // 3. Switch to target database
    await connection.query(`USE \`${dbName}\`;`);
    console.log(`🔄 Switched to database context "${dbName}".`);

    // 4. Read and Execute Schema script
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log('🔄 Reading schema.sql...');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔄 Executing schema commands...');
    await connection.query(schemaSQL);
    console.log('✅ Database schema tables created successfully.');

    // 5. Read and Execute Seed script
    const seedPath = path.join(__dirname, 'seed.sql');
    console.log('🔄 Reading seed.sql...');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    console.log('🔄 Seeding mockup students, faculty, and attendance logs...');
    await connection.query(seedSQL);
    console.log('✅ Mock data seeded successfully.');

    console.log('\n🎉 ========================================================');
    console.log('🚀 SYSTEM DATABASE INITIALIZED SUCCESSFULLY!');
    console.log('   All 10 tables mapped, indexes set, and mock accounts seeded.');
    console.log('=========================================================== 🎉\n');

  } catch (error) {
    console.error('\n❌ DATABASE INITIALIZATION FAILED!');
    console.error('Error Details:', error.message);
    console.error('Please check your XAMPP MySQL state and password in .env\n');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
