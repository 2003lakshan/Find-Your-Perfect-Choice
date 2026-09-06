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
  limits: { fileSize: 10 * 1024 * 1024 },
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

// GET /api/lands/cities/list
router.get('/cities/list', (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT DISTINCT city FROM lands ORDER BY city');
    const cities = toObjects(result).map(c => c.city);
    res.json(cities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// GET /api/lands
router.get('/', (req, res) => {
  try {
    const db = getDB();
    const { city, search } = req.query;
    let query = `SELECT b.*, u.name as owner_name FROM lands b JOIN users u ON b.user_id = u.id WHERE b.status = 'approved'`;
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
    const lands = toObjects(result);

    // Attach images
    const enriched = lands.map(b => {
      const imgResult = db.exec('SELECT filename FROM land_images WHERE land_id = ?', [b.id]);
      const images = toObjects(imgResult).map(img => `/uploads/${img.filename}`);
      return { ...b, images };
    });

    res.json(enriched);
  } catch (err) {
    console.error('List lands error:', err);
    res.status(500).json({ error: 'Failed to fetch lands' });
  }
});

// ===== ADMIN ROUTES (must be before /:id) =====

// GET /api/lands/admin/all — get all lands (any status)
router.get('/admin/all', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const db = getDB();
    const result = db.exec(
      `SELECT b.*, u.name as owner_name, u.email as owner_email
       FROM lands b JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    );
    const lands = toObjects(result);

    const enriched = lands.map(b => {
      const imgResult = db.exec('SELECT filename FROM land_images WHERE land_id = ?', [b.id]);
      const images = toObjects(imgResult).map(img => `/uploads/${img.filename}`);
      return { ...b, images };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Admin list lands error:', err);
    res.status(500).json({ error: 'Failed to fetch lands' });
  }
});

// GET /api/lands/my-listings
router.get('/my-listings', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const result = db.exec(
      `SELECT b.*, u.name as owner_name, u.email as owner_email 
       FROM lands b 
       JOIN users u ON b.user_id = u.id 
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    if (result.length === 0) return res.json([]);
    const lands = toObjects(result);

    const landsWithImages = lands.map(b => {
      const imgResult = db.exec('SELECT filename FROM land_images WHERE land_id = ?', [b.id]);
      b.images = imgResult.length > 0 ? toObjects(imgResult).map(img => `/uploads/${img.filename}`) : [];
      return b;
    });

    res.json(landsWithImages);
  } catch (err) {
    console.error('Get my listings error:', err);
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// GET /api/lands/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDB();
    const result = db.exec(
      `SELECT b.*, u.name as owner_name, u.email as owner_email
       FROM lands b JOIN users u ON b.user_id = u.id WHERE b.id = ?`,
      [parseInt(req.params.id)]
    );
    const rows = toObjects(result);
    if (rows.length === 0) return res.status(404).json({ error: 'Land not found' });

    const land = rows[0];
    const imgResult = db.exec('SELECT filename FROM land_images WHERE land_id = ?', [land.id]);
    land.images = toObjects(imgResult).map(img => `/uploads/${img.filename}`);

    res.json(land);
  } catch (err) {
    console.error('Get land error:', err);
    res.status(500).json({ error: 'Failed to fetch land' });
  }
});

// POST /api/lands
router.post('/', authMiddleware, upload.fields([{ name: 'images', maxCount: 10 }, { name: 'receipt', maxCount: 1 }]), (req, res) => {
  try {
    const db = getDB();
    const { title, description, address, city, price, contact, latitude, longitude, gender } = req.body;

    if (!title || !address || !city || !price || !contact) {
      return res.status(400).json({ error: 'Title, address, city, price, and contact are required' });
    }

    const receiptFile = req.files && req.files['receipt'] ? req.files['receipt'][0].filename : null;

    db.run(
      `INSERT INTO lands (user_id, title, description, address, city, price, contact, latitude, longitude, gender, payment_receipt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description || null, address, city,
       parseFloat(price), contact,
       latitude ? parseFloat(latitude) : null,
       longitude ? parseFloat(longitude) : null,
       gender || 'any', receiptFile]
    );

    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const landId = idResult[0].values[0][0];

    const images = [];
    if (req.files && req.files['images']) {
      for (const file of req.files['images']) {
        db.run('INSERT INTO land_images (land_id, filename) VALUES (?, ?)', [landId, file.filename]);
        images.push(`/uploads/${file.filename}`);
      }
    }

    // Notify all admins about the new pending listing
    const adminResult = db.exec("SELECT id FROM users WHERE role = 'admin'");
    const admins = toObjects(adminResult);
    for (const admin of admins) {
      db.run('INSERT INTO notifications (user_id, message, type, link) VALUES (?, ?, ?, ?)', 
        [admin.id, `New land listing "${title}" pending approval`, 'system', `/lands/${landId}`]);
    }

    saveDB();

    res.status(201).json({
      id: landId, title, description, address, city,
      price: parseFloat(price), contact, latitude, longitude, gender: gender || 'any',
      images, user_id: req.user.id, owner_name: req.user.name
    });
  } catch (err) {
    console.error('Create land error:', err);
    res.status(500).json({ error: 'Failed to create land' });
  }
});

// DELETE /api/lands/:id (owner or admin)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const result = db.exec('SELECT * FROM lands WHERE id = ?', [parseInt(req.params.id)]);
    const rows = toObjects(result);
    if (rows.length === 0) return res.status(404).json({ error: 'Land not found' });
    // Allow owner or admin to delete
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    db.run('DELETE FROM land_images WHERE land_id = ?', [parseInt(req.params.id)]);
    db.run('DELETE FROM lands WHERE id = ?', [parseInt(req.params.id)]);
    saveDB();

    res.json({ message: 'Land deleted successfully' });
  } catch (err) {
    console.error('Delete land error:', err);
    res.status(500).json({ error: 'Failed to delete land' });
  }
});



// PATCH /api/lands/:id/status — approve or reject a land
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
    const existing = db.exec('SELECT id, user_id, title FROM lands WHERE id = ?', [id]);
    const rows = toObjects(existing);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Land not found' });
    }
    const land = rows[0];

    db.run('UPDATE lands SET status = ? WHERE id = ?', [status, id]);
    
    // Notify the listing owner
    db.run('INSERT INTO notifications (user_id, message, type, link) VALUES (?, ?, ?, ?)', 
      [land.user_id, `Your land listing "${land.title}" was ${status}`, 'status_update', `/lands/${id}`]);

    saveDB();
    res.json({ message: `Land ${status} successfully` });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update land status' });
  }
});

// PUT /api/lands/:id — owner or admin update a land
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDB();
    const id = parseInt(req.params.id);
    const existing = db.exec('SELECT * FROM lands WHERE id = ?', [id]);
    const rows = toObjects(existing);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Land not found' });
    }
    // Allow owner or admin to update
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const { title, description, address, city, price, contact, gender } = req.body;
    db.run(
      `UPDATE lands SET title = ?, description = ?, address = ?, city = ?, price = ?, contact = ?, gender = ? WHERE id = ?`,
      [title, description || null, address, city, parseFloat(price), contact, gender || 'any', id]
    );
    saveDB();
    res.json({ message: 'Land updated successfully' });
  } catch (err) {
    console.error('Update land error:', err);
    res.status(500).json({ error: 'Failed to update land' });
  }
});

export default router;
