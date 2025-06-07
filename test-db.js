const db = require('./config/db');

db.query('SELECT NOW()')
  .then(res => {
    console.log('Hora atual do banco:', res.rows[0]);
    db.end(); // Encerra o pool
  })
  .catch(err => {
    console.error('Erro ao testar conexão com o banco:', err);
  });
