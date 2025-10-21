let token = localStorage.getItem('token');
let currentTab = 'popular';

// Token kontrolü (korumalı sayfalar için)
if (!token && window.location.pathname.includes('dashboard')) {
  window.location.href = 'login.html';
}

// Sekme değiştirme
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.menu-tabs a').forEach(a => a.classList.remove('active'));
  event.target.classList.add('active');
  loadScripts();
}

// Login/Signup formları
function handleAuth(formId, isSignup) {
  const form = document.getElementById(formId);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById(isSignup ? 'signup-username' : 'username').value;
    const password = document.getElementById(isSignup ? 'signup-password' : 'password').value;
    const endpoint = isSignup ? '/api/signup' : '/api/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      if (!isSignup) {
        localStorage.setItem('token', data.token);
        window.location.href = 'dashboard.html';
      } else {
        alert('Kayıt başarılı! Giriş yapın.');
        switchTab('login');
      }
    } else {
      alert(data.error);
    }
  });
}
handleAuth('login-form', false);
handleAuth('signup-form', true);

// Sekme değiştirme fonksiyonu
function switchTab(tabName) {
  document.getElementById('login-form').style.display = tabName === 'login' ? 'block' : 'none';
  document.getElementById('signup-form').style.display = tabName === 'signup' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// Script'leri yükle (arama/filtre ile)
async function loadScripts() {
  const search = document.getElementById('search-input').value;
  const game = document.getElementById('game-filter').value;
  const res = await fetch(`/api/scripts?search=${search}&game=${game}`, {
    headers: { 'Authorization': token }
  });
  const scripts = await res.json();
  const container = document.getElementById('scripts-container');
  container.innerHTML = scripts.map(s => `
    <div class="script-card" onclick="viewScript(${s.id})">
      <h3>${s.title}</h3>
      <p>${s.description}</p>
      <p>Oyun: ${s.game} | Yazar: ${s.author}</p>
    </div>
  `).join('');
}

// Tek script görüntüle
async function viewScript(id) {
  const res = await fetch(`/api/script/${id}`, { headers: { 'Authorization': token } });
  const script = await res.json();
  document.getElementById('script-title').textContent = script.title;
  document.getElementById('script-desc').textContent = script.description;
  document.getElementById('script-author').textContent = script.author;
  document.getElementById('script-downloads').textContent = script.downloads;
  document.getElementById('script-code').textContent = script.code;
  window.location.href = `script.html?id=${id}`; // Veya modal kullan
}

// Kopyala butonu
function copyCode() {
  const code = document.getElementById('script-code').textContent;
  navigator.clipboard.writeText(code).then(() => alert('Kopyalandı! Roblox executor\'ınıza yapıştırın.'));
}

// Çıkış
document.getElementById('logout-btn')?.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
});

// Sayfa yüklendiğinde script'leri yükle
if (window.location.pathname.includes('dashboard')) loadScripts();