// Obter histórico de mudanças de um projeto
router.get('/:id/history', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT ph.*, u.name AS user_name
    FROM project_history ph
    JOIN users u ON ph.user_id = u.id
    WHERE ph.project_id = $1
    ORDER BY ph.timestamp DESC
  `;
  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    res.json(results.rows);
  });
});
