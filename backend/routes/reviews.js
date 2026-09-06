import express from 'express';
import { getDB, saveDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Helper: convert sql.js result to array of objects
function toObjects(result) {
  if (!result || result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
}

// Fetch all reviews (Admin only)
router.get('/', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  try {
    const db = getDB();
    const result = db.exec(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       ORDER BY r.created_at DESC`
    );
    const reviews = toObjects(result);
    res.json(reviews);
  } catch (error) {
    console.error('Fetch all reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch all reviews' });
  }
});

// Fetch reviews for a specific listing
router.get('/:type/:id', (req, res) => {
  const { type, id } = req.params;
  try {
    const db = getDB();
    const result = db.exec(
      `SELECT r.*, u.name as user_name 
       FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.listing_type = ? AND r.listing_id = ? 
       ORDER BY r.created_at DESC`,
      [type, id]
    );
    const reviews = toObjects(result);
    res.json(reviews);
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add a new review
router.post('/', authMiddleware, (req, res) => {
  const { listing_id, listing_type, rating, comment } = req.body;
  const user_id = req.user.id;

  if (!listing_id || !listing_type || !rating || !comment) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const db = getDB();
    db.run(
      `INSERT INTO reviews (listing_id, listing_type, user_id, rating, comment) 
       VALUES (?, ?, ?, ?, ?)`,
      [listing_id, listing_type, user_id, rating, comment]
    );
    saveDB();
    res.json({ success: true, message: 'Review added successfully' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Failed to add review' });
  }
});

// Edit a review (Admin only)
router.patch('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }

  if (!comment) {
    return res.status(400).json({ error: 'Comment is required' });
  }

  try {
    const db = getDB();
    db.run(
      `UPDATE reviews SET comment = ? WHERE id = ?`,
      [comment, id]
    );
    saveDB();
    res.json({ success: true, message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

export default router;
