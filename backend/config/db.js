const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'face_attendance_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log('🔄 Connecting to MySQL Database at:', dbConfig.host);

const pool = mysql.createPool(dbConfig);

// Test database connection pool
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed. Express server will run, but database queries will fail.');
    console.error('   Please check your MySQL service and .env configurations.');
    console.error('   Error Message:', error.message);
  }
}

testConnection();

module.exports = pool;
