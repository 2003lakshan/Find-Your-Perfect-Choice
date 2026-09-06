import express from 'express';
import { getDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Fetch notifications for logged in user
router.get('/', authMiddleware, (req, res) => {
  const db = getDB();
  const userId = req.user.id;
  try {
    const stmt = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
    stmt.bind([userId]);
    const notifications = [];
    while (stmt.step()) {
      notifications.push(stmt.getAsObject());
    }
    stmt.free();
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.patch('/:id/read', authMiddleware, (req, res) => {
  const db = getDB();
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  try {
    db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notificationId, userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.patch('/read-all', authMiddleware, (req, res) => {
  const db = getDB();
  const userId = req.user.id;
  
  try {
    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
