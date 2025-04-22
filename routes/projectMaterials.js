const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Importar a conexão com o banco de dados

// Obter itens de orçamento por ID do projeto
router.get('/:projectId', (req, res) => {
  const { projectId } = req.params;
  const query = 'SELECT * FROM projectmaterials WHERE projectId = $1';
  db.query(query, [projectId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json(results.rows);
  });
});

// Adicionar um novo item de orçamento ao projeto
router.post('/', (req, res) => {
  const { projectId, name, value } = req.body;
  const query = 'INSERT INTO projectmaterials (projectId, name, value) VALUES ($1, $2, $3) RETURNING *';
  db.query(query, [projectId, name, value], (err, results) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    const item = results.rows[0];
    res.status(201).json({ id: item.id, projectId: item.projectid, name: item.name, value: item.value });
  });
});

// Atualizar um item de orçamento do projeto
router.put('/:id', (req, res) => {
  const { name, value } = req.body;
  const query = 'UPDATE projectmaterials SET name = $1, value = $2 WHERE id = $3 RETURNING *';
  db.query(query, [name, value, req.params.id], (err, results) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    const item = results.rows[0];
    res.json({ id: item.id, name: item.name, value: item.value });
  });
});

// Deletar um item de orçamento do projeto
router.delete('/:id', (req, res) => {
  const query = 'DELETE FROM projectmaterials WHERE id = $1';
  db.query(query, [req.params.id], (err) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json({ message: 'Item de orçamento deletado com sucesso' });
  });
});

module.exports = router;
