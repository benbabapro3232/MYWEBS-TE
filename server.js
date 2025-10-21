const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const SECRET_KEY = 'your-secret-key-2025'; // Gerçekte environment variable kullan
const USERS_FILE = path.join(__dirname, 'data', 'users.json'); // Örnek kullanıcı verisi
const SCRIPTS_FILE = path.join(__dirname, 'data', 'scripts.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Frontend dosyalarını serve et

// Örnek kullanıcı verisi (gerçekte MongoDB)
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([{ username: 'admin', password: bcrypt.hashSync('password', 10) }]));
}

// Middleware: JWT doğrulama
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Erişim reddedildi' });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Geçersiz token' });
    req.user = user;
    next();
  });
};

// Kayit ol (signup)
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  if (users.find(u => u.username === username)) return res.status(400).json({ error: 'Kullanıcı mevcut' });
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));
  res.json({ message: 'Kayıt başarılı' });
});

// Giriş yap (login)
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const user = users.find(u => u.username === username);
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Geçersiz kimlik' });
  }
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token, username });
});

// Script'leri getir (arama ile)
app.get('/api/scripts', authenticateToken, (req, res) => {
  const { search, game } = req.query;
  let scripts = JSON.parse(fs.readFileSync(SCRIPTS_FILE));
  if (search) scripts = scripts.filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()));
  if (game) scripts = scripts.filter(s => s.game === game);
  res.json(scripts);
});

// Tek script getir
app.get('/api/script/:id', authenticateToken, (req, res) => {
  const scripts = JSON.parse(fs.readFileSync(SCRIPTS_FILE));
  const script = scripts.find(s => s.id == req.params.id);
  if (!script) return res.status(404).json({ error: 'Script bulunamadı' });
  res.json(script);
});

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor`));