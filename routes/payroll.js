const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importar a conexão com o banco de dados
const { authenticateUser, isProductManager } = require('../middleware/auth');

// Obter todos os registros de folha de pagamento
router.get('/', authenticateUser, (req, res) => {
  const query = 'SELECT * FROM payroll';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json(results.rows); // PostgreSQL retorna os dados em 'rows'
  });
});

// Adicionar um novo registro de folha de pagamento
router.post('/', authenticateUser, isProductManager, (req, res) => {
  const { name, role, hoursWorked, hourlyRate, paymentType, salary } = req.body;

  if (!name || !role || !paymentType) {
    return res.status(400).json({ message: "Campos obrigatórios estão faltando." });
  }

  if (paymentType === "hourly" && (!hoursWorked || !hourlyRate)) {
    return res.status(400).json({ message: "Horas trabalhadas e taxa horária são obrigatórias para pagamento por hora." });
  }

  if ((paymentType === "weekly" || paymentType === "monthly") && !salary) {
    return res.status(400).json({ message: "Salário é obrigatório para pagamento semanal ou mensal." });
  }

  const query = `
    INSERT INTO payroll (name, role, hoursWorked, hourlyRate, paymentType, salary)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `;
  const values = [name, role, hoursWorked || null, hourlyRate || null, paymentType, salary || null];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    res.status(201).json({ id: result.rows[0].id, name, role, hoursWorked, hourlyRate, paymentType, salary });
  });
});

// Atualizar um registro de folha de pagamento
router.put('/:id', authenticateUser, isProductManager, (req, res) => {
  const { id } = req.params;
  const { name, role, hoursWorked, hourlyRate, paymentType, salary } = req.body;

  if (!name || !role || !paymentType) {
    return res.status(400).json({ message: "Campos obrigatórios estão faltando." });
  }

  if (paymentType === "hourly" && (!hoursWorked || !hourlyRate)) {
    return res.status(400).json({ message: "Horas trabalhadas e taxa horária são obrigatórias para pagamento por hora." });
  }

  if ((paymentType === "weekly" || paymentType === "monthly") && !salary) {
    return res.status(400).json({ message: "Salário é obrigatório para pagamento semanal ou mensal." });
  }

  const query = `
    UPDATE payroll
    SET name = $1, role = $2, hoursWorked = $3, hourlyRate = $4, paymentType = $5, salary = $6
    WHERE id = $7
  `;
  const values = [name, role, hoursWorked || null, hourlyRate || null, paymentType, salary || null, id];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    res.json({ id, name, role, hoursWorked, hourlyRate, paymentType, salary });
  });
});

// Deletar um registro de folha de pagamento
router.delete('/:id', authenticateUser, isProductManager, (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM payroll WHERE id = $1';
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json({ message: 'Registro deletado com sucesso' });
  });
});

module.exports = router;
