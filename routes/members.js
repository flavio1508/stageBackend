const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Conexão com o PostgreSQL
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Função para enviar e-mail
const sendEmailNotification = (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Erro ao enviar e-mail:', error);
    } else {
      console.log('E-mail enviado:', info.response);
    }
  });
};

// Obter membros por ID do projeto
router.get('/:projectId', (req, res) => {
  const { projectId } = req.params;
  const query = `
    SELECT m.id, m.projectId, u.id as userId, u.name, u.email
    FROM members m
    JOIN users u ON m.member = u.id
    WHERE m.projectId = $1
  `;
  db.query(query, [projectId], (err, results) => {
    if (err) {
      console.log('Erro ao consultar membros:', err);  // Adicionando log

      return res.status(500).json({ message: err.message });
    }
    res.json(results.rows);
  });
});

// Adicionar um novo membro ao projeto
router.post('/:projectId', (req, res) => {
  const { projectId } = req.params;
  const { member } = req.body;
  const query = 'INSERT INTO members (projectId, member) VALUES ($1, $2) RETURNING id';
  db.query(query, [projectId, member], (err, result) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const newMemberId = result.rows[0].id;

    const getUserQuery = 'SELECT id, name, email FROM users WHERE id = $1';
    db.query(getUserQuery, [member], (err, userResults) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const user = userResults.rows[0];

      const newMember = {
        id: newMemberId,
        projectId,
        ...user
      };

      sendEmailNotification(user.email, 'Você foi adicionado a um projeto', `Você foi adicionado ao projeto com ID: ${projectId}`);
      res.status(201).json(newMember);
    });
  });
});

// Deletar um membro do projeto
router.delete('/:projectId/:memberId', (req, res) => {
  const { projectId, memberId } = req.params;
  const query = 'DELETE FROM members WHERE projectId = $1 AND id = $2';
  db.query(query, [projectId, memberId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json({ message: 'Membro deletado com sucesso' });
  });
});

module.exports = router;
