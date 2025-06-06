const db = require('../config/db');
const bcrypt = require('bcryptjs');

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE email = $1 LIMIT 1';
    const result = await db.query(query, [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isactive) {
      return res.status(403).json({ error: 'This account is inactive. Please contact the administrator.' });
    }

    res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, role, birthdate } = req.body;

  try {
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkResult = await db.query(checkQuery, [email]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery = `
      INSERT INTO users (name, email, password, role, birthdate)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, role, birthdate, isactive
    `;
    const result = await db.query(insertQuery, [name, email, hashedPassword, role, birthdate]);

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
};

// UPDATE USER
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, birthdate, ssn, isActive } = req.body;

  try {
    const query = `
      UPDATE users
      SET name = $1, email = $2, role = $3, birthdate = $4, ssn = $5, isactive = $6
      WHERE id = $7
      RETURNING *
    `;
    const values = [name, email, role, birthdate, ssn, isActive, id];
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json({ message: 'Usuário atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

// GET PROFILE
exports.getUserProfile = async (req, res) => {
  const id = req.session.userId;

  try {
    const query = `
      SELECT id, name, email, role, birthdate, ssn, isactive
      FROM users
      WHERE id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar informações do usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar informações do usuário' });
  }
};

// UPDATE PROFILE
exports.updateUserProfile = async (req, res) => {
  const id = req.session.userId;
  const { name, email, role, birthdate, ssn, isActive, password } = req.body;

  try {
    let query = `
      UPDATE users
      SET name = $1, email = $2, role = $3, birthdate = $4, ssn = $5, isactive = $6
    `;
    const values = [name, email, role, birthdate, ssn, isActive];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password = $7 WHERE id = $8`;
      values.push(hashedPassword, id);
    } else {
      query += ` WHERE id = $7`;
      values.push(id);
    }

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.status(200).json({ message: 'Usuário atualizado com sucesso' });
  } catch (err) {
    console.error('Erro ao atualizar perfil do usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};
