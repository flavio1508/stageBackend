const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Conexão com o PostgreSQL
const { authenticateUser, isProductManager } = require('../middleware/auth');

// Função para formatar a data
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (`0${d.getMonth() + 1}`).slice(-2);
  const day = (`0${d.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
};
console.log('🛠️  Rotas de projetos carregadas');

// Criar um novo projeto
router.post('/', authenticateUser, isProductManager, (req, res) => {
  console.log('🚀 Chegou na rota POST /api/projects');
  console.log('🛠️  Rotas de projetos carregadas');

  const { name, startDate, userEmail } = req.body;
  const formattedDate = formatDate(startDate);

  console.log('Dados recebidos para criação de projeto:', { name, startDate, userEmail, formattedDate });

  const query = 'INSERT INTO projects (name, startDate, userEmail) VALUES ($1, $2, $3) RETURNING id';
  db.query(query, [name, formattedDate, userEmail], (err, results) => {
    if (err) {
      console.log('Erro ao criar projeto:', err.message);
      return res.status(400).json({ message: err.message });
    }
    console.log('Projeto criado com sucesso', results.rows[0]);
    res.status(201).json({ id: results.rows[0].id, name, startDate, userEmail });
  });
});

// Obter projetos por email do usuário
router.get('/', authenticateUser, (req, res) => {
  const { email } = req.query;
  console.log('Email recebido para busca de projetos:', email);

  const query = `
  SELECT p.*
  FROM projects p
  LEFT JOIN members m ON p.id = m.projectId
  LEFT JOIN users u ON CAST(m.member AS INTEGER) = u.id
  WHERE u.email = $1 OR p.userEmail = $2
`;

  db.query(query, [email, email], (err, results) => {
    if (err) {
      console.log('Erro ao buscar projetos:', err.message);
      return res.status(500).json({ message: err.message });
    }

    const formattedResults = results.rows.map(project => {
      console.log('Projetos encontrados:', project);
      return {
        ...project,
        startDate: formatDate(project.startDate)
      };
    });

    console.log('Projetos formatados:', formattedResults);
    res.json(formattedResults);
  });
});

// Obter um projeto por ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  console.log('ID do projeto recebido:', id);

  const query = 'SELECT * FROM projects WHERE id = $1';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.log('Erro ao buscar projeto:', err.message);
      return res.status(500).json({ message: err.message });
    }
    console.log('Projeto encontrado:', results.rows[0]);
    res.json(results.rows[0]);
  });
});

// Atualizar um projeto
router.put('/:id', authenticateUser, isProductManager, (req, res) => {
  const { id } = req.params;
  const { name, startDate, userEmail } = req.body;
  const formattedDate = formatDate(startDate);

  console.log('Dados recebidos para atualizar o projeto:', { id, name, startDate, userEmail, formattedDate });

  const query = 'UPDATE projects SET name = $1, startDate = $2, userEmail = $3 WHERE id = $4';
  db.query(query, [name, formattedDate, userEmail, id], (err, results) => {
    if (err) {
      console.log('Erro ao atualizar projeto:', err.message);
      return res.status(400).json({ message: err.message });
    }
    console.log('Projeto atualizado com sucesso:', { id, name, startDate, userEmail });
    res.json({ id, name, startDate, userEmail });
  });
});

// Atualizar o status do projeto
router.put('/:id/status', authenticateUser, isProductManager, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'Status is required' });
  }

  const progress = (Object.values(status).filter(value => value).length / 4) * 100;
  const finalStatus = progress === 100 ? 'completed' : JSON.stringify(status);

  console.log('Dados recebidos para atualizar o status do projeto:', { id, status, progress, finalStatus });

  const query = 'UPDATE projects SET status = $1, progress = $2 WHERE id = $3';
  db.query(query, [finalStatus, progress, id], (err, results) => {
    if (err) {
      console.log('Erro ao atualizar status do projeto:', err.message);
      return res.status(400).json({ message: err.message });
    }
    console.log('Status do projeto atualizado com sucesso:', { id, status, progress });
    res.json({ id, status, progress });
  });
});

// Deletar um projeto
router.delete('/:id', authenticateUser, isProductManager, (req, res) => {
  const { id } = req.params;
  console.log('ID do projeto recebido para deleção:', id);

  const query = 'DELETE FROM projects WHERE id = $1';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.log('Erro ao deletar projeto:', err.message);
      return res.status(500).json({ message: err.message });
    }
    console.log('Projeto deletado com sucesso:', id);
    res.json({ message: 'Projeto deletado com sucesso' });
  });
});

module.exports = router;
