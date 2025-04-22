const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');


const app = express();

app.use(express.json());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }))


// Rota para registrar um novo usuário
router.post('/register', async (req, res) => {
  const { name, email, password, role, birthdate, ssn, isActive} = req.body;
  console.log('Corpo da requisição:', req.body);
  try {
    // Verificar se o usuário já existe
    const queryCheckUser = 'SELECT * FROM users WHERE email = ?';
    db.query(queryCheckUser, [email], async (err, results) => {
      if (err) {
        console.error('Erro no servidor:', err);
        return res.status(500).json({ error: 'Erro no servidor' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      // Criptografar a senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Inserir novo usuário no banco de dados
      const queryInsertUser = 'INSERT INTO users (name, email, password, role, birthdate, ssn, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
      const createdAt = new Date();
      const updatedAt = new Date();
      db.query(queryInsertUser, [name, email, hashedPassword, role, birthdate, ssn, isActive!==undefined ? isActive : true, createdAt, updatedAt], (err, results) => {
        if (err) {
          console.error('Erro no servidor:', err);
          return res.status(500).json({ error: 'Erro no servidor' });
        }

        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

const userController = require('../controllers/userController');
// Rota para atualizar um usuário
router.put('/user/:id', userController.updateUser);

module.exports = router;

module.exports = router;