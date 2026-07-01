import { Router } from 'express';
import { getDB, saveDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';

const router = Router();

// GET /api/users
router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT id, name, email, phone, role, created_at FROM users');
    if (result.length === 0) return res.json([]);

    const cols = result[0].columns;
    const users = result[0].values.map(row => {
      const user = {};
      cols.forEach((col, i) => user[col] = row[i]);
      return user;
    });

    res.json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;
    
    // Prevent admin from deleting themselves
    if (id == req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    db.run('DELETE FROM users WHERE id = ?', [id]);
    saveDB();
    
    res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
