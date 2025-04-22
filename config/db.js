const { Pool } = require('pg');

const db = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432, // porta padrão do PostgreSQL
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados PostgreSQL:', err);
  } else {
    console.log('Conectado ao banco de dados PostgreSQL');
  }
});

module.exports = db;
