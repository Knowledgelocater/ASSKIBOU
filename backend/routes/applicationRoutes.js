const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middlewares/authMiddleware');

// ✅ Submit a proposal (POST /api/applications)
router.post('/', verifyToken, async (req, res) => {
  const { tender_id, company_id, proposal_text, submitted_at } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO applications 
       (tender_id, company_id, proposal_text, submitted_at) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [tender_id, company_id, proposal_text, submitted_at || new Date().toISOString()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error submitting proposal:", err);
    res.status(500).json({ error: 'Failed to submit proposal' });
  }
});

// ✅ Get all proposals for a tender (GET /api/applications/tender/:tenderId)
router.get('/tender/:tenderId', verifyToken, async (req, res) => {
  const { tenderId } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM applications WHERE tender_id = $1 ORDER BY submitted_at DESC',
      [tenderId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching applications:", err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// ✅ DELETE proposal by ID
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM applications WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json({ message: 'Proposal deleted successfully' });
  } catch (err) {
    console.error("❌ Error deleting proposal:", err);
    res.status(500).json({ error: 'Failed to delete proposal' });
  }
});

module.exports = router;
