const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://stagefront.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); // <- adiciona suporte ao preflight OPTIONS

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Banco de dados
const db = require('./config/db');

// Sessão
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // mudar para true se usar HTTPS em produção
    httpOnly: true
  }
}));

// Rota de login
app.post('/api/users/login', (req, res) => {
  const { email, password } = req.body;

  console.log('Login body:', req.body);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const query = 'SELECT * FROM users WHERE email = $1';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Erro no banco:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }

    if (results.rows.length > 0) {
      const user = results.rows[0];

      if (user.loginattempts > 6) {
        return res.status(403).json({ error: 'Conta bloqueada. Tente novamente mais tarde.' });
      }

      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ error: 'Erro no servidor' });

        if (isMatch) {
          db.query('UPDATE users SET loginattempts = 0 WHERE email = $1', [email]);
          req.session.userId = user.id;
          res.status(200).json({ message: 'Login bem-sucedido!', redirectUrl: '/projects' });
        } else {
          db.query('UPDATE users SET loginattempts = loginattempts + 1 WHERE email = $1', [email]);
          res.status(401).json({ error: 'Credenciais inválidas' });
        }
      });
    } else {
      res.status(401).json({ error: 'Credenciais inválidas' });
    }
  });
});

// Middleware de autenticação
function authenticateSession(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }
  next();
}

// Rota protegida de exemplo
app.get('/api/protected', authenticateSession, (req, res) => {
  res.json({ message: 'Acesso permitido' });
});

// Rotas
app.use('/api', require('./routes/rotaRegistro'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/project'));
app.use('/api/members', require('./routes/members'));
app.use('/api/files', require('./routes/projectFiles'));
app.use('/api/projectMaterials', require('./routes/projectMaterials'));
app.use('/api/payroll', require('./routes/payroll'));

// Iniciar servidor
app.listen(5000, () => {
  console.log('Servidor rodando na porta 5000');
});
