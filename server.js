const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// CORS

app.use(cors({
  origin: 'https://stagefront.onrender.com',
  credentials: true,
}));




// Banco de dados
const db = require('./config/db');

// Sessão
const isProduction = process.env.NODE_ENV === 'production';

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,          // Só usar secure em produção
        httpOnly: true,
        sameSite: isProduction ? 'None' : 'Lax', // SameSite None só em produção
    }
}));


// Rota de login
// Rota de login
app.post('/api/users/login', (req, res) => {
    const { email, password } = req.body;

    // Adicionando logs para verificar o corpo da requisição
    console.log('Corpo da requisição:', req.body);
    console.log('Email:', email);
    console.log('Password:', password);

    if (!email || !password) {
        console.log('Email ou senha ausentes!');
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const query = 'SELECT * FROM users WHERE email = $1';
    console.log('Consultando banco de dados para o email:', email);
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Erro no servidor:', err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }

        // Log para verificar os resultados da consulta
        console.log('Resultados da consulta:', results);

        if (results.rows.length > 0) {
            const user = results.rows[0];
            console.log('Usuário encontrado:', user);

            // Verificar se o usuário está bloqueado
            if (user.loginAttempts > 6) {
                console.log('Conta bloqueada para o usuário:', email);
                return res.status(403).json({ error: 'Conta bloqueada. Tente novamente mais tarde.' });
            }

            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    console.error('Erro no servidor:', err);
                    return res.status(500).json({ error: 'Erro no servidor' });
                }

                // Log para verificar o resultado da comparação de senhas
                console.log('Senha correta:', isMatch);

                if (isMatch) {
                    console.log('Senha correta para o usuário:', email);

                    // Resetar o contador de tentativas de login
                    const resetAttemptsQuery = 'UPDATE users SET loginAttempts = 0 WHERE email = $1';
                    db.query(resetAttemptsQuery, [email], (err, results) => {
                        if (err) {
                            console.error('Erro ao resetar tentativas de login:', err);
                        } else {
                            console.log('Tentativas de login resetadas para o usuário:', email);
                        }
                    });

                    // Armazenar o ID do usuário na sessão
                    req.session.userId = user.id;
                    console.log('Sessão iniciada para o usuário:', email);
                    res.status(200).json({ message: 'Login bem-sucedido!', redirectUrl: '/projects' });
                } else {
                    console.log('Senha incorreta para o usuário:', email);

                    // Incrementar o contador de tentativas de login
                    const incrementAttemptsQuery = 'UPDATE users SET loginAttempts = loginAttempts + 1 WHERE email = $1';
                    db.query(incrementAttemptsQuery, [email], (err, results) => {
                        if (err) {
                            console.error('Erro ao incrementar tentativas de login:', err);
                        } else {
                            console.log('Tentativas de login incrementadas para o usuário:', email);
                        }
                    });

                    res.status(401).json({ error: 'Credenciais inválidas' });
                }
            });
        } else {
            console.log('Usuário não encontrado:', email);
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    });
});

// Middleware para verificar a sessão
function authenticateSession(req, res, next) {
    console.log('Verificando sessão para o ID do usuário:', req.session.userId);
    if (!req.session.userId) {
        console.log('Usuário não autenticado');
        return res.status(401).json({ error: 'Não autenticado' });
    }
    console.log('Usuário autenticado:', req.session.userId);
    next();
}

// Exemplo de rota protegida
app.get('/api/protected', authenticateSession, (req, res) => {
    res.json({ message: 'Acesso permitido' });
});

// Importar e usar as rotas
const rotaRegistro = require('./routes/rotaRegistro');
app.use('/api', rotaRegistro);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
console.log('🛠️  Rotas de projetos carregadas');

const projectsRouter = require('./routes/project');
app.use('/api/projects', projectsRouter);
console.log('🛠️  Rotas de projetos carregadas');

const membersRouter = require('./routes/members');
app.use('/api/members', membersRouter);

const filesRouter = require('./routes/projectFiles');
app.use('/api/files', filesRouter);

const budgetItemsRouter = require('./routes/projectMaterials');
app.use('/api/projectMaterials', budgetItemsRouter);

const payrollRouter = require('./routes/payroll');
app.use('/api/payroll', payrollRouter);

// Iniciar servidor
app.listen(5000, () => {
  console.log('Servidor rodando na porta 5000');
});
