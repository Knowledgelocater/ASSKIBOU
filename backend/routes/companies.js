const verifyToken = require('../middlewares/authMiddleware.js');
const express = require('express');
const router = express.Router();
const pool = require('../db');

// ✅ GET all companies or filter by user_id
router.get('/', verifyToken, async (req, res) => {
  const userId = req.query.user_id;
  try {
    const result = userId
      ? await pool.query('SELECT * FROM companies2 WHERE user_id = $1 ORDER BY id DESC', [userId])
      : await pool.query('SELECT * FROM companies2 ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching companies:", err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// ✅ POST create a new company
router.post('/', verifyToken, async (req, res) => {
  const { name, industry, description, logo_url } = req.body;
  const user_id = req.user.userId; // 🔐 extracted from JWT

  console.log("🟡 Incoming request body (with token user_id):", { name, industry, description, logo_url, user_id });

  try {
    const result = await pool.query(
      'INSERT INTO companies2 (name, industry, description, logo_url, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, industry, description, logo_url, user_id]
    );

    console.log("✅ Company added:", result.rows[0]);
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("❌ Error inserting company:", err);
    res.status(500).json({ error: 'Failed to add company' });
  }
});

// ✅ PUT update a company by ID
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, industry, description, logo_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE companies2 SET name = $1, industry = $2, description = $3, logo_url = $4 WHERE id = $5 RETURNING *',
      [name, industry, description, logo_url, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error updating company:", err);
    res.status(500).json({ error: 'Failed to update company' });
  }
});

// ✅ DELETE company by ID
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM companies2 WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json({ message: 'Company deleted successfully' });
  } catch (err) {
    console.error("❌ Error deleting company:", err);
    res.status(500).json({ error: 'Failed to delete company' });
  }
});

// ✅ NEW: Search companies by name, industry, or description
router.get('/search', verifyToken, async (req, res) => {
  const q = req.query.q || '';
  try {
    const result = await pool.query(
      `SELECT * FROM companies2
       WHERE name ILIKE $1 OR industry ILIKE $1 OR description ILIKE $1
       ORDER BY id DESC`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error searching companies:", err);
    res.status(500).json({ error: 'Search failed' });
  }
});
// ✅ PUT: Create or update company for logged-in user
router.put('/', verifyToken, async (req, res) => {
  const user_id = req.user.userId;
  const { name, industry, description, logo_url } = req.body;

  try {
    // Check if a company already exists for the user
    const existing = await pool.query('SELECT * FROM companies2 WHERE user_id = $1', [user_id]);

    if (existing.rows.length > 0) {
      // Update existing company
      const updated = await pool.query(
        'UPDATE companies2 SET name = $1, industry = $2, description = $3, logo_url = $4 WHERE user_id = $5 RETURNING *',
        [name, industry, description, logo_url, user_id]
      );
      return res.status(200).json(updated.rows[0]);
    } else {
      // Create new company
      const created = await pool.query(
        'INSERT INTO companies2 (name, industry, description, logo_url, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, industry, description, logo_url, user_id]
      );
      return res.status(201).json(created.rows[0]);
    }
  } catch (err) {
    console.error("❌ Error in PUT /companies:", err);
    res.status(500).json({ error: 'Failed to save company' });
  }
});


module.exports = router;
