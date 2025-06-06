const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10, // número máximo de conexões simultâneas
});

pool.connect()
  .then(client => {
    console.log('✅ Conectado ao banco de dados PostgreSQL');
    client.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao banco de dados PostgreSQL:', err);
  });

module.exports = pool;
