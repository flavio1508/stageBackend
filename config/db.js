const { Pool } = require('pg');
require('dotenv').config();

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necessário para Neon e alguns outros serviços
  },
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados PostgreSQL:', err);
  } else {
    console.log('Conectado ao banco de dados PostgreSQL');
  }
});

module.exports = db;
