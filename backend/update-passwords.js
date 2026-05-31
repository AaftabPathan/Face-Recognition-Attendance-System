const db = require('./config/db');

async function updatePasswords() {
  console.log('🔄 Running Safe Password Update Script...');
  const correctHash = '$2a$10$eA2FuA7/K7U/bhbMSB25JOib31YA3TtPVvm2R4My9FW6NySDwPm8S';
  
  try {
    await db.query('UPDATE users SET password_hash = ? WHERE id <= 7', [correctHash]);
    console.log('✅ Passwords updated successfully in MySQL!');
  } catch (error) {
    console.error('❌ Failed to update passwords:', error.message);
  } finally {
    process.exit(0);
  }
}

updatePasswords();
