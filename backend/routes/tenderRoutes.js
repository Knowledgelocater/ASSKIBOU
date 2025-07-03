const express = require('express');
const router = express.Router();
const pool = require('../db');
const verifyToken = require('../middlewares/authMiddleware');

// ✅ GET all tenders (paginated)
router.get('/', verifyToken, async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      'SELECT * FROM tenders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching tenders:', err);
    res.status(500).json({ error: 'Failed to fetch tenders' });
  }
});

// ✅ GET tenders for a specific company
router.get('/company/:companyId', verifyToken, async (req, res) => {
  const { companyId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM tenders WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching company tenders:', err);
    res.status(500).json({ error: 'Failed to fetch tenders' });
  }
});

// ✅ POST create a new tender (accepts created_at from frontend)
router.post('/', verifyToken, async (req, res) => {
  const { company_id, title, description, deadline, budget, created_at } = req.body;
  const createdAtValue = created_at || new Date().toISOString();

  try {
    const companyCheck = await pool.query('SELECT * FROM companies2 WHERE id = $1', [company_id]);
    if (companyCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid company_id' });
    }

    const result = await pool.query(
      `INSERT INTO tenders 
       (company_id, title, description, deadline, budget, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [company_id, title, description, deadline, budget, createdAtValue]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error creating tender:', err);
    res.status(500).json({ error: 'Failed to create tender' });
  }
});

// ✅ PUT update a tender
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, budget } = req.body;
  try {
    const result = await pool.query(
      `UPDATE tenders
       SET title = $1, description = $2, deadline = $3, budget = $4
       WHERE id = $5 RETURNING *`,
      [title, description, deadline, budget, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Tender not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating tender:', err);
    res.status(500).json({ error: 'Failed to update tender' });
  }
});

// ✅ DELETE a tender
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM tenders WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tender not found' });

    res.json({ message: 'Tender deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting tender:', err);
    res.status(500).json({ error: 'Failed to delete tender' });
  }
});

module.exports = router;
