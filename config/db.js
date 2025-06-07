const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool
  .query('SELECT NOW()') // pequeno teste para forçar conexão ao carregar
  .then(() => {
    console.log('Conectado ao banco de dados PostgreSQL');
  })
  .catch(err => {
    console.error('Erro ao conectar ao banco de dados PostgreSQL:', err);
  });

module.exports = pool;
