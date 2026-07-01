import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDB, saveDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  }
});

const router = Router();

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

// GET /api/boardings/cities/list
router.get('/cities/list', (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT DISTINCT city FROM boardings ORDER BY city');
    const cities = toObjects(result).map(c => c.city);
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// GET /api/boardings
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const { city, search } = req.query;
    let query = `SELECT b.*, u.name as owner_name FROM boardings b JOIN users u ON b.user_id = u.id WHERE b.status = 'approved'`;
    const params = [];

    if (city) {
      query += ' AND b.city = ?';
      params.push(city);
    }
    if (search) {
      query += ' AND (b.title LIKE ? OR b.address LIKE ? OR b.description LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    query += ' ORDER BY b.created_at DESC';

    const result = db.exec(query, params);
    const boardings = toObjects(result);

    // Attach images
    const enriched = boardings.map(b => {
      const imgResult = db.exec('SELECT filename FROM boarding_images WHERE boarding_id = ?', [b.id]);
      const images = toObjects(imgResult).map(img => `/uploads/${img.filename}`);
      return { ...b, images };
    });

    res.json(enriched);
  } catch (err) {
    console.error('List boardings error:', err);
    res.status(500).json({ error: 'Failed to fetch boardings' });
  }
});

// ===== ADMIN ROUTES (must be before /:id) =====

// GET /api/boardings/admin/all — get all boardings (any status)
router.get('/admin/all', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const db = getDB();
    const result = db.exec(
      `SELECT b.*, u.name as owner_name, u.email as owner_email
       FROM boardings b JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    );
    const boardings = toObjects(result);

    const enriched = boardings.map(b => {
      const imgResult = db.exec('SELECT filename FROM boarding_images WHERE boarding_id = ?', [b.id]);
      const images = toObjects(imgResult).map(img => `/uploads/${img.filename}`);
      return { ...b, images };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Admin list boardings error:', err);
    res.status(500).json({ error: 'Failed to fetch boardings' });
  }
});

// GET /api/boardings/my-listings
router.get('/my-listings', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const result = db.exec(
      `SELECT b.*, u.name as owner_name, u.email as owner_email 
       FROM boardings b 
       JOIN users u ON b.user_id = u.id 
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    if (result.length === 0) return res.json([]);
    const boardings = toObjects(result);

    const boardingsWithImages = boardings.map(b => {
      const imgResult = db.exec('SELECT filename FROM boarding_images WHERE boarding_id = ?', [b.id]);
      b.images = imgResult.length > 0 ? toObjects(imgResult).map(img => `/uploads/${img.filename}`) : [];
      return b;
    });

    res.json(boardingsWithImages);
  } catch (err) {
    console.error('Get my listings error:', err);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// GET /api/boardings/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const result = db.exec(
      `SELECT b.*, u.name as owner_name, u.email as owner_email
       FROM boardings b JOIN users u ON b.user_id = u.id WHERE b.id = ?`,
      [parseInt(req.params.id)]
    );
    const rows = toObjects(result);
    if (rows.length === 0) return res.status(404).json({ error: 'Boarding not found' });

    const boarding = rows[0];
    const imgResult = db.exec('SELECT filename FROM boarding_images WHERE boarding_id = ?', [boarding.id]);
    boarding.images = toObjects(imgResult).map(img => `/uploads/${img.filename}`);

    res.json(boarding);
  } catch (err) {
    console.error('Get boarding error:', err);
    res.status(500).json({ error: 'Failed to fetch boarding' });
  }
});

// POST /api/boardings
router.post('/', authMiddleware, upload.fields([{ name: 'images', maxCount: 5 }, { name: 'receipt', maxCount: 1 }]), (req, res) => {
  try {
    const db = getDB();
    const { title, description, address, city, price, contact, latitude, longitude, gender } = req.body;

    if (!title || !address || !city || !price || !contact) {
      return res.status(400).json({ error: 'Title, address, city, price, and contact are required' });
    }

    const receiptFile = req.files && req.files['receipt'] ? req.files['receipt'][0].filename : null;

    db.run(
      `INSERT INTO boardings (user_id, title, description, address, city, price, contact, latitude, longitude, gender, payment_receipt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description || null, address, city,
       parseFloat(price), contact,
       latitude ? parseFloat(latitude) : null,
       longitude ? parseFloat(longitude) : null,
       gender || 'any', receiptFile]
    );

    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const boardingId = idResult[0].values[0][0];

    const images = [];
    if (req.files && req.files['images']) {
      for (const file of req.files['images']) {
        db.run('INSERT INTO boarding_images (boarding_id, filename) VALUES (?, ?)', [boardingId, file.filename]);
        images.push(`/uploads/${file.filename}`);
      }
    }

    saveDB();

    res.status(201).json({
      id: boardingId, title, description, address, city,
      price: parseFloat(price), contact, latitude, longitude, gender: gender || 'any',
      images, user_id: req.user.id, owner_name: req.user.name
    });
  } catch (err) {
    console.error('Create boarding error:', err);
    res.status(500).json({ error: 'Failed to create boarding' });
  }
});

// DELETE /api/boardings/:id (owner or admin)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT * FROM boardings WHERE id = ?', [parseInt(req.params.id)]);
    const rows = toObjects(result);
    if (rows.length === 0) return res.status(404).json({ error: 'Boarding not found' });
    // Allow owner or admin to delete
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run('DELETE FROM boarding_images WHERE boarding_id = ?', [parseInt(req.params.id)]);
    db.run('DELETE FROM boardings WHERE id = ?', [parseInt(req.params.id)]);
    saveDB();

    res.json({ message: 'Boarding deleted successfully' });
  } catch (err) {
    console.error('Delete boarding error:', err);
    res.status(500).json({ error: 'Failed to delete boarding' });
  }
});



// PATCH /api/boardings/:id/status — approve or reject a boarding
router.patch('/:id/status', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Status must be approved, rejected, or pending' });
    }
    const db = getDB();
    const id = parseInt(req.params.id);
    const existing = db.exec('SELECT id FROM boardings WHERE id = ?', [id]);
    if (toObjects(existing).length === 0) {
      return res.status(404).json({ error: 'Boarding not found' });
    }
    db.run('UPDATE boardings SET status = ? WHERE id = ?', [status, id]);
    saveDB();
    res.json({ message: `Boarding ${status} successfully` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update boarding status' });
  }
});

// PUT /api/boardings/:id — owner or admin update a boarding
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const id = parseInt(req.params.id);
    const existing = db.exec('SELECT * FROM boardings WHERE id = ?', [id]);
    const rows = toObjects(existing);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Boarding not found' });
    }
    // Allow owner or admin to update
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { title, description, address, city, price, contact, gender } = req.body;
    db.run(
      `UPDATE boardings SET title = ?, description = ?, address = ?, city = ?, price = ?, contact = ?, gender = ? WHERE id = ?`,
      [title, description || null, address, city, parseFloat(price), contact, gender || 'any', id]
    );
    saveDB();
    res.json({ message: 'Boarding updated successfully' });
  } catch (err) {
    console.error('Update boarding error:', err);
    res.status(500).json({ error: 'Failed to update boarding' });
  }
});

export default router;
