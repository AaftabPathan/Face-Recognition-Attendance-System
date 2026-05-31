const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function diagnoseDatabase() {
  console.log('🔍 Running Database Diagnostic Check...');
  try {
    const [users] = await db.query('SELECT id, username, email, password_hash, role FROM users');
    
    if (users.length === 0) {
      console.log('❌ Database is empty! No user records found.');
      return;
    }

    console.log(`✅ Found ${users.length} users in database:`);
    for (const u of users) {
      const match = await bcrypt.compare('password123', u.password_hash);
      console.log(`   - ID: ${u.id} | User: "${u.username}" | Email: "${u.email}" | Role: "${u.role}"`);
      console.log(`     Hash: "${u.password_hash}"`);
      console.log(`     Matches "password123": ${match ? '🟢 YES' : '❌ NO'}`);
    }

  } catch (error) {
    console.error('❌ Database Diagnostic failed:', error.message);
  } finally {
    process.exit(0);
  }
}

diagnoseDatabase();
