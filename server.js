import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';

// Configuration - In production, use .env
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'promptforge',
};

const PORT = 8000;

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allow large base64 images

const pool = mysql.createPool(DB_CONFIG);

// Helper to ensure IDs are strings for frontend consistency
const mapIdToString = (row) => ({ ...row, id: row.id ? row.id.toString() : row.id });

// --- Blocks ---

app.get('/blocks', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM prompt_blocks ORDER BY createdAt DESC');
    res.json(rows.map(mapIdToString));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/blocks', async (req, res) => {
  const { title, content, tag, subTag } = req.body;
  const createdAt = Date.now();
  try {
    const [result] = await pool.query(
      'INSERT INTO prompt_blocks (title, content, tag, subTag, createdAt) VALUES (?, ?, ?, ?, ?)',
      [title, content, tag, subTag || '', createdAt]
    );
    res.json({ id: result.insertId.toString(), title, content, tag, subTag, createdAt });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.put('/blocks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, tag, subTag } = req.body;
  try {
    await pool.query(
      'UPDATE prompt_blocks SET title = ?, content = ?, tag = ?, subTag = ? WHERE id = ?',
      [title, content, tag, subTag || '', id]
    );
    // Fetch updated to return full object including createdAt
    const [rows] = await pool.query('SELECT * FROM prompt_blocks WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Block not found' });
    res.json(mapIdToString(rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/blocks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM prompt_blocks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// --- History ---

app.get('/history', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT content FROM prompt_history ORDER BY id DESC LIMIT 50');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/history', async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  try {
    await pool.query('INSERT INTO prompt_history (content) VALUES (?)', [content]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/history', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE prompt_history');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Images ---

app.get('/images', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM generated_images ORDER BY timestamp DESC LIMIT 20');
    // Ensure numeric types are correct if MySQL driver returns strings for bigints
    const cleanRows = rows.map(r => ({
        ...r, 
        timestamp: Number(r.timestamp),
        seed: r.seed ? Number(r.seed) : undefined
    }));
    res.json(cleanRows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/images', async (req, res) => {
  const { url, prompt, timestamp, seed } = req.body;
  try {
    await pool.query(
      'INSERT INTO generated_images (url, prompt, timestamp, seed) VALUES (?, ?, ?, ?)',
      [url, prompt, timestamp, seed]
    );
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/images', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE generated_images');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- Saved Prompts ---

app.get('/saved-prompts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM saved_prompts ORDER BY timestamp DESC');
    res.json(rows.map(r => ({ ...mapIdToString(r), timestamp: Number(r.timestamp) })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/saved-prompts', async (req, res) => {
  const { content } = req.body;
  const timestamp = Date.now();
  try {
    const [result] = await pool.query(
      'INSERT INTO saved_prompts (content, timestamp) VALUES (?, ?)',
      [content, timestamp]
    );
    res.json({ id: result.insertId.toString(), content, timestamp });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/saved-prompts/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM saved_prompts WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/saved-prompts', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE saved_prompts');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});