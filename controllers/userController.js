const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Encontrar o usuário pelo email
    const query = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
    const result = await db.query(query, [email]);
    const user = result.rows[0];
        if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verificar se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }  

    if (!user.isActive) {
      return res.status(403).json({ error: 'This account is inactive. Please contact the administrator.' });
    }

    res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



exports.register = async (req, res) => {
  const { name, email, password, role, birthdate  } = req.body;

  try {
    // Verificar se o usuário já existe
    const existingUser = await db.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Criptografar a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo usuário
    const newUser = await db.create({
      name,
      email,
      password: hashedPassword,
      role,
      birthdate
    });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

// Função para atualizar um usuário
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, birthdate, ssn, isActive } = req.body;


  try {
    // Formatar a data de nascimento
    const formattedBirthdate = new Date(birthdate).toISOString().split('T')[0];
    const query = 'UPDATE users SET name = ?, email = ?, role = ?, birthdate = ?, ssn = ?, isActive = ? WHERE id = ?';
    const values = [name, email, role, formattedBirthdate, ssn, isActive, id];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Erro ao atualizar usuário:', err);
        return res.status(500).json({ error: 'Erro ao atualizar usuário' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

// Função para buscar as informações do usuário logado
exports.getUserProfile = async (req, res) => {
  const { id } = req.session.userId;

  try {
    const query = 'SELECT id, name, email, role, birthdate, ssn, isActive FROM users WHERE id = ?';
    db.query(query, [id], (err, results) => {
      if (err) {
        console.error('Erro ao buscar informações do usuário:', err);
        return res.status(500).json({ error: 'Erro ao buscar informações do usuário' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.status(200).json(results[0]);
    });
  } catch (err) {
    console.error('Erro ao buscar informações do usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar informações do usuário' });
  }
};

// Função para atualizar as informações do usuário
exports.updateUserProfile = async (req, res) => {
  const { id } = req.session.userId;
  const { name, email, role, birthdate, ssn, isActive, password } = req.body;

  try {
    const query = 'UPDATE users SET name = $1, email = $2, role = $3, birthdate = $4, ssn = $5, isActive = $6 WHERE id = $7';
    const values = [name, email, role, birthdate, ssn, isActive];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      values.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    values.push(id);

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Erro ao atualizar usuário:', err);
        return res.status(500).json({ error: 'Erro ao atualizar usuário' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.status(200).json({ message: 'Usuário atualizado com sucesso' });
    });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};