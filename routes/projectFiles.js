const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../config/db'); // Importar a conexão com o banco de dados

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Obter arquivos por ID do projeto
router.get('/folders/:projectId', (req, res) => {
  const { projectId } = req.params;
  const query = 'SELECT * FROM folders WHERE projectId = $1';
  db.query(query, [projectId], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results.rows);
  });
});

// Adicionar uma nova pasta ao projeto
router.post('/folders/:projectId', upload.single('file'), (req, res) => {
  const { projectId } = req.params;
  const { name } = req.body;
  const query = 'INSERT INTO folders (projectId, name) VALUES ($1, $2) RETURNING id';
  db.query(query, [projectId, name], (err, results) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(201).json({ id: results.rows[0].id, projectId, name });
  });
});

// Obter arquivos por ID do projeto e pasta
router.get('/:projectId/:folderId', (req, res) => {
  const { projectId, folderId } = req.params;
  const query = 'SELECT * FROM projectfiles WHERE projectId = $1 AND folderId = $2';
  db.query(query, [projectId, folderId], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(results.rows);
  });
});

// Adicionar um novo arquivo ao projeto e pasta
router.post('/:projectId/:folderId', upload.single('file'), (req, res) => {
  const { projectId, folderId } = req.params;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const { originalname, buffer, mimetype } = req.file;
  const query = `
    INSERT INTO projectfiles (projectId, name, data, folderId, mimetype)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `;
  db.query(query, [projectId, originalname, buffer, folderId, mimetype], (err, results) => {
    if (err) return res.status(400).json({ message: err.message });
    res.status(201).json({ id: results.rows[0].id, projectId, folderId, name: originalname });
  });
});

// Download de arquivo
router.get('/download/:fileId', (req, res) => {
  const { fileId } = req.params;
  const query = 'SELECT * FROM projectfiles WHERE id = $1';
  db.query(query, [fileId], (err, results) => {
    if (err) return res.status(500).json({ message: 'Internal server error' });
    if (results.rows.length === 0) return res.status(404).json({ message: 'File not found' });
    const file = results.rows[0];
    res.setHeader('Content-Disposition', `attachment; filename=${file.name}`);
    res.setHeader('Content-Type', file.mimetype);
    res.send(file.data);
  });
});

// Deletar arquivo
// Deletar uma pasta e os arquivos associados
router.delete('/folders/:projectId/:folderId', (req, res) => {
  const { projectId, folderId } = req.params;

  // Deletar os arquivos associados à pasta
  const deleteFilesQuery = 'DELETE FROM projectfiles WHERE projectId = $1 AND folderId = $2';
  db.query(deleteFilesQuery, [projectId, folderId], (err) => {
    if (err) {
      console.error("Erro ao deletar arquivos:", err.message); // Logar o erro
      return res.status(500).json({ message: "Erro ao deletar arquivos" });
    }

    // Deletar a pasta
    const deleteFolderQuery = 'DELETE FROM folders WHERE id = $1 AND projectId = $2';
    db.query(deleteFolderQuery, [folderId, projectId], (err, results) => {
      if (err) {
        console.error("Erro ao deletar pasta:", err.message); // Logar o erro
        return res.status(500).json({ message: "Erro ao deletar pasta" });
      }
      if (results.rowCount === 0) {
        return res.status(404).json({ message: 'Pasta não encontrada' });
      }
      res.json({ message: 'Pasta e arquivos deletados com sucesso' });
    });
  });
});


module.exports = router;